import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseWebcam {
  videoRef: React.RefObject<HTMLVideoElement>
  start: () => Promise<void>
  stop: () => void
  isActive: boolean
  error?: string
}

export function useWebcam(): UseWebcam {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
      setError(undefined)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsActive(false)
  }, [])

  useEffect(() => {
    void start()
    return () => stop()
  }, [start, stop])

  return { videoRef, start, stop, isActive, error }
}

