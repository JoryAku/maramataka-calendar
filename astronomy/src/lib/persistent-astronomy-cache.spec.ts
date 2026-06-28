import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileAstronomyCacheStore } from './persistent-astronomy-cache';

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
      source: 'usno',
    });

    const nextStore = new FileAstronomyCacheStore(cachePath);
    await expect(nextStore.get('moonrise:2026-01-01')).resolves.toEqual({
      date: '2026-01-01',
      risesAt: '2026-01-01T05:31:00.000Z',
      source: 'usno',
    });

    const rawCache = JSON.parse(await readFile(cachePath, 'utf8')) as {
      version: number;
      entries: Record<string, unknown>;
    };
    expect(rawCache.version).toBe(1);
    expect(rawCache.entries['moonrise:2026-01-01']).toBeDefined();
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
});
