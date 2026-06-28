import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  [key: string]: unknown;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    response.status(statusCode).json({
      statusCode,
      error: this.getError(statusCode, exceptionResponse),
      message: this.getMessage(exception, exceptionResponse),
      ...this.getDetails(exceptionResponse),
      path: request.url,
      timestamp: new Date().toISOString(),
    } satisfies ApiErrorResponse);
  }

  private getError(statusCode: number, exceptionResponse: unknown): string {
    if (
      this.isExceptionResponseObject(exceptionResponse) &&
      typeof exceptionResponse.error === 'string'
    ) {
      return exceptionResponse.error;
    }

    return HttpStatus[statusCode] ?? 'Error';
  }

  private getMessage(
    exception: unknown,
    exceptionResponse: unknown,
  ): string | string[] {
    if (this.isExceptionResponseObject(exceptionResponse)) {
      return exceptionResponse.message;
    }

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exception instanceof Error && exception instanceof HttpException) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private getDetails(exceptionResponse: unknown): Record<string, unknown> {
    if (!this.isExceptionResponseObject(exceptionResponse)) {
      return {};
    }

    const details: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(exceptionResponse)) {
      if (key !== 'message' && key !== 'error' && key !== 'statusCode') {
        details[key] = value;
      }
    }

    return details;
  }

  private isExceptionResponseObject(
    value: unknown,
  ): value is { message: string | string[]; error?: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      (typeof value.message === 'string' || Array.isArray(value.message))
    );
  }
}
