import { LayoutDashboard, Target, BarChart2, Crown, Archive, UserCircle2, Zap } from 'lucide-react'
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

export function BottomNav({ currentTab, setTab, theme, currentUser, setCurrentUser, globalRush, setGlobalRush }: BottomNavProps) {
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

  const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
  const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 h-16 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl z-50 flex items-center px-2 transition-colors duration-1000 overflow-x-auto snap-x hide-scrollbar">
      
      {/* Route Tabs Array (Swipeable) */}
      <div className="flex items-center gap-2 px-2 snap-mandatory snap-x flex-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className="relative p-3 flex-shrink-0 flex items-center justify-center rounded-xl transition-all snap-center"
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

        {/* Separator inside the scroll map */}
        <div className="w-[1px] h-8 bg-white/10 flex-shrink-0 mx-2" />

        {/* Action Toggles inside Native Scroll */}
        <button 
          onClick={() => setCurrentUser(currentUser === AJAY_ID ? SELVAA_ID : AJAY_ID)}
          className={cn("p-3 flex-shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 snap-center transition-colors", activeColor)}
        >
          <UserCircle2 className="w-5 h-5 relative z-10" />
        </button>

        <button 
          onClick={() => setGlobalRush(!globalRush)}
          className={cn(
             "p-3 flex-shrink-0 flex items-center justify-center rounded-xl border snap-center transition-colors",
             globalRush ? "border-brand-red text-brand-red bg-brand-red/20 shadow-[0_0_15px_rgba(255,112,118,0.5)]" : "border-brand-red/50 bg-brand-red/5 text-brand-red/50 hover:bg-brand-red/20"
          )}
        >
          <Zap className={cn("w-5 h-5 relative z-10", globalRush ? "animate-pulse" : "")} />
        </button>
      </div>

    </div>
  )
}
