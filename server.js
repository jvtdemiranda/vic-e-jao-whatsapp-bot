// Servidor local de desenvolvimento (sem dependências): serve a pasta public/
// e o endpoint /api/chat. Em produção, a Vercel faz esse papel.
//   npm run dev  ->  http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleChat } from './lib/chat.js';

try {
  process.loadEnvFile();
} catch {
  // sem .env: roda no modo offline
}

const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 100_000) req.destroy();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/chat') {
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    const { status, json } = await handleChat({ method: req.method, ip: req.socket.remoteAddress, body });
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(json));
  }

  const path = normalize(join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!path.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const file = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}).listen(PORT, () => {
  const mode = process.env.GROQ_API_KEY ? 'IA (Groq)' : 'offline (sem GROQ_API_KEY)';
  console.log(`🦐 Vic & Jão rodando em http://localhost:${PORT}  —  modo: ${mode}`);
});
