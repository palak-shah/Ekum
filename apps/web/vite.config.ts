import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The generated Workbox SW precaches the app shell for offline use and
      // imports our push handler so browser push works even when the tab is shut.
      workbox: {
        navigateFallback: 'index.html',
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
  },
});
