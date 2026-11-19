# MONOLITH

A focused, browser-based playground for experimenting with Groq-hosted language models.

## Features

- Multi-message chat with system, user, and assistant roles
- Model selection and generation controls
- Streaming and non-streaming responses
- Prompt templates and conversation import/export
- Responsive desktop, tablet, and mobile workspace

## Deploy on Vercel

1. Import this repository into Vercel.
2. Add `GROQ_API_KEY` under **Project → Settings → Environment Variables**.
3. Enable it for Production (and Preview if needed).
4. Redeploy, then open the deployment URL.

The key is read only by the `/api/groq` serverless function. It is not embedded in the HTML, committed to Git, or stored in browser local storage.

## Local development

Install Node.js 18 or newer and the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Create a local `.env.local` file (never commit it):

```env
GROQ_API_KEY=gsk_your_key_here
```

## Security

- Never commit real API keys or place them in client-side code.
- Keep `GROQ_API_KEY` in Vercel Environment Variables.
- Rotate any key that has been exposed.
- The API route allows only model-list and chat-completion requests.

## Stack

HTML, CSS, vanilla JavaScript, Vercel Serverless Functions, and the Groq OpenAI-compatible API.
