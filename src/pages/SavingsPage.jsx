import { useState } from 'react'
import { PiggyBank, Plus, Trash2, Calendar } from 'lucide-react'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'

const SAVING_CATEGORIES = ['Emergency Fund', 'Investment', 'Fixed Deposit', 'Recurring Deposit', 'Mutual Fund', 'Other']

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default function SavingsPage() {
  const { savings, addSaving, removeSaving, totalSavings, profile, loading } = useUserData()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ amount: '', category: 'Emergency Fund', date: '', description: '' })

  async function handleAddSaving(e) {
    e.preventDefault()
    if (!formData.amount || !formData.date) return
    setSubmitting(true)
    try {
      await addSaving({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description,
      })
      setFormData({ amount: '', category: 'Emergency Fund', date: '', description: '' })
      setShowForm(false)
    } catch (err) {
      console.error('Error adding saving:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const savingsTarget = profile?.monthlySavingsTarget || 0
  const salary = profile?.salary || 0
  const savingsRate = salary > 0 ? Math.round((totalSavings / salary) * 100) : 0

  // Group savings by category
  const catTotals = {}
  savings.forEach((s) => {
    catTotals[s.category] = (catTotals[s.category] || 0) + (s.amount || 0)
  })

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank className="w-5 h-5 text-lavender-500" />
          <h1 className="text-2xl font-bold text-gray-800">Savings</h1>
        </div>
        <p className="text-sm text-gray-400">
          Track your savings and watch your wealth grow. 🌱
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-mint-50 to-white">
          <p className="text-xs text-gray-500 dark:text-gray-100 font-medium">Total Saved</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{formatCurrency(totalSavings)}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-100 mt-1">{savings.length} entries</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-100 font-medium">Savings Rate</p>
          <p className="text-2xl font-bold text-lavender-600 mt-1">{salary > 0 ? `${savingsRate}%` : '—'}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-100 mt-1">{salary > 0 ? 'of salary' : 'Set salary in profile'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-100 font-medium">Monthly Target</p>
          <p className="text-2xl font-bold text-peach-600 mt-1">{savingsTarget > 0 ? formatCurrency(savingsTarget) : '—'}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-100 mt-1">{savingsTarget > 0 ? 'per month' : 'Set target in profile'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-100 font-medium">Categories</p>
          <p className="text-2xl font-bold text-mint-600 mt-1">{Object.keys(catTotals).length}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-100 mt-1">diversified savings</p>
        </div>
      </div>

      {/* Add Saving Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">Add Savings Entry</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-xs py-2 px-4">
            <Plus className="w-3.5 h-3.5" /> {showForm ? 'Cancel' : 'New Entry'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleAddSaving} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="Amount (₹)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field text-sm"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field text-sm"
            >
              {SAVING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-field text-sm"
            />
            <input
              type="text"
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

      {/* Category Breakdown */}
      {Object.keys(catTotals).length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-4">Savings by Category</h3>
          <div className="space-y-3">
            {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
              const pct = totalSavings > 0 ? Math.round((total / totalSavings) * 100) : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-mint-50 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-mint-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-100">{cat}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-100">₹{total.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Savings Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-4">Savings History</h3>
        {savings.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-100 text-center py-8">No savings yet. Add your first entry above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-lavender-100">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-100">Date</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-100">Category</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-100">Description</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-100">Amount</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-100"></th>
                </tr>
              </thead>
              <tbody>
                {savings.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-mint-50/30 transition-colors">
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-100">{s.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-xl text-[11px] font-semibold bg-mint-100 text-mint-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-100">{s.description || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-mint-700">₹{s.amount?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button onClick={() => removeSaving(s.id)} className="p-1 rounded-lg hover:bg-blush-50 text-gray-400 hover:text-blush-500 transition-colors">
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
    </div>
  )
}
