import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fallbackReply, findDish } from '../lib/fallback.js';

// Simula uma conversa: cada mensagem do cliente recebe a resposta offline.
function converse(...userMessages) {
  const history = [];
  for (const content of userMessages) {
    history.push({ role: 'user', content });
    history.push({ role: 'assistant', content: fallbackReply(history) });
  }
  return history.filter((m) => m.role === 'assistant').map((m) => m.content);
}

test('saudação mostra o cardápio', () => {
  const [reply] = converse('oi');
  assert.match(reply, /Camarão/);
  assert.match(reply, /\*10\. Salada de polvo com camarão\* - R\$35/);
});

test('encontra pratos por número e por nome', () => {
  assert.equal(findDish('quero o 2').id, 2);
  assert.equal(findDish('me vê o 10 por favor').id, 10);
  assert.equal(findDish('uma moqueca').id, 8);
  assert.equal(findDish('salada de polvo com camarão').id, 10);
  assert.equal(findDish('Polvo ao alho e óleo').id, 4);
  assert.equal(findDish('nada a ver'), undefined);
});

test('fluxo completo: delivery + Pix', () => {
  const replies = converse('oi', 'quero o 8', 'delivery', 'Rua das Flores, 45 - Centro', 'pix', 'paguei');
  assert.match(replies[1], /Moqueca de camarão/);
  assert.match(replies[2], /endereço/);
  assert.match(replies[3], /Delivery confirmado para \*Rua das Flores, 45 - Centro\*/);
  assert.match(replies[3], /R\$58/);
  assert.doesNotMatch(replies[3], /\*1\. Camarão na manteiga/, 'não repete o cardápio');
  assert.match(replies[4], /Chave Pix: \*\d{8}\*/);
  assert.match(replies[5], /Pagamento recebido/);
  assert.match(replies[5], /40 minutos/);
});

test('fluxo completo: retirada + cartão', () => {
  const replies = converse('olá', 'lagosta', 'vou retirar', 'cartão');
  assert.match(replies[2], /Rua do Mar, 123/);
  assert.match(replies[3], /balcão/);
  assert.match(replies[3], /25 minutos/);
});

test('número do endereço não é confundido com prato', () => {
  const replies = converse('quero o 3', 'entrega', 'Av. Brasil 7');
  assert.match(replies[2], /Av\. Brasil 7/);
  assert.match(replies[2], /Casquinha de siri/);
});

test('responde horário e permite recomeçar', () => {
  const replies = converse('oi', 'qual o horário?', 'quero o 1', 'novo pedido');
  assert.match(replies[1], /18h às 23h/);
  assert.match(replies[3], /começar de novo/);
});
