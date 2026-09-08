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
      {/* Soft Ambient Background Radial Blur Halo - Zero Square Boundaries */}
      <div className={cn(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[150px] md:h-[220px] rounded-full blur-3xl pointer-events-none transition-all duration-700",
        isRushMode 
          ? "bg-[radial-gradient(ellipse_at_center,rgba(255,112,118,0.3),transparent_70%)] opacity-90" 
          : "bg-[radial-gradient(ellipse_at_center,rgba(129,236,255,0.2),transparent_70%)] opacity-70"
      )} />

      <div className="font-mono text-[10px] md:text-xs tracking-[0.35em] text-white/50 mb-4 z-10 font-bold uppercase select-none">
        DAILY TASK DUEL: FINAL COUNTDOWN
      </div>
      
      {/* Pure Floating Neon Digits with Multi-Stage Text Glow */}
      <div className={cn(
        "font-mono text-6xl md:text-9xl font-black tabular-nums tracking-tighter z-10 transition-colors duration-500 select-none",
        isRushMode ? "text-brand-red text-glow-red rush-text-pulse" : "text-white text-glow-cyan"
      )}>
        {timeLeft}
      </div>

      {/* Rounded Pill Badge for Rush Mode Status */}
      {isRushMode && (
        <div className="mt-6 flex items-center gap-2 border border-brand-red/60 bg-brand-red/10 px-5 py-1.5 rounded-full rush-mode-pulse z-10 shadow-[0_0_20px_rgba(255,112,118,0.3)]">
          <div className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
          <span className="font-mono text-xs tracking-widest text-brand-red font-extrabold uppercase">RUSH MODE: ACTIVE</span>
        </div>
      )}
    </div>
  )
}
