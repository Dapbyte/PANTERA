import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.FRONTEND_PORT || env.VITE_PORT) || 5173
  const proxyTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:8000'
  // Polling keeps HMR working when the source lives on a Windows host and Vite
  // runs inside Docker (inotify events from bind mounts are not reliable there).
  const usePolling = (env.VITE_USE_POLLING ?? process.env.VITE_USE_POLLING) === 'true'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.png', 'logo-pantera-navy.png', 'logo-pantera-white.png'],
        manifest: {
          name: 'PANTERA - Pemantauan Arsip, Termin & Risiko',
          short_name: 'PANTERA',
          description:
            'Aplikasi pemantauan arsip, termin, progres fisik, dan risiko keterlambatan proyek PT. Djasipa Mitra Perkasa.',
          theme_color: '#1877F2',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/favicon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/logo-pantera-navy.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api\//, /^\/storage\//],
        },
      }),
    ],

    server: {
      host: '0.0.0.0',
      port,
      strictPort: false,

      watch: usePolling ? { usePolling: true, interval: 300 } : undefined,

      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/storage': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
