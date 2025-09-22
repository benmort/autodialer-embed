import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true
  },
  server: {
    cors: true,
    allowedHosts: ['benm.ngrok.dev', 'localhost', '127.0.0.1'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  },
  define: {
    global: 'globalThis'
  },
  css: {
    postcss: './postcss.config.js'
  }
})
