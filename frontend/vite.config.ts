import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.FRONTEND_PORT || env.VITE_PORT) || 5173
  const proxyTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:8000'
  // Polling keeps HMR working when the source lives on a Windows host and Vite
  // runs inside Docker (inotify events from bind mounts are not reliable there).
  const usePolling = (env.VITE_USE_POLLING ?? process.env.VITE_USE_POLLING) === 'true'

  return {
    plugins: [react(), tailwindcss()],

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
      },
    },
  }
})
