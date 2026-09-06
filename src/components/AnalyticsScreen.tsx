import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { Task } from '../lib/types'
import { cn } from '../lib/utils'
import { isTaskActive } from '../lib/canvasUtils'
import { Zap } from 'lucide-react'

interface AnalyticsProps {
  tasks: Task[]
}

export function AnalyticsScreen({ tasks }: AnalyticsProps) {
  // Aggregate data by the last 7 days dynamically
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Create an array mapping the last 7 days ending on today
  const last7 = Array.from({length: 7}).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      dateString: d.toDateString(),
      name: days[d.getDay()],
      Ajay: 0,
      Selvaa: 0
    }
  })

  // Map XP summing to the days
  tasks.forEach(t => {
     const tDate = new Date(t.created_at).toDateString()
     const dayObj = last7.find(d => d.dateString === tDate)
     if (dayObj) {
       if (t.user_id === 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88') {
         dayObj.Ajay += t.points
       } else {
         dayObj.Selvaa += t.points
       }
     }
  })

  // Basic projection logic
  const ajayTotal = last7.reduce((s, d) => s + d.Ajay, 0)
  const selvaaTotal = last7.reduce((s, d) => s + d.Selvaa, 0)

  const activeTasks = tasks.filter(t => isTaskActive(t.id))

  return (
    <div className="max-w-6xl mx-auto pt-8 pb-32 fade-in space-y-8">
      
      {/* Main Chart */}
      <div className="glass-panel cyber-border p-4 md:p-8 h-[260px] sm:h-[340px] md:h-[400px]">
        <h3 className="font-display tracking-[0.2em] text-white/50 mb-8">WEEKLY_COMBAT_DATA</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: '#ffffff05'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
            <Bar dataKey="Ajay" fill="#81ecff" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Selvaa" fill="#e966ff" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="AJAY OUTPUT" val={`${ajayTotal} XP`} color="cyan" text="Total exertion measured over rolling 7-day databank." />
        <StatCard title="SELVAA OUTPUT" val={`${selvaaTotal} XP`} color="pink" text="Total exertion measured over rolling 7-day databank." />
        {selvaaTotal > ajayTotal ? (
           <StatCard title="ARENA ALERT" val="WARNING" color="red" text="SELVAA is over-performing relative to AJAY index." />
        ) : (
           <StatCard title="GROWTH FORECAST" val="STABLE" color="cyan" text="AJAY continues consistent output momentum." />
        )}
      </div>

      {/* Active Tasks In-Progress Live Analytics Breakdown */}
      {activeTasks.length > 0 && (
        <div className="glass-panel p-6 cyber-border">
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
                  <div className="font-mono text-xs font-bold text-white/90 truncate max-w-[160px]">{t.title}</div>
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

function StatCard({ title, val, color, text }: { title: string, val: string, color: 'cyan'|'pink'|'red', text: string }) {
  const cMap = {
    cyan: "border-brand-cyan/30 text-brand-cyan shadow-[0_0_20px_rgba(129,236,255,0.1)]",
    pink: "border-brand-pink/30 text-brand-pink shadow-[0_0_20px_rgba(233,102,255,0.1)]",
    red: "border-brand-red/30 text-brand-red shadow-[0_0_20px_rgba(255,112,118,0.1)]"
  }
  return (
    <div className={cn("glass-panel p-6 border flex flex-col", cMap[color])}>
      <h4 className="font-mono text-[10px] tracking-widest text-white/50 mb-4">{title}</h4>
      <div className="font-display text-2xl font-bold mb-2">{val}</div>
      <p className="font-mono text-xs text-white/40 leading-relaxed">{text}</p>
    </div>
  )
}
