import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import { Task } from './lib/types'
import { saveTaskSubtasks, saveTaskMeta, isTaskCompleted } from './lib/canvasUtils'
import { subscribeRealtimeSync } from './lib/realtimeSync'
import { Sidebar } from './components/Sidebar'
import { DashboardScreen } from './components/DashboardScreen'
import { TaskScreen } from './components/TaskScreen'
import { AnalyticsScreen } from './components/AnalyticsScreen'
import { ChampionScreen } from './components/ChampionScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { BottomNav } from './components/BottomNav'
import { MobileHeader } from './components/MobileHeader'
import { BellRing } from 'lucide-react'

// These UUIDs represent the actual users fetched from the live database
const AJAY_ID = 'd0536dfe-47ea-4525-97c6-5cf6e10f4e88'
const SELVAA_ID = '7d01b3e6-3d10-41fe-a22d-1c26d43de0df'

export default function App() {
  const [currentTab, setTab] = useState('dashboard')
  const [tasks, setTasks] = useState<Task[]>([]) 
  const [currentUser, setCurrentUser] = useState(AJAY_ID)
  const [globalRush, setGlobalRush] = useState(false)
  const [notification, setNotification] = useState<{ id: string, msg: string } | null>(null)
  const [, setSyncTick] = useState(0)

  const isTeamup = (t: Task) => t.category === 'Teamup' || t.difficulty === 'Teamup'

  // XP is earned ONLY when tasks are completed (Teamup tasks yield 300 XP to BOTH players)
  const ajayPoints = tasks.filter(t => (t.user_id === AJAY_ID || isTeamup(t)) && isTaskCompleted(t.id)).reduce((sum, t) => sum + t.points, 0) || 0
  const selvaaPoints = tasks.filter(t => (t.user_id === SELVAA_ID || isTeamup(t)) && isTaskCompleted(t.id)).reduce((sum, t) => sum + t.points, 0) || 0

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(500)
      if (data && !error) {
        setTasks(data as Task[])
      } else {
        console.error("Supabase fetch error", error)
      }
    }
    fetchTasks()
    
    // Cross-device Realtime Sync listener
    const unsubscribeSync = subscribeRealtimeSync(() => {
      // Trigger immediate UI re-render when another device broadcasts active / subtask changes
      setSyncTick(prev => prev + 1)
      fetchTasks()
    })

    // Realtime Subs
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        // Always refresh immediately to sync UI state for updates/deletes/inserts
        fetchTasks()
        
        // Handle Toast ONLY on INSERT
        if (payload.eventType === 'INSERT') {
          const t = payload.new as Task
          if (t.user_id !== currentUser) {
             const opponentName = isTeamup(t) ? 'Teamup' : t.user_id === AJAY_ID ? 'Ajay' : 'Selvaa'
             setNotification({ id: Math.random().toString(), msg: `${opponentName} directive: ${t.title} (+${t.points}XP)` })
          }
        }
      })
      .subscribe()
      
    return () => { 
      supabase.removeChannel(channel)
      unsubscribeSync()
    }
  }, [currentUser])

  // Clear toast after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleCreateTask = async (
    title: string, 
    difficultyStr: string, 
    cat: string, 
    duration?: number, 
    startTime?: string, 
    initialSubtasks?: string[]
  ) => {
    const validDbDifficulty = (difficultyStr === 'Teamup' || difficultyStr === 'Epic') ? 'Hard' : difficultyStr
    let points = 50
    if (difficultyStr === 'Medium') points = 100
    if (difficultyStr === 'Hard' || validDbDifficulty === 'Hard') points = 250
    if (cat === 'Teamup' || difficultyStr === 'Teamup') points = 300

    try {
      const { data, error } = await supabase.from('tasks').insert({
        user_id: currentUser,
        title,
        difficulty: validDbDifficulty,
        points,
        category: cat
      }).select()

      if (error) throw error

      if (data && data.length > 0) {
        const newTask = data[0] as Task
        if (initialSubtasks && initialSubtasks.length > 0) {
          const subtasksObjects = initialSubtasks.map((stTitle, i) => ({
            id: `sub_${newTask.id}_${i}`,
            title: stTitle,
            completed: false
          }))
          saveTaskSubtasks(newTask.id, subtasksObjects)
        }
        if (duration || startTime) {
          saveTaskMeta(newTask.id, { duration_minutes: duration || 45, start_time: startTime || '09:00 AM' })
        }
      }
    } catch (e) {
       console.error('Insert failed:', e)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const theme = currentUser === AJAY_ID ? 'cyan' : 'pink'

  const todayStr = new Date().toDateString()
  const todayAjayPoints = tasks.filter(t => new Date(t.created_at).toDateString() === todayStr && (t.user_id === AJAY_ID || isTeamup(t)) && isTaskCompleted(t.id)).reduce((s, t) => s + t.points, 0) || 0
  const todaySelvaaPoints = tasks.filter(t => new Date(t.created_at).toDateString() === todayStr && (t.user_id === SELVAA_ID || isTeamup(t)) && isTaskCompleted(t.id)).reduce((s, t) => s + t.points, 0) || 0

  return (
    <div className="flex min-h-screen bg-black">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-3"
          >
            <BellRing className={theme === 'cyan' ? "w-5 h-5 text-brand-cyan" : "w-5 h-5 text-brand-pink"} />
            <div className="font-mono text-sm">{notification.msg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Command Matrix */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={setTab} 
        points={currentUser === AJAY_ID ? ajayPoints : selvaaPoints} 
        theme={theme} 
        currentUser={currentUser} 
        setCurrentUser={setCurrentUser} 
        globalRush={globalRush} 
        setGlobalRush={setGlobalRush} 
      />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-hidden pb-safe">
         {/* Mobile Sticky Command Topbar */}
         <MobileHeader
           currentTab={currentTab}
           theme={theme}
           currentUser={currentUser}
           setCurrentUser={setCurrentUser}
           points={currentUser === AJAY_ID ? ajayPoints : selvaaPoints}
           globalRush={globalRush}
           setGlobalRush={setGlobalRush}
         />

         <div className={`absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b ${theme === 'cyan' ? 'from-brand-cyan/[0.02]' : 'from-brand-pink/[0.02]'} to-transparent pointer-events-none transition-colors duration-1000`} />
         
         <main className="flex-1 p-3 sm:p-6 md:p-8 pb-32 md:pb-8 overflow-y-auto relative z-10">
           {currentTab === 'dashboard' && (
             <DashboardScreen 
               dailyTasks={tasks.filter(t => new Date(t.created_at).toDateString() === todayStr)} 
               totalTasks={tasks}
               ajayPoints={todayAjayPoints} 
               selvaaPoints={todaySelvaaPoints} 
               globalRush={globalRush} 
             />
           )}
           {currentTab === 'tasks' && (
             <TaskScreen 
               tasks={tasks} 
               points={currentUser === AJAY_ID ? ajayPoints : selvaaPoints} 
               onSubmit={handleCreateTask} 
               onDelete={handleDeleteTask} 
               theme={theme} 
               currentUser={currentUser} 
             />
           )}
           {currentTab === 'history' && <HistoryScreen tasks={tasks} />}
           {currentTab === 'analytics' && <AnalyticsScreen tasks={tasks} />}
           {currentTab === 'profile' && <ProfileScreen tasks={tasks} currentUser={currentUser} points={currentUser === AJAY_ID ? ajayPoints : selvaaPoints} />}
           {currentTab === 'champion' && <ChampionScreen ajayPoints={todayAjayPoints} selvaaPoints={todaySelvaaPoints} />}
         </main>
         
         {/* Mobile Swipeable Command Matrix */}
         <BottomNav 
           currentTab={currentTab} 
           setTab={setTab} 
           theme={theme} 
           currentUser={currentUser} 
           setCurrentUser={setCurrentUser} 
           globalRush={globalRush} 
           setGlobalRush={setGlobalRush} 
         />
      </div>
    </div>
  )
}
