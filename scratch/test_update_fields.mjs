import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmjurwyritfhlnayigsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtanVyd3lyaXRmaGxuYXlpZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQxMzcsImV4cCI6MjA5MDgzMDEzN30.eq24R_HqaLK8IwS0rgE3WrogrypBshVADs4Jc_hP974'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpdate() {
  const { data: selectData } = await supabase.from('tasks').select('id').limit(1)
  if (!selectData || selectData.length === 0) return
  const testId = selectData[0].id

  console.log('Testing update on task ID:', testId)
  
  // Test updating subtasks
  const { error: err1 } = await supabase.from('tasks').update({ subtasks: [{ id: '1', title: 'test', completed: false }] }).eq('id', testId)
  console.log('Update subtasks error:', err1)

  // Test updating completed
  const { error: err2 } = await supabase.from('tasks').update({ completed: true }).eq('id', testId)
  console.log('Update completed error:', err2)

  // Test updating is_active
  const { error: err3 } = await supabase.from('tasks').update({ is_active: true }).eq('id', testId)
  console.log('Update is_active error:', err3)
}

testUpdate()
