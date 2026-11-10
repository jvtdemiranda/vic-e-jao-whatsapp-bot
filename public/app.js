// Chat estilo WhatsApp que conversa com POST /api/chat.
// A memória da conversa fica no navegador (localStorage) e as últimas
// mensagens são enviadas a cada requisição — o servidor não guarda nada.

const STORAGE_KEY = 'vicejao:chat:v1';
const HISTORY_LIMIT = 12;

const els = {
  messages: document.getElementById('messages'),
  form: document.getElementById('form'),
  input: document.getElementById('input'),
  send: document.getElementById('send'),
  status: document.getElementById('status'),
  reset: document.getElementById('reset'),
  suggestions: document.getElementById('suggestions'),
};

let history = load();
let busy = false;

// ---------- persistência ----------

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-50)));
  } catch {
    /* navegação privada / storage bloqueado: segue só em memória */
  }
}

// ---------- formatação WhatsApp ----------

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function formatWhatsApp(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>');
}

const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const TICK_SVG =
  '<svg class="tick" viewBox="0 0 16 11" aria-hidden="true"><path fill="currentColor" d="M11.07.66 10.4.15a.37.37 0 0 0-.52.07L4.29 7.4 1.98 5.24a.37.37 0 0 0-.52.02l-.6.62a.37.37 0 0 0 .02.52l3.17 2.98c.16.15.4.13.54-.04l6.53-8.1a.37.37 0 0 0-.05-.58zm4 0-.67-.51a.37.37 0 0 0-.52.07L8.29 7.4l-.79-.74-.66.82 1.29 1.21c.16.15.4.13.54-.04l6.53-8.1a.37.37 0 0 0-.05-.58z"/></svg>';

// ---------- renderização ----------

function renderMessage(msg, index) {
  const prev = history[index - 1];
  const bubble = document.createElement('div');
  bubble.className = `bubble ${msg.role === 'user' ? 'out' : 'in'}`;
  if (!prev || prev.role !== msg.role) bubble.classList.add('first');

  const read = msg.role === 'user' && history.slice(index + 1).some((m) => m.role === 'assistant');
  const meta = [
    msg.source === 'offline' ? '<span class="tag" title="Resposta do modo offline (sem IA)">offline ·</span>' : '',
    `<time datetime="${msg.time}">${timeLabel(msg.time)}</time>`,
    msg.role === 'user' ? TICK_SVG.replace('class="tick"', `class="tick${read ? ' read' : ''}"`) : '',
  ].join('');

  bubble.innerHTML = `${formatWhatsApp(msg.content)}<span class="meta">${meta}</span>`;
  return bubble;
}

function render() {
  els.messages.querySelectorAll('.bubble').forEach((b) => b.remove());
  history.forEach((msg, i) => els.messages.appendChild(renderMessage(msg, i)));
  renderSuggestions();
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.messages.scrollTop = els.messages.scrollHeight;
  });
}

function showTyping(on) {
  els.status.textContent = on ? 'digitando…' : 'online';
  const existing = els.messages.querySelector('.typing-bubble');
  if (on && !existing) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble in first typing-bubble';
    bubble.setAttribute('aria-label', 'Digitando');
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    els.messages.appendChild(bubble);
    scrollToBottom();
  } else if (!on && existing) {
    existing.remove();
  }
}

function showNotice(text, isError = false) {
  const p = document.createElement('p');
  p.className = `notice${isError ? ' error' : ''}`;
  p.textContent = text;
  els.messages.appendChild(p);
  scrollToBottom();
}

// Sugestões rápidas de acordo com a etapa do atendimento (vale para IA e offline).
function suggestionsFor(lastBotMessage) {
  if (!lastBotMessage) return ['Oi! 👋', 'Ver cardápio', 'Qual o horário?'];
  const t = lastBotMessage.toLowerCase();
  if (/chave|aguardo do pix/.test(t)) return ['Paguei ✅'];
  if (/pix/.test(t) && /cart[aã]o/.test(t)) return ['Pix', 'Cartão'];
  if (/endere[cç]o/.test(t) && !/confirmad/.test(t)) return ['Rua das Flores, 45 - Centro'];
  if (/delivery/.test(t) && /retirada/.test(t)) return ['Delivery 🛵', 'Retirada 🏃'];
  if (/\*1\.|n[uú]mero/.test(t)) return ['Quero o 1', 'Moqueca de camarão', 'Lagosta grelhada'];
  if (/pagamento recebido|confirmado|chega em|pronto em/.test(t)) return ['Valeu! 🙌', 'Novo pedido'];
  return ['Ver cardápio', 'Novo pedido'];
}

function renderSuggestions() {
  const lastBot = [...history].reverse().find((m) => m.role === 'assistant');
  els.suggestions.replaceChildren(
    ...suggestionsFor(lastBot?.content).map((text) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.addEventListener('click', () => send(text));
      return btn;
    }),
  );
}

// ---------- envio ----------

async function send(text) {
  const content = text.trim();
  if (!content || busy) return;

  busy = true;
  els.send.disabled = true;
  els.messages.querySelectorAll('.notice.error').forEach((n) => n.remove());
  history.push({ role: 'user', content, time: new Date().toISOString() });
  save();
  render();
  showTyping(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.slice(-HISTORY_LIMIT).map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);

    // pequeno atraso para o "digitando…" parecer natural
    await new Promise((r) => setTimeout(r, 350));
    history.push({ role: 'assistant', content: data.reply, source: data.source, time: new Date().toISOString() });
    save();
    showTyping(false);
    render();
  } catch (err) {
    showTyping(false);
    showNotice(`Não consegui responder agora: ${err.message}`, true);
  } finally {
    busy = false;
    els.send.disabled = false;
    els.input.focus({ preventScroll: true });
  }
}

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = els.input.value;
  els.input.value = '';
  send(text);
});

els.reset.addEventListener('click', () => {
  history = [];
  save();
  els.messages.querySelectorAll('.notice.error').forEach((n) => n.remove());
  render();
  els.input.focus();
});

render();
if (window.matchMedia('(min-width: 901px)').matches) els.input.focus({ preventScroll: true });
