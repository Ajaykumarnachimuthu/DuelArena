/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pmjurwyritfhlnayigsq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtanVyd3lyaXRmaGxuYXlpZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQxMzcsImV4cCI6MjA5MDgzMDEzN30.eq24R_HqaLK8IwS0rgE3WrogrypBshVADs4Jc_hP974'

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
