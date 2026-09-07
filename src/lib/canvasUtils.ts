import { SubTask } from './types'
import { broadcastSubtaskUpdate, broadcastTaskMetaUpdate } from './realtimeSync'
import { supabase } from './supabase'

const POSITIONS_KEY = 'habit_arena_task_positions_v1'
const CONNECTIONS_KEY = 'habit_arena_task_connections_v1'
const SUBTASKS_KEY = 'habit_arena_task_subtasks_v1'
const META_KEY = 'habit_arena_task_meta_v1'

export interface TaskMeta {
  is_active?: boolean
  duration_minutes?: number
  start_time?: string
  completed?: boolean
}

// Extract human title and embedded metadata from task title
export function extractTaskTitleAndMeta(rawTitle: string): { title: string; meta: any } {
  if (!rawTitle) return { title: '', meta: {} }
  const parts = rawTitle.split('||META:')
  const title = parts[0].trim()
  let meta: any = {}
  if (parts.length > 1) {
    try {
      meta = JSON.parse(parts[1])
    } catch (e) {
      console.error('Failed to parse metadata from title:', e)
    }
  }
  return { title, meta }
}

// Build encoded title string with embedded metadata
export function buildTaskTitleWithMeta(title: string, meta: any): string {
  const cleanTitle = title.split('||META:')[0].trim()
  if (!meta || Object.keys(meta).length === 0) return cleanTitle
  return `${cleanTitle} ||META:${JSON.stringify(meta)}`
}

// Calculate SVG Smooth Cubic Bezier Path between node centers
export function calculateBezierPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const dx = Math.abs(endX - startX) * 0.5
  const controlX1 = startX + dx
  const controlY1 = startY
  const controlX2 = endX - dx
  const controlY2 = endY

  return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
}

// Position persistence helpers
export function loadTaskPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    console.error('Failed to load task positions:', e)
    return {}
  }
}

export function saveTaskPosition(taskId: string, x: number, y: number): void {
  try {
    const current = loadTaskPositions()
    const pos = { x: Math.round(x), y: Math.round(y) }
    current[taskId] = pos
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(current))

    // Sync to Supabase Postgres DB asynchronously
    supabase.from('tasks').select('title').eq('id', taskId).single().then(({ data }) => {
      if (data) {
        const { title, meta } = extractTaskTitleAndMeta(data.title)
        meta.pos = pos
        const newTitle = buildTaskTitleWithMeta(title, meta)
        supabase.from('tasks').update({ title: newTitle }).eq('id', taskId).then()
      }
    })
  } catch (e) {
    console.error('Failed to save task position:', e)
  }
}

// Connection persistence helpers
export function loadTaskConnections(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    console.error('Failed to load task connections:', e)
    return {}
  }
}

export function saveTaskConnections(taskId: string, connectedTo: string[]): void {
  try {
    const current = loadTaskConnections()
    current[taskId] = connectedTo
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(current))

    // Sync to Supabase Postgres DB asynchronously
    supabase.from('tasks').select('title').eq('id', taskId).single().then(({ data }) => {
      if (data) {
        const { title, meta } = extractTaskTitleAndMeta(data.title)
        meta.connectedTo = connectedTo
        const newTitle = buildTaskTitleWithMeta(title, meta)
        supabase.from('tasks').update({ title: newTitle }).eq('id', taskId).then()
      }
    })
  } catch (e) {
    console.error('Failed to save task connections:', e)
  }
}

// Subtasks persistence helpers
export function loadTaskSubtasks(): Record<string, SubTask[]> {
  try {
    const raw = localStorage.getItem(SUBTASKS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    console.error('Failed to load task subtasks:', e)
    return {}
  }
}

export function saveTaskSubtasks(taskId: string, subtasks: SubTask[]): void {
  try {
    const current = loadTaskSubtasks()
    current[taskId] = subtasks
    localStorage.setItem(SUBTASKS_KEY, JSON.stringify(current))
    broadcastSubtaskUpdate(taskId, subtasks)

    // Sync to Supabase Postgres DB asynchronously for cross-device persistence
    supabase.from('tasks').select('title').eq('id', taskId).single().then(({ data }) => {
      if (data) {
        const { title, meta } = extractTaskTitleAndMeta(data.title)
        meta.subtasks = subtasks
        const newTitle = buildTaskTitleWithMeta(title, meta)
        supabase.from('tasks').update({ title: newTitle }).eq('id', taskId).then()
      }
    })
  } catch (e) {
    console.error('Failed to save task subtasks:', e)
  }
}

// Meta state persistence helpers
export function loadTaskMeta(): Record<string, TaskMeta> {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    console.error('Failed to load task meta:', e)
    return {}
  }
}

export function saveTaskMeta(taskId: string, meta: TaskMeta): void {
  try {
    const current = loadTaskMeta()
    const updatedMeta = { ...current[taskId], ...meta }
    // If marking task as completed, automatically turn off active state
    if (updatedMeta.completed) {
      updatedMeta.is_active = false
    }
    current[taskId] = updatedMeta
    localStorage.setItem(META_KEY, JSON.stringify(current))
    broadcastTaskMetaUpdate(taskId, updatedMeta)

    // Sync to Supabase Postgres DB asynchronously for cross-device persistence
    supabase.from('tasks').select('title').eq('id', taskId).single().then(({ data }) => {
      if (data) {
        const { title, meta: dbMeta } = extractTaskTitleAndMeta(data.title)
        const mergedMeta = { ...dbMeta, ...updatedMeta }
        const newTitle = buildTaskTitleWithMeta(title, mergedMeta)
        supabase.from('tasks').update({ title: newTitle }).eq('id', taskId).then()
      }
    })
  } catch (e) {
    console.error('Failed to save task meta:', e)
  }
}

// Global Task Status helper queries
export function isTaskCompleted(taskId: string, taskObj?: { completed?: boolean; subtasks?: SubTask[] }): boolean {
  if (taskObj?.completed !== undefined && taskObj.completed) return true
  
  const meta = loadTaskMeta()[taskId]
  if (meta?.completed) return true

  const subtasks = (taskObj?.subtasks && taskObj.subtasks.length > 0)
    ? taskObj.subtasks
    : (loadTaskSubtasks()[taskId] || [])

  if (subtasks.length > 0 && subtasks.every(st => st.completed)) return true
  return false
}

export function isTaskActive(taskId: string, taskObj?: { is_active?: boolean; completed?: boolean; subtasks?: SubTask[] }): boolean {
  if (isTaskCompleted(taskId, taskObj)) return false
  if (taskObj?.is_active !== undefined && taskObj.is_active) return true
  
  const meta = loadTaskMeta()[taskId]
  if (meta?.is_active !== undefined) return meta.is_active
  return false
}
