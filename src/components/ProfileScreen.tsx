import { motion } from 'framer-motion'
import { Task, getRank, getLevelNumber } from '../lib/types'
import { cn } from '../lib/utils'
import { UserCircle2, Zap } from 'lucide-react'

// Hardcoded user maps
const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'

interface ProfileProps {
  tasks: Task[]
  currentUser: string
  points: number
}

export function ProfileScreen({ tasks, currentUser, points }: ProfileProps) {
  const isAjay = currentUser === AJAY_ID
  const name = isAjay ? 'AJAY' : 'SELVAA'
  const theme = isAjay ? 'cyan' : 'pink'
  
  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const glowText = theme === 'cyan' ? 'text-glow-cyan' : 'text-glow-pink'
  const bgColor = theme === 'cyan' ? 'bg-brand-cyan' : 'bg-brand-pink'
  const borderCol = theme === 'cyan' ? 'border-brand-cyan' : 'border-brand-pink'
  const shadowGlow = theme === 'cyan' ? 'shadow-[0_0_30px_rgba(129,236,255,0.3)]' : 'shadow-[0_0_30px_rgba(233,102,255,0.3)]'

  const userTasks = tasks.filter(t => t.user_id === currentUser)
  
  // Category mapping
  const cats = userTasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const rank = getRank(points)
  const level = getLevelNumber(points)

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-32 fade-in transition-colors duration-1000">
      
      {/* Upper Data Slate */}
      <div className={cn("glass-panel p-8 md:p-12 border flex flex-col md:flex-row items-center gap-12 transition-colors duration-1000", `${borderCol}/30`, shadowGlow)}>
         
         {/* Avatar Chamber */}
         <div className="relative">
           <div className={cn("absolute inset-0 blur-[60px] opacity-40 rounded-full transition-colors duration-1000", bgColor)} />
           <div className={cn("relative w-40 h-40 rounded-full border-[3px] flex items-center justify-center bg-black/60 backdrop-blur-xl transition-colors duration-1000", borderCol)}>
             <UserCircle2 className={cn("w-20 h-20 transition-colors duration-1000", textColor)} />
           </div>
         </div>

         {/* Core Stats */}
         <div className="flex-1 text-center md:text-left space-y-4">
           <div className={cn("font-display font-black text-5xl md:text-6xl tracking-widest uppercase transition-colors duration-1000", glowText)}>{name}</div>
           <div className="flex flex-wrap gap-4 justify-center md:justify-start">
             <div className={cn("px-4 py-1.5 rounded bg-white/5 border transition-colors duration-1000", `${borderCol}/50`)}>
               <span className="text-white/50 text-[10px] font-mono tracking-widest mr-2">RANK</span>
               <span className={cn("font-mono font-bold text-xs", textColor)}>{rank.replace('_', ' ')}</span>
             </div>
             <div className={cn("px-4 py-1.5 rounded bg-white/5 border transition-colors duration-1000", `${borderCol}/50`)}>
               <span className="text-white/50 text-[10px] font-mono tracking-widest mr-2">LEVEL</span>
               <span className={cn("font-mono font-bold text-xs", textColor)}>{level}</span>
             </div>
           </div>
         </div>

         {/* Grand XP */}
         <div className="text-center md:text-right mt-8 md:mt-0">
           <div className={cn("font-mono text-6xl font-black tracking-tighter transition-colors duration-1000", glowText)}>{points.toString().padStart(5, '0')}</div>
           <div className="text-xs font-mono tracking-[0.3em] text-white/40 mt-2">LIFETIME_XP_YIELD</div>
         </div>

      </div>

      {/* Grid Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        
        {/* Radar / Categories */}
        <div className="glass-panel p-8 cyber-border">
          <h3 className="font-display tracking-[0.2em] text-white/50 mb-8 uppercase text-sm">Deployment_Vector</h3>
          <div className="space-y-6">
            {Object.keys(cats).sort((a,b) => cats[b] - cats[a]).map(cat => {
              const max = Math.max(...Object.values(cats))
              const percent = (cats[cat] / max) * 100
              return (
                <div key={cat}>
                  <div className="flex justify-between font-mono text-[10px] tracking-widest mb-2">
                    <span className="text-white/70 uppercase">{cat}</span>
                    <span className={textColor}>{cats[cat]} OPS</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={cn("h-full transition-colors duration-1000", bgColor)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Global Lifetime Log strictly for that user */}
        <div className="glass-panel p-8 cyber-border overflow-hidden flex flex-col h-[400px]">
          <h3 className="font-display tracking-[0.2em] text-white/50 mb-6 uppercase text-sm border-b border-white/10 pb-4">Lifetime_Audit_Log</h3>
          <div className="overflow-y-auto pr-4 space-y-3 flex-1 scrollbar-thin">
            {userTasks.slice(0, 50).map(t => (
              <div key={t.id} className={cn("flex justify-between items-center bg-white/[0.02] p-3 rounded border hover:bg-white/[0.05] transition-colors", `${borderCol}/10`)}>
                <div className="flex items-center gap-3">
                  <Zap className={cn("w-4 h-4 opacity-50", textColor)} />
                  <div>
                    <div className="font-mono text-[11px] text-white/90 truncate max-w-[200px]">{t.title}</div>
                    <div className="font-mono text-[9px] text-white/40 tracking-widest">{t.category} // {new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={cn("font-mono text-xs font-bold", textColor)}>+{t.points}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
