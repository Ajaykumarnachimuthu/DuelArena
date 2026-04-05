import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('')
  const [isRushMode, setIsRushMode] = useState(false)

  useEffect(() => {
    const calcTime = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(23, 59, 59, 999)
      const diff = midnight.getTime() - now.getTime()

      if (diff <= 0) return '00:00:00'

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const s = Math.floor((diff / 1000) % 60)

      // Rush mode if less than 2 hours
      setIsRushMode(h < 2)

      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    setTimeLeft(calcTime())
    const interval = setInterval(() => setTimeLeft(calcTime()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center mb-10 mt-6">
      <div className="text-white/50 text-sm mb-2 font-medium tracking-widest uppercase">Reset Timer</div>
      <motion.div 
        className={cn(
          "font-mono text-5xl md:text-7xl font-bold tabular-nums tracking-tighter transition-all duration-1000",
          isRushMode ? "text-brand-red rush-mode-pulse bg-brand-red/10 border-brand-red/50 rounded-2xl px-8 py-4 border-2" : "text-white"
        )}
      >
        {timeLeft}
      </motion.div>
      {isRushMode && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-brand-red font-bold mt-3 animate-pulse text-sm"
        >
          RUSH MODE ACTIVATED
        </motion.div>
      )}
    </div>
  )
}
