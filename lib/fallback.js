// Modo offline: um atendente com respostas pré-programadas que segue o mesmo
// roteiro do prompt. É usado quando não há GROQ_API_KEY configurada ou quando a
// API da Groq falha / atinge o limite — assim a demo do portfólio nunca fica fora do ar.
//
// A "memória" funciona como no n8n: o estado da conversa é reconstruído
// relendo todas as mensagens do cliente, em ordem.

import { MENU, RESTAURANT, formatPrice, menuText } from './menu.js';

const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const has = (text, words) => words.some((w) => new RegExp(`\\b${w}`).test(text));

const INTENTS = {
  menu: ['cardapio', 'menu', 'pratos', 'opcoes'],
  hours: ['horario', 'abre', 'aberto', 'fecha', 'funciona'],
  restart: ['novo pedido', 'reiniciar', 'recomecar', 'cancelar', 'outro pedido'],
  delivery: ['delivery', 'entrega', 'entregar', 'em casa', 'manda', 'mandar'],
  pickup: ['retir', 'buscar', 'busco', 'pegar', 'presencial', 'balcao', 'vou ai'],
  pix: ['pix'],
  card: ['cartao', 'credito', 'debito', 'maquin'],
  paid: ['paguei', 'pago', 'fiz o pix', 'ja fiz', 'mandei', 'enviei', 'transferi', 'feito', 'pronto'],
  thanks: ['obrigad', 'valeu', 'vlw', 'brigad'],
};

// Ordem importa: nomes mais específicos antes dos genéricos ("salada de polvo com camarão").
const DISH_MATCH_ORDER = [10, 8, 9, 7, 2, 3, 4, 6, 5, 1];

export function findDish(text, { allowNumber = true } = {}) {
  const t = normalize(text);
  if (allowNumber) {
    const num = t.match(/(?:^|[^\d,.])(10|[1-9])(?![\d,.])/);
    if (num) return MENU.find((d) => d.id === Number(num[1]));
  }
  for (const id of DISH_MATCH_ORDER) {
    const dish = MENU.find((d) => d.id === id);
    if (dish.keywords.some((k) => t.includes(k))) return dish;
  }
  // "camarão" sozinho -> camarão na manteiga (o carro-chefe)
  if (/\bcamarao\b/.test(t)) return MENU[0];
  return undefined;
}

// Chave Pix fictícia e estável para a mesma conversa.
function fakePixKey(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return String(Math.abs(h) % 1e8).padStart(8, '0');
}

const summary = (order) => {
  const lines = [`🧾 *Resumo do pedido*`, `${order.dish.emoji} *${order.dish.name}*`];
  lines.push(order.mode === 'delivery' ? `🛵 Delivery: ${order.address}` : `🏃 Retirada: ${RESTAURANT.address}`);
  lines.push(`💰 Total: *${formatPrice(order.dish.price)}*`);
  return lines.join('\n');
};

const askPayment = (order) =>
  order.mode === 'delivery'
    ? 'Como prefere pagar? *Pix* 📲 ou *cartão na entrega* 💳'
    : 'Como prefere pagar? *Pix* 📲 ou *cartão no balcão* 💳';

const menuReply = (intro) => `${intro}\n\n${menuText()}\n\nÉ só mandar o *número* ou o nome do prato! 😋`;

function step(state, message) {
  const t = normalize(message);
  const order = state.order;

  if (has(t, INTENTS.restart)) {
    return { stage: 'choosing', order: {}, reply: menuReply('Bora começar de novo! 🔄 Dá uma olhada:') };
  }
  if (has(t, INTENTS.hours)) {
    return { ...state, reply: `🕕 Funcionamos de *${RESTAURANT.hours}*.\n📍 ${RESTAURANT.address}` };
  }
  if (has(t, INTENTS.menu) && ['start', 'choosing', 'done'].includes(state.stage)) {
    return { stage: 'choosing', order: {}, reply: menuReply('Olha só o que tá saindo hoje! 🌊') };
  }

  switch (state.stage) {
    case 'start': {
      const dish = findDish(t);
      if (dish) return step({ stage: 'choosing', order: {} }, message);
      return {
        stage: 'choosing',
        order: {},
        reply: menuReply(
          `Eaaai! 👋 Aqui é o *${RESTAURANT.attendant}*, atendente virtual do *${RESTAURANT.name}* 🦐\n\nSe liga no nosso cardápio:`,
        ),
      };
    }

    case 'choosing': {
      const dish = findDish(t);
      if (!dish) {
        return {
          ...state,
          reply: `Hmm, não achei esse prato 🤔\nManda o *número* de 1 a 10 ou escreve *cardápio* pra ver as opções!`,
        };
      }
      return {
        stage: 'mode',
        order: { dish },
        reply: `Boa escolha! ${dish.emoji} *${dish.name}* - *${formatPrice(dish.price)}*\n\nVai ser *delivery* 🛵 ou *retirada* no restaurante 🏃?`,
      };
    }

    case 'mode': {
      if (has(t, INTENTS.pickup)) {
        const next = { ...order, mode: 'pickup' };
        return {
          stage: 'payment',
          order: next,
          reply: `Fechou! Retirada no *${RESTAURANT.name}* 📍 ${RESTAURANT.address}\n\n${summary(next)}\n\n${askPayment(next)}`,
        };
      }
      if (has(t, INTENTS.delivery)) {
        return { stage: 'address', order: { ...order, mode: 'delivery' }, reply: 'Show! 🛵 Me passa o *endereço* completo pra entrega?' };
      }
      const dish = findDish(t, { allowNumber: false });
      if (dish) return step({ stage: 'choosing', order: {} }, message);
      return { ...state, reply: 'É *delivery* 🛵 ou *retirada* 🏃?' };
    }

    case 'address': {
      if (t.length < 6) return { ...state, reply: 'Me manda o endereço completo, com rua e número 🏠' };
      const next = { ...order, address: String(message).trim() };
      return {
        stage: 'payment',
        order: next,
        reply: `Show! Delivery confirmado para *${next.address}* 🛵\n\n${summary(next)}\n\n${askPayment(next)}`,
      };
    }

    case 'payment': {
      if (has(t, INTENTS.pix)) {
        const key = fakePixKey(`${order.dish.id}${order.address ?? ''}`);
        return {
          stage: 'awaiting_pix',
          order: { ...order, pixKey: key },
          reply: `Chave Pix: *${key}* 📲\nValor: *${formatPrice(order.dish.price)}*\n\nAssim que pagar, me avisa por aqui! 😉\n_(chave fictícia, é só uma demo)_`,
        };
      }
      if (has(t, INTENTS.card)) {
        const how =
          order.mode === 'delivery'
            ? `O motoboy leva a maquininha 💳\nSeu pedido chega em *${RESTAURANT.deliveryMinutes} minutos* 🛵`
            : `É só pagar no balcão 💳\nSeu pedido fica pronto em *${RESTAURANT.pickupMinutes} minutos* 🔥`;
        return { stage: 'done', order, reply: `Pedido confirmado! ✅\n${how}\n\nValeu pela preferência! 🦐` };
      }
      return { ...state, reply: askPayment(order) };
    }

    case 'awaiting_pix': {
      if (has(t, INTENTS.paid) || has(t, INTENTS.thanks)) {
        const eta =
          order.mode === 'delivery'
            ? `Seu pedido chega em *${RESTAURANT.deliveryMinutes} minutos* 🛵`
            : `Seu pedido fica pronto pra retirada em *${RESTAURANT.pickupMinutes} minutos* 🔥`;
        return { stage: 'done', order, reply: `Pagamento recebido! ✅🎉\n${eta}\n\nValeu pela preferência! 🦐` };
      }
      return { ...state, reply: `Tô no aguardo do Pix 👀\nChave: *${order.pixKey}* - *${formatPrice(order.dish.price)}*\nQuando pagar, é só mandar *paguei*!` };
    }

    case 'done':
    default: {
      if (has(t, INTENTS.thanks)) return { ...state, reply: 'Nós que agradecemos! 💙 Bom apetite! 🦐' };
      const dish = findDish(t, { allowNumber: false });
      if (dish) return step({ stage: 'choosing', order: {} }, message);
      return {
        ...state,
        reply: 'Seu pedido já tá encaminhado! 🛵\nQuer pedir mais alguma coisa? Manda *cardápio* ou *novo pedido* 😋',
      };
    }
  }
}

/**
 * Gera a resposta offline a partir do histórico ({ role, content }[]),
 * sendo a última mensagem a do cliente.
 */
export function fallbackReply(history) {
  let state = { stage: 'start', order: {}, reply: '' };
  for (const msg of history) {
    if (msg.role === 'user') state = step(state, msg.content);
  }
  return state.reply || menuReply('Olha só o nosso cardápio! 🌊');
}
