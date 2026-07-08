import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ASTRONOMY_CACHE_ENTRY_VERSION,
  ASTRONOMY_CACHE_FILE_VERSION,
  FileAstronomyCacheStore,
} from './persistent-astronomy-cache';

describe('FileAstronomyCacheStore', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'maramataka-cache-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns undefined when a cache entry does not exist', async () => {
    const store = new FileAstronomyCacheStore(join(tempDir, 'astronomy.json'));

    await expect(store.get('missing')).resolves.toBeUndefined();
  });

  it('persists cache entries to disk', async () => {
    const cachePath = join(tempDir, 'nested', 'astronomy.json');
    const store = new FileAstronomyCacheStore(cachePath);

    await store.set('moonrise:2026-01-01', {
      date: '2026-01-01',
      risesAt: new Date('2026-01-01T05:31:00.000Z'),
      source: 'astronomy-engine',
    });

    const nextStore = new FileAstronomyCacheStore(cachePath);
    await expect(nextStore.get('moonrise:2026-01-01')).resolves.toEqual({
      date: '2026-01-01',
      risesAt: '2026-01-01T05:31:00.000Z',
      source: 'astronomy-engine',
    });

    const rawCache = JSON.parse(await readFile(cachePath, 'utf8')) as {
      version: number;
      entries: Record<string, { version: number; cachedAt: string }>;
    };
    expect(rawCache.version).toBe(ASTRONOMY_CACHE_FILE_VERSION);
    expect(rawCache.entries['moonrise:2026-01-01']).toEqual(
      expect.objectContaining({
        version: ASTRONOMY_CACHE_ENTRY_VERSION,
        cachedAt: expect.any(String),
      }),
    );
  });

  it('persists concurrent cache entries from a coalesced flush', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    const store = new FileAstronomyCacheStore(cachePath);

    await Promise.all([
      store.set('moonrise:2026-01-01', { date: '2026-01-01' }),
      store.set('moonrise:2026-01-02', { date: '2026-01-02' }),
      store.set('moonrise:2026-01-03', { date: '2026-01-03' }),
    ]);

    const nextStore = new FileAstronomyCacheStore(cachePath);
    await expect(nextStore.get('moonrise:2026-01-01')).resolves.toEqual({
      date: '2026-01-01',
    });
    await expect(nextStore.get('moonrise:2026-01-02')).resolves.toEqual({
      date: '2026-01-02',
    });
    await expect(nextStore.get('moonrise:2026-01-03')).resolves.toEqual({
      date: '2026-01-03',
    });
  });

  it('starts fresh when the cache file has an unsupported shape', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    await new FileAstronomyCacheStore(cachePath).set('first', 'value');
    await rm(cachePath);
    await writeFile(
      cachePath,
      '{"version":2,"entries":{"old":true}}\n',
      'utf8',
    );

    const store = new FileAstronomyCacheStore(cachePath);

    await expect(store.get('old')).resolves.toBeUndefined();
  });

  it('ignores cache entries with unsupported entry versions', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    await writeFile(
      cachePath,
      JSON.stringify({
        version: ASTRONOMY_CACHE_FILE_VERSION,
        entries: {
          old: {
            version: ASTRONOMY_CACHE_ENTRY_VERSION + 1,
            cachedAt: '2026-01-01T00:00:00.000Z',
            value: 'stale',
          },
        },
      }),
      'utf8',
    );

    const store = new FileAstronomyCacheStore(cachePath);

    await expect(store.get('old')).resolves.toBeUndefined();
  });

  it('recovers with an empty cache when the cache file is corrupt', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    await writeFile(cachePath, '{not-json', 'utf8');

    const store = new FileAstronomyCacheStore(cachePath);

    await expect(store.get('anything')).resolves.toBeUndefined();
    await expect(store.set('new', { ok: true })).resolves.toBeUndefined();
    await expect(store.get('new')).resolves.toEqual({ ok: true });
  });

  it('reports active, stale, and unknown cache namespaces', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    const store = new FileAstronomyCacheStore(cachePath);
    await store.set('raw:active:moonrise:2026-01-01', { ok: true });
    await store.set('raw:old:moonrise:2025-01-01', { stale: true });
    await store.set('observational:active:star-markers:2026-01-01', {
      ok: true,
    });
    await store.set('legacy-entry', { unknown: true });

    const inspection = await store.inspectNamespaces([
      'raw:active',
      'observational:active',
    ]);

    expect(inspection.entries).toBe(4);
    expect(inspection.staleEntries).toBe(1);
    expect(inspection.unknownEntries).toBe(1);
    expect(inspection.namespaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          namespace: 'raw:active',
          entries: 1,
          status: 'active',
        }),
        expect.objectContaining({
          namespace: 'raw:old',
          entries: 1,
          status: 'stale',
        }),
        expect.objectContaining({
          namespace: 'observational:active',
          entries: 1,
          status: 'active',
        }),
      ]),
    );
  });

  it('prunes stale namespaced entries without removing active or unknown entries', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    const store = new FileAstronomyCacheStore(cachePath);
    await store.set('raw:active:moonrise:2026-01-01', { ok: true });
    await store.set('raw:old:moonrise:2025-01-01', { stale: true });
    await store.set('observational:old:star-markers:2025-01-01', {
      stale: true,
    });
    await store.set('legacy-entry', { unknown: true });

    const result = await store.pruneStaleNamespaces(['raw:active']);

    expect(result.removedEntries).toBe(2);
    expect(result.entries).toBe(2);
    await expect(store.get('raw:active:moonrise:2026-01-01')).resolves.toEqual({
      ok: true,
    });
    await expect(store.get('raw:old:moonrise:2025-01-01')).resolves.toBeUndefined();
    await expect(
      store.get('observational:old:star-markers:2025-01-01'),
    ).resolves.toBeUndefined();
    await expect(store.get('legacy-entry')).resolves.toEqual({
      unknown: true,
    });
  });

  it('prunes unknown entries only when explicitly requested', async () => {
    const cachePath = join(tempDir, 'astronomy.json');
    const store = new FileAstronomyCacheStore(cachePath);
    await store.set('raw:active:moonrise:2026-01-01', { ok: true });
    await store.set('legacy-entry', { unknown: true });

    const result = await store.pruneStaleNamespaces(['raw:active'], {
      includeUnknown: true,
    });

    expect(result.removedEntries).toBe(1);
    expect(result.entries).toBe(1);
    expect(result.unknownEntries).toBe(0);
    await expect(store.get('raw:active:moonrise:2026-01-01')).resolves.toEqual({
      ok: true,
    });
    await expect(store.get('legacy-entry')).resolves.toBeUndefined();
  });
});
