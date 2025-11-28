import { useRef, useState } from 'react'

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [volume, setVolume] = useState(1)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataBufRef = useRef<Uint8Array>(new Uint8Array(0))

  const ensureGraph = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      try { (audioRef.current as any).crossOrigin = 'anonymous' } catch {}
    }
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (!analyserRef.current) {
      const analyser = ctxRef.current!.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.6
      analyserRef.current = analyser
      dataBufRef.current = new Uint8Array(analyser.frequencyBinCount)
    }
    try {
      const srcNode = ctxRef.current!.createMediaElementSource(audioRef.current!)
      srcNode.connect(analyserRef.current!)
      analyserRef.current!.connect(ctxRef.current!.destination)
    } catch { }
  }

  const play = async (src: string): Promise<void> => {
    try {
      ensureGraph()
      audioRef.current!.src = src
      audioRef.current!.volume = volume
      await audioRef.current!.play()
    } catch { }
    return new Promise((resolve) => {
      if (!audioRef.current) return resolve()
      audioRef.current.onended = () => resolve()
      audioRef.current.onerror = () => resolve()
    })
  }

  const setVol = (v: number) => {
    const vol = Math.max(0, Math.min(1, v))
    setVolume(vol)
    if (audioRef.current) audioRef.current.volume = vol
  }

  const getFrequencyData = (): Uint8Array => {
    const analyser = analyserRef.current
    if (!analyser) return new Uint8Array(0)
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  return { play, setVol, volume, getFrequencyData }
}
