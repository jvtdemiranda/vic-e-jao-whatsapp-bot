# 🍽️ Vic & Jão — Chatbot de Atendimento via WhatsApp com IA

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![n8n](https://img.shields.io/badge/n8n-workflow-orange.svg) ![WhatsApp](https://img.shields.io/badge/WhatsApp-Evolution%20API-25D366.svg)

## 💡 Qual problema resolve?

Restaurantes perdem tempo (e clientes) com atendimento manual via WhatsApp. Esse chatbot simula o atendimento completo de um restaurante — do cardápio à confirmação do pedido — de forma automática, guiado por IA e com memória de conversa.

## ✅ O que você consegue fazer

- Consultar o cardápio e escolher o prato direto pelo WhatsApp
- Escolher entre delivery ou retirada
- Definir a forma de pagamento e confirmar o pedido
- Manter uma conversa natural, com a IA lembrando o contexto do atendimento

## 📱 Demonstração

![Demonstração do Vic & Jão respondendo no WhatsApp](./demo.gif)

## 🔄 Fluxo da automação

1. Cliente envia mensagem no WhatsApp
2. Webhook do n8n recebe via Evolution API
3. O histórico de mensagens daquele cliente é buscado no Google Sheets, para o bot manter contexto da conversa
4. A mensagem atual + o histórico são enviados a um modelo de linguagem (Groq/LLaMA 3.3 70B), que segue um roteiro de atendimento definido via prompt
5. A resposta é enviada de volta ao cliente pelo WhatsApp
6. Cada interação é registrada automaticamente numa planilha do Google Sheets (data/hora, telefone, mensagem, resposta)

![Fluxo completo do workflow no n8n](./fluxo-n8n.png)

## 🛠️ Tecnologias utilizadas

- **n8n** — orquestração do fluxo de atendimento
- **Evolution API** — integração com WhatsApp (Docker)
- **Groq API (LLaMA 3.3 70B)** — geração das respostas do bot, com memória de conversa
- **Google Sheets API** — registro de conversas e fonte de histórico
- **Docker Compose** — containerização do Evolution API

## 📁 Estrutura do repositório

```
vic-e-jao-whatsapp-bot/
├── README.md
├── LICENSE
├── .env.example
├── .gitignore
├── docker-compose.yml
├── demo.gif
├── fluxo-n8n.png
└── n8n-workflows/
    └── vic-e-jao-whatsapp-bot.json   # workflow exportado do n8n
```

## 🚀 Como usar

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
- Selecione [`n8n-workflows/vic-e-jao-whatsapp-bot.json`](./n8n-workflows/vic-e-jao-whatsapp-bot.json)
- Configure suas próprias credenciais (Groq, Evolution API, Google Sheets) dentro do n8n

## 👨‍💻 Autor

João Vitor — [github.com/jvtdemiranda](https://github.com/jvtdemiranda)

## 📜 Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE) para mais detalhes.
