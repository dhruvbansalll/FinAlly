import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  UserCircle, Mail, Phone, MapPin, Briefcase, GraduationCap, Award,
  Calendar, Edit3, Camera, Shield, Star, TrendingUp, Save, X, Wallet,
} from 'lucide-react'
import { useUserData } from '../contexts/UserDataContext'
import { useAuth } from '../contexts/AuthContext'
import Spinner from '../components/Spinner'

function resizeImage(file, maxSize = 320, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Invalid image file'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage() {
  const { profile, saveProfile, totalExpenses, totalSavings, goals, loading } = useUserData()
  const { currentUser } = useAuth()
  const navLocation = useLocation()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarProcessing, setAvatarProcessing] = useState(false)
  const [form, setForm] = useState({})

  // Auto-open edit form when navigated with editBudget state
  useEffect(() => {
    if (navLocation.state?.editBudget && !editing) {
      startEditing()
    }
  }, [navLocation.state])

  if (loading) return <Spinner className="py-20" />

  const name = profile?.name || 'User'
  const job = profile?.job || ''
  const company = profile?.company || ''
  const experience = profile?.experience || ''
  const location = profile?.location || ''
  const age = profile?.age || ''
  const qualification = profile?.qualification || ''
  const skills = profile?.skills ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean) : []
  const salary = profile?.salary || 0
  const savingsTarget = profile?.monthlySavingsTarget || 0
  const budget = profile?.monthlyBudget || 0
  const totalGoalSaved = goals.reduce((sum, g) => sum + (g.current || 0), 0)

  function startEditing() {
    setForm({
      name: profile?.name || '',
      age: profile?.age || '',
      location: profile?.location || '',
      job: profile?.job || '',
      company: profile?.company || '',
      experience: profile?.experience || '',
      qualification: profile?.qualification || '',
      skills: profile?.skills || '',
      avatarUrl: profile?.avatarUrl || '',
      salary: profile?.salary || '',
      monthlySavingsTarget: profile?.monthlySavingsTarget || '',
      monthlyBudget: profile?.monthlyBudget || '',
    })
    setEditing(true)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setAvatarProcessing(true)
      const avatarDataUrl = await resizeImage(file)
      setForm((prev) => ({ ...prev, avatarUrl: avatarDataUrl }))
    } catch (err) {
      console.error('Error processing profile image:', err)
    } finally {
      setAvatarProcessing(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveProfile({
        ...form,
        age: form.age ? parseInt(form.age, 10) : '',
        salary: form.salary ? parseFloat(form.salary) : 0,
        monthlySavingsTarget: form.monthlySavingsTarget ? parseFloat(form.monthlySavingsTarget) : 0,
        monthlyBudget: form.monthlyBudget ? parseFloat(form.monthlyBudget) : 0,
        profileComplete: true,
      })
      setEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  function formatCurrency(n) {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
    return `₹${n}`
  }

  const savingsRate = salary > 0 ? Math.round((totalSavings / salary) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="card bg-gradient-to-br from-white to-lavender-50/50 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-lavender-200/20 to-blush-200/15 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-3xl object-cover shadow-soft-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center shadow-soft-lg">
                <span className="text-4xl">👩‍💼</span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {job}{experience ? ` • ${experience} experience` : ''}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Mail className="w-3.5 h-3.5 text-lavender-400" />
                {currentUser?.email || 'Not set'}
              </div>
              {location && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-lavender-400" />
                  {location}
                </div>
              )}
              {company && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Briefcase className="w-3.5 h-3.5 text-lavender-400" />
                  {company}
                </div>
              )}
              {age && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-lavender-400" />
                  Age {age}
                </div>
              )}
            </div>
          </div>

          <button onClick={startEditing} className="btn-secondary flex items-center gap-2 text-xs py-2 flex-shrink-0">
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Edit Profile</h3>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                <input type="text" value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
                <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Qualification</label>
                <input type="text" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
                <input type="text" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="input-field text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Profile Picture</label>
                <div className="flex items-center gap-3">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Preview" className="w-14 h-14 rounded-2xl object-cover border border-lavender-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-2xl">👩‍💼</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-xl file:border-0 file:bg-lavender-100 file:text-lavender-700 file:font-medium"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">JPG/PNG recommended. Image will be optimized before saving.</p>
                  </div>

                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="text-xs text-blush-500 font-medium hover:text-blush-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {avatarProcessing && <p className="text-[11px] text-lavender-500 mt-1">Processing image...</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Salary (₹)</label>
                <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Savings Target (₹)</label>
                <input type="number" value={form.monthlySavingsTarget} onChange={(e) => setForm({ ...form, monthlySavingsTarget: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly Spending Limit (₹)</label>
                <input type="number" value={form.monthlyBudget} onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })} className="input-field text-sm" placeholder="e.g. 30000" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                {saving ? <Spinner size="sm" /> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Budget & Limits */}
      <div className="card bg-gradient-to-br from-white to-mint-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-mint-500" />
            <h3 className="text-sm font-semibold text-gray-700">Budget & Limits</h3>
          </div>
          {!editing && (
            <button onClick={startEditing} className="text-xs text-lavender-500 font-medium hover:text-lavender-600 transition-colors">
              Edit →
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-gray-800/60 border border-mint-100 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">Monthly Spending Limit</p>
            <p className="text-lg font-bold text-mint-600 mt-0.5">{budget > 0 ? formatCurrency(budget) : '—'}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-400">{budget > 0 ? 'per month' : 'Not set yet'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-gray-800/60 border border-lavender-100 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">Monthly Savings Target</p>
            <p className="text-lg font-bold text-lavender-600 mt-0.5">{savingsTarget > 0 ? formatCurrency(savingsTarget) : '—'}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-400">{savingsTarget > 0 ? 'per month' : 'Not set yet'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-gray-800/60 border border-peach-100 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-400 font-medium">Monthly Salary</p>
            <p className="text-lg font-bold text-peach-600 mt-0.5">{salary > 0 ? formatCurrency(salary) : '—'}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-400">{salary > 0 ? 'per month' : 'Not set yet'}</p>
          </div>
        </div>
        {budget <= 0 && (
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            Setting a monthly spending limit helps you stay on track gently. Click "Edit" above or "Edit Profile" to get started. 💜
          </p>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-lavender-400" />
            <h3 className="text-sm font-semibold text-gray-700">Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="px-3 py-1.5 rounded-2xl bg-lavender-50 text-lavender-600 text-xs font-medium border border-lavender-100">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-mint-500" />
          <h3 className="text-sm font-semibold text-gray-700">Financial Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Salary', value: salary > 0 ? formatCurrency(salary) : '—', sub: salary > 0 ? 'per month' : 'Not set', color: 'text-mint-600' },
            { label: 'Savings Rate', value: savingsRate > 0 ? `${savingsRate}%` : '—', sub: totalSavings > 0 ? formatCurrency(totalSavings) + ' saved' : 'No savings yet', color: 'text-lavender-600' },
            { label: 'Active Goals', value: `${goals.length}`, sub: `${formatCurrency(totalGoalSaved)} saved`, color: 'text-peach-600' },
            { label: 'Total Expenses', value: formatCurrency(totalExpenses), sub: 'all time', color: 'text-blush-600' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-2xl bg-gray-50/50">
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color} mt-0.5`}>{stat.value}</p>
              <p className="text-[11px] text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
