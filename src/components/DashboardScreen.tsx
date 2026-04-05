import { CyberCard } from './CyberCard'
import { PulseTimer } from './PulseTimer'
import { CyberFeed } from './CyberFeed'
import { Task } from '../lib/types'

interface DashProps {
  dailyTasks: Task[]
  totalTasks: Task[]
  ajayPoints: number
  selvaaPoints: number
  globalRush: boolean
}

export function DashboardScreen({ dailyTasks, totalTasks, ajayPoints, selvaaPoints, globalRush }: DashProps) {
  const ajayTasksData = dailyTasks.filter(t => t.user_id === 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88')
  const selvaaTasksData = dailyTasks.filter(t => t.user_id === '7d01b3e6-3d10-41fe-a22d-1c26d43de0df')

  const ajayTasksCount = ajayTasksData.length
  const selvaaTasksCount = selvaaTasksData.length

  // Dynamically calculate streak by observing all historical actions to keep streak alive
  const ajayStreak = new Set(totalTasks.filter(t => t.user_id === 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88').map(t => new Date(t.created_at).toDateString())).size
  const selvaaStreak = new Set(totalTasks.filter(t => t.user_id === '7d01b3e6-3d10-41fe-a22d-1c26d43de0df').map(t => new Date(t.created_at).toDateString())).size

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 fade-in">
      <PulseTimer globalRush={globalRush} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CyberCard name="Ajay" color="cyan" points={ajayPoints} streak={ajayStreak} taskCount={ajayTasksCount} />
        <CyberCard name="Selvaa" color="pink" points={selvaaPoints} streak={selvaaStreak} taskCount={selvaaTasksCount} />
      </div>
      <CyberFeed tasks={dailyTasks} />
    </div>
  )
}
