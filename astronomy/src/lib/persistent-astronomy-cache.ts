import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface AstronomyCacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

interface CacheFile {
  version: 1;
  entries: Record<string, CacheEntry>;
}

interface CacheEntry {
  cachedAt: string;
  value: unknown;
}

export class FileAstronomyCacheStore implements AstronomyCacheStore {
  private cacheFilePromise?: Promise<CacheFile>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async get<T>(key: string): Promise<T | undefined> {
    const cacheFile = await this.loadCacheFile();
    return cacheFile.entries[key]?.value as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const cacheFile = await this.loadCacheFile();
    cacheFile.entries[key] = {
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

      if (parsed.version !== 1 || !parsed.entries) {
        return this.emptyCacheFile();
      }

      return {
        version: 1,
        entries: parsed.entries,
      };
    } catch (error) {
      if (this.isMissingFileError(error)) {
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
      version: 1,
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
