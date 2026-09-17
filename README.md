# Vic & Joa - Chatbot de Atendimento via WhatsApp com IA

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![n8n](https://img.shields.io/badge/n8n-workflow-orange.svg) ![WhatsApp](https://img.shields.io/badge/WhatsApp-Evolution%20API-25D366.svg)

Chatbot de atendimento automatizado para restaurante, simulando o fluxo completo de pedidos via WhatsApp: cardápio, escolha de prato, delivery ou retirada, forma de pagamento e confirmação — tudo conduzido por IA, com memória de conversa.

## Demonstração

![Demonstração do Vic & Joa respondendo no WhatsApp](./demo.gif)

## Como funciona

1. Cliente envia mensagem no WhatsApp
2. Webhook do n8n recebe via Evolution API
3. O histórico de mensagens daquele cliente é buscado no Google Sheets, para o bot manter contexto da conversa
4. A mensagem atual + o histórico são enviados a um modelo de linguagem (Groq/LLaMA 3.3 70B), que segue um roteiro de atendimento definido via prompt
5. A resposta é enviada de volta ao cliente pelo WhatsApp
6. Cada interação é registrada automaticamente numa planilha do Google Sheets (data/hora, telefone, mensagem, resposta)

## Fluxo no n8n

![Fluxo completo do workflow no n8n](./fluxo-n8n.png)

## Stack utilizada

- **n8n** — orquestração do fluxo de atendimento
- **Evolution API** — integração com WhatsApp (Docker)
- **Groq API (LLaMA 3.3 70B)** — geração das respostas do bot, com memória de conversa
- **Google Sheets API** — registro de conversas e fonte de histórico
- **Docker Compose** — containerização do Evolution API

## Como rodar localmente

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js (para rodar o n8n localmente)
- Conta na Groq (API key) e projeto no Google Cloud com Sheets API habilitada

### Passos

1. Clone o repositório
```bash
git clone https://github.com/jvtdemiranda/vic-e-jao-whatsapp-bot.git
cd vic-e-jao-whatsapp-bot
```

2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# edite o .env com sua chave real do Evolution API
```

3. Suba o Evolution API
```bash
docker compose up -d
```

4. Rode o n8n localmente
```bash
npx n8n start
```

5. Importe o workflow
- Acesse `http://localhost:5678`
- Vá em Workflows → Import from File
- Selecione `n8n-workflows/Vic_e_Joa_com_memoria.json`
- Configure suas próprias credenciais (Groq, Evolution API, Google Sheets) dentro do n8n

## Autor

João Vitor Torres de Miranda

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE) para mais detalhes.
