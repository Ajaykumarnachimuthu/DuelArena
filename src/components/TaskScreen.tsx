import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, SubTask } from '../lib/types'
import { cn } from '../lib/utils'
import { 
  loadTaskPositions, saveTaskPosition, 
  loadTaskConnections, saveTaskConnections, 
  loadTaskSubtasks, saveTaskSubtasks, 
  loadTaskMeta, saveTaskMeta,
  calculateBezierPath,
  extractTaskTitleAndMeta
} from '../lib/canvasUtils'
import { subscribeRealtimeSync } from '../lib/realtimeSync'
import { 
  Plus, Trash2, Play, CheckCircle2, Circle, Link as LinkIcon, 
  Clock, Move, ZoomIn, ZoomOut, CheckSquare, 
  Layout, Eye, Sparkles, X, Grid as GridIcon, Users, RotateCcw
} from 'lucide-react'

const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

interface TaskScreenProps {
  tasks: Task[]
  points: number
  onSubmit: (
    title: string, 
    diff: string, 
    cat: string, 
    duration?: number, 
    startTime?: string, 
    initialSubtasks?: string[]
  ) => void
  onDelete: (id: string) => void
  theme: 'cyan' | 'pink'
  currentUser?: string
}

export function TaskScreen({ tasks, onSubmit, onDelete, theme }: TaskScreenProps) {
  // Filter state: 'all' | 'ajay' | 'selvaa'
  const [filterUser, setFilterUser] = useState<'all' | 'ajay' | 'selvaa'>('all')

  // Date Scope Filter state: 'today' | 'all'
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today')

  // Connection linking mode state: source task ID
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null)

  // Local augmented task state maps
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [connections, setConnections] = useState<Record<string, string[]>>({})
  const [subtasksMap, setSubtasksMap] = useState<Record<string, SubTask[]>>({})
  const [metaMap, setMetaMap] = useState<Record<string, { is_active?: boolean; duration_minutes?: number; start_time?: string; completed?: boolean }>>({})

  // Form modal state
  const [isDeployOpen, setIsDeployOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [cat, setCat] = useState('Code')
  const [diff, setDiff] = useState('Medium')
  const [durationMins, setDurationMins] = useState<number>(45)
  const [startTime] = useState<string>('09:00 AM')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [newSubtasks, setNewSubtasks] = useState<string[]>([])

  // Subtask inline edit per card
  // Subtask inline edit per card
  const [inlineSubtaskInput, setInlineSubtaskInput] = useState<Record<string, string>>({})

  // Highlight map for newly deployed task nodes (taskId -> boolean)
  const [highlightTaskIds, setHighlightTaskIds] = useState<Record<string, boolean>>({})
  const prevTasksCountRef = useRef<number>(tasks.length)

  // Canvas View transform (pan X/Y + zoom)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 0.85 : 1.2))

  const panRef = useRef(pan)
  useEffect(() => {
    panRef.current = pan
  }, [pan])

  const canvasRef = useRef<HTMLDivElement>(null)
  const prevDistRef = useRef<number | null>(null)
  const prevMidXRef = useRef<number | null>(null)
  const prevMidYRef = useRef<number | null>(null)
  const singleTouchStartRef = useRef<{ touchX: number; touchY: number; panX: number; panY: number } | null>(null)
  const [isPanDragging, setIsPanDragging] = useState(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  // Detect newly added tasks and trigger 4-second highlight
  useEffect(() => {
    if (tasks.length > prevTasksCountRef.current) {
      const existingIds = new Set(Object.keys(positions))
      const newTasks = tasks.filter(t => !existingIds.has(t.id))
      
      if (newTasks.length > 0) {
        const newHighlightMap: Record<string, boolean> = {}
        newTasks.forEach(t => {
          newHighlightMap[t.id] = true
        })
        setHighlightTaskIds(prev => ({ ...prev, ...newHighlightMap }))

        setTimeout(() => {
          setHighlightTaskIds(prev => {
            const copy = { ...prev }
            newTasks.forEach(t => delete copy[t.id])
            return copy
          })
        }, 4000)
      }
    }
    prevTasksCountRef.current = tasks.length
  }, [tasks, positions])

  // Load local state maps on mount & subscribe to cross-device broadcast sync
  useEffect(() => {
    setPositions(loadTaskPositions())
    setConnections(loadTaskConnections())
    setSubtasksMap(loadTaskSubtasks())
    setMetaMap(loadTaskMeta())

    const unsubscribe = subscribeRealtimeSync(() => {
      // Refresh local state maps live upon receiving cross-device broadcast update
      setPositions(loadTaskPositions())
      setConnections(loadTaskConnections())
      setMetaMap(loadTaskMeta())
      setSubtasksMap(loadTaskSubtasks())
    })

    return () => {
      unsubscribe()
    }
  }, [tasks])

  // Mouse drag panning on empty canvas background
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.group') || target.closest('button') || target.closest('input') || target.closest('select')) {
      return
    }
    setIsPanDragging(true)
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanDragging || !panStartRef.current) return
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    })
  }

  const handleMouseUp = () => {
    setIsPanDragging(false)
    panStartRef.current = null
  }

  const touchSubtaskScrollRef = useRef<{
    element: HTMLElement
    initialMidY: number
    initialScrollTop: number
  } | null>(null)

  // Two-Finger Movement (Pan in X & Y), Pinch Zoom, Single-Finger Touch Pan, Subtask 2-Finger Swipe, Wheel listener
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const subtaskContainer = target.closest('.subtask-scroll-area') as HTMLElement

      if (subtaskContainer) {
        const midY = e.touches.length === 2 
          ? (e.touches[0].clientY + e.touches[1].clientY) / 2 
          : e.touches[0].clientY

        touchSubtaskScrollRef.current = {
          element: subtaskContainer,
          initialMidY: midY,
          initialScrollTop: subtaskContainer.scrollTop
        }
        singleTouchStartRef.current = null
        prevDistRef.current = null
        prevMidXRef.current = null
        prevMidYRef.current = null
        return
      }

      touchSubtaskScrollRef.current = null

      if (e.touches.length === 2) {
        singleTouchStartRef.current = null
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        prevDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        prevMidXRef.current = (t1.clientX + t2.clientX) / 2
        prevMidYRef.current = (t1.clientY + t2.clientY) / 2
      } else if (e.touches.length === 1) {
        if (!target.closest('.group') && !target.closest('button') && !target.closest('input') && !target.closest('select')) {
          singleTouchStartRef.current = {
            touchX: e.touches[0].clientX,
            touchY: e.touches[0].clientY,
            panX: panRef.current.x,
            panY: panRef.current.y
          }
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchSubtaskScrollRef.current) {
        e.preventDefault()
        e.stopPropagation()
        const currentMidY = e.touches.length === 2
          ? (e.touches[0].clientY + e.touches[1].clientY) / 2
          : e.touches[0].clientY

        const deltaY = currentMidY - touchSubtaskScrollRef.current.initialMidY
        touchSubtaskScrollRef.current.element.scrollTop = touchSubtaskScrollRef.current.initialScrollTop - deltaY
        return
      }

      if (e.touches.length === 2) {
        e.preventDefault()

        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        const midX = (t1.clientX + t2.clientX) / 2
        const midY = (t1.clientY + t2.clientY) / 2

        // Pinch Zoom
        if (prevDistRef.current && prevDistRef.current > 0) {
          const ratio = dist / prevDistRef.current
          setZoom(z => Math.min(2.5, Math.max(0.4, parseFloat((z * ratio).toFixed(3)))))
        }

        // Two-Finger Pan Movement in X and Y directions
        if (prevMidXRef.current !== null && prevMidYRef.current !== null) {
          const deltaX = midX - prevMidXRef.current
          const deltaY = midY - prevMidYRef.current
          setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }))
        }

        prevDistRef.current = dist
        prevMidXRef.current = midX
        prevMidYRef.current = midY
      } else if (e.touches.length === 1 && singleTouchStartRef.current) {
        e.preventDefault()
        const deltaX = e.touches[0].clientX - singleTouchStartRef.current.touchX
        const deltaY = e.touches[0].clientY - singleTouchStartRef.current.touchY
        setPan({
          x: singleTouchStartRef.current.panX + deltaX,
          y: singleTouchStartRef.current.panY + deltaY
        })
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchSubtaskScrollRef.current = null
        singleTouchStartRef.current = null
      }
      if (e.touches.length < 2) {
        prevDistRef.current = null
        prevMidXRef.current = null
        prevMidYRef.current = null
      }
    }

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.subtask-scroll-area')) {
        return
      }
      e.preventDefault()
      if (e.ctrlKey) {
        const zoomDelta = -e.deltaY * 0.003
        setZoom(z => Math.min(2.5, Math.max(0.4, parseFloat((z + zoomDelta).toFixed(3)))))
      } else {
        setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Helper: Find next available empty grid slot that does NOT overlap with any existing task card
  const findNextEmptySlot = (currentPositions: Record<string, { x: number; y: number }>) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const COLS = isMobile ? 1 : 3
    const STEP_X = 414
    const STEP_Y = 320
    const START_X = isMobile ? 20 : 64
    const START_Y = 40

    const occupiedList = Object.values(currentPositions)

    let slot = 0
    while (slot < 1000) {
      const col = slot % COLS
      const row = Math.floor(slot / COLS)
      const candX = START_X + col * STEP_X
      const candY = START_Y + row * STEP_Y

      // Check if candidate overlaps within card collision box (width ~300, height ~220)
      const isOverlapping = occupiedList.some(pos => 
        Math.abs(pos.x - candX) < 320 && Math.abs(pos.y - candY) < 240
      )

      if (!isOverlapping) {
        return { x: candX, y: candY }
      }
      slot++
    }

    return { x: START_X, y: START_Y + occupiedList.length * STEP_Y }
  }

  // Auto-assign positions for new tasks using collision-free empty slot finder
  useEffect(() => {
    let changed = false
    const newPositions = { ...positions }

    // Sort tasks chronologically so new tasks get assigned sequentially
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    sortedTasks.forEach((t) => {
      if (!newPositions[t.id]) {
        const nextSlot = findNextEmptySlot(newPositions)
        newPositions[t.id] = nextSlot
        saveTaskPosition(t.id, nextSlot.x, nextSlot.y)
        changed = true
      }
    })

    if (changed) {
      setPositions(newPositions)
    }
  }, [tasks])

  // Auto-align all task cards vertically on mobile or grid pattern on desktop
  const handleAutoAlignGrid = () => {
    const updated: Record<string, { x: number; y: number }> = {}
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const COLS = isMobile ? 1 : 3
    const STEP_X = 414
    const STEP_Y = 320

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    sortedTasks.forEach((t, index) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      updated[t.id] = {
        x: isMobile ? 20 : 64 + col * STEP_X,
        y: 40 + row * STEP_Y
      }
      saveTaskPosition(t.id, updated[t.id].x, updated[t.id].y)
    })

    setPositions(updated)
  }

  // Handle position drag end
  const handleDragEnd = (taskId: string, x: number, y: number) => {
    const updated = { ...positions, [taskId]: { x, y } }
    setPositions(updated)
    saveTaskPosition(taskId, x, y)
  }

  // Handle subtask add to existing task card
  const handleAddInlineSubtask = (taskId: string) => {
    const text = inlineSubtaskInput[taskId]?.trim()
    if (!text) return

    const taskObj = tasks.find(t => t.id === taskId)
    const currentSubtasks = (subtasksMap[taskId] && subtasksMap[taskId].length > 0)
      ? subtasksMap[taskId]
      : (taskObj?.subtasks || [])

    const updatedSubtasks: SubTask[] = [
      ...currentSubtasks,
      { id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), title: text, completed: false }
    ]

    const newMap = { ...subtasksMap, [taskId]: updatedSubtasks }
    setSubtasksMap(newMap)
    saveTaskSubtasks(taskId, updatedSubtasks)
    setInlineSubtaskInput({ ...inlineSubtaskInput, [taskId]: '' })
  }

  // Handle subtask toggle
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const taskObj = tasks.find(t => t.id === taskId)
    const currentSubtasks = (subtasksMap[taskId] && subtasksMap[taskId].length > 0)
      ? subtasksMap[taskId]
      : (taskObj?.subtasks || [])

    const updatedSubtasks = currentSubtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )

    const newMap = { ...subtasksMap, [taskId]: updatedSubtasks }
    setSubtasksMap(newMap)
    saveTaskSubtasks(taskId, updatedSubtasks)

    // Check if all subtasks are now completed
    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed)
    const currentMeta = metaMap[taskId] || { is_active: taskObj?.is_active, completed: taskObj?.completed }
    if (allCompleted && !currentMeta.completed) {
      const updatedMeta = { ...currentMeta, completed: true, is_active: false }
      setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
      saveTaskMeta(taskId, updatedMeta)
    } else if (!allCompleted && currentMeta.completed) {
      const updatedMeta = { ...currentMeta, completed: false }
      setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
      saveTaskMeta(taskId, updatedMeta)
    }
  }

  // Handle subtask deletion
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const taskObj = tasks.find(t => t.id === taskId)
    const currentSubtasks = (subtasksMap[taskId] && subtasksMap[taskId].length > 0)
      ? subtasksMap[taskId]
      : (taskObj?.subtasks || [])

    const updatedSubtasks = currentSubtasks.filter(st => st.id !== subtaskId)
    const newMap = { ...subtasksMap, [taskId]: updatedSubtasks }
    setSubtasksMap(newMap)
    saveTaskSubtasks(taskId, updatedSubtasks)

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed)
    const currentMeta = metaMap[taskId] || { is_active: taskObj?.is_active, completed: taskObj?.completed }
    if (allCompleted && !currentMeta.completed) {
      const updatedMeta = { ...currentMeta, completed: true, is_active: false }
      setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
      saveTaskMeta(taskId, updatedMeta)
    }
  }

  // Handle active status toggle ("Going On")
  const handleToggleActive = (taskId: string) => {
    const currentMeta = metaMap[taskId] || {}
    const newActiveState = !currentMeta.is_active
    const updatedMeta = { 
      ...currentMeta, 
      is_active: newActiveState,
      completed: newActiveState ? false : currentMeta.completed
    }

    setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
    saveTaskMeta(taskId, updatedMeta)
  }

  // Handle task complete toggle (when no subtasks exist or full complete)
  const handleToggleComplete = (taskId: string) => {
    const currentMeta = metaMap[taskId] || {}
    const newComplete = !currentMeta.completed
    const updatedMeta = { 
      ...currentMeta, 
      completed: newComplete,
      is_active: newComplete ? false : currentMeta.is_active
    }

    setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
    saveTaskMeta(taskId, updatedMeta)
  }

  // Connection node click handler
  const handleNodeConnectClick = (taskId: string) => {
    if (!connectingSourceId) {
      setConnectingSourceId(taskId)
    } else if (connectingSourceId === taskId) {
      setConnectingSourceId(null) // cancel
    } else {
      // Create or remove connection between connectingSourceId and taskId
      const sourceLinks = connections[connectingSourceId] || []
      const exists = sourceLinks.includes(taskId)
      const updatedLinks = exists 
        ? sourceLinks.filter(id => id !== taskId)
        : [...sourceLinks, taskId]

      const newConnMap = { ...connections, [connectingSourceId]: updatedLinks }
      setConnections(newConnMap)
      saveTaskConnections(connectingSourceId, updatedLinks)
      setConnectingSourceId(null)
    }
  }

  // Handle Deploy Submit
  const handleDeploySubmit = () => {
    if (!title.trim()) return

    onSubmit(title, diff, cat, durationMins, startTime, newSubtasks)

    // Reset Form
    setTitle('')
    setNewSubtasks([])
    setSubtaskInput('')
    setIsDeployOpen(false)
  }

  // Handle Delete task with connection cleanup
  const handleDeleteTaskNode = (id: string) => {
    // Clean up positions, connections, subtasks, meta
    const newPositions = { ...positions }
    delete newPositions[id]
    setPositions(newPositions)
    saveTaskPosition(id, 0, 0)

    const newConn = { ...connections }
    delete newConn[id]
    // also remove references to this id from other arrays
    Object.keys(newConn).forEach(k => {
      newConn[k] = newConn[k].filter(target => target !== id)
    })
    setConnections(newConn)
    localStorage.setItem('habit_arena_task_connections_v1', JSON.stringify(newConn))

    onDelete(id)
  }

  // Filtered tasks by user and daily scope
  const todayStr = new Date().toDateString()
  const isTeamup = (t: Task) => t.category === 'Teamup' || t.difficulty === 'Teamup'
  const visibleTasks = tasks.filter(t => {
    const matchesUser = filterUser === 'all' 
      ? true 
      : filterUser === 'ajay' 
        ? t.user_id === AJAY_ID || isTeamup(t) 
        : t.user_id === SELVAA_ID || isTeamup(t)

    if (!matchesUser) return false

    if (dateFilter === 'today') {
      const isCreatedToday = new Date(t.created_at).toDateString() === todayStr
      
      const subtasks = (subtasksMap[t.id] && subtasksMap[t.id].length > 0) ? subtasksMap[t.id] : (t.subtasks || [])
      const meta = { completed: t.completed, is_active: t.is_active, ...metaMap[t.id] }
      const completedSubtasksCount = subtasks.filter(st => st.completed).length
      const totalSubtasks = subtasks.length
      const isCompleted = totalSubtasks > 0 ? completedSubtasksCount === totalSubtasks : !!meta.completed
      const isActive = !isCompleted && (meta.is_active || false)

      // Do NOT make task vanish when day ends if active/playing OR subtasks are in progress (ticked)
      const inProgressOrActive = !isCompleted && (isActive || completedSubtasksCount > 0)

      return isCreatedToday || inProgressOrActive
    }
    return true
  })

  // Color tokens
  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-24 pt-4 fade-in">
      
      {/* Control Matrix Toolbar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 cyber-border shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* Left Block: Title & Filter Matrix */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Playground Title Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Layout className={cn("w-5 h-5 shrink-0", textColor)} />
            <div>
              <h2 className="text-xs sm:text-sm font-display tracking-widest text-white leading-tight">OBJECTIVES_PLAYGROUND</h2>
              <p className="text-[9px] font-mono text-white/40 leading-none">INTERACTIVE TASK MAP & WHITEBOARD</p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block shrink-0" />

          {/* Combined Filter Controls Container */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Day Scope Filter Toggle */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
              <button 
                onClick={() => setDateFilter('today')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1",
                  dateFilter === 'today' ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" : "text-white/40 hover:text-white"
                )}
                title="Show directives for today's active daily session"
              >
                <Clock className="w-3 h-3" /> TODAY
              </button>
              <button 
                onClick={() => setDateFilter('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1",
                  dateFilter === 'all' ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                )}
                title="Show all archived canvas directives"
              >
                ARCHIVES
              </button>
            </div>

            {/* User Filter Buttons */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
              <button 
                onClick={() => setFilterUser('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1",
                  filterUser === 'all' ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                )}
              >
                <Eye className="w-3 h-3" /> ALL
              </button>
              <button 
                onClick={() => setFilterUser('ajay')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1",
                  filterUser === 'ajay' ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 font-bold" : "text-white/40 hover:text-brand-cyan"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_8px_#81ecff]" /> AJAY
              </button>
              <button 
                onClick={() => setFilterUser('selvaa')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1",
                  filterUser === 'selvaa' ? "bg-brand-pink/20 text-brand-pink border border-brand-pink/40 font-bold" : "text-white/40 hover:text-brand-pink"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-brand-pink shadow-[0_0_8px_#e966ff]" /> SELVAA
              </button>
            </div>
          </div>
        </div>

        {/* Right Block: Canvas Tools & Action Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Canvas Tool Group */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setConnectingSourceId(connectingSourceId ? null : 'SELECT_MODE')}
              className={cn(
                "px-3 py-1.5 h-8.5 rounded-xl text-[11px] font-mono border transition-all flex items-center gap-1.5 shrink-0",
                connectingSourceId 
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                  : "border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {connectingSourceId ? 'LINKING...' : 'CONNECT'}
            </button>

            <button 
              onClick={handleAutoAlignGrid}
              className="px-3 py-1.5 h-8.5 rounded-xl text-[11px] font-mono border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
              title="Auto-align all task cards vertically on mobile or in grid pattern on desktop"
            >
              <GridIcon className="w-3.5 h-3.5 text-brand-cyan" />
              ALIGN
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-0.5 h-8.5 shrink-0">
              <button 
                onClick={() => setZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))))} 
                className="p-1 text-white/50 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] px-1 text-white/70">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(2.5, parseFloat((z + 0.1).toFixed(2))))} 
                className="p-1 text-white/50 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-[1px] bg-white/10 my-auto mx-0.5" />
              <button
                onClick={() => {
                  setPan({ x: 0, y: 0 })
                  setZoom(typeof window !== 'undefined' && window.innerWidth < 640 ? 0.85 : 1.2)
                }}
                className="px-1.5 py-0.5 text-[10px] font-mono text-white/50 hover:text-white flex items-center gap-1"
                title="Reset View Position & Zoom"
              >
                <RotateCcw className="w-3 h-3" /> RESET
              </button>
            </div>
          </div>

          {/* Objective Triggers Group */}
          <div className="flex items-center gap-2">
            {/* Teamup Button */}
            <div className="teamup-rotating-container shrink-0">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCat('Teamup')
                  setDiff('Teamup')
                  setTitle('Teamup Objective')
                  setIsDeployOpen(true)
                }}
                className="teamup-rotating-content px-3 py-1.5 h-8.5 font-display text-[11px] font-bold tracking-wider text-white bg-black/90 hover:bg-black/70 flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="bg-gradient-to-r from-brand-cyan via-purple-300 to-brand-pink bg-clip-text text-transparent font-extrabold tracking-wider">
                  [ TEAMUP TASK ]
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-300 border border-amber-500/30">
                  300 XP
                </span>
              </motion.button>
            </div>

            {/* New Objective Trigger Button */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsDeployOpen(true)}
              className={cn(
                "px-3.5 py-1.5 h-8.5 rounded-xl font-display text-[11px] font-bold tracking-wider text-black flex items-center gap-1.5 transition-all shadow-lg shrink-0",
                theme === 'cyan' ? "bg-brand-cyan shadow-[0_0_20px_rgba(129,236,255,0.5)]" : "bg-brand-pink shadow-[0_0_20px_rgba(233,102,255,0.5)]"
              )}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> NEW OBJECTIVE
            </motion.button>
          </div>
        </div>

      </div>

      {/* Main Interactive 2D Canvas Playground Area */}
      <div 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[650px] sm:h-[750px] rounded-3xl overflow-hidden blueprint-grid border border-white/10 bg-black/90 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] touch-canvas cursor-grab active:cursor-grabbing select-none"
        style={{ backgroundPosition: `${pan.x}px ${pan.y}px` }}
      >
        
        {/* Canvas Background Info Overlay */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-3 font-mono text-[11px] text-white/30 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
          <Move className="w-3.5 h-3.5 text-brand-cyan" />
          <span>2-FINGER TOUCH / DRAG TO PAN X & Y // PINCH TO ZOOM</span>
        </div>

        {connectingSourceId && (
          <div className="absolute top-4 right-4 z-20 font-mono text-xs text-amber-300 bg-amber-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/40 animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {connectingSourceId === 'SELECT_MODE' 
              ? 'Click a source task node, then click target node to draw connection flowline.'
              : 'Select target node to link flowline, or click again to cancel.'}
          </div>
        )}

        {/* Outer Transformed Container for both SVG connections & cards grid */}
        <div 
          className="w-full h-full absolute inset-0 pointer-events-none"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transformOrigin: '0 0',
            transition: isPanDragging ? 'none' : 'transform 0.05s ease-out'
          }}
        >
          {/* SVG Flowline Layer for Task Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#81ecff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="pink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e966ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {visibleTasks.flatMap(t => {
              const targets = connections[t.id] || []
              const sourcePos = positions[t.id] || t.pos || { x: 40, y: 40 }
              const sourceOwnerIsAjay = t.user_id === AJAY_ID

              // Node box dimensions: width ~ 300px, height ~ 220px
              const sourceCenterX = sourcePos.x + 150
              const sourceCenterY = sourcePos.y + 110

              return targets.map(targetId => {
                const targetTask = tasks.find(x => x.id === targetId)
                if (!targetTask) return null

                const targetPos = positions[targetId] || targetTask.pos || { x: 40, y: 40 }
                const targetCenterX = targetPos.x + 150
                const targetCenterY = targetPos.y + 110

                const pathString = calculateBezierPath(sourceCenterX, sourceCenterY, targetCenterX, targetCenterY)
                const strokeGradient = sourceOwnerIsAjay ? "url(#cyan-gradient)" : "url(#pink-gradient)"

                return (
                  <g key={`${t.id}->${targetId}`}>
                    {/* Glowing background path */}
                    <path
                      d={pathString}
                      fill="none"
                      stroke={sourceOwnerIsAjay ? "#81ecff" : "#e966ff"}
                      strokeWidth={4}
                      strokeOpacity={0.25}
                    />
                    {/* Animated energy flowline */}
                    <path
                      d={pathString}
                      fill="none"
                      stroke={strokeGradient}
                      strokeWidth={2.5}
                      className="flowline-animated"
                    />
                  </g>
                )
              })
            })}
          </svg>

          {/* Task Cards Node Grid Layer */}
          <div className="w-full h-full relative pointer-events-auto">
            {visibleTasks.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                <Layout className="w-12 h-12 text-white/20 mb-3" />
                <p className="font-mono text-sm text-white/40">NO OBJECTIVES FOUND ON CANVAS</p>
                <p className="font-mono text-xs text-white/20 mt-1">Click "NEW OBJECTIVE" to deploy a task to the playground.</p>
              </div>
            ) : (
              visibleTasks.map(t => {
                const { title: displayTitle } = extractTaskTitleAndMeta(t.title)
                const pos = positions[t.id] || t.pos || { x: 40, y: 40 }
                const isTeamup = t.category === 'Teamup' || t.difficulty === 'Teamup'
                const isAjay = t.user_id === AJAY_ID
                const cardThemeColor = isTeamup ? '#e966ff' : isAjay ? '#81ecff' : '#e966ff'
                const cardBorderClass = isTeamup 
                  ? 'border-purple-400/60 bg-gradient-to-br from-brand-cyan/10 via-purple-950/20 to-brand-pink/10' 
                  : isAjay ? 'border-brand-cyan/40 bg-brand-cyan/10' : 'border-brand-pink/40 bg-brand-pink/10'
                const cardGlowClass = isTeamup 
                  ? 'shadow-[0_0_30px_rgba(233,102,255,0.25)] shadow-[0_0_30px_rgba(129,236,255,0.25)]' 
                  : isAjay ? 'shadow-[0_0_25px_rgba(129,236,255,0.15)]' : 'shadow-[0_0_25px_rgba(233,102,255,0.15)]'
                const cardPillBg = isAjay ? 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30' : 'bg-brand-pink/15 text-brand-pink border-brand-pink/30'

                const subtasks = (subtasksMap[t.id] && subtasksMap[t.id].length > 0) ? subtasksMap[t.id] : (t.subtasks || [])
                const meta = {
                  duration_minutes: 45,
                  start_time: '09:00 AM',
                  completed: t.completed,
                  is_active: t.is_active,
                  ...metaMap[t.id]
                }

                const completedSubtasksCount = subtasks.filter(st => st.completed).length
                const totalSubtasks = subtasks.length

                const isCompleted = meta.completed || (totalSubtasks > 0 && completedSubtasksCount === totalSubtasks)
                const isActive = !isCompleted && (meta.is_active || false)

                // Subtask Completion Percentage
                let completionRatio = 0
                if (totalSubtasks > 0) {
                  completionRatio = completedSubtasksCount / totalSubtasks
                } else if (isCompleted) {
                  completionRatio = 1
                }

                // Card dimensions for SVG circumference progress calculation
                const cardWidth = 300
                const cardHeight = 220
                const cardRx = 12
                const perimeter = 2 * (cardWidth + cardHeight) - 8 * cardRx + 2 * Math.PI * cardRx
                const dashOffset = perimeter * (1 - completionRatio)

                const isNewlyCreated = highlightTaskIds[t.id] || false
                const isSourceInConnecting = connectingSourceId === t.id

                return (
                  <motion.div
                    key={t.id}
                    drag
                    dragMomentum={false}
                    initial={{ x: pos.x, y: pos.y, scale: isNewlyCreated ? 0.95 : 1 }}
                    animate={{ x: pos.x, y: pos.y, scale: 1 }}
                    onDrag={(_, info) => {
                      const newX = Math.max(10, Math.round(pos.x + info.offset.x / zoom))
                      const newY = Math.max(10, Math.round(pos.y + info.offset.y / zoom))
                      setPositions(prev => ({ ...prev, [t.id]: { x: newX, y: newY } }))
                    }}
                    onDragEnd={(_, info) => {
                      const newX = Math.max(10, Math.round(pos.x + info.offset.x / zoom))
                      const newY = Math.max(10, Math.round(pos.y + info.offset.y / zoom))
                      handleDragEnd(t.id, newX, newY)
                    }}
                    className="absolute cursor-grab active:cursor-grabbing z-10 group"
                    style={{ width: cardWidth }}
                  >
                  {/* Floating Badge for Newly Created Task Node */}
                  <AnimatePresence>
                    {isNewlyCreated && (
                      <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 font-mono text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-brand-cyan via-purple-400 to-brand-pink text-black shadow-[0_0_20px_rgba(129,236,255,0.9)] flex items-center gap-1.5 whitespace-nowrap animate-bounce"
                      >
                        <Sparkles className="w-3 h-3 text-black fill-current" />
                        <span>NEW OBJECTIVE CREATED HERE</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Rotating Active Border Wrapper if Task is "Going On" (stops automatically when completed) */}
                  <div 
                    className={cn(
                      isNewlyCreated 
                        ? "newly-created-highlight-container" 
                        : isActive 
                          ? (isTeamup ? "teamup-rotating-container" : "active-rotating-container") 
                          : ""
                    )}
                    style={{ '--active-color': cardThemeColor } as React.CSSProperties}
                  >
                    <div className={cn(
                      "active-rotating-content relative glass-panel p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300",
                      isCompleted ? "border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_25px_rgba(16,185,129,0.25)]" : cardBorderClass,
                      isCompleted ? "shadow-[0_0_25px_rgba(16,185,129,0.25)]" : cardGlowClass,
                      isSourceInConnecting ? "ring-2 ring-amber-400 border-amber-400" : ""
                    )}>
                      
                      {/* SVG Circumference Progress Overlay around entire card border */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-xl"
                        style={{ zIndex: 2 }}
                      >
                        <rect
                          x="0"
                          y="0"
                          width="100%"
                          height="100%"
                          rx="12"
                          fill="none"
                          stroke={isCompleted ? '#10b981' : isTeamup ? '#e966ff' : cardThemeColor}
                          strokeWidth="3"
                          strokeDasharray={perimeter}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease',
                            filter: completionRatio > 0 ? `drop-shadow(0 0 8px ${isCompleted ? '#10b981' : isTeamup ? '#e966ff' : cardThemeColor})` : 'none'
                          }}
                        />
                      </svg>

                      {/* Card Header: Owner Badge & Active/Connect Controls */}
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> COMPLETED
                            </span>
                          ) : isTeamup ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-extrabold bg-gradient-to-r from-brand-cyan/20 to-brand-pink/20 text-white border-white/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(233,102,255,0.3)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_6px_#81ecff]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-pink shadow-[0_0_6px_#e966ff]" />
                              AJAY + SELVAA
                            </span>
                          ) : (
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-bold", cardPillBg)}>
                              {isAjay ? 'AJAY' : 'SELVAA'}
                            </span>
                          )}

                          {/* Going On Active Badge */}
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> GOING ON
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Toggle Active Task Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(t.id) }}
                            title={isActive ? "Pause Active Task" : "Mark as Active / Going On"}
                            className={cn(
                              "p-1.5 rounded-lg border transition-all",
                              isActive 
                                ? "bg-amber-500/30 border-amber-400 text-amber-300" 
                                : "border-white/10 text-white/30 hover:text-amber-300 hover:border-amber-400/50"
                            )}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Connect Link Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleNodeConnectClick(t.id) }}
                            title="Connect task to another node"
                            className={cn(
                              "p-1.5 rounded-lg border transition-all",
                              isSourceInConnecting 
                                ? "bg-amber-400 text-black border-amber-400" 
                                : "border-white/10 text-white/30 hover:text-white hover:border-white/30"
                            )}
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Node Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTaskNode(t.id) }}
                            title="Delete Task Objective"
                            className="p-1.5 rounded-lg border border-white/10 text-white/20 hover:text-brand-red hover:border-brand-red/40 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Task Name Title (STABLE RENDER WITHOUT GLITCHING OR HEIGHT JUMPS) */}
                      <div className="min-h-[44px] flex items-center relative z-10 mb-2">
                        <h3 className="font-mono text-sm font-semibold tracking-wide text-white/90 line-clamp-2 leading-tight">
                          {displayTitle}
                        </h3>
                      </div>

                      {/* Meta Info: Category, Difficulty, XP, Duration */}
                      <div className="flex items-center justify-between font-mono text-[10px] text-white/50 mb-3 border-b border-white/5 pb-2 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="uppercase text-white/40">{t.category}</span>
                          <span>•</span>
                          <span className="uppercase text-white/40">{t.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-amber-300/80">
                            <Clock className="w-3 h-3" /> {meta.duration_minutes || 45}m
                          </span>
                          <span className={cn("font-bold text-xs", isTeamup ? "bg-gradient-to-r from-brand-cyan to-brand-pink bg-clip-text text-transparent font-extrabold" : isAjay ? "text-brand-cyan" : "text-brand-pink")}>
                            +{t.points} XP {isTeamup ? 'EACH' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Subtasks Checklist Section */}
                      <div className="relative z-10 mb-2">
                        <div className="flex items-center justify-between font-mono text-[9px] text-white/40 mb-1.5 uppercase tracking-wider">
                          <span>SUBTASKS ({completedSubtasksCount}/{totalSubtasks})</span>
                          {totalSubtasks > 0 && (
                            <span className={cn("font-bold", completionRatio === 1 ? "text-emerald-400" : "text-amber-300")}>
                              {Math.round(completionRatio * 100)}%
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
                          {subtasks.length === 0 ? (
                            <div className="flex items-center justify-between text-[11px] font-mono text-white/30 py-1">
                              <span>No subtasks assigned</span>
                              <button
                                onClick={() => handleToggleComplete(t.id)}
                                className="flex items-center gap-1 text-[10px] text-brand-cyan hover:underline"
                              >
                                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" /> : <Circle className="w-3.5 h-3.5" />}
                                {isCompleted ? 'COMPLETED' : 'MARK DONE'}
                              </button>
                            </div>
                          ) : (
                            subtasks.map(st => (
                              <div
                                key={st.id}
                                className="w-full flex items-center justify-between text-left p-1 rounded hover:bg-white/5 transition-colors group/sub"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleSubtask(t.id, st.id) }}
                                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                >
                                  {st.completed ? (
                                    <CheckSquare className={cn("w-3.5 h-3.5 shrink-0", isTeamup ? "text-purple-400" : isAjay ? "text-brand-cyan" : "text-brand-pink")} />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 stroke-[1.5] text-white/30 group-hover/sub:text-white/60 shrink-0" />
                                  )}
                                  <span className={cn("font-mono text-[11px] truncate", st.completed ? "line-through text-white/30" : "text-white/80")}>
                                    {st.title}
                                  </span>
                                </button>

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSubtask(t.id, st.id) }}
                                  className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-white/30 hover:text-red-400 transition-opacity ml-1 shrink-0"
                                  title="Delete Subtask"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Add Subtask Quick Input */}
                      <div className="flex items-center gap-1 relative z-10">
                        <input
                          value={inlineSubtaskInput[t.id] || ''}
                          onChange={(e) => setInlineSubtaskInput({ ...inlineSubtaskInput, [t.id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddInlineSubtask(t.id) }}
                          placeholder="+ Add subtask..."
                          className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-[10px] outline-none focus:border-white/30 text-white/80"
                        />
                        <button
                          onClick={() => handleAddInlineSubtask(t.id)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded font-mono text-[10px] text-white/70"
                        >
                          ADD
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>

      {/* Deploy New Objective Slide-over Modal */}
      <AnimatePresence>
        {isDeployOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 md:p-8 rounded-2xl max-w-lg w-full cyber-border relative shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-base tracking-widest text-white">DEPLOY_OBJECTIVE_NODE</h3>
                  <p className="font-mono text-xs text-white/40">ADD TASK TO PLAYGROUND CANVAS</p>
                </div>
                <button onClick={() => setIsDeployOpen(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-white/50 mb-1">OBJECTIVE DIRECTIVE</label>
                  <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter objective title..."
                    className={cn("w-full bg-black/60 border border-white/10 rounded-xl p-3.5 font-mono text-sm outline-none text-white", theme === 'cyan' ? "focus:border-brand-cyan" : "focus:border-brand-pink")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs text-white/50 mb-1">CATEGORY</label>
                    <select 
                      value={cat} 
                      onChange={e => {
                        setCat(e.target.value)
                        if (e.target.value === 'Teamup') setDiff('Teamup')
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 font-mono text-sm text-white/80 outline-none"
                    >
                      <option>Code</option>
                      <option>Fitness</option>
                      <option>Learning</option>
                      <option>Life</option>
                      <option>Teamup</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs text-white/50 mb-1">TIME DURATION (MINS)</label>
                    <input 
                      type="number"
                      value={durationMins}
                      onChange={e => setDurationMins(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 font-mono text-sm text-white/80 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-white/50 mb-2">DIFFICULTY & XP REWARD</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Easy', 'Medium', 'Hard', 'Teamup'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDiff(d)
                          if (d === 'Teamup') setCat('Teamup')
                        }}
                        className={cn(
                          "py-2.5 rounded-xl font-mono text-[11px] border tracking-wider transition-all",
                          diff === d 
                            ? d === 'Teamup' 
                              ? "bg-gradient-to-r from-brand-cyan/30 via-purple-600/40 to-brand-pink/30 border-purple-400 text-white font-bold shadow-[0_0_15px_rgba(233,102,255,0.4)]" 
                              : theme === 'cyan' ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold" : "bg-brand-pink/20 border-brand-pink text-brand-pink font-bold"
                            : "border-white/10 text-white/40 hover:bg-white/5"
                        )}
                      >
                        {d === 'Teamup' ? 'Teamup (300XP)' : d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtask additions */}
                <div>
                  <label className="block font-mono text-xs text-white/50 mb-1">INITIAL SUBTASKS</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={subtaskInput}
                      onChange={e => setSubtaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && subtaskInput.trim()) {
                          e.preventDefault()
                          setNewSubtasks([...newSubtasks, subtaskInput.trim()])
                          setSubtaskInput('')
                        }
                      }}
                      placeholder="Add subtask..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (subtaskInput.trim()) {
                          setNewSubtasks([...newSubtasks, subtaskInput.trim()])
                          setSubtaskInput('')
                        }
                      }}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-mono text-xs text-white"
                    >
                      Add
                    </button>
                  </div>

                  {newSubtasks.length > 0 && (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {newSubtasks.map((st, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded text-xs font-mono text-white/80">
                          <span>{st}</span>
                          <button onClick={() => setNewSubtasks(newSubtasks.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-brand-red">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-white/60 hover:bg-white/5"
                >
                  CANCEL
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleDeploySubmit}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-display text-xs font-bold tracking-widest text-black shadow-lg",
                    theme === 'cyan' ? "bg-brand-cyan shadow-[0_0_20px_rgba(129,236,255,0.4)]" : "bg-brand-pink shadow-[0_0_20px_rgba(233,102,255,0.4)]"
                  )}
                >
                  INITIATE_OBJECTIVE
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

// Simple Helper Square Icon for checkboxes
function Square({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  )
}
