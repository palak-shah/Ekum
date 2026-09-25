import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const SHARE_LINK_BOT =
  /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|LinkedInBot/i;

function shareLinkOgMiddleware(
  webEnv: Record<string, string>,
  rootEnv: Record<string, string>,
) {
  const apiBase = (
    webEnv.VITE_API_BASE_URL ||
    rootEnv.VITE_API_BASE_URL ||
    'http://localhost:3000/api/v1'
  ).replace(/\/$/, '');

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = req.url?.split('?')[0] ?? '';
    const shareMatch = path.match(/^\/s\/([^/]+)$/);
    const inviteMatch = path.match(/^\/r\/([^/]+)$/);
    const token = shareMatch?.[1] ?? inviteMatch?.[1];
    const cardPath = shareMatch
      ? `${apiBase}/share-links/${token}/card`
      : inviteMatch
        ? `${apiBase}/referrals/${token}/card`
        : null;
    if (!cardPath || !SHARE_LINK_BOT.test(req.headers['user-agent'] ?? '')) {
      next();
      return;
    }
    try {
      const card = await fetch(cardPath);
      if (!card.ok) {
        next();
        return;
      }
      const html = await card.text();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    } catch {
      next();
    }
  };
}

export default defineConfig(({ mode }) => {
  const webDir = fileURLToPath(new URL('.', import.meta.url));
  const monorepoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const rootEnv = loadEnv(mode, monorepoRoot, '');
  const webEnv = loadEnv(mode, webDir, '');
  const publicOrigin = (
    webEnv.VITE_PUBLIC_ORIGIN ||
    rootEnv.VITE_PUBLIC_ORIGIN ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
  const webBuildId =
    webEnv.VITE_WEB_BUILD ||
    rootEnv.EKUM_WEB_BUILD ||
    process.env.SOURCE_DATE_EPOCH ||
    new Date().toISOString();

  return {
  define: {
    'import.meta.env.VITE_WEB_BUILD': JSON.stringify(webBuildId),
  },
  plugins: [
    {
      name: 'ekum-web-build-id',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ build: webBuildId }),
        });
      },
    },
    {
      name: 'ekum-html-public-origin',
      transformIndexHtml(html) {
        return html
          .replaceAll('%VITE_PUBLIC_ORIGIN%', publicOrigin)
          .replaceAll('%VITE_WEB_BUILD%', webBuildId);
      },
    },
    {
      name: 'ekum-share-link-og',
      configureServer(server) {
        server.middlewares.use(shareLinkOgMiddleware(webEnv, rootEnv));
      },
      configurePreviewServer(server) {
        server.middlewares.use(shareLinkOgMiddleware(webEnv, rootEnv));
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      // Register from `useRegisterSW` so we can show New version · Load.
      injectRegister: false,
      // Keep the SW off during `vite dev` so chat/API responses are never served
      // from a stale Workbox cache while iterating on ThreadPage.
      devOptions: { enabled: false },
      // The generated Workbox SW precaches the app shell for offline use and
      // imports our push handler so browser push works even when the tab is shut.
      workbox: {
        // Do not precache the shell — Home Screen would keep serving the old
        // index.html and never run new update code. Offline uses last NetworkFirst.
        globIgnores: ['**/index.html', '**/version.json'],
        navigateFallbackDenylist: [/^\/api/, /^\/media/, /^\/version\.json/],
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ekum-shell',
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: /\/version\.json$/,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'Ekum',
        short_name: 'Ekum',
        description: 'B2B textile trade, organised.',
        theme_color: '#2b2b2b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['business', 'shopping'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Split the rarely-changing vendor libs into their own chunk so app updates
    // don't re-download React/Router/Query on every deploy (helps repeat loads on
    // slow connections). Feature screens are already route-split via React.lazy.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // So dual-test.html can load the app on both localhost and 127.0.0.1
    // (separate origins → two independent login sessions side by side).
    host: true,
    // Match Compose nginx: page-origin `/media` and `/api` hit the API.
    // Without this, `toAbsoluteMediaUrl` rewrites PUT tickets onto :5173 and uploads fail in e2e/dev.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
};
});
