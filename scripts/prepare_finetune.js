import fs from 'fs'
import path from 'path'

function chunkText(input, maxLen = 1500) {
  const parts = input.split(/\n\n+/)
  const chunks = []
  let buf = ''
  for (const p of parts) {
    const seg = p.trim()
    if (!seg) continue
    if ((buf + (buf ? '\n\n' : '') + seg).length <= maxLen) {
      buf = buf ? buf + '\n\n' + seg : seg
      continue
    }
    if (buf) {
      chunks.push(buf)
      buf = ''
    }
    if (seg.length <= maxLen) {
      chunks.push(seg)
      continue
    }
    let s = seg
    while (s.length > maxLen) {
      const cut = s.lastIndexOf('.', maxLen)
      const idx = cut > 200 ? cut + 1 : maxLen
      chunks.push(s.slice(0, idx).trim())
      s = s.slice(idx).trim()
    }
    if (s) chunks.push(s)
  }
  if (buf) chunks.push(buf)
  return chunks
}

function main() {
  const args = process.argv.slice(2)
  const datasetPath = args[0] && typeof args[0] === 'string' ? args[0] : path.resolve(process.cwd(), 'mdn_filtered_knowledge_base.json')
  const outPath = args[1] && typeof args[1] === 'string' ? args[1] : path.resolve(process.cwd(), 'tmp', 'finetune_instructions.jsonl')
  const maxLen = args[2] ? Number(args[2]) : 1500
  if (!fs.existsSync(datasetPath)) {
    process.stderr.write('Dataset not found\n')
    process.exit(1)
  }
  const dir = path.dirname(outPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const raw = fs.readFileSync(datasetPath, 'utf-8')
  let items
  try { items = JSON.parse(raw) } catch { process.stderr.write('Invalid dataset JSON\n'); process.exit(1) }
  const fd = fs.openSync(outPath, 'w')
  let count = 0
  for (const it of items) {
    const topic = typeof it.topic === 'string' ? it.topic : ''
    const summary = typeof it.summary === 'string' ? it.summary : ''
    const detail = typeof it.detailed_knowledge === 'string' ? it.detailed_knowledge : ''
    const content = [summary, detail].filter(Boolean).join('\n\n')
    const chunks = chunkText(content, maxLen)
    for (const c of chunks) {
      const rec = { instruction: `Giải thích chi tiết: ${topic}`, input: '', output: c }
      fs.writeSync(fd, JSON.stringify(rec) + '\n')
      count += 1
    }
  }
  fs.closeSync(fd)
  process.stdout.write(`Wrote ${count} records to ${outPath}\n`)
}

main()