import { useState } from 'react'
import { motion } from 'framer-motion'
import { Task, getRank, getLevelNumber, getProgressToNextLevel } from '../lib/types'
import { cn } from '../lib/utils'
import { Trash2 } from 'lucide-react'

interface TaskScreenProps {
  tasks: Task[]
  points: number
  onSubmit: (title: string, diff: string, cat: string) => void
  onDelete: (id: string) => void
  theme: 'cyan' | 'pink'
}

export function TaskScreen({ tasks, points, onSubmit, onDelete, theme }: TaskScreenProps) {
  const [title, setTitle] = useState('')
  const [cat, setCat] = useState('Fitness')
  const [diff, setDiff] = useState('Medium')

  const handleDeploy = () => {
    if (!title) return
    onSubmit(title, diff, cat)
    setTitle('')
  }

  const activeLevel = getLevelNumber(points)
  const rank = getRank(points)
  const progressPercent = Math.floor(getProgressToNextLevel(points) * 100)

  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const glowText = theme === 'cyan' ? 'text-glow-cyan' : 'text-glow-pink'
  const bgColor = theme === 'cyan' ? 'bg-brand-cyan' : 'bg-brand-pink'
  const borderCol = theme === 'cyan' ? 'border-brand-cyan' : 'border-brand-pink'
  const focusBorder = theme === 'cyan' ? 'focus:border-brand-cyan' : 'focus:border-brand-pink'
  const shadowGlow = theme === 'cyan' ? 'shadow-[0_0_15px_#81ecff]' : 'shadow-[0_0_15px_#e966ff]'

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 fade-in pt-8 transition-colors duration-1000">
      
      {/* Left side: Form + List */}
      <div className="lg:col-span-2 space-y-8">
        {/* Deploy Panel */}
        <div className="glass-panel p-8 cyber-border transition-colors duration-1000">
          <h3 className="font-display tracking-[0.2em] text-white/50 mb-6">DEPLOY_NEW_OBJECTIVE</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                value={title} onChange={e=>setTitle(e.target.value)}
                placeholder="Objective Directive..."
                className={cn("bg-black/50 border border-white/10 rounded p-4 font-mono text-sm outline-none transition-colors", focusBorder)}
              />
              <select 
                value={cat} onChange={e=>setCat(e.target.value)}
                className="bg-black/50 border border-white/10 rounded p-4 font-mono text-sm text-white/70 appearance-none"
              >
                <option>Fitness</option><option>Code</option><option>Learning</option><option>Life</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              {['Easy', 'Medium', 'Hard'].map(d => (
                <button 
                  key={d} onClick={() => setDiff(d)}
                  className={cn(
                    "flex-1 py-3 rounded border font-mono text-xs tracking-widest transition-all",
                    diff === d ? `${bgColor}/20 ${borderCol} ${textColor} ${glowText}` : "border-white/10 text-white/40 hover:bg-white/5"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeploy}
              className={cn("w-full py-4 rounded font-display font-bold text-lg tracking-widest text-white transition-colors duration-1000",
                theme === 'cyan' ? "bg-gradient-to-r from-brand-cyan to-blue-600 shadow-[0_0_30px_rgba(129,236,255,0.4)]" : "bg-gradient-to-r from-brand-pink to-purple-600 shadow-[0_0_30px_rgba(233,102,255,0.4)]"
              )}
            >
              INITIATE_TASK
            </motion.button>
          </div>
        </div>

        {/* Objectives List */}
        <div className="glass-panel p-8">
          <h3 className="font-display tracking-[0.2em] text-white/50 mb-6">TASK ACCOMPLISHED</h3>
          {tasks.length === 0 ? <p className="font-mono text-xs text-white/30">NO TASKS FOUND</p> : (
            <div className="space-y-4">
              {tasks.map(t => (
                <div key={t.id} className="group flex justify-between border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] p-4 rounded cyber-border items-center transition-colors">
                  <div>
                    <div className={cn("font-mono text-sm transition-colors", textColor)}>{t.title}</div>
                    <div className="text-[10px] uppercase font-mono tracking-widest text-white/40 mt-1">{t.category} // {t.difficulty}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="font-mono font-bold text-lg">+{t.points} XP</div>
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="text-white/20 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: XP Progression Panel */}
      <div className="lg:col-span-1">
        <div className="glass-panel p-8 cyber-border h-full relative overflow-hidden transition-colors duration-1000">
           <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 transition-colors duration-1000", bgColor)} />
           
           <div className="text-center mb-10">
             <div className={cn("font-mono text-7xl font-bold tracking-tighter transition-colors duration-1000", glowText, textColor)}>
               {points.toString().padStart(4, '0')}
             </div>
             <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mt-2">TOTAL_STRENGTH_NODES</div>
           </div>

           <div className="relative border-l border-white/10 ml-6 pl-8 space-y-8 my-10">
             {[3, 2, 1].map(layerDiff => {
               const layerLvl = activeLevel + layerDiff
               return (
                 <div key={layerLvl} className="relative">
                   <div className="absolute -left-10 top-1 w-3 h-3 rounded-full bg-white/5 border border-white/20" />
                   <div className="font-mono text-xs text-white/30">LEVEL {layerLvl}</div>
                 </div>
               )
             })}
             {/* Active Node */}
             <div className="relative">
               <div className={cn("absolute -left-[41px] top-1 w-[18px] h-[18px] rounded-full transition-colors duration-1000", bgColor, shadowGlow)} />
               <div className={cn("glass p-3 border transition-colors duration-1000", `${borderCol}/20`)}>
                 <div className={cn("font-display text-sm tracking-widest uppercase transition-colors duration-1000", textColor)}>ACTIVE_{rank}</div>
                 <div className="font-mono text-xs text-white/70">CURRENTLY_LEVEL_{activeLevel}</div>
               </div>
             </div>
           </div>

           <div className="mt-auto">
             <div className="flex justify-between font-mono text-[10px] tracking-widest text-white/50 mb-2">
               <span>PROGRESSION</span>
               <span className={cn("transition-colors duration-1000", textColor)}>{progressPercent}% TIER FULL</span>
             </div>
             <div className="h-1 bg-white/10 rounded-full">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercent}%` }}
                 className={cn("h-full transition-colors duration-1000", bgColor, shadowGlow)}
               />
             </div>
           </div>
        </div>
      </div>

    </div>
  )
}
