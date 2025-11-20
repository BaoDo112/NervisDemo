import { Router, type Request, type Response } from 'express'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

const router = Router()

interface TTSBody { text?: string; lang?: string }

router.post('/speak', async (req: Request, res: Response): Promise<void> => {
  const { text, lang } = (req.body || {}) as TTSBody
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Thiếu text' })
    return
  }
  try {
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    const outWav = path.join(tmpDir, `tts_${Date.now()}.wav`)

    const piperExe = process.env.PIPER_EXE || path.join(process.cwd(), 'piper', 'piper.exe')
    const piperVoice = process.env.PIPER_VOICE || path.join(process.cwd(), 'vi_VN-vais1000-medium.onnx')
    console.log('TTS Using Voice:', piperVoice)
    // Try multiple possible config names
    let piperConfig = process.env.PIPER_CONFIG || path.join(process.cwd(), 'vi_VN-vais1000-medium.onnx.json')
    if (!fs.existsSync(piperConfig)) {
      piperConfig = path.join(process.cwd(), 'vi_VN-vais1000-medium.json')
    }

    if (!fs.existsSync(piperExe)) {
      res.status(500).json({ success: false, error: `Thiếu piper.exe tại ${piperExe}` })
      return
    }
    if (!fs.existsSync(piperVoice)) {
      res.status(500).json({ success: false, error: `Thiếu voice model tại ${piperVoice}` })
      return
    }

    const args = ['-m', piperVoice, '-f', outWav, '-l', (lang || 'vi')]
    if (fs.existsSync(piperConfig)) args.push('-c', piperConfig)
    const piper = spawn(piperExe, args, { stdio: ['pipe', 'pipe', 'pipe'], cwd: path.dirname(piperExe) })
    piper.stdin.write(text)
    piper.stdin.end()
    let err = ''
    piper.stderr.on('data', (d) => { err += d.toString() })
    piper.on('close', (code) => {
      if (code !== 0 || !fs.existsSync(outWav)) {
        res.status(500).json({ success: false, error: `Piper lỗi: ${err || 'unknown'}` })
        return
      }
      const base = path.basename(outWav)
      const url = `/api/files/${base}`
      res.status(200).json({ success: true, wav: url })
    })
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message })
  }
})

export default router
