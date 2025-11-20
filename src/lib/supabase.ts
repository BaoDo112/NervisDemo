import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'job_seeker' | 'recruiter' | 'admin'
          avatar_url?: string
          profile_data: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'job_seeker' | 'recruiter' | 'admin'
          avatar_url?: string
          profile_data?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'job_seeker' | 'recruiter' | 'admin'
          avatar_url?: string
          profile_data?: Record<string, unknown>
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          description?: string
          website?: string
          logo_url?: string
          contact_info: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          website?: string
          logo_url?: string
          contact_info?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          website?: string
          logo_url?: string
          contact_info?: Record<string, unknown>
        }
      }
      jobs: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string
          requirements: Record<string, unknown>
          benefits: Record<string, unknown>
          location?: string
          salary_min?: number
          salary_max?: number
          status: 'active' | 'paused' | 'closed'
          created_at: string
          expires_at?: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description: string
          requirements?: Record<string, unknown>
          benefits?: Record<string, unknown>
          location?: string
          salary_min?: number
          salary_max?: number
          status?: 'active' | 'paused' | 'closed'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string
          requirements?: Record<string, unknown>
          benefits?: Record<string, unknown>
          location?: string
          salary_min?: number
          salary_max?: number
          status?: 'active' | 'paused' | 'closed'
          expires_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          user_id: string
          cover_letter?: string
          status: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
          recruiter_notes: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          cover_letter?: string
          status?: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
          recruiter_notes?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          cover_letter?: string
          status?: 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected'
          recruiter_notes?: Record<string, unknown>
          updated_at?: string
        }
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          questions: Record<string, unknown>
          overall_score: Record<string, unknown>
          started_at: string
          completed_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: string
          questions?: Record<string, unknown>
          overall_score?: Record<string, unknown>
          started_at?: string
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          questions?: Record<string, unknown>
          overall_score?: Record<string, unknown>
          completed_at?: string
        }
      }
      voice_analyses: {
        Row: {
          id: string
          session_id: string
          user_id: string
          transcription: string
          analysis_scores: Record<string, unknown>
          suggestions: Record<string, unknown>
          cache_key?: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          transcription: string
          analysis_scores: Record<string, unknown>
          suggestions?: Record<string, unknown>
          cache_key?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          transcription?: string
          analysis_scores?: Record<string, unknown>
          suggestions?: Record<string, unknown>
          cache_key?: string
        }
      }
      job_tags: {
        Row: {
          id: string
          job_id: string
          tag_name: string
          category: string
        }
        Insert: {
          id?: string
          job_id: string
          tag_name: string
          category: string
        }
        Update: {
          id?: string
          job_id?: string
          tag_name?: string
          category?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']