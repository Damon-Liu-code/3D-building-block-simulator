import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'JSARInteractiveXR',
      fileName: (format) => `jsar-interactive-xr.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['@yodaos-jsar/api'],
      output: {
        globals: {
          '@yodaos-jsar/api': 'JSAR'
        }
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
