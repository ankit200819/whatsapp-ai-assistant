# Qwen | WhatsApp AI Assistant

Production-ready, lightweight WhatsApp AI Assistant customized for **Maurya ji**, powered by **Qwen** with dual-engine support:
- **Google Gemini 1.5 Flash** (Free Cloud Tier, ~1s high-speed inference)
- **Ollama** (`llama3.2:1b`, 100% offline local PC inference)

---

## 🚀 1-Click Deploy to Render

Click the button below to deploy this assistant to Render for free 24/7 uptime:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ankit200819/whatsapp-ai-assistant)

---

## 🛠 Features

- **Personalized Persona**: Welcomes with *"hii i am qwen and how can i help you maurya ji"* on greeting.
- **WhatsApp Cloud API Ready**: Implements Meta's HMAC-SHA256 signature verification (`x-hub-signature-256`), verification handshake, and outbound messaging.
- **Deduplication Defense**: Prevents Meta re-delivery loops from triggering duplicate AI responses.
- **Resilient Fallback**: Gracefully operates with or without MongoDB (in-memory mode for zero-crash startup).
- **Built-in Web Test UI**: Includes an interactive browser chat & WhatsApp webhook simulator at `/`.

---

## 🔑 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Web server port | `5000` (or `10000` on Render) |
| `NODE_ENV` | Runtime environment | `production` |
| `AI_PROVIDER` | `gemini` or `ollama` | `gemini` |
| `GEMINI_API_KEY` | Free API key from Google AI Studio | *(optional for cloud)* |
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash` |
| `WHATSAPP_VERIFY_TOKEN` | Custom token for Meta webhook | `whatsapp_ai_secret_verify_token` |
| `WHATSAPP_ACCESS_TOKEN` | Meta System User permanent token | *(optional)* |
| `WHATSAPP_PHONE_NUMBER_ID`| Meta WhatsApp phone number ID | *(optional)* |
| `WHATSAPP_APP_SECRET` | Meta App Secret for signature checks | *(optional)* |

---

## 💻 Local Development

```bash
cd backend
npm install
npm start
# Visit http://localhost:5000 in your browser
```
