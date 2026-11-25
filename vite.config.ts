import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { atsDev } from './server/ats-vite.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), atsDev({ ...loadEnv(mode, '.', ['ATS_', 'OPENAI_API_KEY']), ...process.env })],
  server: { host: '0.0.0.0', allowedHosts: true },
}));
