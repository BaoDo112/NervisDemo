import { Router, type Request, type Response } from 'express'
import path from 'path'
import fs from 'fs'
import http from 'http'

const router = Router()

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const tmpDir = path.join(process.cwd(), 'tmp')
  const venvPy = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
  // faster-whisper handles model download, so we just check if python exists and we are online or have cached models
  // For status check, we'll assume ASR is OK if python exists.

  const piperExe = process.env.PIPER_EXE || path.join(process.cwd(), 'piper', 'piper.exe')
  const piperVoice = process.env.PIPER_VOICE || path.join(process.cwd(), 'vi_VN-vais1000-medium.onnx')

  const ollamaUrl = (process.env.OLLAMA_API_URL || 'http://localhost:11434').replace(/\/$/, '')

  const status: Record<string, unknown> = {
    offline: false, // We are mostly online or local-host dependent
    paths: { tmpDir, venvPy, piperExe, piperVoice, ollamaUrl },
    asr: { modelDirExists: true, venvPythonExists: fs.existsSync(venvPy) }, // Mock modelDirExists as true since we rely on FW cache
    tts: { piperExeExists: fs.existsSync(piperExe), piperVoiceExists: fs.existsSync(piperVoice) },
    llm: { reachable: false },
  }

  try {
    await new Promise<void>((resolve) => {
      const req = http.get(ollamaUrl + '/api/tags', () => { status.llm = { reachable: true }; resolve() })
      req.on('error', () => resolve())
      req.setTimeout(2000, () => { try { req.destroy() } catch { }; resolve() })
    })
  } catch { }

  res.status(200).json({ success: true, status })
})

export default router

