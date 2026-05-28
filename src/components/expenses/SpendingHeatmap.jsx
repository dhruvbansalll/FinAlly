import { useMemo } from 'react'
import { useUserData } from '../../contexts/UserDataContext'

export default function SpendingHeatmap() {
  const { expenses } = useUserData()

  // Generate the last 90 days of spending data
  const heatmapData = useMemo(() => {
    const today = new Date()
    const data = {}

    // Initialize last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      data[key] = 0
    }

    // Aggregate expenses by date
    expenses.forEach((exp) => {
      if (exp.date && data.hasOwnProperty(exp.date)) {
        data[exp.date] += exp.amount || 0
      }
    })

    return data
  }, [expenses])

  // Get color intensity based on spending amount
  const getHeatColor = (amount, max) => {
    if (amount === 0) return 'bg-gray-100 dark:bg-gray-800'
    const intensity = Math.min(amount / (max * 0.7), 1)
    if (intensity < 0.2) return 'bg-lavender-100 dark:bg-lavender-900/30'
    if (intensity < 0.4) return 'bg-lavender-200 dark:bg-lavender-800/50'
    if (intensity < 0.6) return 'bg-lavender-300 dark:bg-lavender-700/60'
    if (intensity < 0.8) return 'bg-lavender-400 dark:bg-lavender-600/70'
    return 'bg-lavender-500 dark:bg-lavender-500/80'
  }

  const maxSpending = Math.max(...Object.values(heatmapData), 1)
  const dates = Object.keys(heatmapData)
  const weeks = []

  // Group dates into weeks
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  const hasData = dates.some((d) => heatmapData[d] > 0)

  if (!hasData) {
    return (
      <div className="card p-6 text-center">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">3-Month Spending Trend</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Track your daily spending patterns over the last 90 days</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Add expenses regularly to see your spending heatmap here. 🌿</p>
      </div>
    )
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const startDate = new Date(dates[0])
  const monthLabels = []
  let currentMonth = startDate.getMonth()

  for (let d of dates) {
    const date = new Date(d)
    const m = date.getMonth()
    if (m !== currentMonth) {
      monthLabels.push(`${months[m]}`)
      currentMonth = m
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">3-Month Spending Trend</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Track your daily spending patterns over the last 90 days</p>

      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-1 mb-4">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((date, dIdx) => {
                const amount = heatmapData[date]
                const dateObj = new Date(date)
                const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()]
                return (
                  <div
                    key={date}
                    className={`w-8 h-8 rounded-md ${getHeatColor(amount, maxSpending)} flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-lavender-400 dark:hover:ring-lavender-600 group relative`}
                    title={`${date}: ₹${amount.toLocaleString()}`}
                  >
                    <label
                      className="absolute left-10 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                    >
                      {date}: ₹{amount?.toLocaleString() || 0}
                    </label>
                    {dIdx === 0 && <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 absolute -top-5 left-1">{dayName}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 items-center text-xs pt-3 border-t border-lavender-100 dark:border-lavender-900/30">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-4 h-4 rounded-sm bg-lavender-200 dark:bg-lavender-800/50"></div>
            <div className="w-4 h-4 rounded-sm bg-lavender-400 dark:bg-lavender-600/70"></div>
            <div className="w-4 h-4 rounded-sm bg-lavender-500 dark:bg-lavender-500/80"></div>
          </div>
          <span className="text-gray-600 dark:text-gray-400">More</span>
        </div>
        <div className="ml-auto text-gray-500 dark:text-gray-400">
          Highest: ₹{maxSpending.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
