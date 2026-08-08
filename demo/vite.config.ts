import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const demoRoot = path.dirname(fileURLToPath(import.meta.url));
const demoPort = process.env.DEMO_PORT ?? '3000';
const apiTarget = `http://localhost:${demoPort}`;

export default defineConfig({
  root: demoRoot,
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': apiTarget,
      '/default-assets': apiTarget,
    },
  },
});
