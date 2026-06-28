import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  json,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  urlencoded,
} from 'express';
import { AppModule } from './app/app.module';

const DEFAULT_BODY_LIMIT = '100kb';
const ONE_DAY_IN_SECONDS = 86400;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const globalPrefix = 'api';

  configureTrustProxy(app.getHttpAdapter().getInstance());
  configureSecurityHeaders(app.getHttpAdapter().getInstance());
  configureRequestLimits(app.getHttpAdapter().getInstance());
  app.enableCors({
    origin: getAllowedCorsOrigins(),
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false,
    maxAge: ONE_DAY_IN_SECONDS,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix(globalPrefix);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  Logger.log(
    `API listening on port ${port} with global prefix /${globalPrefix}`,
    'Bootstrap',
  );
}

function configureTrustProxy(server: {
  disable: (setting: string) => void;
  set: (setting: string, value: unknown) => void;
}): void {
  server.disable('x-powered-by');

  if (process.env.TRUST_PROXY) {
    server.set('trust proxy', process.env.TRUST_PROXY);
  }
}

function configureSecurityHeaders(server: {
  use: (
    middleware: (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => void,
  ) => void;
}): void {
  server.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-DNS-Prefetch-Control', 'off');
    response.setHeader('X-Frame-Options', 'DENY');

    next();
  });
}

function configureRequestLimits(server: {
  use: (middleware: RequestHandler) => void;
}): void {
  const bodyLimit = process.env.REQUEST_BODY_LIMIT ?? DEFAULT_BODY_LIMIT;

  server.use(json({ limit: bodyLimit }));
  server.use(urlencoded({ extended: false, limit: bodyLimit }));
}

function getAllowedCorsOrigins(): boolean | string[] {
  const configuredOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  return process.env.NODE_ENV === 'production' ? false : true;
}

bootstrap().catch((error: unknown) => {
  Logger.error(
    'API failed to start',
    error instanceof Error ? error.stack : String(error),
    'Bootstrap',
  );
  process.exitCode = 1;
});
