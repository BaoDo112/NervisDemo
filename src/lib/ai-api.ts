type AIResponse = { text?: string; response?: string; vector?: number[]; error?: string };
function getApiBaseUrl(): string {
  const b = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  const dev = (import.meta as any)?.env?.DEV as boolean | undefined;
  if (b && b.length > 0) return b.replace(/\/$/, '');
  return dev ? 'http://localhost:3003/api' : '';
}

export const aiApi = {
  async transcribe(audioBlob: Blob): Promise<string> {
    const apiBase = getApiBaseUrl();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string);
          const res = await fetch(`${apiBase}/voice/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' })
          });
          const data = await res.json() as { transcript?: string };
          resolve(data.transcript || '');
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsDataURL(audioBlob);
    });
  },

  async chat(prompt: string): Promise<string> {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/chat/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });
    const data = await res.json() as { reply?: string };
    return data.reply || '';
  },

  async embed(_text: string): Promise<number[]> {
    return [];
  }
};
