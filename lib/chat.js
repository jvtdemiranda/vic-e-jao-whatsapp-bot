import { SYSTEM_PROMPT } from './prompt.js';
import { fallbackReply } from './fallback.js';
import { rateLimit } from './rate-limit.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Mesma ideia do n8n (que buscava as últimas 6 trocas no Google Sheets):
// só as mensagens mais recentes vão para o modelo.
export const MAX_MESSAGES = 12;
export const MAX_CHARS = 500;

/** Valida e limpa o histórico vindo do navegador. Retorna null se inválido. */
export function sanitizeHistory(input) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const history = input
    .slice(-MAX_MESSAGES)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === 'user' ? MAX_CHARS : 2000) }))
    .filter((m) => m.content.length > 0);
  if (history.length === 0 || history[history.length - 1].role !== 'user') return null;
  return history;
}

export async function generateReply(history, { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch } = {}) {
  if (!apiKey) return { reply: fallbackReply(history), source: 'offline' };

  try {
    const res = await fetchImpl(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 600,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Groq respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Groq retornou uma resposta vazia');
    return { reply, source: 'ai' };
  } catch (err) {
    console.error('[chat] falha na Groq, usando modo offline:', err.message);
    return { reply: fallbackReply(history), source: 'offline' };
  }
}

/**
 * Lógica do endpoint POST /api/chat, independente de framework
 * (usada pela função serverless da Vercel e pelo servidor local).
 */
export async function handleChat({ method, ip, body, env = process.env }) {
  if (method !== 'POST') return { status: 405, json: { error: 'Método não permitido' } };
  if (!rateLimit(ip || 'anon')) {
    return { status: 429, json: { error: 'Muitas mensagens em pouco tempo. Respira e tenta de novo em instantes 🦐' } };
  }

  let payload = body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return { status: 400, json: { error: 'JSON inválido' } };
    }
  }

  const history = sanitizeHistory(payload?.messages);
  if (!history) return { status: 400, json: { error: 'Envie { messages: [...] } terminando com uma mensagem do cliente' } };

  const result = await generateReply(history, { apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL || DEFAULT_MODEL });
  return { status: 200, json: result };
}
