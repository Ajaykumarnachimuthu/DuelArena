import { LayoutDashboard, Target, BarChart2, Crown, Archive, UserCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface BottomNavProps {
  currentTab: string
  setTab: (tab: string) => void
  theme: 'cyan' | 'pink'
}

export function BottomNav({ currentTab, setTab, theme }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'tasks', icon: Target },
    { id: 'history', icon: Archive },
    { id: 'analytics', icon: BarChart2 },
    { id: 'profile', icon: UserCircle2 },
    { id: 'champion', icon: Crown },
  ]

  const activeColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const activeBg = theme === 'cyan' ? 'bg-brand-cyan/20' : 'bg-brand-pink/20'

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-3xl border-t border-white/5 z-50 flex items-center justify-around px-2 transition-colors duration-1000 pb-safe">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className="relative p-3 flex items-center justify-center rounded-xl transition-all"
          >
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-active"
                className={cn("absolute inset-0 rounded-xl transition-colors duration-1000", activeBg)}
              />
            )}
            <Icon className={cn("w-5 h-5 relative z-10 transition-colors duration-300", isActive ? activeColor : "text-white/40")} />
            {isActive && (
               <div className={cn("absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-colors duration-1000", theme === 'cyan' ? 'bg-brand-cyan shadow-[0_0_10px_#81ecff]' : 'bg-brand-pink shadow-[0_0_10px_#e966ff]')} />
            )}
          </button>
        )
      })}
    </div>
  )
}
