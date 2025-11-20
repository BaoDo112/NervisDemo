export interface AudioMetrics {
  rms: number
  peak: number
  freq: number
}

export function useAudioAnalysis() {
  let analyser: AnalyserNode | null = null
  let raf = 0
  const buf = new Uint8Array(1024)
  const freqBuf = new Uint8Array(1024)
  let metrics: AudioMetrics = { rms: 0, peak: 0, freq: 0 }

  const attach = async (stream: MediaStream) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const src = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    src.connect(analyser)
    const tick = () => {
      if (!analyser) return
      analyser.getByteTimeDomainData(buf)
      analyser.getByteFrequencyData(freqBuf)
      let sum = 0; let peak = 0
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; peak = Math.max(peak, Math.abs(v)) }
      const rms = Math.sqrt(sum / buf.length)
      let maxIdx = 0; for (let i = 1; i < freqBuf.length; i++) if (freqBuf[i] > freqBuf[maxIdx]) maxIdx = i
      const freq = maxIdx * (ctx.sampleRate / 2) / freqBuf.length
      metrics = { rms, peak, freq }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }
  const getFrequencyData = () => {
    if (!analyser) return new Uint8Array(0)
    analyser.getByteTimeDomainData(freqBuf) // Use TimeDomain for waveform (smoother)
    return freqBuf
  }
  const detach = () => { if (raf) cancelAnimationFrame(raf); analyser = null }
  const getMetrics = () => metrics
  return { attach, detach, getMetrics, getFrequencyData }
}

