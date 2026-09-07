import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmjurwyritfhlnayigsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtanVyd3lyaXRmaGxuYXlpZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQxMzcsImV4cCI6MjA5MDgzMDEzN30.eq24R_HqaLK8IwS0rgE3WrogrypBshVADs4Jc_hP974'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function cleanup() {
  await supabase.from('tasks').update({ title: 'Learning JAVA' }).eq('id', 'd419cfc2-53d9-44c6-a9ec-9bfa8413477f')
  console.log('Cleanup complete.')
}

cleanup()
