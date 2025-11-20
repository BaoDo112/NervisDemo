/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import voiceRoutes from './routes/voice.js'
import chatRoutes from './routes/chat.js'
import ttsRoutes from './routes/tts.js'
import path from 'path'
import { fileURLToPath } from 'url'
import statusRoutes from './routes/status.js'
import ragRoutes from './routes/rag.js'

// load env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/tts', ttsRoutes)
app.use('/api/files', express.static(path.join(process.cwd(), 'tmp')))
app.use('/api/status', statusRoutes)
app.use('/api/rag', ragRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((
  _error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // mark _next as intentionally unused to satisfy lint rules without changing Express error handler arity
  void _next
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
/**
 * Serve static files from frontend build
 */
const distPath = path.join(process.cwd(), 'dist')
app.use(express.static(distPath))

/**
 * Handle SPA routing: return index.html for any unknown route
 * This must be AFTER all API routes
 */
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

export default app
