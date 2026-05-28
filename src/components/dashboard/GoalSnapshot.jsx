import { Target } from 'lucide-react'
import { useUserData } from '../../contexts/UserDataContext'

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default function GoalSnapshot() {
  const { goals } = useUserData()

  const topGoals = goals.slice(0, 3)

  const colors = [
    { bar: 'from-lavender-400 to-lavender-500', bg: 'bg-lavender-50' },
    { bar: 'from-blush-400 to-blush-500', bg: 'bg-blush-50' },
    { bar: 'from-mint-400 to-mint-500', bg: 'bg-mint-50' },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
        <Target className="w-4 h-4 text-lavender-400" />
        Top Goals
      </h3>
      {topGoals.length === 0 ? (
        <div className="card p-4">
          <p className="text-sm text-gray-400 text-center">No goals yet. Add one from the Goals page!</p>
        </div>
      ) : (
        topGoals.map((goal, i) => {
          const progress = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0
          const c = colors[i % colors.length]
          return (
            <div key={goal.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl ${c.bg} flex items-center justify-center text-lg`}>
                  🎯
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{goal.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">
                    {formatCurrency(goal.current || 0)} of {formatCurrency(goal.target)}
                  </p>
                  <div className="mt-2 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-lavender-500 font-semibold mt-1">{progress}% complete</p>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
