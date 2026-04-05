import { Task } from '../lib/types'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Dumbbell, Code, Zap, Flame } from 'lucide-react'

const IC = { Fitness: Dumbbell, Code: Code, Learning: Zap, Life: Flame }

export function CyberFeed({ tasks }: { tasks: Task[] }) {
  return (
    <div className="mt-12 glass-panel p-6">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="font-display text-xl tracking-widest">REALTIME_LOGS</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 font-mono text-xs text-white/30 tracking-widest">NO_LOGS_FOUND_IN_DATABANK</div>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 8).map((t, i) => {
            const isAjay = t.user_id === 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
            const Ico = IC[t.category as keyof typeof IC] || Zap
            return (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: isAjay ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-lg cyber-border"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isAjay ? "bg-brand-cyan/20 text-brand-cyan" : "bg-brand-pink/20 text-brand-pink"
                  )}>
                    <Ico className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-white/90">{t.title}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <span className={cn("text-[10px] uppercase tracking-widest", isAjay ? "text-brand-cyan" : "text-brand-pink")}>
                        {isAjay ? 'AJAY' : 'SELVAA'}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-[10px] font-mono text-white/40">{new Date(t.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-glow-cyan text-white">
                  +{t.points}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
