import { motion } from 'framer-motion'
import { getRank, getProgressToNextLevel } from '../lib/types'
import { cn } from '../lib/utils'

interface CyberCardProps {
  name: string;
  color: 'cyan' | 'pink';
  points: number;
  streak: number;
  taskCount: number;
}

export function CyberCard({ name, color, points, streak, taskCount }: CyberCardProps) {
  const isCyan = color === 'cyan'
  const borderClass = isCyan ? 'border-brand-cyan/40' : 'border-brand-pink/40'
  const textGlow = isCyan ? 'text-glow-cyan text-brand-cyan' : 'text-glow-pink text-brand-pink'
  const bgGlow = isCyan ? 'bg-brand-cyan' : 'bg-brand-pink'

  const rank = getRank(points)
  const progressPercent = Math.floor(getProgressToNextLevel(points) * 100)

  return (
    <motion.div 
      whileHover={{ scale: 1.01, y: -2 }}
      className={cn("glass-panel p-6 cyber-border overflow-hidden relative", borderClass)}
    >
      {/* Background hazy glow */}
      <div className={cn("absolute -top-20 -right-20 w-64 h-64 blur-[100px] opacity-20 rounded-full", bgGlow)} />

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex gap-4 items-center">
          <div className={cn("w-14 h-14 rounded-lg border flex items-center justify-center font-display text-2xl font-bold", borderClass, textGlow, "bg-black/50")}>
            {name[0]}
          </div>
          <div>
            <h2 className={cn("font-display text-2xl uppercase tracking-widest", textGlow)}>{name}</h2>
            <div className="flex gap-3 text-xs font-mono text-white/50 mt-1 uppercase">
              <span>Streak: <span className="text-white">{streak}</span></span>
              <span>Tasks: <span className="text-white">{taskCount}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-4 relative z-10">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-white/40 mb-1">TOTAL_XP_YIELD</div>
          <div className={cn("font-mono font-bold text-5xl", textGlow)}>{points.toString().padStart(4, '0')}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-sm tracking-widest text-white/70 mb-1">{rank}</div>
          <div className="text-[10px] text-white/40 font-mono text-glow-cyan">{progressPercent}% TO NEXT</div>
        </div>
      </div>

      {/* Progress Bar Segmented */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={cn("h-full", bgGlow)}
          style={{ boxShadow: `0 0 10px ${isCyan ? '#81ecff' : '#e966ff'}` }}
        />
      </div>

      {/* Subtitles as requested */}
      {!isCyan && (
        <div className="mt-4 text-center font-mono text-[10px] tracking-widest text-brand-pink/70 border border-brand-pink/20 bg-brand-pink/5 py-1 rounded mix-blend-screen">
          SELVAA IS CATCHING UP
        </div>
      )}
    </motion.div>
  )
}
