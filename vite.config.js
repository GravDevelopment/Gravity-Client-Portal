import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo>/; local dev serves it from /.
  base: command === 'build' ? '/Gravity-Client-Portal/' : '/',
  server: {
    port: 59640,
    // In dev, /api goes to the Functions host (`cd api && npm start`), so the
    // app and API share an origin and VITE_API_BASE can stay empty.
    proxy: { '/api': 'http://localhost:7071' },
  },
}));
