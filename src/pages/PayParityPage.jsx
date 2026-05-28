import { useState } from 'react'
import { Scale, Heart, Sparkles, BadgeCheck, ArrowRight, ChevronDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'
import EqualOpportunityGrowthPlanner from '../components/EqualOpportunityGrowthPlanner'

const SALARY_RESEARCH_SITES = [
  { name: 'Glassdoor', url: 'https://www.glassdoor.co.in/Salaries/', desc: 'Company-specific salaries & reviews', emoji: '🔍' },
  { name: 'AmbitionBox', url: 'https://www.ambitionbox.com/salaries', desc: 'Indian company salary data', emoji: '📊' },
  { name: 'LinkedIn Salary', url: 'https://www.linkedin.com/salary/', desc: 'Role-based salary insights', emoji: '💼' },
  { name: 'PayScale India', url: 'https://www.payscale.com/research/IN/Country=India/Salary', desc: 'Detailed salary benchmarks', emoji: '📈' },
]

const NEGOTIATION_TIPS = [
  {
    emoji: '💡',
    title: 'Research before you ask',
    desc: 'Check 2-3 salary sites for your exact role + city + experience level before any discussion.',
  },
  {
    emoji: '📊',
    title: 'Document your impact',
    desc: 'Keep a "wins journal" with metrics — revenue impact, time saved, problems solved.',
  },
  {
    emoji: '🗣️',
    title: 'Anchor high, negotiate down',
    desc: 'Ask 10-15% above your target. Use "Based on my research, the market range is ₹X-₹Y".',
  },
  {
    emoji: '⏰',
    title: 'Time it right',
    desc: 'Negotiate during appraisal cycles, after a big win, or when you have a competing offer.',
  },
]

function toNumber(value) {
  if (value === null || value === undefined) return 0
  const cleaned = String(value).replace(/,/g, '').trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n).toLocaleString()}`
}

export default function PayParityPage() {
  const { profile, loading } = useUserData()
  const [activeTip, setActiveTip] = useState(null)

  if (loading) return <Spinner className="py-20" />

  const salary = toNumber(profile?.salary)
  const hasSalary = salary > 0
  const hasRole = Boolean(profile?.job?.trim())
  const hasSkills = Boolean(profile?.skills?.trim())
  const readiness = [hasSalary, hasRole, hasSkills].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-lavender-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pay Parity</h1>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Understand your worth, close the gap, and grow your career confidently.
        </p>
      </div>

      {/* Quick Stats */}
      {hasSalary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-[11px] text-gray-400 font-medium">Monthly Salary</p>
            <p className="text-xl font-bold text-lavender-600 dark:text-lavender-400 mt-1">{formatCurrency(salary)}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-gray-400 font-medium">Annual (CTC est.)</p>
            <p className="text-xl font-bold text-mint-600 dark:text-mint-400 mt-1">{formatCurrency(salary * 12)}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-gray-400 font-medium">Role</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-1 truncate">{profile?.job || 'Not set'}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-gray-400 font-medium">Profile Readiness</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-mint-400 transition-all"
                  style={{ width: `${(readiness / 3) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{readiness}/3</span>
            </div>
            {readiness < 3 && (
              <Link to="/profile" className="text-[10px] text-lavender-500 hover:text-lavender-600 mt-1 inline-block">
                Complete profile →
              </Link>
            )}
          </div>
        </div>
      )}

      {!hasSalary && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-lavender-50 flex items-center justify-center text-3xl mb-4">⚖️</div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">No salary data yet</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
            Add your salary, role, and skills in your profile for personalized pay insights and growth projections.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-lavender-400 to-blush-400 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all"
          >
            Update profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Growth Planner */}
      <EqualOpportunityGrowthPlanner profile={profile} />

      {/* Salary Research Tools */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BadgeCheck className="w-4 h-4 text-lavender-500" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Research Your Market Value</h3>
          <span className="text-[10px] text-gray-400 ml-1">Check what others in your role earn</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SALARY_RESEARCH_SITES.map(site => (
            <a
              key={site.name}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-lavender-50/50 to-white dark:from-lavender-900/10 dark:to-transparent border border-lavender-100/50 dark:border-lavender-900/30 hover:shadow-soft hover:border-lavender-300 transition-all group"
            >
              <span className="text-2xl">{site.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-lavender-600 transition-colors">{site.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{site.desc}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-lavender-500 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Negotiation Tips */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-lavender-400" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Negotiation Playbook</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NEGOTIATION_TIPS.map((tip, index) => (
            <button
              key={tip.title}
              type="button"
              onClick={() => setActiveTip(prev => prev === index ? null : index)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                activeTip === index
                  ? 'bg-lavender-50 dark:bg-lavender-900/20 border-lavender-200 dark:border-lavender-700 shadow-soft'
                  : 'bg-white dark:bg-gray-800/30 border-gray-100 dark:border-gray-700 hover:border-lavender-200 hover:shadow-soft'
              }`}
            >
              <span className="text-xl flex-shrink-0">{tip.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{tip.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{tip.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empathetic Note */}
      <div className="card bg-gradient-to-r from-blush-50 dark:from-blush-900/20 to-lavender-50 dark:to-lavender-900/20 border-blush-100/50 dark:border-blush-900/30">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-blush-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              You deserve to be valued.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Pay parity isn't just about numbers — it's about being recognized for your work.
              These tools are here to empower you. Take it one step at a time, and remember — asking for what you're worth is not just okay, it's necessary.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
