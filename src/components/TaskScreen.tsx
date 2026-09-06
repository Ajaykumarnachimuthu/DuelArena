import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, SubTask } from '../lib/types'
import { cn } from '../lib/utils'
import { 
  loadTaskPositions, saveTaskPosition, 
  loadTaskConnections, saveTaskConnections, 
  loadTaskSubtasks, saveTaskSubtasks, 
  loadTaskMeta, saveTaskMeta,
  calculateBezierPath 
} from '../lib/canvasUtils'
import { 
  Plus, Trash2, Play, CheckCircle2, Circle, Link as LinkIcon, 
  Clock, Move, ZoomIn, ZoomOut, CheckSquare, 
  Layout, Eye, Sparkles, X
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

  // Connection linking mode state: source task ID
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null)

  // Local augmented task state maps
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [connections, setConnections] = useState<Record<string, string[]>>({})
  const [subtasksMap, setSubtasksMap] = useState<Record<string, SubTask[]>>({})
  const [metaMap, setMetaMap] = useState<Record<string, { is_active?: boolean; duration_minutes?: number; start_time?: string; completed?: boolean }>>({})

  // Flashing percentage map: taskId -> percentage message (smooth in-grid cross-fade text)
  const [flashMessageMap, setFlashMessageMap] = useState<Record<string, string>>({})

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
  const [inlineSubtaskInput, setInlineSubtaskInput] = useState<Record<string, string>>({})

  // Canvas View transform
  const [zoom, setZoom] = useState(1)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Load local state maps on mount
  useEffect(() => {
    setPositions(loadTaskPositions())
    setConnections(loadTaskConnections())
    setSubtasksMap(loadTaskSubtasks())
    setMetaMap(loadTaskMeta())
  }, [])

  // Auto-assign positions for new tasks that lack positions
  useEffect(() => {
    let changed = false
    const newPositions = { ...positions }

    tasks.forEach((t, index) => {
      if (!newPositions[t.id]) {
        // Arrange in grid pattern
        const col = index % 3
        const row = Math.floor(index / 3)
        newPositions[t.id] = {
          x: 40 + col * 340,
          y: 40 + row * 260
        }
        saveTaskPosition(t.id, newPositions[t.id].x, newPositions[t.id].y)
        changed = true
      }
    })

    if (changed) {
      setPositions(newPositions)
    }
  }, [tasks])

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

    const currentSubtasks = subtasksMap[taskId] || []
    const updatedSubtasks: SubTask[] = [
      ...currentSubtasks,
      { id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), title: text, completed: false }
    ]

    const newMap = { ...subtasksMap, [taskId]: updatedSubtasks }
    setSubtasksMap(newMap)
    saveTaskSubtasks(taskId, updatedSubtasks)
    setInlineSubtaskInput({ ...inlineSubtaskInput, [taskId]: '' })

    triggerPercentageFlash(taskId, updatedSubtasks)
  }

  // Handle subtask toggle
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const currentSubtasks = subtasksMap[taskId] || []
    const updatedSubtasks = currentSubtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )

    const newMap = { ...subtasksMap, [taskId]: updatedSubtasks }
    setSubtasksMap(newMap)
    saveTaskSubtasks(taskId, updatedSubtasks)

    triggerPercentageFlash(taskId, updatedSubtasks)
  }

  // Trigger smooth in-grid percentage flash transition
  const triggerPercentageFlash = (taskId: string, subtasksList: SubTask[]) => {
    if (subtasksList.length === 0) return
    const completedCount = subtasksList.filter(s => s.completed).length
    const pct = Math.round((completedCount / subtasksList.length) * 100)

    const flashText = `${pct}% COMPLETED`
    setFlashMessageMap(prev => ({ ...prev, [taskId]: flashText }))

    // Clear flash message after 2.5 seconds with smooth cross-fade back to title
    setTimeout(() => {
      setFlashMessageMap(prev => {
        const copy = { ...prev }
        delete copy[taskId]
        return copy
      })
    }, 2500)
  }

  // Handle active status toggle ("Going On")
  const handleToggleActive = (taskId: string) => {
    const currentMeta = metaMap[taskId] || {}
    const newActiveState = !currentMeta.is_active
    const updatedMeta = { ...currentMeta, is_active: newActiveState }

    setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
    saveTaskMeta(taskId, updatedMeta)
  }

  // Handle task complete toggle (when no subtasks exist or full complete)
  const handleToggleComplete = (taskId: string) => {
    const currentMeta = metaMap[taskId] || {}
    const newComplete = !currentMeta.completed
    const updatedMeta = { ...currentMeta, completed: newComplete }

    setMetaMap(prev => ({ ...prev, [taskId]: updatedMeta }))
    saveTaskMeta(taskId, updatedMeta)

    const flashText = newComplete ? '100% COMPLETED' : 'STATUS RESET'
    setFlashMessageMap(prev => ({ ...prev, [taskId]: flashText }))

    setTimeout(() => {
      setFlashMessageMap(prev => {
        const copy = { ...prev }
        delete copy[taskId]
        return copy
      })
    }, 2500)
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

  // Filtered tasks
  const visibleTasks = tasks.filter(t => {
    if (filterUser === 'ajay') return t.user_id === AJAY_ID
    if (filterUser === 'selvaa') return t.user_id === SELVAA_ID
    return true
  })

  // Color tokens
  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-24 pt-4 fade-in">
      
      {/* Control Matrix Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 cyber-border shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* Left: Title & User Filters */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Layout className={cn("w-6 h-6", textColor)} />
            <div>
              <h2 className="text-sm font-display tracking-widest text-white">OBJECTIVES_PLAYGROUND</h2>
              <p className="text-[10px] font-mono text-white/40">INTERACTIVE TASK MAP & WHITEBOARD</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

          {/* User Filter Buttons */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setFilterUser('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                filterUser === 'all' ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
              )}
            >
              <Eye className="w-3.5 h-3.5" /> ALL ARENA
            </button>
            <button 
              onClick={() => setFilterUser('ajay')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                filterUser === 'ajay' ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 font-bold" : "text-white/40 hover:text-brand-cyan"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_8px_#81ecff]" /> AJAY
            </button>
            <button 
              onClick={() => setFilterUser('selvaa')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5",
                filterUser === 'selvaa' ? "bg-brand-pink/20 text-brand-pink border border-brand-pink/40 font-bold" : "text-white/40 hover:text-brand-pink"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-brand-pink shadow-[0_0_8px_#e966ff]" /> SELVAA
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          
          {/* Connection Link Mode Toggle */}
          <button 
            onClick={() => setConnectingSourceId(connectingSourceId ? null : 'SELECT_MODE')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-mono border transition-all flex items-center gap-2",
              connectingSourceId 
                ? "bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <LinkIcon className="w-4 h-4" />
            {connectingSourceId ? 'LINKING MODE ACTIVE' : 'CONNECT TASKS'}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-1">
            <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="p-1.5 text-white/50 hover:text-white">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] px-2 text-white/70">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.4, z + 0.1))} className="p-1.5 text-white/50 hover:text-white">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Deploy New Task Modal Trigger */}
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsDeployOpen(true)}
            className={cn(
              "px-5 py-2.5 rounded-xl font-display text-xs font-bold tracking-widest text-black flex items-center gap-2 transition-all shadow-lg",
              theme === 'cyan' ? "bg-brand-cyan shadow-[0_0_20px_rgba(129,236,255,0.5)]" : "bg-brand-pink shadow-[0_0_20px_rgba(233,102,255,0.5)]"
            )}
          >
            <Plus className="w-4 h-4 stroke-[3]" /> NEW OBJECTIVE
          </motion.button>
        </div>
      </div>

      {/* Main Canvas Whiteboard Playground Area */}
      <div 
        ref={canvasRef}
        className="relative w-full h-[680px] rounded-3xl overflow-hidden blueprint-grid border border-white/10 bg-black/90 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]"
      >
        
        {/* Canvas Background Info Overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-3 font-mono text-[11px] text-white/30 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
          <Move className="w-3.5 h-3.5 text-brand-cyan" />
          <span>DRAG CARDS ANYWHERE // PERSISTENT CANVAS POSITIONS</span>
        </div>

        {connectingSourceId && (
          <div className="absolute top-4 right-4 z-10 font-mono text-xs text-amber-300 bg-amber-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/40 animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {connectingSourceId === 'SELECT_MODE' 
              ? 'Click a source task node, then click target node to draw connection flowline.'
              : 'Select target node to link flowline, or click again to cancel.'}
          </div>
        )}

        {/* SVG Flowline Layer for Task Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
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
            const sourcePos = positions[t.id] || { x: 40, y: 40 }
            const sourceOwnerIsAjay = t.user_id === AJAY_ID

            // Node box dimensions: width ~ 300px, height ~ 180px
            const sourceCenterX = (sourcePos.x + 150) * zoom
            const sourceCenterY = (sourcePos.y + 90) * zoom

            return targets.map(targetId => {
              const targetTask = tasks.find(x => x.id === targetId)
              if (!targetTask) return null

              const targetPos = positions[targetId] || { x: 40, y: 40 }
              const targetCenterX = (targetPos.x + 150) * zoom
              const targetCenterY = (targetPos.y + 90) * zoom

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

        {/* Task Cards Node Grid Canvas */}
        <div 
          className="w-full h-full relative"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.15s ease-out' }}
        >
          {visibleTasks.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
              <Layout className="w-12 h-12 text-white/20 mb-3" />
              <p className="font-mono text-sm text-white/40">NO OBJECTIVES FOUND ON CANVAS</p>
              <p className="font-mono text-xs text-white/20 mt-1">Click "NEW OBJECTIVE" to deploy a task to the playground.</p>
            </div>
          ) : (
            visibleTasks.map(t => {
              const pos = positions[t.id] || { x: 40, y: 40 }
              const isAjay = t.user_id === AJAY_ID
              const cardThemeColor = isAjay ? '#81ecff' : '#e966ff'
              const cardBorderClass = isAjay ? 'border-brand-cyan/40' : 'border-brand-pink/40'
              const cardGlowClass = isAjay ? 'shadow-[0_0_25px_rgba(129,236,255,0.15)]' : 'shadow-[0_0_25px_rgba(233,102,255,0.15)]'
              const cardPillBg = isAjay ? 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30' : 'bg-brand-pink/15 text-brand-pink border-brand-pink/30'

              const subtasks = subtasksMap[t.id] || []
              const meta = metaMap[t.id] || {}
              const isActive = meta.is_active || false
              const isCompleted = meta.completed || false

              const completedSubtasksCount = subtasks.filter(st => st.completed).length
              const totalSubtasks = subtasks.length

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

              const flashText = flashMessageMap[t.id]

              const isSourceInConnecting = connectingSourceId === t.id

              return (
                <motion.div
                  key={t.id}
                  drag
                  dragMomentum={false}
                  initial={{ x: pos.x, y: pos.y }}
                  animate={{ x: pos.x, y: pos.y }}
                  onDragEnd={(_, info) => {
                    const newX = Math.max(10, pos.x + info.offset.x)
                    const newY = Math.max(10, pos.y + info.offset.y)
                    handleDragEnd(t.id, newX, newY)
                  }}
                  className="absolute cursor-grab active:cursor-grabbing z-10 group"
                  style={{ width: cardWidth }}
                >
                  {/* Rotating Active Border Wrapper if Task is "Going On" */}
                  <div 
                    className={cn(
                      isActive ? "active-rotating-container" : ""
                    )}
                    style={{ '--active-color': cardThemeColor } as React.CSSProperties}
                  >
                    <div className={cn(
                      "active-rotating-content relative glass-panel p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300",
                      cardBorderClass,
                      cardGlowClass,
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
                          stroke={cardThemeColor}
                          strokeWidth="3"
                          strokeDasharray={perimeter}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease',
                            filter: completionRatio > 0 ? `drop-shadow(0 0 8px ${cardThemeColor})` : 'none'
                          }}
                        />
                      </svg>

                      {/* Card Header: Owner Badge & Active/Connect Controls */}
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-bold", cardPillBg)}>
                            {isAjay ? 'AJAY' : 'SELVAA'}
                          </span>

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

                      {/* Task Name Title with Smooth In-Grid Flash Percentage Replacement */}
                      <div className="min-h-[44px] flex items-center relative z-10 mb-2">
                        <AnimatePresence mode="wait">
                          {flashText ? (
                            <motion.div
                              key="flash"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              transition={{ duration: 0.25 }}
                              className={cn(
                                "w-full py-1 px-2.5 rounded-lg border font-mono text-xs font-bold tracking-widest text-center shadow-lg",
                                isAjay 
                                  ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan text-glow-cyan" 
                                  : "bg-brand-pink/20 border-brand-pink text-brand-pink text-glow-pink"
                              )}
                            >
                              ⚡ {flashText}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="title"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              transition={{ duration: 0.25 }}
                              className="font-mono text-sm font-semibold tracking-wide text-white/90 line-clamp-2"
                            >
                              {t.title}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                          <span className={cn("font-bold text-xs", isAjay ? "text-brand-cyan" : "text-brand-pink")}>
                            +{t.points} XP
                          </span>
                        </div>
                      </div>

                      {/* Subtasks Checklist Section */}
                      <div className="space-y-1.5 max-h-[85px] overflow-y-auto hide-scrollbar relative z-10 mb-2">
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
                            <button
                              key={st.id}
                              onClick={(e) => { e.stopPropagation(); handleToggleSubtask(t.id, st.id) }}
                              className="w-full flex items-center justify-between text-left p-1 rounded hover:bg-white/5 transition-colors group/sub"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {st.completed ? (
                                  <CheckSquare className={cn("w-3.5 h-3.5 shrink-0", isAjay ? "text-brand-cyan" : "text-brand-pink")} />
                                ) : (
                                  <Square className="w-3.5 h-3.5 stroke-[1.5] text-white/30 group-hover/sub:text-white/60 shrink-0" />
                                )}
                                <span className={cn("font-mono text-[11px] truncate", st.completed ? "line-through text-white/30" : "text-white/80")}>
                                  {st.title}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
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
                      onChange={e => setCat(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 font-mono text-sm text-white/80 outline-none"
                    >
                      <option>Code</option>
                      <option>Fitness</option>
                      <option>Learning</option>
                      <option>Life</option>
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
                  <div className="grid grid-cols-3 gap-3">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiff(d)}
                        className={cn(
                          "py-2.5 rounded-xl font-mono text-xs border tracking-wider transition-all",
                          diff === d 
                            ? theme === 'cyan' ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold" : "bg-brand-pink/20 border-brand-pink text-brand-pink font-bold"
                            : "border-white/10 text-white/40 hover:bg-white/5"
                        )}
                      >
                        {d}
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
