import { motion } from 'framer-motion'
import { Task } from '../lib/types'
import { cn } from '../lib/utils'
import { Flame, Code, Dumbbell, Zap } from 'lucide-react'

interface TaskFeedProps {
  tasks: Task[]
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  Fitness: <Dumbbell className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
  Learning: <Zap className="w-4 h-4" />,
  Life: <Flame className="w-4 h-4" />
}

export function TaskFeed({ tasks }: TaskFeedProps) {
  return (
    <div className="glass-panel p-6 h-[400px] overflow-y-auto flex flex-col gap-3">
      <h3 className="font-display font-bold text-xl mb-2 sticky top-0 bg-black/50 backdrop-blur-md p-2 rounded z-10">Live Feed</h3>
      {tasks.length === 0 && <p className="text-white/40 text-sm text-center mt-10">No tasks logged yet today.</p>}
      {tasks.map((task, i) => {
        const isAjay = task.user_name === 'Ajay'
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: isAjay ? -50 : 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: i * 0.1 }}
            className={cn(
              "p-4 rounded-xl border flex items-center justify-between",
              isAjay ? "border-brand-cyan/20 bg-brand-cyan/5" : "border-brand-pink/20 bg-brand-pink/5"
            )}
          >
             <div className="flex items-center gap-3">
               <div className={cn(
                 "p-2 rounded-lg",
                 isAjay ? "bg-brand-cyan/20 text-brand-cyan" : "bg-brand-pink/20 text-brand-pink"
               )}>
                 {CAT_ICONS[task.category] || <Zap className="w-4 h-4"/>}
               </div>
               <div>
                  <div className="font-bold text-sm">{task.title}</div>
                  <div className="text-xs text-white/50 flex gap-2">
                    <span className={isAjay ? "text-brand-cyan" : "text-brand-pink"}>{task.user_name}</span>
                    <span>•</span>
                    <span>{task.difficulty}</span>
                  </div>
               </div>
             </div>
             <div className="font-mono font-bold text-lg text-white">
               +{task.points} 
             </div>
          </motion.div>
        )
      })}
    </div>
  )
}
