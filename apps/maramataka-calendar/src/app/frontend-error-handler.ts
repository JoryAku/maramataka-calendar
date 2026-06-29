import { ErrorHandler, inject, Injectable } from '@angular/core';
import { MARAMATAKA_APP_CONFIG } from './app-config';

@Injectable()
export class MaramatakaErrorHandler implements ErrorHandler {
  private readonly config = inject(MARAMATAKA_APP_CONFIG);

  handleError(error: unknown): void {
    if (this.config.errorReporting === 'none') {
      return;
    }

    console.error('Unhandled frontend error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
