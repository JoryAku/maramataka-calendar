import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const ASTRONOMY_CACHE_FILE_VERSION = 1;
export const ASTRONOMY_CACHE_ENTRY_VERSION = 1;

export interface AstronomyCacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

interface CacheFile {
  version: typeof ASTRONOMY_CACHE_FILE_VERSION;
  entries: Record<string, CacheEntry>;
}

interface CacheEntry {
  version: typeof ASTRONOMY_CACHE_ENTRY_VERSION;
  cachedAt: string;
  value: unknown;
}

export class FileAstronomyCacheStore implements AstronomyCacheStore {
  private cacheFilePromise?: Promise<CacheFile>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async get<T>(key: string): Promise<T | undefined> {
    const cacheFile = await this.loadCacheFile();
    const entry = cacheFile.entries[key];

    if (!entry || entry.version !== ASTRONOMY_CACHE_ENTRY_VERSION) {
      return undefined;
    }

    return entry.value as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const cacheFile = await this.loadCacheFile();
    cacheFile.entries[key] = {
      version: ASTRONOMY_CACHE_ENTRY_VERSION,
      cachedAt: new Date().toISOString(),
      value,
    };

    this.writeQueue = this.writeQueue.then(() =>
      this.writeCacheFile(cacheFile),
    );
    await this.writeQueue;
  }

  private async loadCacheFile(): Promise<CacheFile> {
    this.cacheFilePromise ??= this.readCacheFile();
    return this.cacheFilePromise;
  }

  private async readCacheFile(): Promise<CacheFile> {
    try {
      const rawCache = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(rawCache) as Partial<CacheFile>;

      if (
        parsed.version !== ASTRONOMY_CACHE_FILE_VERSION ||
        !parsed.entries
      ) {
        return this.emptyCacheFile();
      }

      return {
        version: ASTRONOMY_CACHE_FILE_VERSION,
        entries: parsed.entries,
      };
    } catch (error) {
      if (this.isMissingFileError(error) || error instanceof SyntaxError) {
        return this.emptyCacheFile();
      }

      throw error;
    }
  }

  private async writeCacheFile(cacheFile: CacheFile): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(
      tempPath,
      `${JSON.stringify(cacheFile, null, 2)}\n`,
      'utf8',
    );
    await rename(tempPath, this.filePath);
  }

  private emptyCacheFile(): CacheFile {
    return {
      version: ASTRONOMY_CACHE_FILE_VERSION,
      entries: {},
    };
  }

  private isMissingFileError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }
}
