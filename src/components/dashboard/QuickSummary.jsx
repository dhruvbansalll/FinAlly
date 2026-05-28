import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { Wallet, PiggyBank, ShieldCheck, TrendingDown } from 'lucide-react'
import { useUserData } from '../../contexts/UserDataContext'

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-soft-md border border-lavender-100 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{payload[0].name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
          {payload[0].value}%
        </p>
      </div>
    )
  }
  return null
}

export default function QuickSummary() {
  const { profile, totalExpenses, totalSavings, goals } = useUserData()

  const salary = profile?.salary || 0
  const savingsTarget = profile?.monthlySavingsTarget || 0
  const totalGoalSaved = goals.reduce((sum, g) => sum + (g.current || 0), 0)
  const totalGoalTarget = goals.reduce((sum, g) => sum + (g.target || 0), 0)
  const emergencyProgress = savingsTarget > 0 ? Math.min(Math.round((totalSavings / (savingsTarget * 3)) * 100), 100) : 0

  const spentPct = salary > 0 ? Math.round((totalExpenses / salary) * 100) : 0
  const savedPct = salary > 0 ? Math.round((totalSavings / salary) * 100) : 0
  const investedPct = Math.max(0, 100 - spentPct - savedPct)

  const spendVsIncome = [
    { name: 'Spent', value: spentPct || 0, color: '#ffaac2' },
    { name: 'Saved', value: savedPct || 0, color: '#b89dfc' },
    { name: 'Other', value: investedPct || 100, color: '#86efbf' },
  ]

  const savingsRate = salary > 0 ? Math.round((totalSavings / salary) * 100) : 0

  const stats = [
    {
      icon: PiggyBank,
      label: 'Savings Rate',
      value: salary > 0 ? `${savingsRate}%` : '—',
      sub: salary > 0 ? `of ₹${salary.toLocaleString()} salary` : 'Set salary in profile',
      color: 'lavender',
      bg: 'bg-lavender-50',
      iconBg: 'bg-lavender-100',
      iconColor: 'text-lavender-500',
    },
    {
      icon: ShieldCheck,
      label: 'Emergency Fund',
      value: formatCurrency(totalSavings),
      sub: savingsTarget > 0 ? `${emergencyProgress}% of 3-month goal` : 'Set target in profile',
      color: 'mint',
      bg: 'bg-mint-50',
      iconBg: 'bg-mint-100',
      iconColor: 'text-mint-600',
      progress: emergencyProgress,
    },
    {
      icon: TrendingDown,
      label: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      sub: `${goals.length} active goals`,
      color: 'blush',
      bg: 'bg-blush-50',
      iconBg: 'bg-blush-100',
      iconColor: 'text-blush-500',
    },
    {
      icon: Wallet,
      label: 'Goals Progress',
      value: totalGoalTarget > 0 ? `${Math.round((totalGoalSaved / totalGoalTarget) * 100)}%` : '—',
      sub: totalGoalTarget > 0 ? `${formatCurrency(totalGoalSaved)} of ${formatCurrency(totalGoalTarget)}` : 'Add a goal to track',
      color: 'peach',
      bg: 'bg-peach-50',
      iconBg: 'bg-peach-100',
      iconColor: 'text-peach-600',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-300 font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-0.5">{stat.value}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-400">{stat.sub}</p>
            {stat.progress !== undefined && (
              <div className="mt-2 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full transition-all duration-700"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Spend vs Income Donut */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Spend vs Income</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendVsIncome}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {spendVsIncome.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-3">
            {spendVsIncome.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">{item.name}</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
