import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface TaskCreationFormProps {
  onSubmit: (title: string, diff: string, cat: string, player: string) => void;
}

export function TaskCreationForm({ onSubmit }: TaskCreationFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [title, setTitle] = useState('')
  const [diff, setDiff] = useState('Medium')
  const [cat, setCat] = useState('Fitness')
  const [player, setPlayer] = useState('Ajay')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if(!title) return;
    onSubmit(title, diff, cat, player)
    setTitle('')
    setIsOpen(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-white text-black p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform z-50 flex items-center justify-center font-bold"
      >
        <Plus className="w-6 h-6 mr-2" /> Log Task
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md relative"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold font-display mb-6">Log A Task</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Who completed it?</label>
                  <select 
                    value={player} onChange={e => setPlayer(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white appearance-none"
                  >
                    <option className="bg-black">Ajay</option>
                    <option className="bg-black">Selvaa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Task Title</label>
                  <input 
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand-cyan transition-colors"
                    placeholder="e.g. 100 Pushups"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Difficulty</label>
                    <select 
                      value={diff} onChange={e => setDiff(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white appearance-none"
                    >
                      <option className="bg-black">Easy (50 XP)</option>
                      <option className="bg-black">Medium (100 XP)</option>
                      <option className="bg-black">Hard (250 XP)</option>
                      <option className="bg-black">Epic (500 XP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Category</label>
                    <select 
                      value={cat} onChange={e => setCat(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white appearance-none"
                    >
                      <option className="bg-black">Fitness</option>
                      <option className="bg-black">Code</option>
                      <option className="bg-black">Learning</option>
                      <option className="bg-black">Life</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-white text-black font-bold py-3 mt-4 rounded-lg hover:bg-gray-200 transition-colors">
                  Submit Task
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
