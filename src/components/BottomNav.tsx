import { LayoutDashboard, Target, BarChart2, Crown, Archive, UserCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface BottomNavProps {
  currentTab: string
  setTab: (tab: string) => void
  theme: 'cyan' | 'pink'
  currentUser: string
  setCurrentUser: (u: string) => void
  globalRush: boolean
  setGlobalRush: (r: boolean) => void
}

export function BottomNav({ currentTab, setTab, theme }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
    { id: 'tasks', icon: Target, label: 'Tasks' },
    { id: 'history', icon: Archive, label: 'Logs' },
    { id: 'analytics', icon: BarChart2, label: 'Data' },
    { id: 'profile', icon: UserCircle2, label: 'User' },
    { id: 'champion', icon: Crown, label: 'Champ' },
  ]

  const activeColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const activeBg = theme === 'cyan' ? 'bg-brand-cyan/20' : 'bg-brand-pink/20'

  return (
    <div className="md:hidden fixed bottom-4 left-3 right-3 h-14 bg-black/90 backdrop-blur-2xl border border-white/15 rounded-2xl z-50 p-1 shadow-[0_0_25px_rgba(0,0,0,0.9)] flex items-center justify-between">
      <div className="grid grid-cols-6 gap-1 w-full h-full">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className="relative h-full w-full flex flex-col items-center justify-center rounded-xl transition-all"
            >
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-active-pill"
                  className={cn("absolute inset-0 rounded-xl transition-colors duration-300 border border-white/10", activeBg)}
                />
              )}
              <Icon className={cn("w-4 h-4 relative z-10 transition-colors duration-300", isActive ? activeColor : "text-white/40")} />
              <span className={cn("text-[9px] font-mono leading-none mt-0.5 relative z-10 transition-colors duration-300", isActive ? "text-white font-bold" : "text-white/30")}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
