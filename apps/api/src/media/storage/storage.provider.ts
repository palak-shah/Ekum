import { Logger, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../core/config/config.schema';
import { AzureBlobDriver } from './azure-blob.driver';
import { LocalStorageDriver } from './local-storage.driver';
import { STORAGE_DRIVER, type StorageDriver } from './storage.types';

/**
 * Selects the storage driver at boot: Azure Blob when an account + key are
 * configured, otherwise a local dev driver. Keeping the choice here means every
 * consumer just injects STORAGE_DRIVER and never branches on environment.
 */
export const storageProvider: Provider = {
  provide: STORAGE_DRIVER,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): StorageDriver => {
    const account = config.get('AZURE_STORAGE_ACCOUNT', { infer: true });
    const accountKey = config.get('AZURE_STORAGE_KEY', { infer: true });
    const container = config.get('AZURE_STORAGE_CONTAINER', { infer: true });
    if (account && accountKey) {
      return new AzureBlobDriver({ account, accountKey, container });
    }
    const baseUrl = config.get('PUBLIC_MEDIA_BASE_URL', { infer: true });
    new Logger('Storage').warn('Azure storage not configured; using local dev media driver.');
    return new LocalStorageDriver(baseUrl);
  },
};
