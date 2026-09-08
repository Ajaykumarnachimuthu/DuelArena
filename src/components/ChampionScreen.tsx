import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Swords, Zap, CheckCircle2, TrendingUp } from 'lucide-react'
import { Task } from '../lib/types'
import { isTaskCompleted } from '../lib/canvasUtils'
import { cn } from '../lib/utils'

const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

interface ChampionProps {
  ajayPoints: number
  selvaaPoints: number
  tasks?: Task[]
}

export function ChampionScreen({ ajayPoints, selvaaPoints, tasks = [] }: ChampionProps) {
  const [resetTimeLeft, setResetTimeLeft] = useState('')

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(23, 59, 59, 999)
      const diff = midnight.getTime() - now.getTime()
      if (diff <= 0) {
        setResetTimeLeft('00:00:00')
        return
      }
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const m = Math.floor((diff / 1000 / 60) % 60)
      const s = Math.floor((diff / 1000) % 60)
      setResetTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  const isTied = ajayPoints === selvaaPoints && ajayPoints > 0
  const isZero = ajayPoints === 0 && selvaaPoints === 0
  const isAjayLeading = ajayPoints > selvaaPoints || (ajayPoints === selvaaPoints)
  const leaderName = isTied ? 'TIED ARENA' : isAjayLeading ? 'AJAY' : 'SELVAA'
  const gapMargin = Math.abs(ajayPoints - selvaaPoints)

  const isTeamup = (t: Task) => t.category === 'Teamup' || t.difficulty === 'Teamup'

  // Completed tasks count today
  const ajayCompletedTasks = tasks.filter(t => (t.user_id === AJAY_ID || isTeamup(t)) && isTaskCompleted(t.id, t)).length
  const selvaaCompletedTasks = tasks.filter(t => (t.user_id === SELVAA_ID || isTeamup(t)) && isTaskCompleted(t.id, t)).length

  // Total XP sum
  const maxVal = Math.max(ajayPoints, selvaaPoints, 1)
  const ajayPct = Math.round((ajayPoints / maxVal) * 100)
  const selvaaPct = Math.round((selvaaPoints / maxVal) * 100)

  return (
    <div className="max-w-5xl mx-auto pt-6 pb-32 flex flex-col items-center fade-in text-center px-4">
      
      {/* Live Status Badge & Midnight Reset Countdown */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="px-4 py-1.5 rounded-full text-xs font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-extrabold tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>DAILY_CHAMPION • LIVE SYNC ACTIVE</span>
        </motion.div>

        <div className="px-4 py-1.5 rounded-full text-xs font-mono uppercase bg-white/5 border border-white/10 text-white/70 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>RESETS IN: <strong className="text-amber-300 font-mono">{resetTimeLeft}</strong></span>
        </div>
      </div>

      <div className="font-mono text-xs tracking-[0.3em] text-white/50 mb-8 uppercase font-bold">
        REALTIME_DAILY_VICTOR_STANDINGS
      </div>

      {/* Leader Avatar Spotlight */}
      <div className="relative mb-8">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 blur-[130px] rounded-full transition-colors duration-1000",
            isTied ? "bg-amber-500/50" : isAjayLeading ? "bg-brand-cyan/60" : "bg-brand-pink/60"
          )}
        />

        <div className={cn(
          "relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 flex flex-col items-center justify-center bg-black/60 backdrop-blur-2xl transition-colors duration-1000 shadow-2xl",
          isTied ? "border-amber-400/60" : isAjayLeading ? "border-brand-cyan/60" : "border-brand-pink/60"
        )}>
          <Crown className="absolute -top-10 w-16 h-16 text-yellow-400 crown-bounce drop-shadow-[0_0_25px_rgba(250,204,21,0.8)]" />
          <span className={cn(
            "font-display font-black text-6xl text-white transition-colors duration-1000",
            isTied ? "text-glow-amber" : isAjayLeading ? "text-glow-cyan" : "text-glow-pink"
          )}>
            {isTied ? '=' : leaderName[0]}
          </span>
          <span className="font-mono text-[10px] tracking-widest text-white/60 mt-1 uppercase font-bold">
            {isTied ? 'TIED LEAD' : `${leaderName} LEADING`}
          </span>
        </div>
      </div>

      {/* Main Leader Title Banner */}
      <h1 className={cn(
        "font-display text-4xl sm:text-6xl md:text-7xl font-black mb-4 text-white transition-colors duration-1000 tracking-tight",
        isTied ? "text-amber-300 drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]" : isAjayLeading ? "text-glow-cyan" : "text-glow-pink"
      )}>
        {isZero ? 'THE ARENA IS EVEN!' : isTied ? 'DEAD HEAT TIE!' : `${leaderName} IS LEADING!`}
      </h1>

      <p className="font-mono text-xs sm:text-sm text-white/60 max-w-lg mb-10 leading-relaxed">
        {isZero 
          ? 'No objectives completed today yet. Complete your first directive to claim today\'s Daily Crown!' 
          : isTied 
            ? `Both duellists are neck and neck at ${ajayPoints} XP! Next completed objective breaks the tie.` 
            : `${leaderName} holds the crown with a ${gapMargin} XP lead today.`}
      </p>

      {/* Side-by-Side Duel Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12 text-left">
        
        {/* AJAY CARD */}
        <motion.div 
          whileHover={{ y: -4 }}
          className={cn(
            "relative glass-panel p-6 rounded-2xl border backdrop-blur-2xl transition-all duration-500 overflow-hidden",
            isAjayLeading && !isTied 
              ? "border-brand-cyan/60 bg-brand-cyan/10 shadow-[0_0_35px_rgba(129,236,255,0.2)]" 
              : "border-white/10 bg-white/[0.02]"
          )}
        >
          {isAjayLeading && !isTied && (
            <div className="absolute top-3 right-3 font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-cyan text-black shadow-[0_0_12px_#81ecff] flex items-center gap-1">
              <Crown className="w-3 h-3 fill-current" /> DAILY CHAMPION
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center font-display font-black text-brand-cyan text-lg">
              A
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide">AJAY</h3>
              <div className="font-mono text-xs text-brand-cyan">CYAN FACTION</div>
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="font-mono text-xs text-white/50 uppercase">TODAY'S YIELD</span>
            <span className="font-mono text-4xl font-black text-brand-cyan text-glow-cyan">{ajayPoints} <span className="text-xs font-normal text-white/50">XP</span></span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-cyan to-cyan-300 h-full rounded-full transition-all duration-700 shadow-[0_0_12px_#81ecff]" 
              style={{ width: `${ajayPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-white/60 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
              <span>{ajayCompletedTasks} Tasks Done</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{ajayPct}% Yield</span>
            </div>
          </div>
        </motion.div>

        {/* SELVAA CARD */}
        <motion.div 
          whileHover={{ y: -4 }}
          className={cn(
            "relative glass-panel p-6 rounded-2xl border backdrop-blur-2xl transition-all duration-500 overflow-hidden",
            !isAjayLeading && !isTied 
              ? "border-brand-pink/60 bg-brand-pink/10 shadow-[0_0_35px_rgba(233,102,255,0.2)]" 
              : "border-white/10 bg-white/[0.02]"
          )}
        >
          {!isAjayLeading && !isTied && (
            <div className="absolute top-3 right-3 font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-pink text-black shadow-[0_0_12px_#e966ff] flex items-center gap-1">
              <Crown className="w-3 h-3 fill-current" /> DAILY CHAMPION
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center font-display font-black text-brand-pink text-lg">
              S
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide">SELVAA</h3>
              <div className="font-mono text-xs text-brand-pink">PINK FACTION</div>
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="font-mono text-xs text-white/50 uppercase">TODAY'S YIELD</span>
            <span className="font-mono text-4xl font-black text-brand-pink text-glow-pink">{selvaaPoints} <span className="text-xs font-normal text-white/50">XP</span></span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-pink to-fuchsia-300 h-full rounded-full transition-all duration-700 shadow-[0_0_12px_#e966ff]" 
              style={{ width: `${selvaaPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-white/60 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-pink" />
              <span>{selvaaCompletedTasks} Tasks Done</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{selvaaPct}% Yield</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* XP Margin Summary Box */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 w-full max-w-md flex items-center justify-between font-mono">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-amber-400" />
          <div className="text-left">
            <div className="text-xs text-white/40 uppercase">MARGIN GAP DIFFERENTIAL</div>
            <div className="text-sm font-bold text-white/90">
              {isTied ? '0 XP GAP (TIED)' : `${gapMargin} XP GAP TO TAKE LEAD`}
            </div>
          </div>
        </div>
        <div className="text-2xl font-black text-amber-300">
          +{gapMargin} XP
        </div>
      </div>

    </div>
  )
}
