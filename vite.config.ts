import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true, // すべての型定義を1つのファイルに統合
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KuroGamen',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      // CSSファイルの出力名を固定化する
      cssFileName: 'index',
    },
    rollupOptions: {
      // 外部依存関係としてバンドルから除外するライブラリ
      // (react/jsx-runtime などのサブパスも含めて除外する)
      external: [/^react($|\/)/, /^react-dom($|\/)/, 'lucide-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'LucideReact',
        },
      },
    },
  },
});
