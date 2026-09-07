import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pmjurwyritfhlnayigsq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtanVyd3lyaXRmaGxuYXlpZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTQxMzcsImV4cCI6MjA5MDgzMDEzN30.eq24R_HqaLK8IwS0rgE3WrogrypBshVADs4Jc_hP974'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTitleMeta() {
  const { data, error: selectErr } = await supabase.from('tasks').select('*').limit(1)
  if (selectErr || !data || data.length === 0) return console.error(selectErr)

  const task = data[0]
  console.log('Original task:', task)

  const sampleSubtasks = [{ id: 's1', title: 'Check API', completed: true }]
  const metaObj = { subtasks: sampleSubtasks, completed: true, is_active: false }
  const newTitle = `${task.title.split('||META:')[0].trim()} ||META:${JSON.stringify(metaObj)}`

  const { error: updateErr } = await supabase.from('tasks').update({ title: newTitle }).eq('id', task.id)
  console.log('Update Error:', updateErr)

  const { data: updatedTask } = await supabase.from('tasks').select('*').eq('id', task.id).single()
  console.log('Updated Task in Supabase DB:', updatedTask)
}

testTitleMeta()
