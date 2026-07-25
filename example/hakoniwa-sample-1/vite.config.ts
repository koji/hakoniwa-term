import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['hakoniwa-term'],
  },
  resolve: {
    alias: {
      'hakoniwa-term/dist/index.css': path.resolve(__dirname, '../../dist/index.css'),
      'hakoniwa-term': path.resolve(__dirname, '../../dist/index.js'),
    },
  },
})
