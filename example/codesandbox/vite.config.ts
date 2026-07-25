import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // ローカル(file:)パッケージは事前バンドルから除外する
    exclude: ['kuro-gamen'],
  },
});
