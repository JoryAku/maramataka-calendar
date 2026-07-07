import {
  createCacheFingerprint,
  createFingerprintNamespace,
  stableStringify,
} from './cache-fingerprint';

describe('cache fingerprint helpers', () => {
  it('serializes object keys in stable order', () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });

  it('creates the same fingerprint for equivalent metadata', () => {
    expect(createCacheFingerprint({ b: 2, a: 1 })).toBe(
      createCacheFingerprint({ a: 1, b: 2 }),
    );
  });

  it('includes the layer name in cache namespaces', () => {
    expect(createFingerprintNamespace('raw', { version: 1 })).toMatch(
      /^raw:[a-f0-9]{16}$/,
    );
  });
});
