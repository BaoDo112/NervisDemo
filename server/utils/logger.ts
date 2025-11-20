import fs from 'fs'
import path from 'path'

export function appendLog(file: string, obj: Record<string, unknown>): void {
  try {
    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), ...obj }) + '\n')
  } catch {}
}

