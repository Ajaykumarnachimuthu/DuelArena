import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Task, getRank, getLevelNumber } from '../lib/types'
import { cn } from '../lib/utils'
import { UserCircle2, Zap, CheckCircle2, Clock, ShieldCheck, Flame } from 'lucide-react'
import { isTaskActive, isTaskCompleted } from '../lib/canvasUtils'

const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'

interface ProfileProps {
  tasks: Task[]
  currentUser: string
  points: number
}

export function ProfileScreen({ tasks, currentUser, points }: ProfileProps) {
  const [sessionTab, setSessionTab] = useState<'today' | 'lifetime'>('today')

  const isAjay = currentUser === AJAY_ID
  const name = isAjay ? 'AJAY' : 'SELVAA'
  const theme = isAjay ? 'cyan' : 'pink'
  
  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const glowText = theme === 'cyan' ? 'text-glow-cyan' : 'text-glow-pink'
  const bgColor = theme === 'cyan' ? 'bg-brand-cyan' : 'bg-brand-pink'
  const borderCol = theme === 'cyan' ? 'border-brand-cyan' : 'border-brand-pink'
  const shadowGlow = theme === 'cyan' ? 'shadow-[0_0_30px_rgba(129,236,255,0.3)]' : 'shadow-[0_0_30px_rgba(233,102,255,0.3)]'

  const isTeamup = (t: Task) => t.category === 'Teamup' || t.difficulty === 'Teamup'
  const userTasks = tasks.filter(t => t.user_id === currentUser || isTeamup(t))

  // Today's Daily Personal Session Metrics
  const todayStr = new Date().toDateString()
  const todayTasks = userTasks.filter(t => new Date(t.created_at).toDateString() === todayStr)
  const todayPlannedCount = todayTasks.length
  const todayCompletedCount = todayTasks.filter(t => isTaskCompleted(t.id, t)).length
  const todayIncompleteCount = todayPlannedCount - todayCompletedCount
  const todayRatePct = todayPlannedCount > 0 ? Math.round((todayCompletedCount / todayPlannedCount) * 100) : 0
  const todayNetDifference = todayCompletedCount - todayIncompleteCount

  // Daily Performance Mastery Level Calculation based on today's planned & completed directives
  let dailyLevelTitle = 'LEVEL 0: STANDBY'
  let dailyLevelDesc = 'No daily directives scheduled for today.'
  let dailyLevelBadgeBg = 'bg-white/5 border-white/20 text-white/40'

  if (todayPlannedCount > 0) {
    if (todayRatePct === 100) {
      dailyLevelTitle = 'LEVEL 5: OVERLORD (100% CLEARED)'
      dailyLevelDesc = 'Flawless execution! All planned daily objectives completed.'
      dailyLevelBadgeBg = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
    } else if (todayRatePct >= 76) {
      dailyLevelTitle = 'LEVEL 4: MASTER STRATEGIST'
      dailyLevelDesc = 'Near perfect completion rate! Pushing past limits.'
      dailyLevelBadgeBg = 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
    } else if (todayRatePct >= 51) {
      dailyLevelTitle = 'LEVEL 3: CYBER ELITE'
      dailyLevelDesc = 'Solid momentum! Over half of daily objectives secured.'
      dailyLevelBadgeBg = theme === 'cyan' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-[0_0_20px_rgba(129,236,255,0.4)]' : 'bg-brand-pink/20 border-brand-pink text-brand-pink shadow-[0_0_20px_rgba(233,102,255,0.4)]'
    } else if (todayRatePct >= 26) {
      dailyLevelTitle = 'LEVEL 2: COMBAT WARRIOR'
      dailyLevelDesc = 'Active engagement in progress. Keep clearing directives!'
      dailyLevelBadgeBg = 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
    } else {
      dailyLevelTitle = 'LEVEL 1: INITIATE'
      dailyLevelDesc = 'Directive execution initiated. Clear more objectives to level up.'
      dailyLevelBadgeBg = 'bg-blue-500/20 border-blue-400 text-blue-300'
    }
  }

  // Daily Comparison Graph Data for Recharts
  const dailyGraphData = [
    { name: 'Planned', count: todayPlannedCount, fill: '#3b82f6' },
    { name: 'Completed', count: todayCompletedCount, fill: '#10b981' },
    { name: 'Incomplete', count: todayIncompleteCount, fill: '#f59e0b' }
  ]

  // Category mapping based strictly on completed operations
  const completedTasks = userTasks.filter(t => isTaskCompleted(t.id, t))
  const cats = completedTasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const rank = getRank(points)
  const level = getLevelNumber(points)

  // Filter tasks depending on session tab toggle
  const activeSessionTasks = sessionTab === 'today' ? todayTasks : userTasks

  return (
    <div className="max-w-5xl mx-auto pt-6 md:pt-10 pb-32 fade-in space-y-8 transition-colors duration-1000">
      
      {/* Upper Data Slate */}
      <div className={cn("glass-panel p-6 md:p-10 rounded-3xl border flex flex-col md:flex-row items-center gap-8 transition-colors duration-1000", `${borderCol}/30`, shadowGlow)}>
         
         {/* Avatar Chamber */}
         <div className="relative">
           <div className={cn("absolute inset-0 blur-[60px] opacity-40 rounded-full transition-colors duration-1000", bgColor)} />
           <div className={cn("relative w-32 h-32 md:w-36 md:h-36 rounded-full border-[3px] flex items-center justify-center bg-black/60 backdrop-blur-xl transition-colors duration-1000", borderCol)}>
             <UserCircle2 className={cn("w-16 h-16 md:w-20 md:h-20 transition-colors duration-1000", textColor)} />
           </div>
         </div>

         {/* Core Stats */}
         <div className="flex-1 text-center md:text-left space-y-3">
           <div className={cn("font-display font-black text-4xl md:text-5xl tracking-widest uppercase transition-colors duration-1000", glowText)}>{name}</div>
           <div className="flex flex-wrap gap-3 justify-center md:justify-start">
             <div className={cn("px-3.5 py-1.5 rounded-xl bg-white/5 border transition-colors duration-1000 flex items-center gap-2", `${borderCol}/50`)}>
               <span className="text-white/40 text-[10px] font-mono tracking-widest">RANK</span>
               <span className={cn("font-mono font-bold text-xs", textColor)}>{rank.replace('_', ' ')}</span>
             </div>
             <div className={cn("px-3.5 py-1.5 rounded-xl bg-white/5 border transition-colors duration-1000 flex items-center gap-2", `${borderCol}/50`)}>
               <span className="text-white/40 text-[10px] font-mono tracking-widest">LIFETIME LEVEL</span>
               <span className={cn("font-mono font-bold text-xs", textColor)}>{level}</span>
             </div>
           </div>
         </div>

         {/* Grand XP */}
         <div className="text-center md:text-right">
           <div className={cn("font-mono text-5xl md:text-6xl font-black tracking-tighter transition-colors duration-1000", glowText)}>{points.toString().padStart(5, '0')}</div>
           <div className="text-xs font-mono tracking-[0.3em] text-white/40 mt-1">LIFETIME_XP_YIELD</div>
         </div>

      </div>

      {/* Daily Performance & Mastery Level Section */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 cyber-border space-y-6">
        
        {/* Header with Title & Level Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 font-display text-xs sm:text-sm tracking-widest text-white uppercase">
              <Flame className="w-4 h-4 text-amber-400" /> DAILY_SESSION_MASTERY // TODAY
            </div>
            <p className="font-mono text-xs text-white/40 mt-0.5">{todayStr.toUpperCase()} OPERATIONAL SUMMARY</p>
          </div>

          <div className={cn("px-4 py-2 rounded-xl border font-mono text-xs font-bold tracking-wider flex items-center gap-2 self-start md:self-auto", dailyLevelBadgeBg)}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{dailyLevelTitle}</span>
          </div>
        </div>

        {/* Progress Bar & Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-white/60">
            <span>DAILY OBJECTIVES COMPLETION</span>
            <span className={cn("font-bold", textColor)}>{todayCompletedCount} / {todayPlannedCount} ({todayRatePct}%)</span>
          </div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${todayRatePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn("h-full rounded-full transition-colors duration-500", todayRatePct === 100 ? "bg-emerald-400 shadow-[0_0_12px_#10b981]" : bgColor)}
            />
          </div>
          <p className="font-mono text-[11px] text-white/40 italic">{dailyLevelDesc}</p>
        </div>

        {/* Daily Tasks Comparison Graph & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Recharts Bar Comparison Graph */}
          <div className="lg:col-span-2 glass-panel p-4 md:p-6 rounded-2xl border border-white/5 h-[220px] flex flex-col">
            <div className="font-mono text-xs text-white/50 mb-2 flex items-center justify-between">
              <span>DAILY DIRECTIVES COMPARISON</span>
              <span className="text-[10px] text-white/30">PLANNED vs COMPLETED vs INCOMPLETE</span>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', fontFamily: 'JetBrains Mono', fontSize: '11px' }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-center justify-between">
              <div className="font-mono text-xs text-white/70">PLANNED TODAY</div>
              <div className="font-mono font-bold text-base text-blue-300">{todayPlannedCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
              <div className="font-mono text-xs text-white/70">COMPLETED TODAY</div>
              <div className="font-mono font-bold text-base text-emerald-300">+{todayCompletedCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
              <div className="font-mono text-xs text-white/70">INCOMPLETE / PENDING</div>
              <div className="font-mono font-bold text-base text-amber-300">{todayIncompleteCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
              <div className="font-mono text-xs text-white/70">NET DIFFERENCE</div>
              <div className={cn("font-mono font-bold text-base", todayNetDifference >= 0 ? "text-emerald-400" : "text-amber-400")}>
                {todayNetDifference >= 0 ? `+${todayNetDifference}` : todayNetDifference}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Grid Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Category Breakdown */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl cyber-border">
          <h3 className="font-display tracking-[0.2em] text-white/50 mb-6 uppercase text-xs sm:text-sm">Deployment_Vectors_Cleared</h3>
          <div className="space-y-5">
            {Object.keys(cats).length === 0 ? (
              <div className="font-mono text-xs text-white/30 py-8 text-center">NO CLEARED OPERATIONS YET</div>
            ) : (
              Object.keys(cats).sort((a,b) => cats[b] - cats[a]).map(cat => {
                const max = Math.max(...Object.values(cats))
                const percent = (cats[cat] / max) * 100
                return (
                  <div key={cat}>
                    <div className="flex justify-between font-mono text-[10px] tracking-widest mb-1.5">
                      <span className="text-white/70 uppercase">{cat}</span>
                      <span className={textColor}>{cats[cat]} CLEARED</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={cn("h-full transition-colors duration-1000", bgColor)} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Personal Session Audit Log with Session Toggle */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl cyber-border overflow-hidden flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
            <h3 className="font-display tracking-[0.2em] text-white/50 uppercase text-xs sm:text-sm">Session_Log</h3>
            
            {/* Session Tab Filter Toggle */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setSessionTab('today')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1",
                  sessionTab === 'today' ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" : "text-white/40 hover:text-white"
                )}
              >
                <Clock className="w-3 h-3" /> TODAY
              </button>
              <button
                onClick={() => setSessionTab('lifetime')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1",
                  sessionTab === 'lifetime' ? "bg-white/15 text-white font-bold" : "text-white/40 hover:text-white"
                )}
              >
                LIFETIME
              </button>
            </div>
          </div>

          <div className="overflow-y-auto pr-2 space-y-3 flex-1 scrollbar-thin">
            {activeSessionTasks.length === 0 ? (
              <div className="font-mono text-xs text-white/30 py-12 text-center">
                {sessionTab === 'today' ? "NO DIRECTIVES DEPLOYED TODAY YET" : "NO LIFETIME DIRECTIVES LOGGED"}
              </div>
            ) : (
              activeSessionTasks.slice(0, 50).map(t => {
                const active = isTaskActive(t.id, t)
                const completed = isTaskCompleted(t.id, t)
                return (
                  <div key={t.id} className={cn("flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border hover:bg-white/[0.05] transition-colors", `${borderCol}/10`)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Zap className={cn("w-4 h-4 opacity-70 shrink-0", textColor)} />
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-white/90 truncate max-w-[160px] sm:max-w-[220px]">{t.title}</div>
                        <div className="font-mono text-[9px] text-white/40 tracking-widest mt-0.5">{t.category} // {new Date(t.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Status Badge */}
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
              })
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
