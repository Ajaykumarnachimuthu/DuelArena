import { Task } from '../lib/types'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

// Hardcoded for splitting just the UI visually since history requires distinct opponent columns
const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

export function HistoryScreen({ tasks }: { tasks: Task[] }) {
  // Group all tasks by Date String
  const grouped = tasks.reduce((acc, task) => {
     const d = new Date(task.created_at).toDateString()
     if (!acc[d]) acc[d] = []
     acc[d].push(task)
     return acc
  }, {} as Record<string, Task[]>)

  const sortedDates = Object.keys(grouped).sort((a,b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="max-w-6xl mx-auto pt-8 pb-32 fade-in space-y-12">
      {sortedDates.length === 0 && (
        <div className="font-mono text-center text-white/30 text-sm py-20 tracking-widest">
          NO HISTORICAL ARCHIVES LOCATED
        </div>
      )}

      {sortedDates.map((dateStr, idx) => {
        const dayTasks = grouped[dateStr]
        const ajays = dayTasks.filter(t => t.user_id === AJAY_ID)
        const selvaas = dayTasks.filter(t => t.user_id === SELVAA_ID)
        const ajayXP = ajays.reduce((s,t) => s + t.points, 0)
        const selvaaXP = selvaas.reduce((s,t) => s + t.points, 0)

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
              <div className="font-mono text-[10px] tracking-widest px-3 py-1 bg-white/5 rounded text-white/50 border border-white/10">
                DAILY_VICTOR: {winner}
              </div>
            </div>

            {/* Split Combat Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Ajay's Daily List */}
              <div className="glass-panel p-6 border-brand-cyan/20">
                <div className="flex justify-between items-center mb-6 border-b border-brand-cyan/20 pb-4">
                   <h4 className="font-display tracking-widest text-brand-cyan text-glow-cyan text-sm">AJAY_OPS</h4>
                   <span className="font-mono text-brand-cyan px-2 py-1 bg-brand-cyan/10 rounded">{ajayXP} XP</span>
                </div>
                <div className="space-y-3">
                  {ajays.length === 0 && <div className="text-xs font-mono text-white/20">NO OPS LOGGED.</div>}
                  {ajays.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-brand-cyan/5 p-3 rounded border border-brand-cyan/10 hover:bg-brand-cyan/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-brand-cyan opacity-50" />
                        <div>
                          <div className="font-mono text-[11px] text-white/90">{t.title}</div>
                          <div className="font-mono text-[9px] text-white/40 tracking-widest">{t.category}</div>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-brand-cyan font-bold">+{t.points}</div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Selvaa's Daily List */}
               <div className="glass-panel p-6 border-brand-pink/20">
                <div className="flex justify-between items-center mb-6 border-b border-brand-pink/20 pb-4">
                   <h4 className="font-display tracking-widest text-brand-pink text-glow-pink text-sm">SELVAA_OPS</h4>
                   <span className="font-mono text-brand-pink px-2 py-1 bg-brand-pink/10 rounded">{selvaaXP} XP</span>
                </div>
                <div className="space-y-3">
                  {selvaas.length === 0 && <div className="text-xs font-mono text-white/20">NO OPS LOGGED.</div>}
                  {selvaas.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-brand-pink/5 p-3 rounded border border-brand-pink/10 hover:bg-brand-pink/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-brand-pink opacity-50" />
                        <div>
                          <div className="font-mono text-[11px] text-white/90">{t.title}</div>
                          <div className="font-mono text-[9px] text-white/40 tracking-widest">{t.category}</div>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-brand-pink font-bold">+{t.points}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )
      })}

    </div>
  )
}
