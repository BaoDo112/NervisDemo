import { Router, type Request, type Response } from 'express'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { appendLog } from '../utils/logger.js'

const router = Router()

interface TranscribeRequestBody {
  audioBase64?: string
  mimeType?: string
}

function isValidMime(m?: string): boolean {
  if (!m) return false
  // Allow common audio types; for demo we support webm/ogg/wav
  return /^(audio\/(webm|ogg|wav))/i.test(m)
}

function decodeBase64ToBuffer(b64: string): Buffer {
  // Strip potential data URL prefix if present
  const commaIdx = b64.indexOf(',')
  const pure = commaIdx >= 0 ? b64.slice(commaIdx + 1) : b64
  return Buffer.from(pure, 'base64')
}

// Persistent Python Process Manager
let pythonProcess: ReturnType<typeof spawn> | null = null
let isPythonReady = false
type STTResult = { success: boolean; transcript?: string; error?: string; language?: string; probability?: number; status?: string }
type QueueItem = { audioPath: string; resolve: (val: STTResult) => void; reject: (err: Error) => void }
const requestQueue: QueueItem[] = []
let isProcessing = false

function startPythonProcess() {
  if (pythonProcess) return

  // Switching to 'medium' for better stability/speed on local machines.
  // 'large-v3' is too heavy and causes timeouts/crashes.
  const modelDir = process.env.VIWHISPER_MODEL_DIR || 'medium'
  const scriptPath = path.join(process.cwd(), 'server', 'python', 'viwhisper_transcribe.py')
  const venvPy = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
  const pythonExe = fs.existsSync(venvPy) ? venvPy : 'python'

  console.log('Starting persistent STT process...')
  const device = (process.env.STT_DEVICE || 'cpu').toLowerCase() === 'cuda' ? 'cuda' : 'cpu'
  pythonProcess = spawn(pythonExe, [scriptPath, '--model_dir', modelDir, '--device', device], {
    env: { ...process.env, HF_HUB_OFFLINE: '0' }
  })

  pythonProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const json = JSON.parse(trimmed)
        if (json.status === 'ready') {
          console.log('STT Process Ready')
          isPythonReady = true
          processNextRequest()
        } else if (json.success === false) {
          console.error('STT Error:', json.error)
          // If it's a fatal error for the request, reject it
          if (isProcessing) {
            const current = requestQueue.shift()
            if (current) current.reject(new Error(json.error))
            isProcessing = false
            processNextRequest()
          }
        } else if (isProcessing) {
          // Result for the current request
          const current = requestQueue.shift()
          if (current) {
            current.resolve(json)
          }
          isProcessing = false
          processNextRequest()
        } else {
          console.log('STT Unhandled Message:', json)
        }
      } catch {
        console.error('STT Parse Error:', trimmed)
      }
    }
  })

  pythonProcess.stderr?.on('data', (data) => {
    const msg = data.toString()
    console.error('STT Stderr:', msg)
    appendLog(path.join(process.cwd(), 'logs', 'voice.log'), { stage: 'stderr', error: msg })
    if (/cudnn_ops64/i.test(msg) || /cudnnCreateTensorDescriptor/i.test(msg)) {
      try { pythonProcess?.kill('SIGKILL') } catch { console.error('STT kill error') }
      pythonProcess = null
      isPythonReady = false
      isProcessing = false
      process.env.STT_DEVICE = 'cpu'
      setTimeout(startPythonProcess, 1000)
    }
  })

  pythonProcess.on('close', (code) => {
    console.log('STT Process exited with code', code)
    pythonProcess = null
    isPythonReady = false
    isProcessing = false

    // Reject all pending requests
    while (requestQueue.length > 0) {
      const req = requestQueue.shift()
      if (req) req.reject(new Error('STT Process Crashed'))
    }

    // Retry starting if it crashed unexpectedly?
    setTimeout(startPythonProcess, 5000)
  })
}

function processNextRequest() {
  if (!isPythonReady || isProcessing || requestQueue.length === 0) return

  const next = requestQueue[0] // Peek, don't shift yet until we send
  if (!pythonProcess || !pythonProcess.stdin) return

  isProcessing = true
  try {
    // Send JSON with path and prompt
    const payload = JSON.stringify({
      path: next.audioPath,
      prompt: "Cuộc phỏng vấn xin việc, lập trình viên, Frontend, Backend, React, Node.js, UIT, công nghệ thông tin, sinh viên."
    })
    pythonProcess.stdin.write(payload + '\n')
  } catch (e) {
    console.error('Failed to write to STT process', e)
    isProcessing = false
    // Fail this request
    requestQueue.shift()?.reject(e)
    processNextRequest()
  }
}

// Start immediately
startPythonProcess()
// Force restart for CUDA update
router.post('/transcribe', async (req: Request, res: Response): Promise<void> => {
  const { audioBase64, mimeType } = req.body as TranscribeRequestBody

  if (!audioBase64 || !isValidMime(mimeType)) {
    res.status(400).json({ success: false, error: 'Thiếu audioBase64 hoặc mimeType không hợp lệ' })
    return
  }

  let audioBuf: Buffer
  try {
    audioBuf = decodeBase64ToBuffer(audioBase64)
  } catch {
    res.status(400).json({ success: false, error: 'Base64 không hợp lệ' })
    return
  }

  const tmpDir = path.join(process.cwd(), 'tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const base = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const ext = mimeType?.includes('wav') ? 'wav' : (mimeType?.includes('ogg') ? 'ogg' : 'webm')
  const tmpFile = path.join(tmpDir, `${base}.${ext}`)
  const wavFile = path.join(tmpDir, `${base}.wav`)

  fs.writeFileSync(tmpFile, audioBuf)

  // Convert to WAV 16k mono
  if (!ffmpegPath) {
    res.status(500).json({ success: false, error: 'No ffmpeg' })
    return
  }

  const convertToWav = () => new Promise<string>((resolve, reject) => {
    const ff = spawn(ffmpegPath, ['-y', '-vn', '-i', tmpFile, '-ac', '1', '-ar', '16000', wavFile])
    ff.on('close', (code) => {
      try { fs.unlink(tmpFile, () => { }) } catch { console.error('tmp cleanup error') }
      if (code === 0) resolve(wavFile)
      else reject(new Error('FFmpeg failed'))
    })
  })

  try {
    const finalWav = await convertToWav()

    // Queue for STT
    const result = await new Promise<STTResult>((resolve, reject) => {
      // Timeout for the queue (60s) to allow for model loading and heavy processing
      const timer = setTimeout(() => reject(new Error('Queue timeout')), 60000)
      requestQueue.push({
        audioPath: finalWav,
        resolve: (d) => { clearTimeout(timer); resolve(d) },
        reject: (e) => { clearTimeout(timer); reject(e) }
      })
      processNextRequest()
    })

    try { fs.unlink(finalWav, () => { }) } catch { console.error('wav cleanup error') }

    if (result.success) {
      res.status(200).json({ success: true, transcript: result.transcript, confidence: result.probability })
    } else {
      res.status(200).json({ success: true, transcript: 'Không thể phiên âm', fallback: true })
    }

  } catch (e) {
    appendLog(path.join(process.cwd(), 'logs', 'voice.log'), { stage: 'exception', error: (e as Error).message })
    res.status(200).json({ success: true, transcript: 'Lỗi hệ thống', fallback: true })
  }
})

export default router
