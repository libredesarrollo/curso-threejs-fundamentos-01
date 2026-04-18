import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: '../public', // If we have assets
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
  }
});
