// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
    host: true,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:8080',
        router: (req: { url: string }) => {
          const url = req.url || ''
          if (url.startsWith('/api/opposite') || url.startsWith('/api/model') || url.startsWith('/api/article')) {
            return 'http://localhost:8001'
          }
          return 'http://localhost:8080'
        },
      },
    },
  },
})
