import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; name: string }
      }
      tasks: {
        Row: { id: string; user_id: string; title: string; difficulty: string; points: number; category: string; created_at: string }
        Insert: { id?: string; user_id: string; title: string; difficulty: string; points: number; category: string; created_at?: string }
      }
      streaks: {
        Row: { user_id: string; current_streak: number; longest_streak: number; last_active_date: string }
      }
    }
  }
}
