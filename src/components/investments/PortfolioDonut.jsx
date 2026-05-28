import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { PieChart as PieChartIcon } from 'lucide-react'

const COLORS = [
  '#b89dfc', // lavender
  '#67d8a4', // mint
  '#ff9db8', // blush
  '#ffbe76', // peach
  '#ffe8b3', // cream
  '#87ceeb', // sky
  '#dda0dd', // plum
  '#98d8c8', // sage
]

const TOTAL_ASSET_TYPES = 8

function formatCurrency(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n).toLocaleString()}`
}

export default function PortfolioDonut({ investments }) {
  const { chartData, totalValue, diversificationScore } = useMemo(() => {
    if (!investments?.length) {
      return { chartData: [], totalValue: 0, diversificationScore: 0 }
    }

    const byType = {}
    investments.forEach(inv => {
      const type = inv.type || 'Other'
      byType[type] = (byType[type] || 0) + (inv.currentValue || inv.amount || 0)
    })

    const chartData = Object.entries(byType)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const totalValue = chartData.reduce((s, d) => s + d.value, 0)
    const diversificationScore = Math.min(Object.keys(byType).length / TOTAL_ASSET_TYPES, 1)

    return { chartData, totalValue, diversificationScore }
  }, [investments])

  if (!investments?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-col items-center justify-center py-10"
      >
        <PieChartIcon className="w-10 h-10 text-lavender-200 dark:text-lavender-800 mb-3" />
        <p className="text-sm text-gray-400">Add investments to see your portfolio breakdown</p>
      </motion.div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    const pct = ((value / totalValue) * 100).toFixed(1)
    return (
      <div className="card p-3 !rounded-xl shadow-lg text-xs">
        <p className="font-bold text-gray-700 dark:text-gray-200">{name}</p>
        <p className="text-gray-500">{formatCurrency(value)} ({pct}%)</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-4 h-4 text-lavender-400" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">Portfolio Breakdown</h3>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-400 font-medium">Total Value</p>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {chartData.map((d, i) => {
              const pct = ((d.value / totalValue) * 100).toFixed(1)
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{d.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{pct}%</span>
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t border-lavender-100 dark:border-lavender-800/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Diversification Score</span>
              <span className="text-xs font-bold text-lavender-600">
                {Math.round(diversificationScore * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-lavender-100 dark:bg-lavender-900/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${diversificationScore * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-mint-400"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {chartData.length} of {TOTAL_ASSET_TYPES} asset types used
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
