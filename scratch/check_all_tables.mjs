import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmjurwyritfhlnayigsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtanVyd3lyaXRmaGxuYXlpZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQxMzcsImV4cCI6MjA5MDgzMDEzN30.eq24R_HqaLK8IwS0rgE3WrogrypBshVADs4Jc_hP974'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  const tables = ['tasks', 'users', 'streaks', 'task_meta', 'task_subtasks', 'subtasks', 'arena_state']
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    console.log(`Table '${t}':`, error ? error.message : 'EXISTS! Rows: ' + data.length)
  }
}

checkTables()
