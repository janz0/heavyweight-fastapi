// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    proxy: {
      // forward Railway's healthcheck to FastAPI
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // and any /api calls too, if needed:
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    }
  }
})
