export function chunkText(input: string, maxLen = 1500): string[] {
  const parts = input.split(/\n\n+/)
  const chunks: string[] = []
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