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

// Initialize Supabase Broadcast Channel for cross-device real-time sync
export function initRealtimeSync(): void {
  if (syncChannel) return

  syncChannel = supabase.channel('arena-sync', {
    config: {
      broadcast: { self: false } // Receive events from other devices/clients
    }
  })

  syncChannel
    .on('broadcast', { event: 'arena-state-change' }, (response) => {
      if (response.payload) {
        const payload = response.payload as RealtimeSyncPayload
        
        // Update local storage cache immediately upon receiving broadcast from another device
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

        // Notify all registered React state listeners
        listeners.forEach(fn => fn(payload))
      }
    })
    .subscribe()
}

// Broadcast task meta update (e.g. is_active ON PROGRESS / completed) to all other connected devices
export function broadcastTaskMetaUpdate(taskId: string, meta: TaskMeta): void {
  initRealtimeSync()
  if (syncChannel) {
    syncChannel.send({
      type: 'broadcast',
      event: 'arena-state-change',
      payload: {
        type: 'META_UPDATE',
        taskId,
        meta
      }
    })
  }
}

// Broadcast subtasks checklist update to all other connected devices
export function broadcastSubtaskUpdate(taskId: string, subtasks: SubTask[]): void {
  initRealtimeSync()
  if (syncChannel) {
    syncChannel.send({
      type: 'broadcast',
      event: 'arena-state-change',
      payload: {
        type: 'SUBTASK_UPDATE',
        taskId,
        subtasks
      }
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
