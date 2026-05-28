import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Plus, Trash2, Landmark, BookOpen,
  Target, Rocket,
} from 'lucide-react'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'
import PageHeader from '../components/ui/PageHeader'
import LearnSection from '../components/investments/LearnSection'
import LifeStageSelector from '../components/investments/LifeStageSelector'
import AiAdvisor from '../components/investments/AiAdvisor'
import PlatformGuide from '../components/investments/PlatformGuide'
import SipCalculator from '../components/investments/SipCalculator'
import PortfolioDonut from '../components/investments/PortfolioDonut'

const INVESTMENT_TYPES = ['Mutual Fund', 'Stocks', 'PPF', 'FD', 'Gold', 'ETF', 'NPS', 'Other']

const PHASES = [
  { id: 'learn', label: 'Learn', icon: BookOpen, color: 'mint', desc: 'Build your investment knowledge' },
  { id: 'plan', label: 'Plan', icon: Target, color: 'lavender', desc: 'Strategize your investment approach' },
  { id: 'act', label: 'Act', icon: Rocket, color: 'blush', desc: 'Build and manage your portfolio' },
]

const PHASE_GRADIENT = {
  mint: 'linear-gradient(to right, #4ade9a, #22c57a)',
  lavender: 'linear-gradient(to right, #b89dfc, #9b6ff8)',
  blush: 'linear-gradient(to right, #ff9db8, #ff6e9a)',
}

function formatCurrency(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n).toLocaleString()}`
}

export default function InvestmentsPage() {
  const { investments, loading, addInvestment, removeInvestment } = useUserData()
  const [activePhase, setActivePhase] = useState('learn')
  const [lifeStage, setLifeStage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Mutual Fund',
    amount: '',
    currentValue: '',
    date: '',
    notes: '',
  })

  const totals = useMemo(() => {
    const invested = investments.reduce((sum, i) => sum + (i.amount || 0), 0)
    const current = investments.reduce((sum, i) => sum + (i.currentValue || i.amount || 0), 0)
    const gain = current - invested
    const gainPct = invested > 0 ? Math.round((gain / invested) * 100) : 0
    return { invested, current, gain, gainPct }
  }, [investments])

  async function handleAddInvestment(e) {
    e.preventDefault()
    if (!formData.amount || !formData.date) return
    setSubmitting(true)
    try {
      await addInvestment({
        name: formData.type,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes.trim(),
      })
      setFormData({ type: 'Mutual Fund', amount: '', currentValue: '', date: '', notes: '' })
      setShowForm(false)
    } catch (err) {
      console.error('Error adding investment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveInvestment(id) {
    try {
      await removeInvestment(id)
    } catch (err) {
      console.error('Error deleting investment:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        icon={TrendingUp}
        title="Investments"
        subtitle="Your journey: Learn, Plan, Act — grow your wealth confidently"
      />

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-mint-50 to-white dark:from-mint-900/10 dark:to-transparent">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Invested</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{formatCurrency(totals.invested)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{investments.length} holdings</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Value</p>
          <p className="text-2xl font-bold text-lavender-600 dark:text-lavender-400 mt-1">{formatCurrency(totals.current)}</p>
          <p className="text-[11px] text-gray-400 mt-1">live snapshot</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Overall Return</p>
          <p className={`text-2xl font-bold mt-1 ${totals.gain >= 0 ? 'text-mint-600' : 'text-blush-600'}`}>
            {totals.gain >= 0 ? '+' : ''}{formatCurrency(totals.gain)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{totals.gain >= 0 ? '+' : ''}{totals.gainPct}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Asset Types</p>
          <p className="text-2xl font-bold text-peach-600 dark:text-peach-400 mt-1">{new Set(investments.map((i) => i.type)).size}</p>
          <p className="text-[11px] text-gray-400 mt-1">diversification</p>
        </div>
      </div>

      {/* Phase Tab Navigation */}
      <div className="flex gap-2 sticky top-0 z-20 py-3" style={{ backgroundColor: 'var(--app-bg)' }}>
        {PHASES.map((phase, i) => {
          const Icon = phase.icon
          const isActive = activePhase === phase.id
          return (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                isActive
                  ? 'text-white shadow-soft scale-[1.03]'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-lavender-100/50 dark:border-lavender-800/30 hover:shadow-soft hover:scale-[1.01]'
              }`}
              style={isActive ? { backgroundImage: PHASE_GRADIENT[phase.color] } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>Phase {i + 1}: {phase.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active Phase Content */}
      <AnimatePresence mode="wait">
        {activePhase === 'learn' && (
          <motion.div
            key="learn"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <LearnSection />
          </motion.div>
        )}

        {activePhase === 'plan' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <LifeStageSelector selected={lifeStage} onSelect={setLifeStage} />
            <AiAdvisor lifeStage={lifeStage} />
            <PlatformGuide />
            <SipCalculator />
          </motion.div>
        )}

        {activePhase === 'act' && (
          <motion.div
            key="act"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <PortfolioDonut investments={investments} />

            {/* Government Schemes CTA */}
            <Link
              to="/government-schemes"
              className="block card bg-gradient-to-br from-lavender-50 to-blush-50 dark:from-lavender-900/20 dark:to-blush-900/10 hover:shadow-soft-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Explore Government Schemes</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Discover PPF, SSY, NPS and more women-friendly government investment options
                  </p>
                </div>
                <div className="text-lavender-400 group-hover:translate-x-1 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </Link>

            {/* Add Investment Form */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">Add Investment</h3>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-xs py-2 px-4">
                  <Plus className="w-3.5 h-3.5" /> {showForm ? 'Cancel' : 'New Holding'}
                </button>
              </div>
              {showForm && (
                <form onSubmit={handleAddInvestment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field text-sm"
                  >
                    {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Invested (₹)"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Current value (₹)"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    className="input-field text-sm"
                  />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field text-sm"
                  />
                  <button type="submit" disabled={submitting} className="btn-primary text-sm">
                    {submitting ? <Spinner size="sm" /> : 'Save'}
                  </button>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field text-sm sm:col-span-2 lg:col-span-5"
                  />
                </form>
              )}
            </div>

            {/* Holdings Table */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-4">Holdings</h3>
              {loading ? (
                <Spinner className="py-8" />
              ) : investments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No investments tracked yet. Add your first holding above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-lavender-100 dark:border-lavender-800/30">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Date</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Name</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Type</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">Invested</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">Current</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">Return</th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((i) => {
                        const ret = (i.currentValue || i.amount || 0) - (i.amount || 0)
                        const retPct = i.amount ? Math.round((ret / i.amount) * 100) : 0
                        return (
                          <tr key={i.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-lavender-50/30 dark:hover:bg-lavender-900/10 transition-colors">
                            <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{i.date}</td>
                            <td className="py-2.5 px-3 text-gray-700 dark:text-gray-200 font-medium">{i.name}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-xl text-[11px] font-semibold bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-400">
                                {i.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">₹{(i.amount || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-lavender-700 dark:text-lavender-400">₹{(i.currentValue || i.amount || 0).toLocaleString()}</td>
                            <td className={`py-2.5 px-3 text-right text-xs font-semibold ${ret >= 0 ? 'text-mint-600' : 'text-blush-600'}`}>
                              {ret >= 0 ? '+' : ''}{retPct}%
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button onClick={() => handleRemoveInvestment(i.id)} className="p-1 rounded-lg hover:bg-blush-50 dark:hover:bg-blush-900/20 text-gray-400 hover:text-blush-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
