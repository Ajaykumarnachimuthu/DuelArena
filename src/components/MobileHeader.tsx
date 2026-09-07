import { UserCircle2, Zap, Trophy, LayoutDashboard, Target, Archive, BarChart2, Crown, Calendar } from 'lucide-react'
import { cn } from '../lib/utils'

interface MobileHeaderProps {
  currentTab: string
  theme: 'cyan' | 'pink'
  currentUser: string
  setCurrentUser: (u: string) => void
  points: number
  globalRush: boolean
  setGlobalRush: (r: boolean) => void
}

export function MobileHeader({
  currentTab,
  theme,
  currentUser,
  setCurrentUser,
  points,
  globalRush,
  setGlobalRush
}: MobileHeaderProps) {
  const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
  const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'
  const isAjay = currentUser === AJAY_ID
  const userName = isAjay ? 'AJAY' : 'SELVAA'

  const titles: Record<string, { label: string; icon: any }> = {
    dashboard: { label: 'ARENA_COMMAND', icon: LayoutDashboard },
    tasks: { label: 'TASK_WHITEBOARD', icon: Target },
    events: { label: 'EVENT_DIRECTIVES', icon: Calendar },
    history: { label: 'COMBAT_LOGS', icon: Archive },
    analytics: { label: 'TELEMETRY', icon: BarChart2 },
    profile: { label: 'OPERATOR_MATRIX', icon: UserCircle2 },
    champion: { label: 'HALL_OF_FAME', icon: Crown }
  }

  const activeMeta = titles[currentTab] || { label: 'HABIT_ARENA', icon: LayoutDashboard }
  const Icon = activeMeta.icon

  const activeColor = theme === 'cyan' ? 'text-brand-cyan' : 'text-brand-pink'
  const badgeBorder = theme === 'cyan' ? 'border-brand-cyan/40 bg-brand-cyan/10' : 'border-brand-pink/40 bg-brand-pink/10'

  return (
    <header className="md:hidden sticky top-0 z-40 w-full bg-black/80 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center justify-between transition-colors duration-500">
      {/* Title & Screen Icon */}
      <div className="flex items-center gap-2.5">
        <div className={cn("p-1.5 rounded-lg border border-white/10 bg-white/5", activeColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h1 className="font-display text-xs tracking-wider text-white font-bold leading-none">
            {activeMeta.label}
          </h1>
          <span className="font-mono text-[9px] text-white/40 tracking-widest uppercase">
            LIVE_DUEL_ARENA
          </span>
        </div>
      </div>

      {/* User Switcher & XP Pill */}
      <div className="flex items-center gap-2">
        {/* Global Rush Toggle */}
        <button
          onClick={() => setGlobalRush(!globalRush)}
          className={cn(
            "p-2 rounded-xl border transition-all text-[10px] font-mono flex items-center gap-1",
            globalRush
              ? "border-brand-red text-brand-red bg-brand-red/20 shadow-[0_0_10px_rgba(255,112,118,0.5)]"
              : "border-brand-red/40 bg-brand-red/5 text-brand-red/60"
          )}
          title="Global Rush Mode"
        >
          <Zap className={cn("w-3.5 h-3.5", globalRush ? "animate-pulse" : "")} />
        </button>

        {/* User Pill Button */}
        <button
          onClick={() => setCurrentUser(isAjay ? SELVAA_ID : AJAY_ID)}
          className={cn("px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-mono font-bold", badgeBorder, activeColor)}
        >
          <UserCircle2 className="w-3.5 h-3.5" />
          <span>{userName}</span>
          <span className="text-[10px] opacity-75 text-white/80 border-l border-white/20 pl-1.5 flex items-center gap-0.5">
            <Trophy className="w-2.5 h-2.5 text-amber-400" />
            {points}
          </span>
        </button>
      </div>
    </header>
  )
}
