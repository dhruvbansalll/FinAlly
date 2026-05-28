import { useState, useEffect } from 'react'
import { Target, Plus, Calendar } from 'lucide-react'
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/Spinner'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const GOAL_CATEGORIES = ['Home', 'Travel', 'Education', 'Vehicle', 'Emergency', 'Retirement', 'Other']

export default function GoalsPage() {
  const { currentUser } = useAuth()
  const [firestoreGoals, setFirestoreGoals] = useState([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updatingGoalId, setUpdatingGoalId] = useState(null)
  const [topUpValues, setTopUpValues] = useState({})
  const [formData, setFormData] = useState({ title: '', target: '', current: '', deadline: '', category: 'Home' })

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'goals'), where('userId', '==', currentUser.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      setFirestoreGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoadingGoals(false)
    })
    return unsubscribe
  }, [currentUser])

  async function handleAddGoal(e) {
    e.preventDefault()
    if (!formData.title || !formData.target || !formData.deadline) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'goals'), {
        userId: currentUser.uid,
        title: formData.title,
        target: parseFloat(formData.target),
        current: parseFloat(formData.current) || 0,
        deadline: formData.deadline,
        category: formData.category,
        createdAt: serverTimestamp(),
      })
      setFormData({ title: '', target: '', current: '', deadline: '', category: 'Home' })
      setShowForm(false)
      toast.success(`Goal “${formData.title}” created! 🎯`)
    } catch (err) {
      console.error('Error adding goal:', err)
      toast.error('Failed to create goal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTopUpGoal(goal) {
    const rawAmount = topUpValues[goal.id]
    const amount = parseFloat(rawAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid savings amount to add.')
      return
    }

    setUpdatingGoalId(goal.id)
    try {
      const newCurrent = (parseFloat(goal.current) || 0) + amount
      await updateDoc(doc(db, 'goals', goal.id), {
        current: newCurrent,
        updatedAt: serverTimestamp(),
      })
      setTopUpValues((prev) => ({ ...prev, [goal.id]: '' }))
      toast.success(`Added ₹${amount.toLocaleString()} to “${goal.title}”`) 
    } catch (err) {
      console.error('Error updating goal savings:', err)
      toast.error('Could not update goal savings. Please try again.')
    } finally {
      setUpdatingGoalId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-lavender-500" />
            <h1 className="page-title">Goals</h1>
          </div>
          <p className="page-subtitle">
            Your dreams, tracked beautifully. Every step counts. 🌟
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* New Goal Form */}
      {showForm && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Set a New Goal</h3>
          <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Goal title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field text-sm"
            />
            <input
              type="number"
              min="0"
              required
              placeholder="Target amount (₹)"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="input-field text-sm"
            />
            <input
              type="number"
              min="0"
              placeholder="Amount saved so far (₹)"
              value={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.value })}
              className="input-field text-sm"
            />
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input-field text-sm"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field text-sm"
            >
              {GOAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? <Spinner size="sm" /> : 'Create Goal'}
            </button>
          </form>
        </div>
      )}

      {/* Your Goals */}
      {loadingGoals ? (
        <Spinner className="py-8" label="Loading goals…" />
      ) : firestoreGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          message='Click “New Goal” above to set your first financial goal! Every journey starts with a single step. 🌟'
        />
      ) : (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Your Goals</h3>
          <div className="space-y-4">
            {firestoreGoals.map((g) => {
              const progress = g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0
              return (
                <div key={g.id} className="p-4 rounded-2xl border transition-all hover:scale-[1.005]" style={{ backgroundColor: 'var(--app-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">{g.title}</h4>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-lavender-300">{g.category}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {g.deadline}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-lavender-600 dark:text-lavender-400">{progress}%</span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">₹{(g.current || 0).toLocaleString()}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">₹{g.target.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-border)' }}>
                    <div
                      className="h-full bg-gradient-to-r from-lavender-400 to-lavender-500 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${g.title}: ${progress}% complete`}
                    />
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Add savings (₹)"
                      value={topUpValues[g.id] || ''}
                      onChange={(e) => setTopUpValues((prev) => ({ ...prev, [g.id]: e.target.value }))}
                      className="input-field text-sm"
                      aria-label={`Add savings to ${g.title}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleTopUpGoal(g)}
                      disabled={updatingGoalId === g.id}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      {updatingGoalId === g.id ? <Spinner size="sm" /> : 'Add Savings'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
