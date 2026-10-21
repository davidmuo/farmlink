import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from main.tsx once the page is idle, so precaching never competes with first paint
      injectRegister: null,
      manifest: {
        name: 'FarmLink',
        short_name: 'FarmLink',
        description: 'Fresh produce marketplace connecting farmers and buyers',
        theme_color: '#0A1C14',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        // Only the app shell is precached: files the first page load has already fetched. Precaching
        // every chunk meant a 1 MB background download on a first visit, competing with the hero
        // video. Other chunks are cached the first time they're used (see runtimeCaching).
        globPatterns: ['index.html', 'assets/index-*.{js,css}', 'assets/react-*.js', 'fonts/*.woff2'],
        globIgnores: ['media/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Code-split chunks: content-hashed, so a cached copy is always correct
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'app-chunks', expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
          {
            // Profile and produce photos
            urlPattern: ({ url }) => url.origin === 'https://images.pexels.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'pexels-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Video posters (content-hashed, so they never change). The videos themselves stream with
            // byte-range requests and are cached by the browser's HTTP cache via immutable headers.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/media/') && url.pathname.endsWith('.webp'),
            handler: 'CacheFirst',
            options: { cacheName: 'media-posters', expiration: { maxEntries: 30 } },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes rarely, so keep it in its own long-lived chunks
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
