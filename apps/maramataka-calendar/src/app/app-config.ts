import { InjectionToken } from '@angular/core';
import { environment } from '../environments/environment';

export interface MaramatakaFrontendConfig {
  apiBaseUrl: string;
  errorReporting: 'console' | 'none';
}

declare global {
  interface Window {
    __MARAMATAKA_CONFIG__?: Partial<MaramatakaFrontendConfig>;
  }
}

export const MARAMATAKA_APP_CONFIG =
  new InjectionToken<MaramatakaFrontendConfig>('MARAMATAKA_APP_CONFIG', {
    providedIn: 'root',
    factory: () => resolveMaramatakaConfig(),
  });

export function resolveMaramatakaConfig(): MaramatakaFrontendConfig {
  const runtimeConfig =
    typeof window === 'undefined' ? undefined : window.__MARAMATAKA_CONFIG__;
  const apiBaseUrl =
    runtimeConfig?.apiBaseUrl ?? environment.apiBaseUrl ?? '/api';
  const errorReporting =
    runtimeConfig?.errorReporting ?? environment.errorReporting ?? 'console';

  return {
    apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl),
    errorReporting,
  };
}

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.trim();

  if (!trimmed || trimmed === '/') {
    return '';
  }

  return trimmed.replace(/\/+$/, '');
}
