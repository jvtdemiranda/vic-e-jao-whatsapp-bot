# Vic & Joa - Chatbot de Atendimento via WhatsApp com IA

Chatbot de atendimento automatizado para restaurante, simulando o fluxo completo de pedidos via WhatsApp: cardápio, escolha de prato, delivery ou retirada, forma de pagamento e confirmação — tudo conduzido por IA.

## Como funciona

1. Cliente envia mensagem no WhatsApp
2. Webhook do n8n recebe via Evolution API
3. A mensagem é processada por um modelo de linguagem (Groq/LLaMA 3.3 70B), que segue um roteiro de atendimento definido via prompt
4. A resposta é enviada de volta ao cliente pelo WhatsApp
5. Cada interação é registrada automaticamente numa planilha do Google Sheets (data/hora, telefone, mensagem, resposta)

## Stack utilizada

- **n8n** — orquestração do fluxo de atendimento
- **Evolution API** — integração com WhatsApp (Docker)
- **Groq API (LLaMA 3.3 70B)** — geração das respostas do bot
- **Google Sheets API** — registro de conversas
- **Docker Compose** — containerização do Evolution API

## Como rodar localmente

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js (para rodar o n8n localmente)
- Conta na Groq (API key) e projeto no Google Cloud com Sheets API habilitada

### Passos

1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/vic-e-jao-whatsapp-bot.git
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
- Selecione `n8n-workflows/Vic_e_Joa.json`
- Configure suas próprias credenciais (Groq, Evolution API, Google Sheets) dentro do n8n

## Demonstração

[Aqui entra o GIF/vídeo mostrando a conversa funcionando]

## Autor

João Vitor Torres de Miranda