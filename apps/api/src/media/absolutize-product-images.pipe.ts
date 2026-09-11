import { Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../core/config/config.schema';
import { absolutizeProductImageFields } from './absolutize-media-url';

/**
 * Chat Save to my designs (and other clients) may POST relative `/media/…`
 * image paths. Rewrite onto PUBLIC_MEDIA_BASE_URL before Zod `url()`.
 */
@Injectable()
export class AbsolutizeProductImagesPipe implements PipeTransform {
  constructor(private readonly config: ConfigService<Env, true>) {}

  transform(value: unknown): unknown {
    const mediaBase = this.config.get('PUBLIC_MEDIA_BASE_URL', { infer: true });
    return absolutizeProductImageFields(value, mediaBase);
  }
}
