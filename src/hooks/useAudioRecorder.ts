/**
 * useAudioRecorder
 * Lightweight browser audio recorder using MediaRecorder.
 * Records to a single Blob (default: audio/webm; codecs=opus) and exposes base64 conversion.
 * No external dependencies. Safe defaults and cleanup.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface RecordingResult {
  blob: Blob
  mimeType: string
  durationMs: number
}

export interface UseAudioRecorderOptions {
  mimeType?: string // e.g., 'audio/webm'
  timeSliceMs?: number // chunk size; if undefined, one final chunk
  onError?: (error: Error) => void
  onStream?: (stream: MediaStream) => void
}

export interface UseAudioRecorder {
  isRecording: boolean
  start: () => Promise<void>
  stop: () => Promise<RecordingResult | null>
  reset: () => void
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorder {
  const { mimeType = 'audio/webm', timeSliceMs, onError, onStream } = options
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startTimeRef = useRef<number>(0)
  const [isRecording, setIsRecording] = useState<boolean>(false)

  const cleanup = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop()
      } catch {/* no-op */}
    }
    recorderRef.current = null
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
    }
    mediaStreamRef.current = null
    chunksRef.current = []
    startTimeRef.current = 0
    setIsRecording(false)
  }, [])

  const start = useCallback(async () => {
    try {
      // Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder
      chunksRef.current = []
      startTimeRef.current = performance.now()
      if (onStream) onStream(stream)

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onerror = (ev: Event) => {
        const error = new Error(`Recorder error: ${(ev as ErrorEvent).message || 'unknown'}`)
        if (onError) onError(error)
        cleanup()
      }

      recorder.start(timeSliceMs)
      setIsRecording(true)
    } catch (err) {
      if (onError) onError(err as Error)
    }
  }, [cleanup, mimeType, onError, timeSliceMs])

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return null
    return new Promise<RecordingResult | null>((resolve) => {
      try {
        recorder.onstop = () => {
          const durationMs = Math.max(0, performance.now() - startTimeRef.current)
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
          cleanup()
          resolve({ blob, mimeType: recorder.mimeType, durationMs })
        }
        recorder.stop()
      } catch (e) {
        if (onError) onError(e as Error)
        cleanup()
        resolve(null)
      }
    })
  }, [cleanup, onError])

  const reset = useCallback(() => {
    cleanup()
  }, [cleanup])

  useEffect(() => () => cleanup(), [cleanup])

  return { isRecording, start, stop, reset }
}

/**
 * Utility: convert Blob to base64 string (without data URL prefix)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const commaIdx = result.indexOf(',')
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result)
      } else {
        reject(new Error('Unexpected reader result'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}
