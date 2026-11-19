import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), {
    name: 'pathcv-premium-api',
    async configureServer(server) {
      // The same Node handler is deployed as a Vercel function; it is never in the client bundle.
      // @ts-expect-error JavaScript server module has no TypeScript declarations.
      const { premiumHandler } = await import('./api/premium.mjs');
      server.middlewares.use('/api/premium', premiumHandler({ ...loadEnv(mode, '.', ''), ...process.env }));
    },
  }],
  server: { host: '0.0.0.0', allowedHosts: true },
}));
