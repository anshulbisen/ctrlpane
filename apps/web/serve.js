import { join } from 'node:path';

const distDir = import.meta.dir;

Bun.serve({
  port: Number(process.env.WEB_PORT) || 33000,
  hostname: '127.0.0.1',

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;

    const file = Bun.file(join(distDir, pathname));
    if (await file.exists()) {
      return new Response(file);
    }

    // SPA fallback: serve index.html for all unmatched routes
    return new Response(Bun.file(join(distDir, 'index.html')));
  },
});
