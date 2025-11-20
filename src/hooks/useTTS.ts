export interface TTSOptions {
  rate: number
  pitch: number
  volume?: number
  voice?: SpeechSynthesisVoice | null
}

export function useTTS(initial: TTSOptions = { rate: 1, pitch: 1, voice: null }) {
  let currentUtter: SpeechSynthesisUtterance | null = null
  let options: TTSOptions = initial

  const setOptions = (o: Partial<TTSOptions>) => { options = { ...options, ...o } }
  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return
    if (currentUtter) { window.speechSynthesis.cancel(); currentUtter = null }
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = options.rate
    utter.pitch = options.pitch
    utter.volume = Math.max(0, Math.min(1, options.volume ?? 1))
    if (options.voice) utter.voice = options.voice!
    currentUtter = utter
    window.speechSynthesis.speak(utter)
  }
  const cancel = () => { if (currentUtter) { window.speechSynthesis.cancel(); currentUtter = null } }
  const getVoices = () => (window.speechSynthesis?.getVoices?.() || [])
  return { speak, cancel, setOptions, getVoices }
}
