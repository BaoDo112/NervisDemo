import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials for RAG.')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export async function embedText(text: string): Promise<number[]> {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'nomic-embed-text',
                prompt: text
            })
        })

        if (!response.ok) {
            throw new Error(`Ollama embedding failed: ${response.statusText}`)
        }

        const data = await response.json()
        return data.embedding
    } catch (error) {
        console.error('Error generating embedding:', error)
        return []
    }
}

export async function searchKnowledgeBase(query: string, threshold = 0.5, limit = 3): Promise<string> {
    try {
        const embedding = await embedText(query)
        if (embedding.length === 0) return ''

        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit
        })

        if (error) {
            console.error('Supabase search error:', error)
            return ''
        }

        if (!documents || (documents as unknown[]).length === 0) return ''

        type MatchedDoc = { content: string }
        const items = documents as unknown as MatchedDoc[]
        return items.map((doc) => doc.content).join('\n\n')
    } catch (error) {
        console.error('RAG search error:', error)
        return ''
    }
}
