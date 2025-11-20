import { supabase } from './supabase';

// This URL will come from your Modal deployment (e.g., https://your-username--ai-interview-backend-api-entrypoint.modal.run)
const MODAL_API_URL = import.meta.env.VITE_MODAL_API_URL || '';

interface AIResponse {
    text?: string;
    response?: string;
    vector?: number[];
    error?: string;
}

export const aiApi = {
    /**
     * Transcribe audio using Faster-Whisper on Modal
     */
    async transcribe(audioBlob: Blob): Promise<string> {
        if (!MODAL_API_URL) {
            console.warn('VITE_MODAL_API_URL is not set. Mocking response.');
            return "Đây là văn bản giả lập vì chưa có kết nối Modal.";
        }

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                try {
                    const res = await fetch(MODAL_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'transcribe',
                            payload: base64Audio
                        })
                    });
                    const data: AIResponse = await res.json();
                    if (data.error) throw new Error(data.error);
                    resolve(data.text || '');
                } catch (e) {
                    reject(e);
                }
            };
            reader.readAsDataURL(audioBlob);
        });
    },

    /**
     * Generate text using Gemma 3 on Modal
     */
    async chat(prompt: string): Promise<string> {
        if (!MODAL_API_URL) {
            console.warn('VITE_MODAL_API_URL is not set. Mocking response.');
            return "Tôi là AI (giả lập). Bạn cần deploy Modal để tôi hoạt động thực sự.";
        }

        try {
            const res = await fetch(MODAL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'chat',
                    payload: prompt
                })
            });
            const data: AIResponse = await res.json();
            if (data.error) throw new Error(data.error);
            return data.response || '';
        } catch (e) {
            console.error('AI Chat Error:', e);
            throw e;
        }
    },

    /**
     * Generate embeddings for RAG
     */
    async embed(text: string): Promise<number[]> {
        if (!MODAL_API_URL) return [];

        try {
            const res = await fetch(MODAL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'embed',
                    payload: text
                })
            });
            const data: AIResponse = await res.json();
            if (data.error) throw new Error(data.error);
            return data.vector || [];
        } catch (e) {
            console.error('Embedding Error:', e);
            throw e;
        }
    }
};
