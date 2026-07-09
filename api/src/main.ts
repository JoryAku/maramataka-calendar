import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import {
  createCacheFingerprint,
  RAW_ASTRONOMY_CACHE_METADATA,
  OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
} from '@maramataka-calendar/astronomy';
import {
  createMaramatakaRuleSetCacheMetadata,
  createMaramatakaRuleSetFingerprint,
  MARAMATAKA_RULE_SET_CACHE_METADATA_VERSION,
} from '@maramataka-calendar/maramataka-domain';
import {
  json,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  urlencoded,
} from 'express';
import { AppModule } from './app/app.module';
import { ApiExceptionFilter } from './app/api-exception.filter';
import { ACTIVE_MARAMATAKA_RULE_SET } from './app/maramataka.service-provider';

const DEFAULT_BODY_LIMIT = '100kb';
const ONE_DAY_IN_SECONDS = 86400;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const globalPrefix = 'api';

  configureTrustProxy(app.getHttpAdapter().getInstance());
  configureSecurityHeaders(app.getHttpAdapter().getInstance());
  configureRequestLogging(app.getHttpAdapter().getInstance());
  configureRequestLimits(app.getHttpAdapter().getInstance());
  app.enableCors({
    origin: getAllowedCorsOrigins(),
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false,
    maxAge: ONE_DAY_IN_SECONDS,
  });
  app.enableShutdownHooks();
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix(globalPrefix);
  configureOpenApi(app, globalPrefix);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  logCacheFingerprints();

  Logger.log(
    `API listening on port ${port} with global prefix /${globalPrefix}`,
    'Bootstrap',
  );
}

function configureOpenApi(app: INestApplication, globalPrefix: string): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Maramataka Calendar API')
      .setDescription(
        'Astronomy-backed maramataka date, month, year, dawn sky, and timeline data.',
      )
      .setVersion('1.0')
      .build(),
  );
  const route = `/${globalPrefix}/openapi.json`;

  app
    .getHttpAdapter()
    .getInstance()
    .get(route, (_request: Request, response: Response) => {
      response.type('application/json').send(document);
    });
}

function logCacheFingerprints(): void {
  const maramatakaRuleSetMetadata = createMaramatakaRuleSetCacheMetadata(
    ACTIVE_MARAMATAKA_RULE_SET,
  );
  const context = {
    event: 'cache_fingerprints',
    fingerprints: {
      rawAstronomy: createCacheFingerprint(RAW_ASTRONOMY_CACHE_METADATA),
      observationalAstronomy: createCacheFingerprint(
        OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
      ),
      maramatakaRules: createCacheFingerprint(maramatakaRuleSetMetadata),
    },
    metadataSummary: createCacheMetadataSummary(),
    fullMetadataCommand: 'npm run diagnose:maramataka -- cache-fingerprints',
  };

  Logger.log(JSON.stringify(context), 'CacheFingerprint');
}

function createCacheMetadataSummary() {
  return {
    rawAstronomy: {
      layer: RAW_ASTRONOMY_CACHE_METADATA.layer,
      version: RAW_ASTRONOMY_CACHE_METADATA.version,
      operations: RAW_ASTRONOMY_CACHE_METADATA.operations,
    },
    observationalAstronomy: {
      layer: OBSERVATIONAL_ASTRONOMY_CACHE_METADATA.layer,
      version: OBSERVATIONAL_ASTRONOMY_CACHE_METADATA.version,
      operations: OBSERVATIONAL_ASTRONOMY_CACHE_METADATA.operations,
      dawnMarkerSampling:
        OBSERVATIONAL_ASTRONOMY_CACHE_METADATA.dawnMarkerSampling,
    },
    maramatakaRules: {
      layer: 'maramataka-rules',
      ruleSet: {
        id: ACTIVE_MARAMATAKA_RULE_SET.id,
        version: ACTIVE_MARAMATAKA_RULE_SET.version,
        source: ACTIVE_MARAMATAKA_RULE_SET.source,
        tradition: ACTIVE_MARAMATAKA_RULE_SET.tradition,
        mataVersion: ACTIVE_MARAMATAKA_RULE_SET.mataVersion,
        metadataVersion: MARAMATAKA_RULE_SET_CACHE_METADATA_VERSION,
        fingerprint: createMaramatakaRuleSetFingerprint(
          ACTIVE_MARAMATAKA_RULE_SET,
        ),
      },
      mataCount: ACTIVE_MARAMATAKA_RULE_SET.mata.length,
      yearStartMarker: ACTIVE_MARAMATAKA_RULE_SET.yearStartRule?.marker.id,
      starMonthMarkerCount:
        ACTIVE_MARAMATAKA_RULE_SET.starMonthNaming?.markers.length ?? 0,
      targetMataNames:
        ACTIVE_MARAMATAKA_RULE_SET.matarikiHoliday?.targetMataNames ?? [],
    },
  };
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

function configureRequestLogging(server: {
  use: (
    middleware: (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => void,
  ) => void;
}): void {
  const logger = new Logger('HttpRequest');

  server.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    const requestId = getRequestId(request);

    response.setHeader('X-Request-Id', requestId);
    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const context = {
        requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: response.statusCode,
        durationMs,
        remoteAddress: request.ip,
        userAgent: request.get('user-agent'),
      };
      const message = JSON.stringify(context);

      if (response.statusCode >= 500) {
        logger.error(message);
        return;
      }

      logger.log(message);
    });

    next();
  });
}

function getRequestId(request: Request): string {
  const incomingRequestId = request.get('x-request-id');

  return incomingRequestId?.trim() || randomUUID();
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
