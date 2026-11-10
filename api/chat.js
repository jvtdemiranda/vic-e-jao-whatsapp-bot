// Função serverless da Vercel: POST /api/chat
import { handleChat } from '../lib/chat.js';

export default async function handler(req, res) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || '').split(',')[0].trim() || req.socket?.remoteAddress;

  const { status, json } = await handleChat({ method: req.method, ip, body: req.body });
  if (status === 405) res.setHeader('Allow', 'POST');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(json);
}
