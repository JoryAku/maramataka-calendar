import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const ASTRONOMY_CACHE_FILE_VERSION = 2;
export const ASTRONOMY_CACHE_ENTRY_VERSION = 2;

export interface AstronomyCacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface AstronomyCacheNamespaceSummary {
  namespace: string;
  entries: number;
  cachedAtMin?: string;
  cachedAtMax?: string;
  status: 'active' | 'stale' | 'unknown';
}

export interface AstronomyCacheInspection {
  path: string;
  entries: number;
  activeNamespaces: string[];
  namespaces: AstronomyCacheNamespaceSummary[];
  staleEntries: number;
  unknownEntries: number;
}

export interface AstronomyCachePruneResult extends AstronomyCacheInspection {
  removedEntries: number;
}

export interface AstronomyCachePruneOptions {
  includeUnknown?: boolean;
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
  private flushPromise?: Promise<void>;
  private flushQueued = false;

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

    await this.scheduleFlush();
  }

  async inspectNamespaces(
    activeNamespaces: string[],
  ): Promise<AstronomyCacheInspection> {
    const cacheFile = await this.loadCacheFile();
    return this.inspectCacheFile(cacheFile, activeNamespaces);
  }

  async pruneStaleNamespaces(
    activeNamespaces: string[],
    options: AstronomyCachePruneOptions = {},
  ): Promise<AstronomyCachePruneResult> {
    const cacheFile = await this.loadCacheFile();
    const activeNamespaceSet = new Set(activeNamespaces);
    let removedEntries = 0;

    for (const key of Object.keys(cacheFile.entries)) {
      const namespace = this.namespaceForKey(key);
      if (namespace && activeNamespaceSet.has(namespace)) {
        continue;
      }

      if (!namespace && !options.includeUnknown) {
        continue;
      }

      delete cacheFile.entries[key];
      removedEntries += 1;
    }

    if (removedEntries > 0) {
      await this.scheduleFlush();
    }

    return {
      ...this.inspectCacheFile(cacheFile, activeNamespaces),
      removedEntries,
    };
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

  private scheduleFlush(): Promise<void> {
    this.flushQueued = true;
    this.flushPromise ??= this.flushCacheFile().finally(() => {
      this.flushPromise = undefined;
    });

    return this.flushPromise;
  }

  private async flushCacheFile(): Promise<void> {
    await Promise.resolve();

    while (this.flushQueued) {
      this.flushQueued = false;
      await this.writeCacheFile(await this.loadCacheFile());
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

  private inspectCacheFile(
    cacheFile: CacheFile,
    activeNamespaces: string[],
  ): AstronomyCacheInspection {
    const activeNamespaceSet = new Set(activeNamespaces);
    const summaries = new Map<string, AstronomyCacheNamespaceSummary>();
    let unknownEntries = 0;

    for (const [key, entry] of Object.entries(cacheFile.entries)) {
      const namespace = this.namespaceForKey(key);
      if (!namespace) {
        unknownEntries += 1;
        continue;
      }

      const summary =
        summaries.get(namespace) ??
        this.createNamespaceSummary(namespace, activeNamespaceSet);
      summary.entries += 1;
      summary.cachedAtMin = this.minIsoDate(summary.cachedAtMin, entry.cachedAt);
      summary.cachedAtMax = this.maxIsoDate(summary.cachedAtMax, entry.cachedAt);
      summaries.set(namespace, summary);
    }

    const namespaces = [...summaries.values()].sort((a, b) =>
      a.namespace.localeCompare(b.namespace),
    );
    const staleEntries = namespaces
      .filter((namespace) => namespace.status === 'stale')
      .reduce((total, namespace) => total + namespace.entries, 0);

    return {
      path: this.filePath,
      entries: Object.keys(cacheFile.entries).length,
      activeNamespaces,
      namespaces,
      staleEntries,
      unknownEntries,
    };
  }

  private createNamespaceSummary(
    namespace: string,
    activeNamespaceSet: Set<string>,
  ): AstronomyCacheNamespaceSummary {
    return {
      namespace,
      entries: 0,
      status: activeNamespaceSet.has(namespace) ? 'active' : 'stale',
    };
  }

  private namespaceForKey(key: string): string | undefined {
    const parts = key.split(':');
    if (parts.length < 3) {
      return undefined;
    }

    const [layer, fingerprint] = parts;
    if (!['raw', 'observational'].includes(layer) || !fingerprint) {
      return undefined;
    }

    return `${layer}:${fingerprint}`;
  }

  private minIsoDate(current: string | undefined, candidate: string): string {
    return !current || candidate < current ? candidate : current;
  }

  private maxIsoDate(current: string | undefined, candidate: string): string {
    return !current || candidate > current ? candidate : current;
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
