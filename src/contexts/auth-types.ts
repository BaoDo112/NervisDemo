import type { User, Session, AuthError } from '@supabase/supabase-js'

export type UserRole = 'job_seeker' | 'recruiter' | 'admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  profile_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    userData: { full_name: string; role: UserRole },
  ) => Promise<{ error: AuthError | null }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (
    updates: Partial<UserProfile>,
  ) => Promise<{ error: Error | null }>
}