import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const STATIC_DIRS = [
  '3d',
  'apps',
  'assets',
  'covers',
  'css',
  'fonts',
  'js',
  'logos',
  'myscore',
  'photo',
  'posters',
  'sport',
];

function copyStaticDirectoriesPlugin(): Plugin {
  return {
    name: 'copy-static-collection-dirs',
    closeBundle() {
      const rootDir = process.cwd();
      const distDir = resolve(rootDir, 'dist');
      for (const dir of STATIC_DIRS) {
        const src = resolve(rootDir, dir);
        const dest = resolve(distDir, dir);
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true, force: true });
        }
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), copyStaticDirectoriesPlugin()],
  publicDir: false,
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'index.html'),
    },
  },
});
