import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mic, StopCircle, Send, User as UserIcon, Bot } from 'lucide-react'
import { useAudioRecorder, blobToBase64 } from '@/hooks/useAudioRecorder'
import { getApiBase } from '@/lib/api'
import { cn } from '@/lib/utils'

type Role = 'user' | 'assistant'
type MessageType = 'text' | 'voice'

interface ChatMessage {
  id: string
  role: Role
  type: MessageType
  content: string
  createdAt: number
}

interface ChatBoxProps {
  className?: string
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user'
  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 mb-2 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent text-accent-foreground',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          {isUser ? (
            <UserIcon size={16} />
          ) : (
            <Bot size={16} />
          )}
          <span className="text-xs opacity-80">
            {isUser ? 'Bạn' : 'AI'} • {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  )
}

export const ChatBox: React.FC<ChatBoxProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const recorder = useAudioRecorder({ mimeType: 'audio/webm' })
  const { isRecording, start, reset } = recorder

  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const canSendText = useMemo(() => {
    return inputValue.trim().length > 0 && !sending
  }, [inputValue, sending])

  const pushMessage = (role: Role, type: MessageType, content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        type,
        content,
        createdAt: Date.now(),
      },
    ])
  }

  const handleSendText = async () => {
    if (!canSendText) return
    const text = inputValue.trim()
    setInputValue('')
    pushMessage('user', 'text', text)
    setSending(true)
    try {
      const res = await fetch(`${getApiBase()}/chat/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Lỗi máy chủ' }))
        throw new Error(data.error || 'Máy chủ trả về lỗi')
      }
      const data: { success: boolean; reply?: string } = await res.json()
      const reply = data.reply || 'Đã nhận tin nhắn của bạn (demo).'
      pushMessage('assistant', 'text', reply)
    } catch (err) {
      pushMessage('assistant', 'text', `Có lỗi xảy ra: ${(err as Error).message}`)
    } finally {
      setSending(false)
    }
  }

  const handleStopRecording = async () => {
    const result = await recorder.stop()
    if (!result) return
    const { blob, mimeType } = result
    const base64 = await blobToBase64(blob)
    pushMessage('user', 'voice', '[Voice] Đang phiên âm...')
    setSending(true)
    try {
      const res = await fetch(`${getApiBase()}/voice/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Lỗi máy chủ' }))
        throw new Error(data.error || 'Máy chủ trả về lỗi')
      }
      const data: { success: boolean; transcript?: string } = await res.json()
      const transcript = data.transcript || 'Không có transcript (demo)'
      // Replace the last placeholder voice message with transcript
      setMessages(prev => {
        const updated = [...prev]
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'user' && updated[i].type === 'voice' && updated[i].content.includes('Đang phiên âm')) {
            updated[i] = { ...updated[i], content: transcript }
            break
          }
        }
        return updated
      })
      // Stub AI reply
      pushMessage('assistant', 'text', demoMode ? 'AI (demo): Tôi đã đọc transcript của bạn!' : 'AI: Trả lời dựa trên transcript.')
    } catch (err) {
      pushMessage('assistant', 'text', `Có lỗi xảy ra khi phiên âm: ${(err as Error).message}`)
    } finally {
      setSending(false)
      reset()
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendText()
    }
  }

  return (
    <Card className={cn('w-full max-w-3xl mx-auto', className)}>
      <CardHeader>
        <CardTitle>AI Chat Demo (Text + Voice)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[60vh] overflow-y-auto border rounded-md p-4 bg-background">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Bắt đầu trò chuyện: gõ tin nhắn hoặc ghi âm giọng nói của bạn.
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'secondary'}
            size="icon"
            onClick={() => {
            if (isRecording) {
                void handleStopRecording()
              } else {
                void start()
              }
            }}
            disabled={sending}
            aria-label={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
          >
            {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
          </Button>

          <Input
            placeholder={isRecording ? 'Đang ghi âm...' : 'Nhập tin nhắn và nhấn Enter để gửi'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || isRecording}
          />

          <Button
            type="button"
            onClick={() => void handleSendText()}
            disabled={!canSendText}
          >
            <Send className="mr-2" size={16} /> Gửi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
