export function getApiBase(): string {
  const env = (import.meta as ImportMeta).env
  const modal = env?.VITE_MODAL_API_URL as string | undefined
  const base = modal && modal.length > 0 ? modal : (env?.VITE_API_BASE_URL as string | undefined)
  if (base && base.length > 0) return base.replace(/\/$/, '')
  return env?.DEV ? 'http://localhost:3003/api' : ''
}
