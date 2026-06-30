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
});
