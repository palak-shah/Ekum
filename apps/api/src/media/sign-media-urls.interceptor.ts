import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { signMediaUrl } from './media-url-token';

/**
 * Safety net: any local `/media/…` URL leaving the API without a token gets a
 * short-lived full signature. Catalog locked-preview paths must already be
 * rewritten + signed as preview before the response (so this does not upgrade them).
 */
@Injectable()
export class SignMediaUrlsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((body) => signUnsignedMediaUrls(body)));
  }
}

function alreadySigned(url: string): boolean {
  return url.includes('ekum_sig=');
}

function isLocalMediaUrl(value: string): boolean {
  if (!value.includes('/media')) return false;
  try {
    const parsed = new URL(value, 'http://localhost');
    return parsed.pathname === '/media' || parsed.pathname.startsWith('/media/');
  } catch {
    return value.startsWith('/media/') || value === '/media';
  }
}

export function signUnsignedMediaUrls(value: unknown): unknown {
  if (typeof value === 'string') {
    if (!isLocalMediaUrl(value) || alreadySigned(value)) return value;
    return signMediaUrl(value, 'full');
  }
  if (Array.isArray(value)) {
    return value.map((entry) => signUnsignedMediaUrls(entry));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = signUnsignedMediaUrls(entry);
    }
    return out;
  }
  return value;
}
