import { useNavigate } from 'react-router-dom'
import { Wallet, AlertTriangle, Sparkles, Calendar, TrendingDown } from 'lucide-react'
import { useUserData } from '../../contexts/UserDataContext'
import { useAppSettings } from '../../contexts/AppSettingsContext'
import { formatCurrencyByCode } from '../../utils/currency'

function getThresholdInfo(pct) {
  if (pct > 100) return {
    message: "You've exceeded your monthly budget — don't worry, we can fix this together. 💜",
    color: 'blush',
    barColor: 'from-blush-400 to-blush-500',
    bgGrad: 'from-blush-50 to-white',
    icon: AlertTriangle,
    iconColor: 'text-blush-500',
  }
  if (pct >= 90) return {
    message: "You're very close to your budget limit — want me to help optimise spending? 🌸",
    color: 'peach',
    barColor: 'from-peach-400 to-blush-400',
    bgGrad: 'from-peach-50 to-white',
    icon: AlertTriangle,
    iconColor: 'text-peach-500',
  }
  if (pct >= 70) return {
    message: "You're getting close to your limit — would you like tips to manage the rest of the month? 🌿",
    color: 'peach',
    barColor: 'from-peach-400 to-peach-500',
    bgGrad: 'from-peach-50/50 to-white',
    icon: Sparkles,
    iconColor: 'text-peach-500',
  }
  if (pct >= 50) return {
    message: "You've used half your spending budget this month. You're doing well — keep it up! ✨",
    color: 'lavender',
    barColor: 'from-lavender-400 to-lavender-500',
    bgGrad: 'from-lavender-50/50 to-white',
    icon: Sparkles,
    iconColor: 'text-lavender-500',
  }
  return {
    message: "Great start to the month — you're spending mindfully! 🌱",
    color: 'mint',
    barColor: 'from-mint-400 to-mint-500',
    bgGrad: 'from-mint-50/50 to-white',
    icon: Sparkles,
    iconColor: 'text-mint-500',
  }
}

export default function BudgetWallet() {
  const { profile, currentMonthExpenses, expenses } = useUserData()
  const { currency } = useAppSettings()
  const navigate = useNavigate()
  const budget = profile?.monthlyBudget || 0

  if (budget <= 0) {
    return (
      <div className="card bg-gradient-to-br from-lavender-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lavender-100 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-lavender-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">Monthly Budget Wallet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 leading-relaxed">
              Set a monthly spending limit in your profile to track your budget in real time. It helps you stay in control — gently and clearly. 💜
            </p>
            <button
              onClick={() => navigate('/profile', { state: { editBudget: true } })}
              className="mt-3 px-3 py-1.5 rounded-xl bg-lavender-100 text-lavender-700 text-xs font-semibold hover:bg-lavender-200 transition-colors"
            >
              Set Budget →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const spent = currentMonthExpenses
  const remaining = Math.max(budget - spent, 0)
  const pct = Math.round((spent / budget) * 100)
  const barPct = Math.min(pct, 100)
  const threshold = getThresholdInfo(pct)
  const ThresholdIcon = threshold.icon

  // Daily allowance calculation
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate() + 1
  const dailyAllowance = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0

  // Top spending category this month
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(monthKey))
  const catTotals = {}
  monthExpenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0) })
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]

  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className={`card bg-gradient-to-br ${threshold.bgGrad} overflow-hidden relative`}>
      {/* Decorative blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-lavender-200/20 to-blush-200/10 rounded-full blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-lavender-400 to-blush-300 flex items-center justify-center shadow-soft">
              <Wallet className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Monthly Budget Wallet</h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{monthName} {now.getFullYear()}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
            pct > 100 ? 'bg-blush-100 text-blush-600' :
            pct >= 70 ? 'bg-peach-100 text-peach-600' :
            'bg-mint-100 text-mint-600'
          }`}>
            {pct}% used
          </span>
        </div>

        {/* Budget Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-900">₹{spent.toLocaleString()} spent</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-900">₹{budget.toLocaleString()} budget</span>
          </div>
          <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${threshold.barColor} rounded-full transition-all duration-700`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-gray-700/50 border border-white/80 dark:border-gray-600/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">Remaining</p>
            <p className={`text-lg font-bold mt-0.5 ${pct > 100 ? 'text-blush-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {pct > 100 ? `-₹${(spent - budget).toLocaleString()}` : `₹${remaining.toLocaleString()}`}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-gray-700/50 border border-white/80 dark:border-gray-600/50">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">Daily Limit</p>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">₹{dailyAllowance.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">{daysLeft} days left</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-gray-700/50 border border-white/80 dark:border-gray-600/50">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">Top Spend</p>
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{topCategory ? topCategory[0] : '—'}</p>
            {topCategory && <p className="text-[10px] text-gray-400">₹{topCategory[1].toLocaleString()}</p>}
          </div>
        </div>

        {/* Threshold Remark */}
        <div className={`flex items-start gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-gray-700/50 border border-${threshold.color}-100/50 dark:border-gray-600/50`}>
          <ThresholdIcon className={`w-4 h-4 ${threshold.iconColor} flex-shrink-0 mt-0.5`} />
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{threshold.message}</p>
        </div>
      </div>
    </div>
  )
}
