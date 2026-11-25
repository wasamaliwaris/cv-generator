import { createAtsHandler } from '../api/ats.mjs';
export function atsDev(env) {
  const handler = createAtsHandler(env);
  const mount = (server) => {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/api/ats') return next();
      void handler(req, res);
    });
  };
  return { name: 'pathcv-ats-api', configureServer: mount, configurePreviewServer: mount };
}
