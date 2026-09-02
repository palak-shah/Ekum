import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { mediaDiskCandidates } from './media-disk-path';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * Dev-only blob stand-in: LocalStorageDriver mints PUT/GET URLs under
 * PUBLIC_MEDIA_BASE_URL (/media/...). Writes land on disk under `mediaRoot`.
 */
export function mountLocalMedia(app: INestApplication, mediaRoot: string): void {
  const root = resolve(mediaRoot);
  const http = app.getHttpAdapter().getInstance() as express.Express;

  const resolveSafe = (relativePath: string): string | null => {
    const relative = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
    if (!relative || relative.includes('..')) {
      return null;
    }
    const target = resolve(join(root, relative));
    if (!target.startsWith(root)) {
      return null;
    }
    return target;
  };

  http.use('/media', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type,x-ekum-dev-upload');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Express 5 requires a named wildcard (path-to-regexp).
  http.put(
    '/media/*path',
    express.raw({ type: '*/*', limit: '15mb' }),
    async (req: Request, res: Response) => {
      if (req.header('x-ekum-dev-upload') !== 'true') {
        res.status(403).json({ message: 'Dev upload header required.' });
        return;
      }
      const relative = mediaPathParam(req);
      const target = resolveSafe(relative);
      if (!target) {
        res.status(400).json({ message: 'Invalid media path.' });
        return;
      }
      const body = req.body as Buffer;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ message: 'Empty upload body.' });
        return;
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      res.status(200).end();
    },
  );

  http.get('/media/*path', async (req: Request, res: Response) => {
    const relative = mediaPathParam(req);
    const candidates = mediaDiskCandidates(relative);
    if (candidates.length === 0) {
      res.status(400).end();
      return;
    }
    for (const candidate of candidates) {
      const target = resolveSafe(candidate);
      if (!target) {
        continue;
      }
      try {
        const data = await readFile(target);
        const type = CONTENT_TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream';
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.status(200).send(data);
        return;
      } catch {
        // try next layout (slash folder vs comma filename)
      }
    }
    res.status(404).end();
  });
}

/** Express 5 `*path` may be a string or string[]. */
function mediaPathParam(req: Request): string {
  const raw = req.params.path as string | string[] | undefined;
  if (Array.isArray(raw)) {
    return raw.join('/');
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw;
  }
  return req.path.replace(/^\/media\/?/, '');
}
