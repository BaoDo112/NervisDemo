export function getApiBase(): string {
  const fromEnv = (import.meta as ImportMeta).env?.VITE_API_BASE_URL as string | undefined
  return (fromEnv && fromEnv.length > 0) ? fromEnv.replace(/\/$/, '') : 'http://localhost:3003/api'
}
