import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const backend = new URL(
    env.BACKEND_URL ||
      'http://127.0.0.1:8080/Lordminds/Real_Estate_CRM/backend'
  )

  return {
    base: env.VITE_BASE_PATH || '/',

    plugins: [
      react(),
      tailwindcss(),
    ],

    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,

      allowedHosts: ['.trycloudflare.com'],

      proxy: {
        '/api': {
          target: backend.origin,
          changeOrigin: true,
          secure: false,

          rewrite: (path) =>
            `${backend.pathname.replace(/\/$/, '')}${path}`,

          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('host', backend.host)
            })

            proxy.on('error', (err) => {
              console.error('API proxy error:', err)
            })
          },
        },
      },
    },
  }
})