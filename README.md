# MONOLITH

A browser-based LLM playground powered by each visitor's own Groq API account.

## Features

- Personal API key setup for every visitor
- Multi-message chat with system, user, and assistant roles
- Model selection and generation controls
- Streaming and non-streaming responses
- Prompt templates and conversation import/export
- Responsive desktop, tablet, and mobile workspace

## Connect your Groq account

1. Open MONOLITH and choose **My API key** in the left sidebar (or **Manage my API key** in Configuration).
2. Create a key in the [Groq Console](https://console.groq.com/keys).
3. Paste and save the key. It is stored in that browser profile, not in the MONOLITH repository.
4. Select a model and start chatting.

Each visitor supplies their own key and uses their own Groq account, quota, and billing. MONOLITH does not require the site owner to configure a shared `GROQ_API_KEY`.

## Key handling

- The key is stored in the visitor's browser `localStorage` so it remains available on their next visit.
- Each API request sends the key over HTTPS to the MONOLITH serverless proxy in the `X-Groq-API-Key` request header.
- The proxy forwards the key to Groq and does not write it to files, logs, or persistent server storage.
- The key is not included in chat request bodies or GitHub source files.
- On shared devices, remove the key after use. Visitors can remove it at any time from **My API key**.
- Use a trusted MONOLITH deployment; the site operator controls the frontend and server code.

## Deploy on Vercel

1. Import this repository into Vercel.
2. No Groq API key environment variable is required.
3. Deploy the project. Each visitor connects their own key in the app.

## Local development

Use Node.js 18 or newer and the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

## Stack

HTML, CSS, vanilla JavaScript, Vercel Serverless Functions, and the Groq OpenAI-compatible API.
