import { Task } from '../lib/types'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Dumbbell, Code, Zap, Flame, CheckCircle2 } from 'lucide-react'
import { isTaskActive, isTaskCompleted, extractTaskTitleAndMeta } from '../lib/canvasUtils'

const IC = { Fitness: Dumbbell, Code: Code, Learning: Zap, Life: Flame }

export function CyberFeed({ tasks }: { tasks: Task[] }) {
  return (
    <div className="mt-12 glass-panel p-6">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-display text-xl tracking-widest text-white">REALTIME_LOGS</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 font-mono text-xs text-white/30 tracking-widest">NO_LOGS_FOUND_IN_DATABANK</div>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 8).map((t, i) => {
            const isTeamup = t.category === 'Teamup' || t.difficulty === 'Teamup'
            const isAjay = t.user_id === 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
            const Ico = IC[t.category as keyof typeof IC] || Zap
            const active = isTaskActive(t.id, t)
            const completed = isTaskCompleted(t.id, t)

            return (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: isTeamup ? 0 : isAjay ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "group flex items-center justify-between p-3.5 border transition-colors rounded-xl cyber-border",
                  isTeamup ? "border-purple-500/30 bg-gradient-to-r from-brand-cyan/10 via-purple-950/20 to-brand-pink/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border",
                    isTeamup ? "bg-gradient-to-br from-brand-cyan/30 to-brand-pink/30 text-white border-purple-400/50 shadow-[0_0_12px_rgba(233,102,255,0.3)]" : isAjay ? "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30" : "bg-brand-pink/20 text-brand-pink border-brand-pink/30"
                  )}>
                    <Ico className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-white/90">{extractTaskTitleAndMeta(t.title).title}</div>
                    <div className="flex gap-2 items-center mt-1">
                      {isTeamup ? (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-gradient-to-r from-brand-cyan to-brand-pink bg-clip-text text-transparent">
                          AJAY + SELVAA [TEAMUP]
                        </span>
                      ) : (
                        <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", isAjay ? "text-brand-cyan" : "text-brand-pink")}>
                          {isAjay ? 'AJAY' : 'SELVAA'}
                        </span>
                      )}
                      <span className="text-white/20">•</span>
                      <span className="text-[10px] font-mono text-white/40">{new Date(t.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges: Pulsing & Shrinking ON PROGRESS vs COMPLETED */}
                <div className="flex items-center gap-3">
                  {active ? (
                    <motion.div
                      animate={{ scale: [1, 0.94, 1], opacity: [1, 0.75, 1] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                      className="px-3 py-1 rounded-lg text-xs font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                      <span>ON PROGRESS</span>
                    </motion.div>
                  ) : completed ? (
                    <div className="px-3 py-1 rounded-lg text-xs font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>COMPLETED • +{t.points} XP {isTeamup ? 'EACH' : ''}</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-lg text-xs font-mono uppercase bg-white/5 text-white/40 border border-white/10 tracking-wider">
                      STANDBY
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
