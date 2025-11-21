type ViteEnv = {
  VITE_MODAL_API_URL?: string
  MODAL_API_URL?: string
  VITE_API_BASE_URL?: string
  DEV?: boolean
}

export function getModalUrl(): string | undefined {
  const env = import.meta.env as unknown as ViteEnv
  return env.VITE_MODAL_API_URL || env.MODAL_API_URL
}

export function getApiBase(): string {
  const env = import.meta.env as unknown as ViteEnv
  // Prefer local API base or explicit VITE_API_BASE_URL; ignore Modal for base selection
  const base = env.VITE_API_BASE_URL
  if (base && base.length > 0) return base.replace(/\/$/, '')
  return env.DEV ? 'http://localhost:3003/api' : ''
}
