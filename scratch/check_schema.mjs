import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmjurwyritfhlnayigsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtanVyd3lyaXRmaGxuYXlpZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQxMzcsImV4cCI6MjA5MDgzMDEzN30.eq24R_HqaLK8IwS0rgE3WrogrypBshVADs4Jc_hP974'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  const { data, error } = await supabase.from('tasks').select('*').limit(2)
  console.log('Error:', error)
  console.log('Sample Tasks Data:', JSON.stringify(data, null, 2))
}

checkSchema()
