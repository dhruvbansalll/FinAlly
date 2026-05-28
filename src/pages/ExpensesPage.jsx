import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from 'recharts'
import {
  Receipt, ShoppingBag, Utensils, Home, Car, Heart,
  Sparkles, Plus, Trash2,
} from 'lucide-react'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'
import BudgetWallet from '../components/dashboard/BudgetWallet'
import SpendingHeatmap from '../components/expenses/SpendingHeatmap'
import toast from 'react-hot-toast'

const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Shopping', 'Transport', 'Self-care', 'Others']

const CATEGORY_CONFIG = {
  Housing: { color: '#b89dfc', icon: Home },
  Food: { color: '#ffaac2', icon: Utensils },
  Shopping: { color: '#86efbf', icon: ShoppingBag },
  Transport: { color: '#ffc182', icon: Car },
  'Self-care': { color: '#d4c5fe', icon: Heart },
  Others: { color: '#ffd1de', icon: Receipt },
}

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-soft-md border border-lavender-100 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{payload[0].name}</p>
        <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export default function ExpensesPage() {
  const { currentUser } = useAuth()
  const { profile, currentMonthExpenses } = useUserData()
  const [expenses, setExpenses] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ amount: '', category: 'Food', date: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setExpenses(items)
      setLoadingExpenses(false)
    })
    return unsubscribe
  }, [currentUser])

  async function handleAddExpense(e) {
    e.preventDefault()
    if (!formData.amount || !formData.date) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'expenses'), {
        userId: currentUser.uid,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description,
        createdAt: serverTimestamp(),
      })
      setFormData({ amount: '', category: 'Food', date: '', description: '' })
      setShowForm(false)
      toast.success('Expense added! 🌸')
      // Toast-based budget alert
      const budget = profile?.monthlyBudget || 0
      if (budget > 0) {
        const pct = Math.round((currentMonthExpenses / budget) * 100)
        if (pct >= 100) toast.error("You've exceeded your monthly budget. Let's review together. 💜")
        else if (pct >= 90) toast("You're very close to your budget limit this month. 🌸", { icon: '⚠️' })
        else if (pct >= 70) toast("Heads up — you've used 70%+ of your monthly budget. 🌿", { icon: '💡' })
      }
    } catch (err) {
      console.error('Error adding expense:', err)
      toast.error('Failed to add expense. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteExpense(id) {
    try {
      await deleteDoc(doc(db, 'expenses', id))
      toast.success('Expense removed.')
    } catch (err) {
      console.error('Error deleting expense:', err)
      toast.error('Could not delete expense. Please try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="w-5 h-5 text-lavender-500" />
          <h1 className="page-title">Spending Tracker</h1>
        </div>
        <p className="page-subtitle">
          Track where your money goes — with gentle clarity. 🌸
        </p>
      </div>

      {/* Add Expense Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Add Expense</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-3.5 h-3.5" /> {showForm ? 'Cancel' : 'New Expense'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              required
              aria-label="Amount in rupees"
              placeholder="Amount (₹)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field text-sm"
            />
            <select
              aria-label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              required
              aria-label="Date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field text-sm"
            />
            <input
              type="text"
              aria-label="Description"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field text-sm"
            />
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? <Spinner size="sm" /> : 'Add'}
            </button>
          </form>
        )}
      </div>

      {/* Monthly Budget Wallet */}
      <div>
        <BudgetWallet />
      </div>

      {/* 3-Month Spending Heatmap */}
      <div>
        <SpendingHeatmap />
      </div>

      {/* Expenses Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Your Expenses</h3>
        {loadingExpenses ? (
          <Spinner className="py-8" label="Loading expenses…" />
        ) : expenses.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No expenses yet. Add your first one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Expenses list">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Category</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Description</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b hover:bg-lavender-50/30 dark:hover:bg-lavender-900/20 transition-colors" style={{ borderColor: 'var(--card-border)' }}>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{exp.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-xl text-[11px] font-semibold bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-lavender-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{exp.description || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-800 dark:text-gray-100">₹{exp.amount?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        aria-label={`Delete expense: ${exp.description || exp.category}`}
                        className="p-1 rounded-lg hover:bg-blush-50 dark:hover:bg-blush-900/20 text-gray-400 hover:text-blush-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Tracked</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">₹{expenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{expenses.length} transactions</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Daily Average</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            ₹{expenses.length > 0 ? Math.round(expenses.reduce((s, e) => s + (e.amount || 0), 0) / Math.max(new Set(expenses.map((e) => e.date)).size, 1)).toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Across all categories</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Top Category</p>
          <p className="text-xl font-bold text-lavender-600 dark:text-lavender-400 mt-1">
            {(() => {
              const catTotals = {}
              expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0) })
              const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
              return sorted.length > 0 ? sorted[0][0] : '—'
            })()}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Highest spending</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Categories Used</p>
          <p className="text-xl font-bold text-mint-600 dark:text-mint-400 mt-1">{new Set(expenses.map((e) => e.category)).size}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Keep tracking! 🌟</p>
        </div>
      </div>

      {/* Category Breakdown (from your tracked expenses) */}
      {expenses.length > 0 && (() => {
        const catTotals = {}
        expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0) })
        const dynamicCategories = Object.entries(catTotals).map(([name, value]) => ({
          name,
          value,
          color: CATEGORY_CONFIG[name]?.color || '#b89dfc',
          icon: CATEGORY_CONFIG[name]?.icon || Receipt,
        }))
        const totalExpense = dynamicCategories.reduce((s, c) => s + c.value, 0)
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Breakdown</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dynamicCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {dynamicCategories.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {dynamicCategories.map((cat) => {
                    const pct = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0
                    return (
                      <div key={cat.name} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '22' }}>
                          <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">{cat.name}</span>
                            <span className="text-xs font-bold text-gray-700">₹{cat.value.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1 bg-gray-100 rounded-full mt-1">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend</h3>
              {(() => {
                const monthlyMap = {}
                expenses.forEach((e) => {
                  if (!e.date) return
                  const d = new Date(e.date)
                  const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
                  monthlyMap[key] = (monthlyMap[key] || 0) + (e.amount || 0)
                })
                const monthlyTrend = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }))
                if (monthlyTrend.length < 2) return <p className="text-sm text-gray-400 text-center py-8">Add more expenses across different months to see trends.</p>
                return (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend}>
                        <defs>
                          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b89dfc" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#b89dfc" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3eeff" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                        <Tooltip
                          contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e9e0ff', borderRadius: '12px', fontSize: '12px' }}
                          formatter={(val) => [`₹${val.toLocaleString()}`, 'Spent']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#b89dfc" strokeWidth={2.5} fill="url(#expenseGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

      {/* Insight */}
      <div className="card border" style={{ background: 'linear-gradient(to right, var(--app-bg), var(--surface-bg))', borderColor: 'var(--card-border)' }}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-mint-500 dark:text-mint-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Spending Insight ✨</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {expenses.length > 0
                ? 'Keep tracking your expenses to see patterns emerge. Small shifts make a big difference over time. 🌿'
                : 'Start adding your expenses above to get personalized spending insights! 🌿'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
