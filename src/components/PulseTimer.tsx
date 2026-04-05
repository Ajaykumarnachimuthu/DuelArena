import { useState, useEffect } from 'react'
import { cn } from '../lib/utils'

export function PulseTimer({ globalRush }: { globalRush: boolean }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isTimeRush, setIsTimeRush] = useState(false)

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const mid = new Date()
      mid.setHours(23, 59, 59, 999)
      const diff = mid.getTime() - now.getTime()
      if (diff <= 0) return '00:00:00'
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const s = Math.floor((diff / 1000) % 60)
      setIsTimeRush(h < 2)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    setTimeLeft(calc())
    const int = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(int)
  }, [])

  const isRushMode = isTimeRush || globalRush

  return (
    <div className="flex flex-col items-center justify-center my-12 relative">
      <div className="absolute inset-0 bg-brand-cyan/5 blur-[100px] w-full h-[200px] rounded-full pointer-events-none" />
      <div className="font-mono text-[10px] tracking-[0.3em] text-white/50 mb-4 z-10">DAILY TASK DUEL: FINAL COUNTDOWN</div>
      
      <div className={cn(
        "font-mono text-5xl md:text-9xl font-black tabular-nums tracking-tighter mix-blend-screen z-10",
        isRushMode ? "text-brand-red text-glow-red rush-mode-pulse" : "text-white text-glow-cyan"
      )}>
        {timeLeft}
      </div>

      {isRushMode && (
        <div className="mt-6 flex items-center gap-2 border border-brand-red/50 bg-brand-red/10 px-4 py-1.5 rounded-full rush-mode-pulse z-10">
          <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
          <span className="font-mono text-xs tracking-widest text-brand-red">RUSH MODE: ACTIVE</span>
        </div>
      )}
    </div>
  )
}
