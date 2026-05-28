import { motion } from 'framer-motion'
import {
  GraduationCap, Briefcase, Heart, Baby,
  PauseCircle, TrendingUp, Clock, Armchair,
} from 'lucide-react'

const LIFE_STAGES = [
  { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Learning & saving basics' },
  { id: 'early-career', label: 'Early Career', icon: Briefcase, desc: 'First job, building habits' },
  { id: 'newlywed', label: 'Newlywed', icon: Heart, desc: 'Joint planning & goals' },
  { id: 'new-parent', label: 'New Parent', icon: Baby, desc: 'Child\'s future planning' },
  { id: 'career-break', label: 'Career Break', icon: PauseCircle, desc: 'Maintaining finances' },
  { id: 'mid-career', label: 'Mid-Career', icon: TrendingUp, desc: 'Growth & rebalancing' },
  { id: 'pre-retirement', label: 'Pre-Retirement', icon: Clock, desc: 'Securing your future' },
  { id: 'retired', label: 'Retired', icon: Armchair, desc: 'Income & estate planning' },
]

export default function LifeStageSelector({ selected, onSelect }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-3">
        Select Your Life Stage
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        This helps us personalize investment advice for your specific situation
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {LIFE_STAGES.map((stage) => {
          const Icon = stage.icon
          const isActive = selected === stage.id
          return (
            <motion.button
              key={stage.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              layout
              onClick={() => onSelect(stage.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-lavender-100 to-blush-50 dark:from-lavender-900/40 dark:to-blush-900/20 border-lavender-300 dark:border-lavender-600 shadow-soft'
                  : 'border-lavender-100/50 dark:border-lavender-800/30 hover:border-lavender-200 dark:hover:border-lavender-700'
              }`}
              style={{ backgroundColor: isActive ? undefined : 'var(--surface-bg)' }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isActive
                  ? 'bg-lavender-500 text-white'
                  : 'bg-lavender-100 dark:bg-lavender-900/40 text-lavender-500 dark:text-lavender-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold whitespace-nowrap ${
                isActive ? 'text-lavender-700 dark:text-lavender-300' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {stage.label}
              </span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">{stage.desc}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
