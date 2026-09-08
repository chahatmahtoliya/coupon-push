import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.xml': 'application/xml' };
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname.replace(/^\/+/, '') + (pathname.endsWith('/') ? 'index.html' : '');
    const candidates = pathname.startsWith('/blog/') ? [path.join(root, relative)] : [path.join(root, 'public', relative), path.join(root, 'out', relative)];
    for (const file of candidates) {
      if (!file.startsWith(root + path.sep)) continue;
      try {
        const body = await fs.readFile(file);
        response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        response.end(body); return;
      } catch (error) { if (!['ENOENT', 'EISDIR'].includes(error.code)) throw error; }
    }
    response.writeHead(404); response.end('Page not found');
  } catch { response.writeHead(400); response.end('Invalid request'); }
}).listen(8767, '127.0.0.1', () => console.log('CouponPush blog: http://127.0.0.1:8767/blog/'));
