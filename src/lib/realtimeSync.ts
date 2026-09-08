import { supabase } from './supabase'
import { TaskMeta } from './canvasUtils'
import { SubTask } from './types'

export interface RealtimeSyncPayload {
  type: 'META_UPDATE' | 'SUBTASK_UPDATE' | 'CANVAS_UPDATE'
  taskId: string
  meta?: TaskMeta
  subtasks?: SubTask[]
  position?: { x: number; y: number }
  senderId?: string
}

type SyncCallback = (payload: RealtimeSyncPayload) => void

const listeners: Set<SyncCallback> = new Set()
let syncChannel: ReturnType<typeof supabase.channel> | null = null

export const CLIENT_ID = Math.random().toString(36).substring(2, 11)

// Initialize Supabase Broadcast Channel for cross-device real-time sync
export function initRealtimeSync(): void {
  if (syncChannel) return

  syncChannel = supabase.channel('arena-sync', {
    config: {
      broadcast: { self: false } // Prevent duplicate self broadcast loop back
    }
  })

  syncChannel
    .on('broadcast', { event: 'arena-state-change' }, (response) => {
      if (response.payload) {
        const payload = response.payload as RealtimeSyncPayload
        
        // Ignore self-emitted broadcasts
        if (payload.senderId === CLIENT_ID) return

        // Update local storage cache immediately upon receiving broadcast from another tab/device
        if (payload.taskId && payload.meta) {
          try {
            const META_KEY = 'habit_arena_task_meta_v1'
            const raw = localStorage.getItem(META_KEY)
            const current = raw ? JSON.parse(raw) : {}
            current[payload.taskId] = { ...current[payload.taskId], ...payload.meta }
            localStorage.setItem(META_KEY, JSON.stringify(current))
          } catch (e) {
            console.error('Failed to update meta cache from broadcast:', e)
          }
        }

        if (payload.taskId && payload.subtasks) {
          try {
            const SUBTASKS_KEY = 'habit_arena_task_subtasks_v1'
            const raw = localStorage.getItem(SUBTASKS_KEY)
            const current = raw ? JSON.parse(raw) : {}
            current[payload.taskId] = payload.subtasks
            localStorage.setItem(SUBTASKS_KEY, JSON.stringify(current))
          } catch (e) {
            console.error('Failed to update subtasks cache from broadcast:', e)
          }
        }

        if (payload.taskId && payload.position) {
          try {
            const POSITIONS_KEY = 'habit_arena_task_positions_v1'
            const raw = localStorage.getItem(POSITIONS_KEY)
            const current = raw ? JSON.parse(raw) : {}
            current[payload.taskId] = payload.position
            localStorage.setItem(POSITIONS_KEY, JSON.stringify(current))
          } catch (e) {
            console.error('Failed to update position cache from broadcast:', e)
          }
        }

        // Notify all registered React state listeners
        listeners.forEach(fn => fn(payload))
      }
    })
    .subscribe()
}

// Broadcast task meta update (e.g. is_active ON PROGRESS / completed)
export function broadcastTaskMetaUpdate(taskId: string, meta: TaskMeta): void {
  initRealtimeSync()
  const payload: RealtimeSyncPayload = {
    type: 'META_UPDATE',
    taskId,
    meta,
    senderId: CLIENT_ID
  }
  if (syncChannel) {
    syncChannel.send({
      type: 'broadcast',
      event: 'arena-state-change',
      payload
    })
  }
}

// Broadcast subtasks checklist update
export function broadcastSubtaskUpdate(taskId: string, subtasks: SubTask[]): void {
  initRealtimeSync()
  const payload: RealtimeSyncPayload = {
    type: 'SUBTASK_UPDATE',
    taskId,
    subtasks,
    senderId: CLIENT_ID
  }
  if (syncChannel) {
    syncChannel.send({
      type: 'broadcast',
      event: 'arena-state-change',
      payload
    })
  }
}

// Broadcast canvas node position/connections update
export function broadcastCanvasUpdate(taskId: string, position?: { x: number; y: number }): void {
  initRealtimeSync()
  const payload: RealtimeSyncPayload = {
    type: 'CANVAS_UPDATE',
    taskId,
    position,
    senderId: CLIENT_ID
  }
  if (syncChannel) {
    syncChannel.send({
      type: 'broadcast',
      event: 'arena-state-change',
      payload
    })
  }
}

// Subscribe React components to real-time broadcast updates
export function subscribeRealtimeSync(callback: SyncCallback): () => void {
  initRealtimeSync()
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}
