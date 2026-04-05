import { motion } from 'framer-motion'
import { LayoutDashboard, Target, BarChart2, Crown, ChevronRight, Archive, UserCircle2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  points: number;
  theme: 'cyan' | 'pink';
}

export function Sidebar({ currentTab, setTab, points, theme }: SidebarProps) {
  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'tasks', label: 'TASKS', icon: Target },
    { id: 'history', label: 'HISTORY', icon: Archive },
    { id: 'analytics', label: 'ANALYTICS', icon: BarChart2 },
    { id: 'profile', label: 'PERSONAL', icon: UserCircle2 },
    { id: 'champion', label: 'DAILY_CHAMP', icon: Crown },
  ]

  const rank = points < 1000 ? 'ROOKIE' : points < 5000 ? 'ELITE_WARRIOR' : 'MONSTER'
  
  const textColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const glowText = theme === 'cyan' ? 'text-glow-cyan' : 'text-glow-pink'
  const bgColor = theme === 'cyan' ? 'bg-brand-cyan/20' : 'bg-brand-pink/20'
  const borderCol = theme === 'cyan' ? 'border-brand-cyan/50' : 'border-brand-pink/50'
  const glowShadow = theme === 'cyan' ? 'shadow-[0_0_10px_#81ecff]' : 'shadow-[0_0_10px_#e966ff]'

  return (
    <div className="w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-black/50 backdrop-blur-2xl flex flex-col z-40 hidden md:flex transition-colors duration-1000">
      
      {/* Profile Section */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl glow-avatar transition-colors", bgColor, borderCol, textColor)}>
            {theme === 'cyan' ? 'A' : 'S'}
          </div>
          <div>
            <div className={cn("font-display font-bold uppercase tracking-wider text-sm transition-colors", glowText)}>{theme === 'cyan' ? 'AJAY_COMMAND' : 'SELVAA_COMMAND'}</div>
            <div className="text-xs text-white/50 tracking-widest">{rank} // {points}XP</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left tracking-wider text-sm transition-all relative overflow-hidden",
                isActive ? `${textColor} ${bgColor}` : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div layoutId="sidebar-active" className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", bgColor, glowShadow)} />
              )}
              <Icon className="w-4 h-4" />
              <span className="font-mono">{tab.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </button>
          )
        })}
      </div>

    </div>
  )
}
