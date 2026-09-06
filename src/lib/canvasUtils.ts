import { SubTask } from './types'

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
    current[taskId] = { x: Math.round(x), y: Math.round(y) }
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(current))
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
    current[taskId] = { ...current[taskId], ...meta }
    localStorage.setItem(META_KEY, JSON.stringify(current))
  } catch (e) {
    console.error('Failed to save task meta:', e)
  }
}

// Global Task Status helper queries
export function isTaskCompleted(taskId: string): boolean {
  const meta = loadTaskMeta()[taskId]
  if (meta?.completed) return true
  const subtasks = loadTaskSubtasks()[taskId] || []
  if (subtasks.length > 0 && subtasks.every(st => st.completed)) return true
  return false
}

export function isTaskActive(taskId: string): boolean {
  const meta = loadTaskMeta()[taskId]
  return !!meta?.is_active
}
