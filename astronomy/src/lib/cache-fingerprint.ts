import { createHash } from 'node:crypto';

export type CacheFingerprintMetadata =
  | null
  | string
  | number
  | boolean
  | readonly CacheFingerprintMetadata[]
  | { readonly [key: string]: CacheFingerprintMetadata | undefined };

export const createCacheFingerprint = (
  metadata: CacheFingerprintMetadata,
): string =>
  createHash('sha256')
    .update(stableStringify(metadata))
    .digest('hex')
    .slice(0, 16);

export const createFingerprintNamespace = (
  layer: string,
  metadata: CacheFingerprintMetadata,
): string => `${layer}:${createCacheFingerprint(metadata)}`;

export const stableStringify = (value: CacheFingerprintMetadata): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value)
    .filter(
      (entry): entry is [string, CacheFingerprintMetadata] =>
        entry[1] !== undefined,
    )
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return `{${entries
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableStringify(entryValue)}`,
    )
    .join(',')}}`;
};
