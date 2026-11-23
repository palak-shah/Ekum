import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { SignMediaUrlsInterceptor } from './sign-media-urls.interceptor';
import { storageProvider } from './storage/storage.provider';

/**
 * Media: direct-to-blob uploads. Mints scoped upload tickets, records media rows,
 * and enqueues thumbnail derivation (processed by the Jobs runner). The storage
 * driver is Azure Blob in production and a local dev driver otherwise.
 */
@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    storageProvider,
    { provide: APP_INTERCEPTOR, useClass: SignMediaUrlsInterceptor },
  ],
  exports: [MediaService],
})
export class MediaModule {}
