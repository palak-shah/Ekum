import 'reflect-metadata';
import { join } from 'node:path';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { Env } from './core/config/config.schema';
import { mountLocalMedia } from './media/local-media.mount';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
    credentials: true,
  });

  // LocalStorageDriver mints PUT/GET under PUBLIC_MEDIA_BASE_URL when Azure is unset.
  const azureAccount = config.get('AZURE_STORAGE_ACCOUNT', { infer: true });
  const azureKey = config.get('AZURE_STORAGE_KEY', { infer: true });
  if (!azureAccount || !azureKey) {
    mountLocalMedia(app, join(process.cwd(), '.media'));
    app.get(Logger).warn('Local media mounted at /.media (dev uploads)');
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  app.get(Logger).log(`Ekum API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
