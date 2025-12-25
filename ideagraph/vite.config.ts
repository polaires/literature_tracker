import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy auth/sync API requests to backend server
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/sync': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy Semantic Scholar API requests to avoid CORS issues in development
      '/api/semanticscholar': {
        target: 'https://api.semanticscholar.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/semanticscholar/, ''),
        secure: true,
      },
      // Proxy Unpaywall API requests
      '/api/unpaywall': {
        target: 'https://api.unpaywall.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/unpaywall/, ''),
        secure: true,
      },
      // Proxy CORE API requests
      '/api/core': {
        target: 'https://api.core.ac.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/core/, ''),
        secure: true,
      },
    },
  },
})
