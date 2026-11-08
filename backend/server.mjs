// Serves the frontend with security headers. No API, no database and no request logging.
import { createServer } from 'node:http';
import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = join(import.meta.dirname, '..', 'frontend');

// Only these files are served, so nothing else on disk can be requested.
const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/veiviser.js': ['veiviser.js', 'text/javascript; charset=utf-8'],
  '/veiviser-data.js': ['veiviser-data.js', 'text/javascript; charset=utf-8'],
  '/icons/icon.svg': ['icons/icon.svg', 'image/svg+xml'],
  '/fonts/instrument-sans-400.woff2': ['fonts/instrument-sans-400.woff2', 'font/woff2'],
  '/fonts/instrument-sans-500.woff2': ['fonts/instrument-sans-500.woff2', 'font/woff2'],
  '/fonts/instrument-sans-600.woff2': ['fonts/instrument-sans-600.woff2', 'font/woff2'],
  '/fonts/instrument-serif-400.woff2': ['fonts/instrument-serif-400.woff2', 'font/woff2'],
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

// Development only: open pages reload when a frontend file changes or the server restarts.
const DEV_RELOAD_SCRIPT = `const events = new EventSource('/__dev/events');
let connected = false;
events.onopen = () => {
  if (connected) location.reload();
  connected = true;
};
events.onmessage = () => location.reload();
`;

function startDevReload() {
  const clients = new Set();
  let timer;
  watch(FRONTEND_DIR, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const client of clients) client.write('data: reload\n\n');
    }, 100);
  });
  return clients;
}

export function createAppServer({ dev = false } = {}) {
  const devClients = dev ? startDevReload() : null;

  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (dev && req.method === 'GET' && pathname === '/__dev/reload.js') {
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'text/javascript; charset=utf-8' });
      return res.end(DEV_RELOAD_SCRIPT);
    }
    if (dev && req.method === 'GET' && pathname === '/__dev/events') {
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
      res.write(': connected\n\n');
      devClients.add(res);
      req.on('close', () => devClients.delete(res));
      return;
    }

    const file = STATIC_FILES[pathname];
    if (req.method !== 'GET' || !file) {
      res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Fant ikke siden.');
    }

    try {
      let body = await readFile(join(FRONTEND_DIR, file[0]));
      if (dev && file[0] === 'index.html') {
        body = body.toString('utf8').replace('</body>', '<script src="/__dev/reload.js"></script></body>');
      }
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': file[1], 'Cache-Control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(500, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Noe gikk galt på serveren.');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = Number(process.env.PORT) || 3001;
  const HOST = process.env.HOST || '127.0.0.1';
  createAppServer({ dev: process.argv.includes('--dev') }).listen(PORT, HOST, () => {
    console.log(`Tilgangsstien kjører på http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT}`);
  });
}
