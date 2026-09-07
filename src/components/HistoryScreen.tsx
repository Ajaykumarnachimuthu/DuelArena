import { Task } from '../lib/types'
import { motion } from 'framer-motion'
import { Zap, CheckCircle2 } from 'lucide-react'
import { isTaskActive, isTaskCompleted, extractTaskTitleAndMeta } from '../lib/canvasUtils'

// Hardcoded for splitting just the UI visually since history requires distinct opponent columns
const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

import { useState } from 'react'

export function HistoryScreen({ tasks }: { tasks: Task[] }) {
  // Mobile filter state: 'all' | 'ajay' | 'selvaa'
  const [mobileFilter, setMobileFilter] = useState<'all' | 'ajay' | 'selvaa'>('all')

  // Group all tasks by Date String
  const grouped = tasks.reduce((acc, task) => {
     const d = new Date(task.created_at).toDateString()
     if (!acc[d]) acc[d] = []
     acc[d].push(task)
     return acc
  }, {} as Record<string, Task[]>)

  const sortedDates = Object.keys(grouped).sort((a,b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="max-w-6xl mx-auto pt-4 md:pt-8 pb-32 fade-in space-y-8">
      
      {/* Mobile Filter Tabs (Visible on small viewports) */}
      <div className="flex md:hidden items-center justify-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10">
        <button
          onClick={() => setMobileFilter('all')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all ${mobileFilter === 'all' ? 'bg-white/15 text-white' : 'text-white/40'}`}
        >
          ALL HISTORY
        </button>
        <button
          onClick={() => setMobileFilter('ajay')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all ${mobileFilter === 'ajay' ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40' : 'text-white/40'}`}
        >
          AJAY
        </button>
        <button
          onClick={() => setMobileFilter('selvaa')}
          className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all ${mobileFilter === 'selvaa' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : 'text-white/40'}`}
        >
          SELVAA
        </button>
      </div>
      {sortedDates.length === 0 && (
        <div className="font-mono text-center text-white/30 text-sm py-20 tracking-widest">
          NO HISTORICAL ARCHIVES LOCATED
        </div>
      )}

      {sortedDates.map((dateStr, idx) => {
        const isTeamup = (t: Task) => t.category === 'Teamup' || t.difficulty === 'Teamup'
        const dayTasks = grouped[dateStr]
        const ajays = dayTasks.filter(t => t.user_id === AJAY_ID || isTeamup(t))
        const selvaas = dayTasks.filter(t => t.user_id === SELVAA_ID || isTeamup(t))
        const ajayXP = ajays.filter(t => isTaskCompleted(t.id)).reduce((s,t) => s + t.points, 0)
        const selvaaXP = selvaas.filter(t => isTaskCompleted(t.id)).reduce((s,t) => s + t.points, 0)

        const winner = ajayXP > selvaaXP ? 'AJAY' : selvaaXP > ajayXP ? 'SELVAA' : 'DRAW'

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={dateStr} 
            className="space-y-6"
          >
            {/* Header Plate for the Date */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="font-display tracking-[0.3em] font-bold text-white/70">{dateStr.toUpperCase()}</div>
              <div className="h-[1px] flex-1 bg-white/5" />
              <div className="font-mono text-xs tracking-widest px-3 py-1 bg-white/5 rounded-lg text-white/70 border border-white/10 font-bold">
                DAILY_VICTOR: <span className="text-amber-400 font-extrabold">{winner}</span>
              </div>
            </div>

            {/* Split Combat Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Ajay's Daily List */}
              {(mobileFilter === 'all' || mobileFilter === 'ajay') && (
                <div className="glass-panel p-6 border-brand-cyan/20">
                  <div className="flex justify-between items-center mb-6 border-b border-brand-cyan/20 pb-4">
                     <h4 className="font-display tracking-widest text-brand-cyan text-glow-cyan text-sm">AJAY_OPS</h4>
                     <span className="font-mono text-brand-cyan font-bold px-2.5 py-1 bg-brand-cyan/10 rounded-lg">{ajayXP} XP</span>
                  </div>
                  <div className="space-y-3">
                    {ajays.length === 0 && <div className="text-xs font-mono text-white/20">NO OPS LOGGED.</div>}
                    {ajays.map(t => {
                      const active = isTaskActive(t.id)
                      const completed = isTaskCompleted(t.id)
                      return (
                        <div key={t.id} className="flex justify-between items-center bg-brand-cyan/5 p-3.5 rounded-xl border border-brand-cyan/10 hover:bg-brand-cyan/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-brand-cyan opacity-70 shrink-0" />
                            <div>
                              <div className="font-mono text-xs font-bold text-white/90">{extractTaskTitleAndMeta(t.title).title}</div>
                              <div className="font-mono text-[10px] text-white/40 tracking-widest mt-0.5">{t.category}</div>
                            </div>
                          </div>

                          {/* Status Badge: Pulsing & Shrinking ON PROGRESS vs COMPLETED */}
                          {active ? (
                            <motion.div
                              animate={{ scale: [1, 0.94, 1], opacity: [1, 0.75, 1] }}
                              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                              className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1 shrink-0"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              <span>ON PROGRESS</span>
                            </motion.div>
                          ) : completed ? (
                            <div className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>DONE • +{t.points} XP</span>
                            </div>
                          ) : (
                            <div className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-white/40 border border-white/10 shrink-0">
                              STANDBY
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

               {/* Selvaa's Daily List */}
               {(mobileFilter === 'all' || mobileFilter === 'selvaa') && (
                <div className="glass-panel p-6 border-brand-pink/20">
                  <div className="flex justify-between items-center mb-6 border-b border-brand-pink/20 pb-4">
                     <h4 className="font-display tracking-widest text-brand-pink text-glow-pink text-sm">SELVAA_OPS</h4>
                     <span className="font-mono text-brand-pink font-bold px-2.5 py-1 bg-brand-pink/10 rounded-lg">{selvaaXP} XP</span>
                  </div>
                <div className="space-y-3">
                  {selvaas.length === 0 && <div className="text-xs font-mono text-white/20">NO OPS LOGGED.</div>}
                  {selvaas.map(t => {
                    const active = isTaskActive(t.id)
                    const completed = isTaskCompleted(t.id)
                    return (
                      <div key={t.id} className="flex justify-between items-center bg-brand-pink/5 p-3.5 rounded-xl border border-brand-pink/10 hover:bg-brand-pink/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-brand-pink opacity-70 shrink-0" />
                          <div>
                            <div className="font-mono text-xs font-bold text-white/90">{extractTaskTitleAndMeta(t.title).title}</div>
                            <div className="font-mono text-[10px] text-white/40 tracking-widest mt-0.5">{t.category}</div>
                          </div>
                        </div>

                        {/* Status Badge: Pulsing & Shrinking ON PROGRESS vs COMPLETED */}
                        {active ? (
                          <motion.div
                            animate={{ scale: [1, 0.94, 1], opacity: [1, 0.75, 1] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                            className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1 shrink-0"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>ON PROGRESS</span>
                          </motion.div>
                        ) : completed ? (
                          <div className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>DONE • +{t.points} XP</span>
                          </div>
                        ) : (
                          <div className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-white/40 border border-white/10 shrink-0">
                            STANDBY
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              )}

            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
