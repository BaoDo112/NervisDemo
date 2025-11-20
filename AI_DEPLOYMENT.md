# AI Deployment Guide (Modal.com)

This guide explains how to run the AI backend (`backend/modal_app.py`) which hosts:
1.  **LLM**: Gemma 3 4b (Unsloth optimized)
2.  **STT**: Faster-Whisper (Large-v3)
3.  **Embeddings**: Nomic-Embed-Text (for RAG)

## Prerequisites
1.  Install Modal:
    ```bash
    pip install modal
    modal setup
    ```
2.  Authenticate with Modal (browser will open).

## Running Locally (Dev Mode)
To run the AI backend in "dev mode" (hot-reload) and get a temporary URL:

```bash
cd backend
modal serve modal_app.py
```

**Output:**
You will see a URL like: `https://your-username--ai-interview-backend-api-entrypoint.modal.run`

**Connect Frontend:**
1.  Copy that URL.
2.  Open `.env` in the root directory.
3.  Set `VITE_MODAL_API_URL=https://your-username--ai-interview-backend-api-entrypoint.modal.run`
4.  Restart frontend: `npm run dev`

## Deploying to Production
To deploy permanently:

```bash
cd backend
modal deploy modal_app.py
```

This gives you a permanent URL. Update your production `.env` with this URL.

## Architecture Note
- **Frontend** sends audio/text to **Modal**.
- **Modal** processes it (GPU) and returns text.
- **Supabase** stores the chat history and user data.
- **Modal** is *stateless* (it doesn't remember past chats, the frontend sends context if needed, or Supabase handles it).
