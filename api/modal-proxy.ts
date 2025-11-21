import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const modalUrl = (process.env.VITE_MODAL_API_URL || process.env.MODAL_API_URL) as string | undefined
    if (!modalUrl) {
      res.status(500).json({ error: 'Missing MODAL_API_URL / VITE_MODAL_API_URL' })
      return
    }

    type ModalRequestBody = { action?: string; payload?: unknown }
    const rawBody = req.body as unknown
    let action: string | undefined
    let payload: unknown
    if (typeof rawBody === 'string') {
      try {
        const parsed = JSON.parse(rawBody) as ModalRequestBody
        action = parsed.action
        payload = parsed.payload
      } catch {
        action = undefined
        payload = undefined
      }
    } else if (typeof rawBody === 'object' && rawBody !== null) {
      const obj = rawBody as Record<string, unknown>
      action = typeof obj.action === 'string' ? obj.action : undefined
      payload = obj.payload
    }
    if (!action) {
      res.status(400).json({ error: 'Invalid action' })
      return
    }

    const forwardRes = await fetch(modalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
    const data: unknown = await forwardRes.json()

    if (action === 'chat') {
      const src = data as { response?: unknown; error?: unknown; text?: unknown }
      const response = typeof src.response === 'string'
        ? src.response
        : typeof src.text === 'string'
          ? src.text
          : typeof src.error === 'string'
            ? src.error
            : ''
      res.status(forwardRes.status).json({ response })
      return
    }

    if (action === 'transcribe') {
      const src = data as { text?: unknown; transcript?: unknown; error?: unknown }
      const text = typeof src.text === 'string'
        ? src.text
        : typeof src.transcript === 'string'
          ? src.transcript
          : typeof src.error === 'string'
            ? src.error
            : ''
      res.status(forwardRes.status).json({ text })
      return
    }

    res.status(forwardRes.status).json(data as Record<string, unknown>)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
}