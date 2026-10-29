import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from the root of gravitycandidateportal.co.za, locally and live.
  base: '/',
  // GitHub Pages deploys main:/docs as-is, so the built site is committed there.
  // The folder is emptied on each build; CNAME and .nojekyll come from public/.
  build: { outDir: 'docs' },
  server: {
    port: 59640,
    // In dev, /api goes to the Functions host (`cd api && npm start`), so the
    // app and API share an origin and VITE_API_BASE can stay empty.
    proxy: { '/api': 'http://localhost:7071' },
  },
});
