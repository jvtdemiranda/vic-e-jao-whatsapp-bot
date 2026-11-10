// Limite simples por IP, em memória, para proteger a cota da API da Groq.
// Em ambiente serverless cada instância tem sua própria memória, então é um
// limite "melhor esforço" — suficiente para uma demo de portfólio.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;
const hits = new Map();

export function rateLimit(key, now = Date.now()) {
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
