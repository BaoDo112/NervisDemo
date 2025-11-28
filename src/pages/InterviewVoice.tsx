import React, { useEffect, useMemo, useState, useRef } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAudioRecorder, blobToBase64 } from '@/hooks/useAudioRecorder'
import { useWebcam } from '@/hooks/useWebcam'
import { useTTS } from '@/hooks/useTTS'
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis'
import { getApiBase, getModalUrl } from '@/lib/api'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AudioVisualizer } from '@/components/AudioVisualizer'
import { FeedbackDialog } from '@/components/FeedbackDialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { NotificationDialog } from '@/components/ui/notification-dialog'

// Icons
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const CameraOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M21 21l-2-2m-2 5l-2-2m-2 5l-2-2m-2 5l-2-2M1 1l22 22" />
  </svg>
)

type Role = 'user' | 'ai'

interface Message {
  id: string
  role: Role
  content: string
}

const InterviewVoice: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const topic = searchParams.get('topic') || 'Phỏng vấn chung'
  const userRole = searchParams.get('role') || 'interviewee'
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [isVideoRecording, setIsVideoRecording] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])
  const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) {
      if (userRole === 'interviewee') {
        setMessages([{
          id: 'm1',
          role: 'ai',
          content: `Chào bạn, tôi là AI Interviewer. Hôm nay chúng ta sẽ phỏng vấn về chủ đề "${topic}". Bạn hãy giới thiệu đôi nét về bản thân nhé?`
        }])
      } else {
        setMessages([{
          id: 'm1',
          role: 'ai',
          content: `Chào bạn, tôi là Ứng viên AI. Tôi đã sẵn sàng cho buổi phỏng vấn về "${topic}". Mời bạn đặt câu hỏi đầu tiên.`
        }])
      }
    }
  }, [userRole, topic, messages.length])

  const [progressQ] = useState({ current: 0, total: 3 })
  const [progressT, setProgressT] = useState({ currentSec: 0, totalMin: 30 })
  const [volume, setVolume] = useState(70)

  const analysis = useAudioAnalysis()
  const recorder = useAudioRecorder({ mimeType: 'audio/webm', onStream: (s) => analysis.attach(s) })
  const isRecording = recorder.isRecording
  const webcam = useWebcam()
  const [sessionId] = useState(() => crypto.randomUUID())
  const [chatInput, setChatInput] = useState('')
  const [difficulty] = useState<string>('medium')
  const tts = useTTS({ rate: 1, pitch: 1 })
  const player = useAudioPlayer()
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [freqData, setFreqData] = useState<Uint8Array>(new Uint8Array(0))
  const [aiFreqData, setAiFreqData] = useState<Uint8Array>(new Uint8Array(0))
  const [showFeedback, setShowFeedback] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgressT(p => ({ ...p, currentSec: p.currentSec + 1 }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const anyOpen = showExitConfirm || showFeedback || notification.isOpen
    const el = appRef.current
    if (el) {
      if (anyOpen) el.setAttribute('inert', '')
      else el.removeAttribute('inert')
    }
    if (anyOpen) {
      const ae = document.activeElement as HTMLElement | null
      if (ae) {
        ae.blur()
      }
    }
  }, [showExitConfirm, showFeedback, notification.isOpen])

  const rafRef = useRef<number | null>(null)
  const getFreqRef = useRef<() => Uint8Array>(() => new Uint8Array(0))
  const smoothedDataRef = useRef<Uint8Array>(new Uint8Array(0))

  useEffect(() => {
    getFreqRef.current = () => analysis.getFrequencyData()
  }, [analysis])

  useEffect(() => {
    if (isRecording) {
      const smoothingFactor = 0.85 // Increased for more stability
      const loop = () => {
        const rawData = getFreqRef.current()
        if (smoothedDataRef.current.length !== rawData.length) {
          smoothedDataRef.current = new Uint8Array(rawData.length)
        }
        // Apply exponential smoothing with noise gate
        for (let i = 0; i < rawData.length; i++) {
          const currentValue = rawData[i]
          // Noise gate: ignore very low values
          if (currentValue < 10) {
            smoothedDataRef.current[i] = smoothedDataRef.current[i] * 0.9
          } else {
            smoothedDataRef.current[i] = smoothedDataRef.current[i] * smoothingFactor + currentValue * (1 - smoothingFactor)
          }
        }
        setFreqData(new Uint8Array(smoothedDataRef.current))
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      smoothedDataRef.current = new Uint8Array(0)
      setFreqData(new Uint8Array(0))
    }
  }, [isRecording])

  const aiRafRef = useRef<number | null>(null)
  const getAiFreqRef = useRef<() => Uint8Array>(() => new Uint8Array(0))
  useEffect(() => {
    getAiFreqRef.current = () => player.getFrequencyData()
  }, [player])
  useEffect(() => {
    if (isAiSpeaking) {
      const loop = () => {
        setAiFreqData(getAiFreqRef.current())
        aiRafRef.current = requestAnimationFrame(loop)
      }
      aiRafRef.current = requestAnimationFrame(loop)
      return () => {
        if (aiRafRef.current !== null) cancelAnimationFrame(aiRafRef.current)
        aiRafRef.current = null
      }
    } else {
      if (aiRafRef.current !== null) {
        cancelAnimationFrame(aiRafRef.current)
        aiRafRef.current = null
      }
      setAiFreqData(new Uint8Array(0))
    }
  }, [isAiSpeaking])

  const qPercent = useMemo(() => Math.min(100, Math.round((progressQ.current / progressQ.total) * 100)), [progressQ])
  const tPercent = useMemo(() => Math.min(100, Math.round(((progressT.currentSec / 60) / progressT.totalMin) * 100)), [progressT])

  const toggleMic = async () => {
    if (!isRecording) {
      await recorder.start()
    } else {
      const result = await recorder.stop()
      if (result) {
        const b64 = await blobToBase64(result.blob)
        setMessages(prev => prev.concat({ id: crypto.randomUUID(), role: 'user', content: 'Đang phiên âm...' }))
        try {
          const modalUrl = getModalUrl()
          const isDev = import.meta.env.DEV
          const apiBase = getApiBase()
          let data: { success?: boolean; transcript?: string; text?: string }
          // Prefer local API base (Ollama/STT) first with timeout
          if (apiBase) {
            const controller = new AbortController()
            const to = setTimeout(() => controller.abort(), 60000)
            const res = await fetch(`${apiBase}/voice/transcribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioBase64: b64, mimeType: result.mimeType }), signal: controller.signal })
            clearTimeout(to)
            data = await res.json()
          } else if (modalUrl && modalUrl.length > 0) {
            const target = isDev ? modalUrl : '/api/modal-proxy'
            const res = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'transcribe', payload: b64 }) })
            const json = await res.json()
            data = { success: true, transcript: json.text }
          } else {
            setNotification({ isOpen: true, title: 'Không thể kết nối', description: 'Chưa cấu hình API Base URL. Thiết lập VITE_MODAL_API_URL (hoặc MODAL_API_URL) hoặc VITE_API_BASE_URL.', type: 'error' })
            setMessages(prev => prev.filter(m => m.content === 'Đang phiên âm...' ? false : true))
            return
          }
          const text = data.transcript || 'Không có transcript'

          // Basic spam check
          const lowerText = text.toLowerCase()
          const isHardSpam = lowerText.includes('la la school') ||
            (lowerText.includes('subscribe') && lowerText.includes('kênh')) ||
            (lowerText.includes('video') && lowerText.includes('hấp dẫn')) ||
            lowerText.includes('hãy đăng ký') ||
            lowerText.includes('cảm ơn các bạn đã theo dõi');

          // If spam or too short, remove bubble and notify
          if (isHardSpam) {
            setMessages(prev => prev.map(m => (m.content === 'Đang phiên âm...' ? { ...m, content: 'Âm thanh không hợp lệ' } : m)))
            return
          }
          if (text.trim().length < 3) {
            setMessages(prev => prev.map(m => (m.content === 'Đang phiên âm...' ? { ...m, content: 'Âm thanh quá ngắn, vui lòng nói rõ hơn' } : m)))
            return
          }

          setMessages(prev => prev.map(m => (m.content === 'Đang phiên âm...' ? { ...m, content: text } : m)))
          await handleAiResponse(text)
        } catch {
          setMessages(prev => prev.map(m => (m.content === 'Đang phiên âm...' ? { ...m, content: 'Lỗi phiên âm' } : m)))
        }
        analysis.detach()
      }
    }
  }

  const toggleVideoRecording = async () => {
    if (isVideoRecording) {
      mediaRecorder.current?.stop()
    } else {
      // Start recording
      if (!webcam.videoRef.current?.srcObject) return

      const stream = webcam.videoRef.current.srcObject as MediaStream
      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder
      recordedChunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
        const fileName = `interview_${sessionId}_${Date.now()}.webm`

        if (user?.id) {
          const { error } = await supabase.storage
            .from('call_recordings')
            .upload(`${user.id}/${fileName}`, blob)

          if (error) {
            console.error('Error uploading recording:', error)
            setNotification({
              isOpen: true,
              title: 'Lỗi lưu bản ghi',
              description: 'Không thể lưu video ghi hình. Vui lòng thử lại.',
              type: 'error'
            })
          } else {
            setNotification({
              isOpen: true,
              title: 'Đã lưu bản ghi',
              description: 'Video phỏng vấn đã được lưu thành công.',
              type: 'success'
            })
          }
        }
        setIsVideoRecording(false)
      }

      recorder.start()
      setIsVideoRecording(true)
    }
  }

  const handleAiResponse = async (text: string) => {
    const modalUrl = getModalUrl()
    const isDev = import.meta.env.DEV
    const apiBase = getApiBase()
    const fetchReply = async (): Promise<string> => {
      // Prefer local API first
      if (apiBase) {
        const res = await fetch(`${apiBase}/chat/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, sessionId, difficulty, role: userRole, topic }) })
        const json = await res.json()
        return (json.reply || '').trim()
      }
      if (modalUrl && modalUrl.length > 0) {
        const messagesPayload = [
          { role: 'system', content: `Bạn là AI Interviewer chuyên nghiệp. Trả lời trực tiếp, súc tích (2-4 câu), không yêu cầu thêm bối cảnh. Chủ đề: ${topic}. Vai trò: ${userRole}. Độ khó: ${difficulty}. Ngôn ngữ: tiếng Việt.` },
          { role: 'user', content: text }
        ]
        const target = isDev ? modalUrl : '/api/modal-proxy'
        const res = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat', payload: messagesPayload }) })
        const json = await res.json()
        const baseReply = typeof json.response === 'string' ? json.response : (typeof json.text === 'string' ? json.text : (typeof json.error === 'string' ? json.error : ''))
        return (baseReply || '').trim()
      }
      return ''
    }

    let reply = ''
    try {
      reply = await fetchReply()
    } catch {
      reply = ''
    }
    const isWeak = reply.toLowerCase().includes('xin lỗi, hệ thống đang khởi động') || reply.startsWith('Về câu hỏi:')
    if (!reply || isWeak) {
      reply = await fetchReply()
    }
    if (!reply) {
      setNotification({ isOpen: true, title: 'AI không phản hồi', description: 'Vui lòng thử nói lại hoặc nhập câu hỏi khác.', type: 'info' })
      return
    }

    setMessages(prev => prev.concat({ id: crypto.randomUUID(), role: 'ai', content: reply }))
    setIsAiSpeaking(true)
    try {
      const apiBase = getApiBase()
      if (apiBase) {
        const res = await fetch(`${apiBase}/tts/speak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: reply, lang: 'vi' }) })
        const json = await res.json()
        if (json?.success && typeof json.wav === 'string') {
          const apiOrigin = apiBase.replace(/\/api$/, '')
          const wavUrl = json.wav.startsWith('http') ? json.wav : `${apiOrigin}${json.wav}`
          await player.play(wavUrl)
        } else {
          tts.speak(reply)
        }
      } else {
        tts.speak(reply)
      }
    } catch {
      tts.speak(reply)
    } finally {
      setIsAiSpeaking(false)
    }

    // Check if interview should end
    if (progressQ.current >= progressQ.total) {
      setShowFeedback(true)
    }
  }

  const toggleCamera = async () => {
    if (webcam.isActive) {
      webcam.stop()
    } else {
      await webcam.start()
    }
  }

  const sendText = async () => {
    const text = chatInput.trim()
    if (!text) return
    setMessages(prev => prev.concat({ id: crypto.randomUUID(), role: 'user', content: text }))
    setChatInput('')
    await handleAiResponse(text)
  }

  useEffect(() => {
    const syncVoices = () => {
      const voices = tts.getVoices()
      const vi = voices.find(v => (v.lang || '').toLowerCase().startsWith('vi'))
      if (vi) tts.setOptions({ voice: vi })
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', syncVoices as EventListener)
      syncVoices()
    }
  }, [tts])

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div ref={appRef} className="w-[min(1440px,95vw)] h-[88vh] rounded-[64px] p-8 bg-gradient-to-br from-white to-[#ecfbff] grid grid-cols-[2fr_1fr] gap-16 overflow-hidden">
          {/* Left: Video block */}
          <div className="flex flex-col gap-6 min-h-0">
            <div className="flex items-center gap-6 mb-2">
              <div className="w-16 h-16 flex-shrink-0">
                <img src="/src/assets/sidebar-avatar.png" alt="nervIS" className="w-full h-full object-contain" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                Phỏng vấn bộ câu hỏi {topic}
              </div>
            </div>

            <div className="relative rounded-[32px] overflow-hidden shadow-md border border-slate-200 flex-1 min-h-0">
              <video ref={webcam.videoRef} className="w-full h-[55vh] max-h-[55vh] object-cover" muted playsInline />
              {!webcam.isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-100">
                  <span className="text-sm font-medium">Camera Off</span>
                </div>
              )}
              <button
                onClick={toggleCamera}
                className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full transition-all"
                title={webcam.isActive ? 'Tắt camera' : 'Bật camera'}
              >
                {webcam.isActive ? <CameraIcon /> : <CameraOffIcon />}
              </button>
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm font-medium backdrop-blur-sm">
                Nguyễn Thị A
              </div>
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <VolumeIcon />
                  <div className="text-sm text-slate-700">Âm lượng</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      setVolume(v)
                      player.setVol(v / 100)
                      tts.setOptions({ volume: v / 100 })
                    }}
                    className="w-[200px] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-cyan"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleVideoRecording}
                    className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all ${isVideoRecording
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className={`rounded-full transition-all ${isVideoRecording
                      ? 'w-6 h-6 bg-red-500 rounded-md'
                      : 'w-10 h-10 bg-red-500 rounded-full'
                      }`} />
                  </button>
                  <div className="text-sm font-medium text-slate-700">
                    {isVideoRecording ? 'Đang ghi hình...' : 'Nhấn để ghi hình'}
                  </div>
                </div>

                {/* Voice Chat Control - Moved here for clarity */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMic}
                    className={`w-11 h-11 rounded-2xl border grid place-items-center transition-colors ${isRecording ? 'bg-brand-cyan text-white border-brand-cyan' : 'bg-white border-[#ebebeb] text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <MicIcon />
                  </button>
                  <div className="text-sm text-slate-700">{isRecording ? 'Đang nghe...' : 'Bật mic nói'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#ebebeb] grid place-items-center">
                    <span className="text-[18px] font-serif">CC</span>
                  </div>
                  <div className="text-sm text-slate-700">Phụ đề</div>
                </div>
              </div>
              <button
                onClick={() => setShowExitConfirm(true)}
                className="px-4 py-2 rounded-2xl bg-[#ff5a5d] text-white text-sm hover:bg-[#ff4a4d] transition-colors"
              >
                Thoát
              </button>
            </div>
          </div>

          {/* Right: AI panel + progress + chat */}
          <div className="flex flex-col gap-6 min-h-0">
            <div className="border border-[#62d0ee] rounded-[24px] bg-white p-3 h-[80px] flex items-center gap-4">
              <div className="rounded-full px-3 py-1.5 bg-gradient-to-r from-[#62d0ee] to-[#62eed4] text-white text-sm font-semibold">AI</div>
              <div className="flex-1 h-[40px] flex items-center justify-between">
                <AudioVisualizer data={aiFreqData} isAnimating={isAiSpeaking} height={40} width={420} barColor="#62d0ee" />
              </div>
            </div>

            <div className="rounded-[32px] bg-[#62d0ee] p-6 text-white">
              <div className="text-xl font-semibold mb-4">Tiến độ phỏng vấn</div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm">{progressQ.current}/{progressQ.total} câu hỏi</div>
                  <div className="h-2 bg-[#a5ecff] rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${qPercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="text-sm">{Math.floor(progressT.currentSec / 60)} phút {String(progressT.currentSec % 60).padStart(2, '0')} giây / {progressT.totalMin} phút</div>
                  <div className="h-2 bg-[#a5ecff] rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${tPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#62d0ee] rounded-[32px] bg-[#e6faff] p-6 flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 h-full overflow-y-auto space-y-6 pr-3 pt-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`${m.role === 'ai' ? 'bg-white text-slate-800 rounded-[16px_4px_16px_16px]' : 'bg-[#62d0ee] text-white rounded-[4px_16px_16px_16px]'} px-4 py-2`}>
                      <div className="text-sm font-semibold mb-1">{m.role === 'ai' ? 'Hiếu' : 'Nguyễn Thị A'}</div>
                      <p className="text-[18px] leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 flex items-center gap-3">
                {isRecording ? (
                  <div className="flex-1 h-[52px] bg-slate-50 rounded-full border border-brand-cyan/30 flex items-center px-4 gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <div className="flex-1 h-full flex items-center justify-center overflow-hidden">
                      <AudioVisualizer data={freqData} isAnimating={isRecording} height={40} width={300} barColor="#ef4444" />
                    </div>
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Đang nghe...</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendText()}
                    placeholder="..."
                    className="flex-1 h-[52px] px-6 rounded-full bg-white border border-slate-200 focus:outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 transition-all"
                  />
                )}

                <button
                  onClick={toggleMic}
                  className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${isRecording
                    ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                    : 'bg-white text-brand-cyan border border-slate-200 hover:border-brand-cyan'
                    }`}
                  title={isRecording ? 'Dừng ghi âm' : 'Bắt đầu nói'}
                >
                  {isRecording ? <StopIcon /> : <MicIcon />}
                </button>

                {!isRecording && chatInput.trim() && (
                  <button
                    onClick={sendText}
                    className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-brand-cyan to-brand-blue text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <SendIcon />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-[90vw] p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Kết thúc buổi phỏng vấn?</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn kết thúc buổi phỏng vấn? AI sẽ đánh giá kết quả của bạn.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowExitConfirm(false)}>
                Tiếp tục
              </Button>
              <Button
                className="bg-[#ff5a5d] hover:bg-[#ff4a4d] text-white"
                onClick={() => {
                  setShowExitConfirm(false)
                  setShowFeedback(true)
                }}
              >
                Kết thúc
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={showFeedback}
        onClose={() => {
          setShowFeedback(false)
          navigate(-1)
        }}
        sessionId={sessionId}
        messages={messages}
        topic={topic}
        role={userRole}
      />

      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        description={notification.description}
        type={notification.type}
      />
    </ProtectedRoute>
  )
}

export default InterviewVoice
