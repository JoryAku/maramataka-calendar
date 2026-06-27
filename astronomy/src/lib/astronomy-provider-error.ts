export type AstronomyProviderErrorCode =
  | 'request-failed'
  | 'request-timeout'
  | 'invalid-response'
  | 'data-unavailable';

export class AstronomyProviderError extends Error {
  readonly provider: string;
  readonly code: AstronomyProviderErrorCode;
  readonly cause?: unknown;

  constructor(
    provider: string,
    code: AstronomyProviderErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'AstronomyProviderError';
    this.provider = provider;
    this.code = code;
    this.cause = options?.cause;
  }
}

export function findAstronomyProviderError(
  error: unknown,
): AstronomyProviderError | undefined {
  if (error instanceof AstronomyProviderError) {
    return error;
  }

  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause) {
      return findAstronomyProviderError(cause);
    }
  }

  return undefined;
}
