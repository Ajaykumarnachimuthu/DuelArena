import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { Task } from '../lib/types'
import { cn } from '../lib/utils'
import { isTaskActive, isTaskCompleted, extractTaskTitleAndMeta } from '../lib/canvasUtils'
import { Zap, CheckCircle2, AlertTriangle, TrendingUp, Award, Layers } from 'lucide-react'

const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

interface AnalyticsProps {
  tasks: Task[]
}

export function AnalyticsScreen({ tasks }: AnalyticsProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Rolling 7-day data structure
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      dateString: d.toDateString(),
      name: days[d.getDay()],
      AjayXP: 0,
      SelvaaXP: 0,
      Completed: 0,
      Incomplete: 0,
      TotalPlanned: 0
    }
  })

  const isTeamup = (t: Task) => t.category === 'Teamup' || t.difficulty === 'Teamup'

  // Map task completion and XP over rolling 7 days
  tasks.forEach(t => {
    const tDate = new Date(t.created_at).toDateString()
    const dayObj = last7.find(d => d.dateString === tDate)
    
    const completed = isTaskCompleted(t.id, t)

    if (dayObj) {
      dayObj.TotalPlanned += 1
      if (completed) {
        dayObj.Completed += 1
        if (isTeamup(t)) {
          dayObj.AjayXP += t.points
          dayObj.SelvaaXP += t.points
        } else if (t.user_id === AJAY_ID) {
          dayObj.AjayXP += t.points
        } else if (t.user_id === SELVAA_ID) {
          dayObj.SelvaaXP += t.points
        }
      } else {
        dayObj.Incomplete += 1
      }
    }
  })

  // Global aggregates
  const ajay7DayXP = last7.reduce((s, d) => s + d.AjayXP, 0)
  const selvaa7DayXP = last7.reduce((s, d) => s + d.SelvaaXP, 0)

  const totalTasksCount = tasks.length
  const totalCompletedCount = tasks.filter(t => isTaskCompleted(t.id, t)).length
  const totalIncompleteCount = totalTasksCount - totalCompletedCount
  const overallRatePct = totalTasksCount > 0 ? Math.round((totalCompletedCount / totalTasksCount) * 100) : 0

  // Dominant category calculation
  const catCounts: Record<string, number> = {}
  tasks.forEach(t => {
    if (isTaskCompleted(t.id, t)) {
      catCounts[t.category] = (catCounts[t.category] || 0) + 1
    }
  })
  const topCategory = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0] || 'Code'

  const activeTasks = tasks.filter(t => isTaskActive(t.id, t))

  return (
    <div className="max-w-6xl mx-auto pt-4 md:pt-8 pb-32 fade-in space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 cyber-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-sm sm:text-base tracking-[0.25em] text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-cyan" /> COMBAT_ANALYTICS_MATRIX
          </h2>
          <p className="font-mono text-xs text-white/40 mt-1">7-DAY PERFORMANCE, EFFICIENCY & EXERTION DATA</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            {overallRatePct}% OVERALL EFFICIENCY
          </span>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="AJAY 7-DAY XP" val={`${ajay7DayXP} XP`} color="cyan" icon={<Award className="w-4 h-4 text-brand-cyan" />} text="Total output over rolling 7 days." />
        <StatCard title="SELVAA 7-DAY XP" val={`${selvaa7DayXP} XP`} color="pink" icon={<Award className="w-4 h-4 text-brand-pink" />} text="Total output over rolling 7 days." />
        <StatCard title="DIRECTIVES CLEARED" val={`${totalCompletedCount} / ${totalTasksCount}`} color="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} text={`${totalIncompleteCount} directives pending execution.`} />
        <StatCard title="DOMINANT VECTOR" val={topCategory.toUpperCase()} color="amber" icon={<Layers className="w-4 h-4 text-amber-400" />} text="Highest volume completed category." />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Weekly Combat XP Output Chart */}
        <div className="glass-panel cyber-border p-6 rounded-2xl flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h3 className="font-display text-xs tracking-widest text-white/70 uppercase">XP_OUTPUT_COMPARISON (7-DAY)</h3>
            <span className="font-mono text-[10px] text-white/40">AJAY VS SELVAA</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontFamily: 'JetBrains Mono', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Ajay XP" dataKey="AjayXP" fill="#81ecff" radius={[4, 4, 0, 0]} />
                <Bar name="Selvaa XP" dataKey="SelvaaXP" fill="#e966ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Tasks Planned vs Completed Chart */}
        <div className="glass-panel cyber-border p-6 rounded-2xl flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h3 className="font-display text-xs tracking-widest text-white/70 uppercase">DAILY_DIRECTIVES_STATUS (7-DAY)</h3>
            <span className="font-mono text-[10px] text-white/40">COMPLETED VS PENDING</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontFamily: 'JetBrains Mono', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Completed" dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Incomplete" dataKey="Incomplete" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Performance Summary Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 cyber-border flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display text-xs tracking-widest text-white uppercase">COMBAT_STATUS_REPORT</h4>
            <p className="font-mono text-xs text-white/50 mt-0.5">
              {selvaa7DayXP > ajay7DayXP 
                ? 'SELVAA holds the output lead over the last 7 days.' 
                : ajay7DayXP > selvaa7DayXP 
                  ? 'AJAY holds the output lead over the last 7 days.' 
                  : 'AJAY and SELVAA are currently tied in output.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="font-mono text-[10px] text-white/40 uppercase">Total Directives</div>
            <div className="font-mono font-bold text-sm text-white">{totalTasksCount}</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="font-mono text-[10px] text-emerald-400/70 uppercase">Cleared</div>
            <div className="font-mono font-bold text-sm text-emerald-300">{totalCompletedCount}</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="font-mono text-[10px] text-amber-400/70 uppercase">Pending</div>
            <div className="font-mono font-bold text-sm text-amber-300">{totalIncompleteCount}</div>
          </div>
        </div>
      </div>

      {/* Active Tasks In-Progress Live Analytics Breakdown */}
      {activeTasks.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 cyber-border">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h4 className="font-display text-xs tracking-widest text-amber-300 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> ACTIVE_TASKS_IN_PROGRESS ({activeTasks.length})
            </h4>
            <span className="font-mono text-[10px] text-white/40">LIVE EXECUTION MONITOR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeTasks.map(t => (
              <div key={t.id} className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/10 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-white/90 truncate max-w-[160px]">{extractTaskTitleAndMeta(t.title).title}</div>
                  <div className="font-mono text-[10px] text-white/40 mt-0.5">{t.category}</div>
                </div>
                <motion.div
                  animate={{ scale: [1, 0.94, 1], opacity: [1, 0.75, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1 shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>ON PROGRESS</span>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ title, val, color, icon, text }: { title: string; val: string; color: 'cyan' | 'pink' | 'emerald' | 'amber'; icon?: React.ReactNode; text: string }) {
  const cMap = {
    cyan: "border-brand-cyan/30 text-brand-cyan shadow-[0_0_20px_rgba(129,236,255,0.1)]",
    pink: "border-brand-pink/30 text-brand-pink shadow-[0_0_20px_rgba(233,102,255,0.1)]",
    emerald: "border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    amber: "border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
  }
  return (
    <div className={cn("glass-panel p-5 rounded-2xl border flex flex-col justify-between space-y-3", cMap[color])}>
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-[10px] tracking-widest text-white/50">{title}</h4>
        {icon}
      </div>
      <div>
        <div className="font-display text-xl sm:text-2xl font-bold text-white tracking-wide">{val}</div>
        <p className="font-mono text-[11px] text-white/40 leading-relaxed mt-1">{text}</p>
      </div>
    </div>
  )
}
