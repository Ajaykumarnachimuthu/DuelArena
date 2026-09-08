import { SubTask } from './types'
import { broadcastSubtaskUpdate, broadcastTaskMetaUpdate, broadcastCanvasUpdate } from './realtimeSync'
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
  completed_at?: string
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

// Smart Docking & Bezier Path calculation between card edges
export function calculateSmartBezierPath(
  sourcePos: { x: number; y: number },
  sourceWidth: number,
  sourceHeight: number,
  targetPos: { x: number; y: number },
  targetWidth: number,
  targetHeight: number
): { path: string; startX: number; startY: number; endX: number; endY: number } {
  const sCenterX = sourcePos.x + sourceWidth / 2
  const sCenterY = sourcePos.y + sourceHeight / 2
  const tCenterX = targetPos.x + targetWidth / 2
  const tCenterY = targetPos.y + targetHeight / 2

  const dx = tCenterX - sCenterX
  const dy = tCenterY - sCenterY

  let startX: number, startY: number, endX: number, endY: number
  let controlX1: number, controlY1: number, controlX2: number, controlY2: number

  // Dock to Top/Bottom edges if relative offset is primarily vertical
  if (Math.abs(dy) >= Math.abs(dx)) {
    if (dy > 0) {
      // Target is BELOW source: Exit Bottom of Source, Enter Top of Target
      startX = sCenterX
      startY = sourcePos.y + sourceHeight
      endX = tCenterX
      endY = targetPos.y

      const deltaY = Math.max(40, Math.abs(endY - startY) * 0.5)
      controlX1 = startX
      controlY1 = startY + deltaY
      controlX2 = endX
      controlY2 = endY - deltaY
    } else {
      // Target is ABOVE source: Exit Top of Source, Enter Bottom of Target
      startX = sCenterX
      startY = sourcePos.y
      endX = tCenterX
      endY = targetPos.y + targetHeight

      const deltaY = Math.max(40, Math.abs(startY - endY) * 0.5)
      controlX1 = startX
      controlY1 = startY - deltaY
      controlX2 = endX
      controlY2 = endY + deltaY
    }
  } else {
    // Dock to Left/Right edges if relative offset is primarily horizontal
    if (dx > 0) {
      // Target is RIGHT of source: Exit Right of Source, Enter Left of Target
      startX = sourcePos.x + sourceWidth
      startY = sCenterY
      endX = targetPos.x
      endY = tCenterY

      const deltaX = Math.max(40, Math.abs(endX - startX) * 0.5)
      controlX1 = startX + deltaX
      controlY1 = startY
      controlX2 = endX - deltaX
      controlY2 = endY
    } else {
      // Target is LEFT of source: Exit Left of Source, Enter Right of Target
      startX = sourcePos.x
      startY = sCenterY
      endX = targetPos.x + targetWidth
      endY = tCenterY

      const deltaX = Math.max(40, Math.abs(startX - endX) * 0.5)
      controlX1 = startX - deltaX
      controlY1 = startY
      controlX2 = endX + deltaX
      controlY2 = endY
    }
  }

  const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`
  return { path, startX, startY, endX, endY }
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

const positionSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {}

export function saveTaskPosition(taskId: string, x: number, y: number): void {
  try {
    const current = loadTaskPositions()
    const pos = { x: Math.round(x), y: Math.round(y) }
    current[taskId] = pos
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(current))
    broadcastCanvasUpdate(taskId, pos)

    // Debounce Supabase Postgres DB sync so canvas dragging is 60fps butter smooth
    if (positionSaveTimers[taskId]) {
      clearTimeout(positionSaveTimers[taskId])
    }

    positionSaveTimers[taskId] = setTimeout(() => {
      supabase.from('tasks').select('title').eq('id', taskId).single().then(({ data }) => {
        if (data) {
          const { title, meta } = extractTaskTitleAndMeta(data.title)
          meta.pos = pos
          const newTitle = buildTaskTitleWithMeta(title, meta)
          supabase.from('tasks').update({ title: newTitle }).eq('id', taskId).then()
        }
      })
    }, 400)
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

export function saveTaskMeta(taskId: string, meta: TaskMeta & { completed_at?: string }): void {
  try {
    const current = loadTaskMeta()
    const updatedMeta = { ...current[taskId], ...meta }
    // If marking task as completed, automatically turn off active state and record completion timestamp
    if (updatedMeta.completed) {
      updatedMeta.is_active = false
      if (!updatedMeta.completed_at) {
        updatedMeta.completed_at = new Date().toISOString()
      }
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

// Calculate dynamic daily points for Ajay or Selvaa in real-time
export function calculateDailyUserPoints(userId: string, tasks: any[]): number {
  const todayStr = new Date().toDateString()
  const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
  const isTeamup = (t: any) => t.category === 'Teamup' || t.difficulty === 'Teamup'
  
  const userTasks = tasks.filter(t => (userId === AJAY_ID ? (t.user_id === AJAY_ID || isTeamup(t)) : (t.user_id !== AJAY_ID || isTeamup(t))))

  const localMetaMap = loadTaskMeta()
  const localSubtasksMap = loadTaskSubtasks()

  let points = 0

  for (const t of userTasks) {
    const meta = localMetaMap[t.id] || {}
    const subtasks = (localSubtasksMap[t.id] && localSubtasksMap[t.id].length > 0) 
      ? localSubtasksMap[t.id] 
      : (t.subtasks || [])
    
    const completed = isTaskCompleted(t.id, t)

    const createdToday = new Date(t.created_at).toDateString() === todayStr
    const completedToday = meta.completed_at ? new Date(meta.completed_at).toDateString() === todayStr : true

    if (completed) {
      if (createdToday || completedToday) {
        points += t.points || 50
      }
    } else if (subtasks.length > 0) {
      const completedSubCount = subtasks.filter((st: any) => st.completed).length
      if (completedSubCount > 0 && (createdToday || completedToday)) {
        points += Math.round((completedSubCount / subtasks.length) * (t.points || 50))
      }
    }
  }

  return points
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

export function isTaskActiveOrInProgress(taskId: string, taskObj?: { is_active?: boolean; completed?: boolean; subtasks?: SubTask[] }): boolean {
  if (isTaskCompleted(taskId, taskObj)) return false
  if (isTaskActive(taskId, taskObj)) return true

  const subtasks = (taskObj?.subtasks && taskObj.subtasks.length > 0)
    ? taskObj.subtasks
    : (loadTaskSubtasks()[taskId] || [])

  if (subtasks.length > 0 && subtasks.some(st => st.completed)) return true
  return false
}
