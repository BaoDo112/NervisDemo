import { Router, type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { supabase, embedText } from '../utils/rag'
import { chunkText } from '../utils/chunk'

const router = Router()

type IngestBody = { datasetPath?: string; maxLen?: number; concurrency?: number }
type QueryBody = { query?: string; threshold?: number; limit?: number }

async function insertDocument(content: string, embedding: number[], metadata: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('documents').insert({ content, embedding, metadata })
  if (error) throw new Error(error.message)
}

router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  const { datasetPath, maxLen, concurrency } = req.body as IngestBody
  const p = datasetPath && typeof datasetPath === 'string' && datasetPath.length > 0 ? datasetPath : path.resolve(process.cwd(), 'mdn_filtered_knowledge_base.json')
  const m = typeof maxLen === 'number' && maxLen > 200 ? maxLen : 1500
  const c = typeof concurrency === 'number' && concurrency > 0 && concurrency <= 8 ? concurrency : 3
  if (!fs.existsSync(p)) {
    res.status(400).json({ success: false, error: 'Dataset not found' })
    return
  }
  const raw = fs.readFileSync(p, 'utf-8')
  let items: Array<Record<string, unknown>>
  try {
    items = JSON.parse(raw)
  } catch {
    res.status(400).json({ success: false, error: 'Invalid dataset JSON' })
    return
  }
  const tasks: Array<() => Promise<void>> = []
  for (const it of items) {
    const topic = typeof it.topic === 'string' ? it.topic : ''
    const summary = typeof it.summary === 'string' ? it.summary : ''
    const detail = typeof it.detailed_knowledge === 'string' ? it.detailed_knowledge : ''
    const content = [topic, summary, detail].filter(Boolean).join('\n\n')
    const splits = chunkText(content, m)
    for (const s of splits) {
      const md: Record<string, unknown> = { id: it.id, category: it.category, topic }
      tasks.push(async () => {
        const emb = await embedText(s)
        if (!emb || emb.length === 0) return
        await insertDocument(s, emb, md)
      })
    }
  }
  let idx = 0
  async function worker(): Promise<void> {
    while (idx < tasks.length) {
      const t = tasks[idx++]
      try { await t() } catch (e) { void e }
    }
  }
  const workers: Promise<void>[] = []
  for (let i = 0; i < c; i++) workers.push(worker())
  await Promise.all(workers)
  res.status(200).json({ success: true, inserted: tasks.length })
})

router.post('/search', async (req: Request, res: Response): Promise<void> => {
  const { query, threshold, limit } = req.body as QueryBody
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Invalid query' })
    return
  }
  const emb = await embedText(query)
  if (!emb || emb.length === 0) {
    res.status(500).json({ success: false, error: 'Embedding failed' })
    return
  }
  const thr = typeof threshold === 'number' ? threshold : 0.5
  const lim = typeof limit === 'number' ? limit : 3
  const { data, error } = await supabase.rpc('match_documents', { query_embedding: emb, match_threshold: thr, match_count: lim })
  if (error) {
    res.status(500).json({ success: false, error: error.message })
    return
  }
  res.status(200).json({ success: true, data })
})

router.post('/answer', async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body as QueryBody
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Invalid query' })
    return
  }
  const emb = await embedText(query)
  if (!emb || emb.length === 0) {
    res.status(500).json({ success: false, error: 'Embedding failed' })
    return
  }
  const { data } = await supabase.rpc('match_documents', { query_embedding: emb, match_threshold: 0.5, match_count: 4 })
  const ctx = Array.isArray(data) ? (data as Array<{ content?: string }>).map(d => (d.content || '')).filter(Boolean).join('\n\n') : ''
  const base = 'http://127.0.0.1:11434'
  const model = 'gemma3:4b'
  const messages: Array<{ role: string; content: string }> = []
  const sys = ctx ? `Sử dụng kiến thức sau để trả lời chính xác:\n\n${ctx}` : 'Trả lời ngắn gọn, chính xác.'
  messages.push({ role: 'system', content: sys })
  messages.push({ role: 'user', content: query })
  try {
    const resp = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, stream: false }) })
    if (!resp.ok) {
      const t = await resp.text()
      res.status(500).json({ success: false, error: t })
      return
    }
    const jd: unknown = await resp.json()
    const obj = jd as { message?: { content?: string } }
    const ans = typeof obj?.message?.content === 'string' ? obj.message.content : ''
    res.status(200).json({ success: true, answer: ans, context: ctx })
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

export default router