// Cardápio do restaurante Vic & Jão.
// Fonte única usada pelo prompt da IA e pelo modo offline.

export const MENU = [
  { id: 1, name: 'Camarão na manteiga', price: 45, emoji: '🦐', keywords: ['camarao na manteiga', 'manteiga'] },
  { id: 2, name: 'Lagosta grelhada', price: 89, emoji: '🦞', keywords: ['lagosta'] },
  { id: 3, name: 'Casquinha de siri', price: 32, emoji: '🦀', keywords: ['casquinha', 'siri'] },
  { id: 4, name: 'Polvo ao alho e óleo', price: 67, emoji: '🐙', keywords: ['polvo ao alho', 'alho e oleo'] },
  { id: 5, name: 'Filé de peixe grelhado', price: 38, emoji: '🐟', keywords: ['peixe', 'file'] },
  { id: 6, name: 'Lula à milanesa', price: 42, emoji: '🦑', keywords: ['lula', 'milanesa'] },
  { id: 7, name: 'Mix de frutos do mar', price: 72, emoji: '🍤', keywords: ['mix'] },
  { id: 8, name: 'Moqueca de camarão', price: 58, emoji: '🥘', keywords: ['moqueca'] },
  { id: 9, name: 'Macarrão com frutos do mar', price: 48, emoji: '🍝', keywords: ['macarrao', 'massa'] },
  { id: 10, name: 'Salada de polvo com camarão', price: 35, emoji: '🥗', keywords: ['salada'] },
];

export const RESTAURANT = {
  name: 'Vic & Jão',
  attendant: 'Camarão',
  address: 'Rua do Mar, 123 - Centro',
  hours: 'terça a domingo, das 18h às 23h',
  deliveryMinutes: 40,
  pickupMinutes: 25,
};

export const formatPrice = (value) => `R$${value}`;

export const menuText = () =>
  MENU.map((d) => `*${d.id}. ${d.name}* - ${formatPrice(d.price)} ${d.emoji}`).join('\n');
