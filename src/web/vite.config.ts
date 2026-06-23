import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The NestJS API listens on http://localhost:8080 with a global `/api` prefix.
// We proxy `/api` during development so the front-end can use same-origin
// relative URLs and avoid CORS configuration.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});

