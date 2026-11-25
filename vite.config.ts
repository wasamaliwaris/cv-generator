import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { atsDev } from './server/ats-vite.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), atsDev({ ...loadEnv(mode, '.', ['ATS_', 'OPENAI_API_KEY']), ...process.env })],
  build: { rollupOptions: { output: {
    // Tesseract loads its dictionary by language code; keep this one file's basename stable.
    assetFileNames: asset => asset.names.includes('eng.traineddata.gz') ? 'assets/ats-ocr/eng-v4-best-int/eng.traineddata.gz' : 'assets/[name]-[hash][extname]',
  } } },
  server: { host: '0.0.0.0', allowedHosts: true },
}));
