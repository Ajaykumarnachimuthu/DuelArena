import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8')

const env = {}
envContent.split('\n').forEach(line => {
  const [k, v] = line.split('=')
  if (k && v) env[k.trim()] = v.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testTeamupInsert() {
  const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
  
  console.log('Testing Teamup insert with mapped difficulty "Hard" & category "Teamup":')
  const res = await supabase.from('tasks').insert({
    user_id: AJAY_ID,
    title: 'Joint Teamup Objective',
    difficulty: 'Hard',
    points: 300,
    category: 'Teamup'
  }).select()

  if (res.error) {
    console.error('FAILED:', res.error)
  } else {
    console.log('SUCCESS! Created Teamup Task:', JSON.stringify(res.data[0], null, 2))
    // Cleanup test task
    await supabase.from('tasks').delete().eq('id', res.data[0].id)
  }
}

testTeamupInsert()
