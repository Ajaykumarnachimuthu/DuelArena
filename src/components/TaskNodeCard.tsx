import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Task, SubTask } from '../lib/types'
import { TaskMeta, extractTaskTitleAndMeta } from '../lib/canvasUtils'
import { cn } from '../lib/utils'
import { 
  Trash2, Play, CheckCircle2, Circle, Link as LinkIcon, 
  Clock, CheckSquare, Sparkles, X, Maximize2, RotateCcw, Archive
} from 'lucide-react'
import { HoverMarqueeText } from './HoverMarqueeText'


const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'

interface TaskNodeCardProps {
  task: Task
  pos: { x: number; y: number }
  zoom?: number
  isNewlyCreated: boolean
  isSourceInConnecting: boolean
  isArchived?: boolean
  onRetrieve?: () => void
  subtasks: SubTask[]
  meta: TaskMeta
  inlineSubtaskInput: string
  onInlineSubtaskChange: (text: string) => void
  onAddInlineSubtask: () => void
  onToggleSubtask: (subtaskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  onToggleActive: () => void
  onToggleComplete: () => void
  onNodeConnectClick: () => void
  onDeleteTaskNode: () => void
  onDrag: (info: { offset: { x: number; y: number } }) => void
  onDragEnd: (info: { offset: { x: number; y: number } }) => void
  onExpand?: () => void
}

export const TaskNodeCard = memo(function TaskNodeCard({
  task,
  pos,
  zoom = 1,
  isNewlyCreated,
  isSourceInConnecting,
  isArchived,
  onRetrieve,
  subtasks,
  meta,
  inlineSubtaskInput,
  onInlineSubtaskChange,
  onAddInlineSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onToggleActive,
  onToggleComplete,
  onNodeConnectClick,
  onDeleteTaskNode,
  onDrag,
  onDragEnd,
  onExpand
}: TaskNodeCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [isDraggingCard, setIsDraggingCard] = useState(false)

  useEffect(() => {
    x.set(0)
    y.set(0)
  }, [pos.x, pos.y])

  const { title: displayTitle } = extractTaskTitleAndMeta(task.title)
  const isTeamup = task.category === 'Teamup' || task.difficulty === 'Teamup'
  const isAjay = task.user_id === AJAY_ID
  const cardThemeColor = isTeamup ? '#e966ff' : isAjay ? '#81ecff' : '#e966ff'
  const cardBorderClass = isTeamup 
    ? 'border-purple-400/60 bg-gradient-to-br from-brand-cyan/10 via-purple-950/20 to-brand-pink/10' 
    : isAjay ? 'border-brand-cyan/40 bg-brand-cyan/10' : 'border-brand-pink/40 bg-brand-pink/10'
  const cardGlowClass = isTeamup 
    ? 'shadow-[0_0_30px_rgba(233,102,255,0.25)] shadow-[0_0_30px_rgba(129,236,255,0.25)]' 
    : isAjay ? 'shadow-[0_0_25px_rgba(129,236,255,0.15)]' : 'shadow-[0_0_25px_rgba(233,102,255,0.15)]'
  const cardPillBg = isAjay ? 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30' : 'bg-brand-pink/15 text-brand-pink border-brand-pink/30'

  const completedSubtasksCount = subtasks.filter(st => st.completed).length
  const totalSubtasks = subtasks.length

  const isCompleted = meta.completed || (totalSubtasks > 0 && completedSubtasksCount === totalSubtasks)
  const isActive = !isCompleted && (meta.is_active || false)

  let completionRatio = 0
  if (totalSubtasks > 0) {
    completionRatio = completedSubtasksCount / totalSubtasks
  } else if (isCompleted) {
    completionRatio = 1
  }

  const progressBorderColor = isTeamup 
    ? '#e966ff' 
    : isAjay 
      ? '#81ecff' 
      : '#e966ff'

  const completedBorderClass = isTeamup
    ? 'border-purple-400/80 bg-purple-950/20 shadow-[0_0_30px_rgba(233,102,255,0.35)]'
    : isAjay
      ? 'border-brand-cyan/70 bg-brand-cyan/15 shadow-[0_0_30px_rgba(129,236,255,0.35)]'
      : 'border-brand-pink/70 bg-brand-pink/15 shadow-[0_0_30px_rgba(233,102,255,0.35)]'
  const cardWidth = 300

  return (
    <motion.div
      key={task.id}
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ scale: isNewlyCreated ? 0.95 : 1 }}
      animate={{ scale: 1 }}
      onDragStart={() => setIsDraggingCard(true)}
      onDrag={(_, info) => {
        const deltaCanvasX = info.delta.x / zoom
        const deltaCanvasY = info.delta.y / zoom
        const newX = x.get() + deltaCanvasX
        const newY = y.get() + deltaCanvasY
        x.set(newX)
        y.set(newY)
        onDrag({ offset: { x: newX, y: newY } })
      }}
      onDragEnd={() => {
        setIsDraggingCard(false)
        const finalDx = x.get()
        const finalDy = y.get()
        onDragEnd({ offset: { x: finalDx, y: finalDy } })
      }}
      className={cn("absolute cursor-grab active:cursor-grabbing group transition-shadow", isDraggingCard ? "z-50 shadow-[0_0_40px_rgba(129,236,255,0.6)]" : "z-10")}
      style={{ left: pos.x, top: pos.y, width: cardWidth, x, y }}
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

      {/* Rotating Active Border Wrapper if Task is "Going On" */}
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
        <div 
          onDoubleClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('.subtask-scroll-area')) {
              return
            }
            if (onExpand) onExpand()
          }}
          className={cn(
            "active-rotating-content relative glass-panel p-4 rounded-xl border backdrop-blur-2xl transition-all duration-300",
            isCompleted ? completedBorderClass : cardBorderClass,
            isCompleted ? "" : cardGlowClass,
            isSourceInConnecting ? "ring-2 ring-amber-400 border-amber-400" : ""
          )}
        >
          
          {/* SVG Circumference Progress Overlay around card border when subtasks/task completed */}
          {completionRatio > 0 && (
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
                stroke={progressBorderColor}
                strokeWidth="3"
                pathLength="100"
                strokeDasharray={completionRatio < 1 ? "100" : "none"}
                strokeDashoffset={completionRatio < 1 ? 100 * (1 - completionRatio) : 0}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.3s ease',
                  filter: `drop-shadow(0 0 10px ${progressBorderColor})`
                }}
              />
            </svg>
          )}

          {/* Card Header: Owner Badge & Action Buttons */}
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

              {isActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" /> GOING ON
                </span>
              )}

              {isArchived && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                  <Archive className="w-3 h-3 text-purple-400" /> ARCHIVED
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {isArchived && onRetrieve && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRetrieve() }}
                  title="Retrieve this archived objective to today's active canvas"
                  className="px-2 py-1 rounded-lg bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/50 text-[10px] font-mono font-bold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(129,236,255,0.25)]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RETRIEVE</span>
                </button>
              )}

              {onExpand && (
                <button
                  onClick={(e) => { e.stopPropagation(); onExpand() }}
                  title="Expand / Pop up Task Objective"
                  className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-brand-cyan hover:border-brand-cyan/40 transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); onToggleActive() }}
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

              <button
                onClick={(e) => { e.stopPropagation(); onNodeConnectClick() }}
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

              <button
                onClick={(e) => { e.stopPropagation(); onDeleteTaskNode() }}
                title="Delete Task Objective"
                className="p-1.5 rounded-lg border border-white/10 text-white/20 hover:text-brand-red hover:border-brand-red/40 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Task Name Title */}
          <div className="min-h-[44px] flex items-center relative z-10 mb-2">
            <h3 className="font-mono text-sm font-semibold tracking-wide text-white/90 line-clamp-2 leading-tight">
              {displayTitle}
            </h3>
          </div>

          {/* Meta Info: Category, Difficulty, XP, Duration */}
          <div className="flex items-center justify-between font-mono text-[10px] text-white/50 mb-3 border-b border-white/5 pb-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="uppercase text-white/40">{task.category}</span>
              <span>•</span>
              <span className="uppercase text-white/40">{task.difficulty}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-300/80">
                <Clock className="w-3 h-3" /> {meta.duration_minutes || 45}m
              </span>
              <span className={cn("font-bold text-xs", isTeamup ? "bg-gradient-to-r from-brand-cyan to-brand-pink bg-clip-text text-transparent font-extrabold" : isAjay ? "text-brand-cyan" : "text-brand-pink")}>
                +{task.points} XP {isTeamup ? 'EACH' : ''}
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

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 subtask-scroll-area" style={{ touchAction: 'pan-y' }}>
              {subtasks.length === 0 ? (
                <div className="flex items-center justify-between text-[11px] font-mono text-white/30 py-1">
                  <span>No subtasks assigned</span>
                  <button
                    onClick={() => onToggleComplete()}
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
                      onClick={(e) => { e.stopPropagation(); onToggleSubtask(st.id) }}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      {st.completed ? (
                        <CheckSquare className={cn("w-3.5 h-3.5 shrink-0", isTeamup ? "text-purple-400" : isAjay ? "text-brand-cyan" : "text-brand-pink")} />
                      ) : (
                        <Square className="w-3.5 h-3.5 stroke-[1.5] text-white/30 group-hover/sub:text-white/60 shrink-0" />
                      )}
                      <HoverMarqueeText
                        text={st.title}
                        className={cn("font-mono text-[11px]", st.completed ? "line-through text-white/30" : "text-white/80")}
                      />

                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSubtask(st.id) }}
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
              value={inlineSubtaskInput || ''}
              onChange={(e) => onInlineSubtaskChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddInlineSubtask() }}
              placeholder="+ Add subtask..."
              className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 font-mono text-[10px] outline-none focus:border-white/30 text-white/80"
            />
            <button
              onClick={() => onAddInlineSubtask()}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded font-mono text-[10px] text-white/70"
            >
              ADD
            </button>
          </div>

          {/* Bottom Archived Bar with Restore CTA */}
          {isArchived && onRetrieve && (
            <div className="mt-3 pt-2.5 border-t border-white/10 relative z-10 flex items-center justify-between">
              <span className="font-mono text-[9px] text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3 text-white/30" /> {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRetrieve() }}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-brand-cyan/20 to-blue-500/20 hover:from-brand-cyan/30 hover:to-blue-500/30 text-brand-cyan border border-brand-cyan/50 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(129,236,255,0.25)] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-brand-cyan" />
                <span>RESTORE TO TODAY</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  )
})

function Square({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  )
}
