import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface PlayerCardProps {
  name: string
  color: 'cyan' | 'pink'
  points: number
  level: string
  streak: number
}

export function PlayerCard({ name, color, points, level, streak }: PlayerCardProps) {
  const isCyan = color === 'cyan'
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -5 }}
      className={cn(
        "glass-panel p-6 flex flex-col gap-4 relative overflow-hidden",
        isCyan ? "border-brand-cyan/30" : "border-brand-pink/30"
      )}
    >
      {/* Background glow orb */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 blur-[80px] rounded-full opacity-30",
        isCyan ? "bg-brand-cyan" : "bg-brand-pink"
      )} />

      <div className="flex justify-between items-start z-10">
        <div>
          <h2 className={cn(
            "text-3xl font-display font-bold uppercase",
            isCyan ? "text-brand-cyan text-glow-cyan" : "text-brand-pink text-glow-pink"
          )}>{name}</h2>
          <p className="text-white/60 font-medium text-sm">{level} Rank</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold">{points}</div>
          <div className="text-white/50 text-xs">XP Points</div>
        </div>
      </div>

      <div className="z-10 mt-4 space-y-2">
        <div className="flex justify-between text-xs text-white/70">
          <span>Daily Streak</span>
          <span className="font-mono text-white text-glow-cyan">{streak} Days 🔥</span>
        </div>
        {/* Fake XP Bar */}
        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(points % 1000) / 10}%` }}
            className={cn("h-full rounded-full", isCyan ? "bg-brand-cyan" : "bg-brand-pink")}
          />
        </div>
        <p className="text-[10px] text-right text-white/40">{1000 - (points % 1000)} XP to next rank</p>
      </div>
    </motion.div>
  )
}
