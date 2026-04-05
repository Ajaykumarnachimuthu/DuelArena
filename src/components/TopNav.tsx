import { motion } from 'framer-motion'
import { Zap, Bell, UserCircle2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface TopNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
  currentUser: string;
  setCurrentUser: (u: string) => void;
  globalRush: boolean;
  setGlobalRush: (r: boolean) => void;
  theme: 'cyan' | 'pink';
}

export function TopNav({ currentTab, setTab, currentUser, setCurrentUser, globalRush, setGlobalRush, theme }: TopNavProps) {
  const tabs = ['dashboard', 'tasks', 'history', 'analytics', 'profile', 'champion']

  return (
    <div className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-3xl sticky top-0 z-30 flex items-center justify-between px-6 transition-colors duration-1000">
      <div className="font-display font-black tracking-widest text-lg">
        HABIT<span className={cn("transition-colors duration-1000", theme === 'cyan' ? "text-brand-cyan" : "text-brand-pink")}>_ARENA</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={cn(
              "text-xs font-mono tracking-widest uppercase relative py-2 transition-colors",
              currentTab === tab ? "text-white" : "text-white/40 hover:text-white/80"
            )}
          >
            {tab}
            {currentTab === tab && (
              <motion.div layoutId="topnav-active" className={cn("absolute left-0 right-0 bottom-0 h-0.5 transition-colors duration-1000", theme === 'cyan' ? "bg-brand-cyan shadow-[0_0_10px_#81ecff]" : "bg-brand-pink shadow-[0_0_10px_#e966ff]")} />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {/* Profile Switcher */}
        <button 
          onClick={() => setCurrentUser(currentUser === 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88' ? '7d01b3e6-3d10-41fe-a22d-1c26d43de0df' : 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono tracking-widest uppercase hover:bg-white/10 transition-colors"
        >
          <UserCircle2 className="w-4 h-4" />
          <span className={theme === 'cyan' ? "text-brand-cyan" : "text-brand-pink"}>
            {theme === 'cyan' ? 'Ajay' : 'Selvaa'}
          </span>
        </button>

        <button className="text-white/50 hover:text-white transition-colors relative">
           <Bell className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => setGlobalRush(!globalRush)}
          className={cn(
             "flex items-center justify-center gap-2 px-3 md:px-4 py-1.5 md:py-1.5 h-8 md:h-auto rounded-full font-bold tracking-widest transition-colors",
             globalRush ? "border border-brand-red text-brand-red bg-brand-red/20 shadow-[0_0_15px_rgba(255,112,118,0.5)]" : "border border-brand-red/50 bg-brand-red/5 text-brand-red/50 hover:bg-brand-red/20"
          )}
        >
          <Zap className="w-3.5 h-3.5 md:w-3 md:h-3" />
          <span className="hidden md:inline text-xs">RUSH_MODE</span>
        </button>
      </div>
    </div>
  )
}
