import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EventItem } from '../lib/types'
import { cn } from '../lib/utils'
import { 
  Calendar, Link as LinkIcon, ExternalLink, Plus, 
  Trash2, Clock, Sparkles, Filter, X, CheckCircle2, Square 
} from 'lucide-react'

const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

interface EventsScreenProps {
  events: EventItem[]
  onSubmit: (title: string, deadline: string, link?: string, category?: string, userId?: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  theme: 'cyan' | 'pink'
  currentUser?: string
}

export function EventsScreen({ events, onSubmit, onToggle, onDelete, theme, currentUser }: EventsScreenProps) {
  const [isDeployOpen, setIsDeployOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [category, setCategory] = useState('Code')
  const [targetUser, setTargetUser] = useState(currentUser || AJAY_ID)
  
  // Default deadline to current date YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0]
  const [deadline, setDeadline] = useState(todayDateStr)

  // Filter tab state
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'ajay' | 'selvaa'>('all')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let formattedLink = link.trim()
    if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`
    }

    onSubmit(title, deadline, formattedLink || undefined, category, targetUser)
    setTitle('')
    setLink('')
    setDeadline(todayDateStr)
    setIsDeployOpen(false)
  }

  // Filtered Events
  const filteredEvents = events.filter(ev => {
    const isTeamup = ev.category === 'Teamup'
    if (filter === 'pending') return !ev.completed
    if (filter === 'completed') return ev.completed
    if (filter === 'ajay') return ev.user_id === AJAY_ID || isTeamup
    if (filter === 'selvaa') return ev.user_id === SELVAA_ID || isTeamup
    return true
  })

  // Urgency helper
  const getDeadlineStatus = (deadlineStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(deadlineStr)
    target.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `OVERDUE BY ${Math.abs(diffDays)} DAYS`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
    if (diffDays === 0) return { text: 'DUE TODAY', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse' }
    if (diffDays === 1) return { text: 'DUE TOMORROW', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' }
    return { text: `DUE IN ${diffDays} DAYS`, color: 'text-brand-cyan/80 bg-brand-cyan/10 border-brand-cyan/20' }
  }

  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const glowText = theme === 'cyan' ? 'text-glow-cyan' : 'text-glow-pink'

  return (
    <div className="max-w-6xl mx-auto w-full pb-28 fade-in">
      {/* Header Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className={cn("w-6 h-6", textColor)} />
            <h1 className={cn("font-display font-bold tracking-widest text-xl sm:text-2xl uppercase", glowText)}>
              EVENT_DIRECTIVES
            </h1>
          </div>
          <p className="font-mono text-xs text-white/50">
            PERMANENT EVENT REGISTRATION // DEADLINES & SPECIFIC RESOURCES (NEVER EXPIRES IN 24H)
          </p>
        </div>

        <button
          onClick={() => setIsDeployOpen(true)}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shrink-0",
            theme === 'cyan'
              ? "bg-brand-cyan text-black hover:bg-brand-cyan/90 shadow-[0_0_20px_rgba(129,236,255,0.4)]"
              : "bg-brand-pink text-black hover:bg-brand-pink/90 shadow-[0_0_20px_rgba(233,102,255,0.4)]"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER NEW EVENT</span>
        </button>
      </div>

      {/* Filter Matrix Bar */}
      <div className="glass-panel p-3 rounded-xl mb-6 flex flex-wrap items-center justify-between gap-3 border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-white/40 mr-1 shrink-0" />
          {(['all', 'pending', 'completed', 'ajay', 'selvaa'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                filter === f
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {f === 'all' ? 'ALL EVENTS' : f === 'pending' ? 'UPCOMING' : f === 'completed' ? 'REGISTERED' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="font-mono text-[11px] text-white/40">
          TOTAL_EVENTS: <span className="text-white font-bold">{events.length}</span>
        </div>
      </div>

      {/* Deploy Event Modal */}
      <AnimatePresence>
        {isDeployOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/20 shadow-2xl relative"
            >
              <button
                onClick={() => setIsDeployOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className={cn("w-5 h-5", textColor)} />
                <h3 className="font-display font-bold text-lg text-white tracking-wider">REGISTER EVENT DIRECTIVE</h3>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-white/60 mb-1 uppercase tracking-wider">Event Objective Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Hackathon Final Presentation, Exam Registration..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1 uppercase tracking-wider">Specific Link / URL (Optional)</label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-white/30" />
                    <input
                      type="text"
                      value={link}
                      onChange={e => setLink(e.target.value)}
                      placeholder="e.g. https://meet.google.com/xyz or https://portal.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand-cyan transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1 uppercase tracking-wider">Deadline Date (Calendar) *</label>
                    <input
                      type="date"
                      required
                      min={todayDateStr}
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1 uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-cyan transition-colors"
                    >
                      <option value="Code" className="bg-neutral-900">Code</option>
                      <option value="Learning" className="bg-neutral-900">Learning</option>
                      <option value="Fitness" className="bg-neutral-900">Fitness</option>
                      <option value="Life" className="bg-neutral-900">Life</option>
                      <option value="Teamup" className="bg-neutral-900">Teamup Objective</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 mb-1 uppercase tracking-wider">Assigned Player</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetUser(AJAY_ID)}
                      className={cn(
                        "py-2.5 rounded-xl border text-center font-bold transition-all",
                        targetUser === AJAY_ID
                          ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan"
                          : "bg-white/5 border-white/10 text-white/40"
                      )}
                    >
                      AJAY
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetUser(SELVAA_ID)}
                      className={cn(
                        "py-2.5 rounded-xl border text-center font-bold transition-all",
                        targetUser === SELVAA_ID
                          ? "bg-brand-pink/20 border-brand-pink text-brand-pink"
                          : "bg-white/5 border-white/10 text-white/40"
                      )}
                    >
                      SELVAA
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetUser(AJAY_ID); setCategory('Teamup'); }}
                      className={cn(
                        "py-2.5 rounded-xl border text-center font-bold transition-all",
                        category === 'Teamup'
                          ? "bg-gradient-to-r from-brand-cyan/20 to-brand-pink/20 border-purple-400 text-white"
                          : "bg-white/5 border-white/10 text-white/40"
                      )}
                    >
                      TEAMUP
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-black transition-all shadow-lg mt-2",
                    theme === 'cyan' ? "bg-brand-cyan hover:bg-brand-cyan/90" : "bg-brand-pink hover:bg-brand-pink/90"
                  )}
                >
                  SAVE EVENT DIRECTIVE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Events List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center rounded-2xl border border-white/5">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="font-mono text-sm text-white/40">NO EVENT DIRECTIVES FOUND</p>
            <p className="font-mono text-xs text-white/20 mt-1">
              Click "REGISTER NEW EVENT" to schedule permanent deadlines & attach specific resource links.
            </p>
          </div>
        ) : (
          filteredEvents.map(ev => {
            const isTeamup = ev.category === 'Teamup'
            const isAjay = ev.user_id === AJAY_ID
            const urgency = getDeadlineStatus(ev.deadline)

            const borderClass = ev.completed
              ? (isTeamup ? "border-purple-400/60 bg-gradient-to-r from-brand-cyan/10 via-purple-950/20 to-brand-pink/10" : isAjay ? "border-brand-cyan/50 bg-brand-cyan/5" : "border-brand-pink/50 bg-brand-pink/5")
              : (isTeamup ? "border-purple-400/30 bg-white/[0.02]" : isAjay ? "border-brand-cyan/30 bg-white/[0.02]" : "border-brand-pink/30 bg-white/[0.02]")

            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "glass-panel p-5 rounded-2xl border transition-all duration-300 relative group flex flex-col justify-between",
                  borderClass,
                  ev.completed ? "opacity-80" : "hover:border-white/30"
                )}
              >
                <div>
                  {/* Card Header: Owner Badge & Urgency Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isTeamup ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-extrabold bg-gradient-to-r from-brand-cyan/20 to-brand-pink/20 text-white border-purple-400/40">
                          AJAY + SELVAA [TEAMUP]
                        </span>
                      ) : (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-bold",
                          isAjay ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30" : "bg-brand-pink/15 text-brand-pink border-brand-pink/30"
                        )}>
                          {isAjay ? 'AJAY' : 'SELVAA'}
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-white/30 uppercase">{ev.category || 'Event'}</span>
                    </div>

                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border", urgency.color)}>
                      {urgency.text}
                    </span>
                  </div>

                  {/* Title & Link */}
                  <div className="mb-4">
                    <h4 className={cn(
                      "font-mono text-base font-bold text-white tracking-wide mb-1",
                      ev.completed && "line-through text-white/40"
                    )}>
                      {ev.title}
                    </h4>

                    {ev.link && (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-cyan hover:underline bg-brand-cyan/10 px-2.5 py-1 rounded-lg border border-brand-cyan/20 mt-1 transition-colors group/link"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-brand-cyan group-hover/link:scale-110 transition-transform" />
                        <span className="truncate max-w-[240px] sm:max-w-[300px]">{ev.link}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Registered Checkbox & Delete */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                  <button
                    onClick={() => onToggle(ev.id)}
                    className="flex items-center gap-2 font-mono text-xs font-bold transition-colors"
                  >
                    {ev.completed ? (
                      <span className={cn("flex items-center gap-1.5", isTeamup ? "text-purple-300" : isAjay ? "text-brand-cyan" : "text-brand-pink")}>
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                        <span>REGISTERED / DONE</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-white/50 hover:text-white">
                        <Square className="w-4 h-4 stroke-[1.5]" />
                        <span>MARK REGISTERED</span>
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/30">
                      <Clock className="w-3 h-3 inline mr-1 opacity-60" />
                      {new Date(ev.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <button
                      onClick={() => onDelete(ev.id)}
                      className="p-1 text-white/30 hover:text-rose-400 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
