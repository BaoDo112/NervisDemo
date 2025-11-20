import React, { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAudioRecorder, blobToBase64 } from '@/hooks/useAudioRecorder'

type ChatRole = 'user' | 'ai'

interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  at: number
}

interface TranscribeResponse {
  success: boolean
  transcript?: string
  confidence?: number
  error?: string
}

export interface VoiceChatProps {
  title?: string
  apiUrl?: string // default: '/api/voice/transcribe'
}

/**
 * VoiceChat component
 * - Mic toggle to record audio
 * - Sends audio to backend to transcribe
 * - Displays transcript and a simple AI response (stub)
 */
export const VoiceChat: React.FC<VoiceChatProps> = ({ title = 'Phỏng vấn với AI (Voice)', apiUrl = '/api/voice/transcribe' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const recorder = useAudioRecorder({
    mimeType: 'audio/wav',
    onError: (err) => console.error(err.message),
  })

  const header = useMemo(() => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${recorder.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
        <span className="text-sm text-gray-600">{recorder.isRecording ? 'Đang ghi âm...' : 'Sẵn sàng'}</span>
      </div>
    </div>
  ), [recorder.isRecording, title])

  const sendToTranscribe = useCallback(async (blob: Blob): Promise<TranscribeResponse> => {
    try {
      setLoading(true)
      const base64 = await blobToBase64(blob)
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioBase64: base64, mimeType: blob.type }),
      })
      const data = (await res.json()) as TranscribeResponse
      return data
    } catch (e) {
      return { success: false, error: (e as Error).message }
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  const handleMicToggle = useCallback(async () => {
    if (!recorder.isRecording) {
      await recorder.start()
      return
    }
    const result = await recorder.stop()
    if (result && result.blob.size > 0) {
      // Add user message placeholder
      setMessages((prev) => prev.concat({ id: crypto.randomUUID(), role: 'user', text: '[Âm thanh đã ghi — đang xử lý...]', at: Date.now() }))
      const resp = await sendToTranscribe(result.blob)
      // Update last user placeholder with transcript
      setMessages((prev) => {
        const copy = [...prev]
        const idx = copy.findIndex((m) => m.role === 'user' && m.text.startsWith('[Âm thanh'))
        if (idx >= 0) {
          copy[idx] = {
            ...copy[idx],
            text: resp.success ? (resp.transcript || '[Không có transcript]') : `[Lỗi xử lý: ${resp.error ?? 'không rõ'}]`,
          }
        }
        return copy
      })
      // Add AI reply (stub logic on UI for demo)
      if (resp.success) {
        const reply = `Cảm ơn bạn. Tôi ghi nhận: ${resp.transcript}. Bạn có thể chia sẻ thêm chi tiết?`
        setMessages((prev) => prev.concat({ id: crypto.randomUUID(), role: 'ai', text: reply, at: Date.now() }))
      }
    }
  }, [recorder, sendToTranscribe])

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      {header}
      <div className="border rounded-2xl p-4 h-80 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">Hãy bấm mic để trả lời câu hỏi bằng giọng nói. Phần mềm sẽ phiên âm và AI sẽ phản hồi.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`${m.role === 'user' ? 'bg-blue-100 inline-block' : 'bg-gray-100 inline-block'} px-3 py-2 rounded-xl max-w-xl`}>
                <span className="text-sm text-gray-800">{m.text}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant={recorder.isRecording ? 'destructive' : 'default'}
          className={recorder.isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
          onClick={handleMicToggle}
        >
          {recorder.isRecording ? 'Dừng ghi' : 'Bắt đầu ghi'}
        </Button>
        {loading && <span className="text-sm text-gray-500">Đang xử lý...</span>}
      </div>
    </div>
  )
}

export default VoiceChat
