import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    minify: false,    // Disables JavaScript minification across all files
    cssMinify: false, // Disables CSS minification across all files
    sourcemap: true,  // Generates source maps for effortless inspection
    emptyOutDir: true // Clears old bundles before rebuilding
  }
});
