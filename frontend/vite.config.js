import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    open: false,
    proxy: {
      // Forward /api calls to the backend during local dev (override target via VITE_API_PROXY_TARGET).
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/pages/**',
        'src/data/**',
      ],
      thresholds: {
        lines: 5,
        functions: 10,
        branches: 20,
        statements: 5,
      },
    },
  },
});
