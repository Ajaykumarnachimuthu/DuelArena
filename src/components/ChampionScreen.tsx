import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { cn } from '../lib/utils'

interface ChampionProps {
  ajayPoints: number
  selvaaPoints: number
}

export function ChampionScreen({ ajayPoints, selvaaPoints }: ChampionProps) {
  const isAjayLeading = ajayPoints >= selvaaPoints
  const champName = isAjayLeading ? 'AJAY' : 'SELVAA'
  const champPoints = isAjayLeading ? ajayPoints : selvaaPoints
  
  const textGlow = isAjayLeading ? 'text-glow-cyan' : 'text-glow-pink'
  const borderColor = isAjayLeading ? 'border-brand-cyan/50' : 'border-brand-pink/50'

  return (
    <div className="max-w-4xl mx-auto pt-20 pb-32 flex flex-col items-center text-center fade-in">
      <div className="font-mono text-sm tracking-[0.3em] text-white/50 mb-8 uppercase">Live_Daily_Victor_Projections</div>
      
      <div className="relative mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("absolute inset-0 blur-[120px] rounded-full opacity-40 transition-colors duration-1000", isAjayLeading ? "bg-brand-cyan" : "bg-brand-pink")}
        />
        <div className={cn("relative z-10 w-48 h-48 rounded-full border-4 glass flex items-center justify-center bg-black/50 backdrop-blur-xl transition-colors duration-1000", borderColor)}>
           <span className={cn("font-display font-black text-6xl text-white transition-colors duration-1000", textGlow)}>
             {champName[0]}
           </span>
           <Crown className="absolute -top-8 w-16 h-16 text-yellow-400 crown-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
        </div>
      </div>

      <h1 className={cn("font-display text-5xl md:text-7xl font-black mb-6 text-white transition-colors duration-1000", textGlow)}>
        {champName} IS LEADING!
      </h1>

      <div className="flex gap-8 mb-12">
        <div className={cn("glass-panel p-6 border text-center transition-colors duration-1000", borderColor)}>
          <div className={cn("font-mono text-4xl text-white font-bold mb-2 transition-colors duration-1000", textGlow)}>{champPoints}</div>
          <div className="text-xs font-mono tracking-[0.2em] text-white/40">TODAY'S_YIELD</div>
        </div>
        <div className="glass-panel p-6 border border-white/10 text-center">
          <div className="font-mono text-4xl text-white font-bold mb-2">{Math.abs(ajayPoints - selvaaPoints)}</div>
          <div className="text-xs font-mono tracking-[0.2em] text-white/40">XP GAP MARGIN</div>
        </div>
      </div>

    </div>
  )
}
