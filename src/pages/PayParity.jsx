// PayParity.jsx
// Unified Pay Parity page — replaces both the original PayParity and PayParityPage.
// Salary benchmarks are fetched from the backend (or a local mock during development).
// See src/utils/payParityApi.js for API configuration.

import { useState, useEffect } from 'react'
import {
  Scale, Heart, Sparkles, BadgeCheck,
  ArrowRight, ChevronDown, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'
import { fetchPayParity } from '../utils/payParityApi'
import EqualOpportunityGrowthPlanner from '../components/EqualOpportunityGrowthPlanner'

// ─── Negotiation tips ────────────────────────────────────────────────────────
const TIPS = [
  {
    emoji: '💡',
    title: 'Know your market value',
    desc: 'Research salary bands for your exact role and city. You deserve to know.',
    detail: 'Search by exact role, years of experience, and city on at least two salary sites before your discussion.',
  },
  {
    emoji: '📊',
    title: 'Document your impact',
    desc: 'Keep a "wins journal" — track projects, metrics, and praise you receive.',
    detail: 'Use numbers where possible, such as revenue impact, time saved, or process improvements you delivered.',
  },
  {
    emoji: '🗣️',
    title: 'Practice negotiation scripts',
    desc: 'Use "I" statements and anchor high. Rehearse with a trusted friend.',
    detail: 'Prepare one anchor figure and one fallback range, then practice saying it out loud with confidence.',
  },
  {
    emoji: '🤝',
    title: 'Find allies & sponsors',
    desc: 'Identify leaders who champion your work and can advocate in closed rooms.',
    detail: 'Share monthly progress updates with your manager and one cross‑functional leader who can support your case.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toNumber(v) {
  const n = Number(String(v || '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function formatLakhs(n) {
  return `₹${(n / 100000).toFixed(1)}L`
}

// ─── Post-process API response into display-ready result ─────────────────────
function buildResult({ apiData, form }) {
  const actualPay = toNumber(form.actualPay)
  const { marketBenchmark, companyEstimate, sources } = apiData
  const gap  = marketBenchmark - actualPay
  const flag = gap > 200000 ? 'below_market' : 'competitive'

  return {
    actualPay,
    marketBenchmark,
    companyEstimate,
    gap:  Math.max(0, gap),
    flag,
    factors: [
      { name: 'Role',       value: form.role       || 'Not specified' },
      { name: 'Experience', value: `${form.experience || 0} years`    },
      { name: 'Location',   value: form.location   || 'Not specified' },
      { name: 'Company',    value: form.company    || 'Not specified' },
      ...(form.skills ? [{ name: 'Skills', value: form.skills }] : []),
    ],
    suggestions: flag === 'below_market'
      ? [
          `Market pays ~${formatLakhs(marketBenchmark)} for this role at your experience level`,
          `At ${form.company || 'this company'}, peers earn ~${formatLakhs(companyEstimate)}`,
          'Consider negotiating during appraisal with data from Glassdoor and AmbitionBox',
          'Upskilling in high-demand areas can further increase your market value',
        ]
      : [
          'Your compensation is competitive for your profile',
          `Market average is ~${formatLakhs(marketBenchmark)}`,
          'Continue building skills to stay ahead of the curve',
        ],
    sources,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PayParity() {
  const { profile, loading: profileLoading } = useUserData()
  const [activeTip, setActiveTip]   = useState(null)
  const [fetching,  setFetching]    = useState(false)
  const [apiError,  setApiError]    = useState(null)
  const [result,    setResult]      = useState(null)
  const [form, setForm] = useState({
    company: '', role: '', experience: '', location: '', skills: '', actualPay: '',
  })

  // Pre-populate form fields from the user's profile on first load.
  useEffect(() => {
    if (!profile) return
    setForm((prev) => ({
      ...prev,
      company:    prev.company    || profile.company    || '',
      role:       prev.role       || profile.job        || '',
      experience: prev.experience || String(profile.experience || ''),
      location:   prev.location   || profile.location   || '',
      skills:     prev.skills     || profile.skills     || '',
      // Convert monthly salary → annual CTC for the form default.
      actualPay:  prev.actualPay  || (profile.salary ? String(toNumber(profile.salary) * 12) : ''),
    }))
  }, [profile])

  const salary    = toNumber(profile?.salary)
  const hasSalary = salary > 0
  const hasRole   = Boolean(profile?.job?.trim())
  const hasSkills = Boolean(profile?.skills?.trim())
  const readiness = [hasSalary, hasRole, hasSkills].filter(Boolean).length

  const handleChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    setFetching(true)
    try {
      const apiData = await fetchPayParity({
        company:    form.company,
        role:       form.role,
        experience: Number(form.experience) || 0,
        location:   form.location,
        skills:     form.skills,
      })
      setResult(buildResult({ apiData, form }))
    } catch (err) {
      setApiError(err.message || 'Failed to fetch pay data. Please try again.')
    } finally {
      setFetching(false)
    }
  }

  if (profileLoading) return <Spinner className="py-20" />

  const maxVal = result
    ? Math.max(result.actualPay, result.marketBenchmark, result.companyEstimate, 1)
    : 1

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-lavender-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pay Parity</h1>
        </div>
        <p className="text-sm text-gray-400">
          Understand where you stand and how to close the gap — at your own pace. 💜
        </p>
      </div>

      {/* ── Profile readiness panel (shown when salary exists) ────────────── */}
      {hasSalary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2 bg-gradient-to-br from-white to-lavender-50/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center text-white flex-shrink-0">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700">Salary data detected</p>
                <p className="text-xs text-gray-500 mt-1">
                  We found your profile details and pre-filled the form below for you.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-lavender-100 dark:border-gray-700/50">
                <p className="text-[11px] text-gray-400 dark:text-gray-400">Monthly salary (profile)</p>
                <p className="text-2xl font-bold text-lavender-600 mt-1">
                  {formatCurrency(salary)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-mint-100 dark:border-gray-700/50">
                <p className="text-[11px] text-gray-400 dark:text-gray-400">Profile readiness</p>
                <p className="text-2xl font-bold text-mint-600 mt-1">
                  {Math.round((readiness / 3) * 100)}%
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {readiness === 3
                    ? 'Great profile coverage for pay insights.'
                    : 'Add more profile details for better insights.'}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-mint-50/40 to-white">
            <p className="text-sm font-semibold text-gray-700 mb-2">Complete your parity profile</p>
            <ul className="space-y-2 text-xs text-gray-600">
              {[['Salary', hasSalary], ['Job title', hasRole], ['Skills', hasSkills]].map(([label, done]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${done ? 'bg-mint-500' : 'bg-gray-300'}`} />
                  {label} {done ? 'added' : 'missing'}
                </li>
              ))}
            </ul>
            {(!hasRole || !hasSkills) && (
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-lavender-600 hover:text-lavender-700"
              >
                Add missing details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Evaluation form ───────────────────────────────────────────────── */}
      <div className="card">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Evaluate Your Pay
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'company',   placeholder: 'Company (e.g. Infosys, Google)', type: 'text'   },
            { key: 'role',      placeholder: 'Role / Job Title',               type: 'text'   },
            { key: 'experience',placeholder: 'Years of Experience',            type: 'number' },
            { key: 'location',  placeholder: 'Location',                       type: 'text'   },
            { key: 'skills',    placeholder: 'Skills (comma-separated)',        type: 'text'   },
            { key: 'actualPay', placeholder: 'Your Annual CTC (e.g. 900000)', type: 'number' },
          ].map(({ key, placeholder, type }) => (
            <input
              key={key}
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={handleChange(key)}
              min={type === 'number' ? '0' : undefined}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
            />
          ))}

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={fetching}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-lavender-400 to-blush-400 text-white text-sm font-semibold shadow-soft hover:shadow-soft-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {fetching ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Fetching benchmarks…
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  Compare Pay
                </>
              )}
            </button>
          </div>
        </form>

        {apiError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{apiError}</p>
          </div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {result && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Your Pay',        value: result.actualPay,        textColor: 'text-lavender-600', borderColor: 'border-lavender-100' },
              { label: 'Market Average',  value: result.marketBenchmark,  textColor: result.marketBenchmark  > result.actualPay ? 'text-teal-600' : 'text-gray-700', borderColor: 'border-teal-100'   },
              { label: 'At Your Company', value: result.companyEstimate,  textColor: result.companyEstimate  > result.actualPay ? 'text-teal-600' : 'text-gray-700', borderColor: 'border-amber-100'  },
            ].map((c) => (
              <div key={c.label} className={`card border ${c.borderColor}`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {c.label}
                </p>
                <p className={`text-2xl font-bold ${c.textColor}`}>{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="card">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Visual Comparison
            </p>
            <div className="space-y-3">
              {[
                { label: 'Your Pay', value: result.actualPay,       barColor: 'bg-lavender-400' },
                { label: 'Market',   value: result.marketBenchmark, barColor: 'bg-teal-400'     },
                { label: 'Company',  value: result.companyEstimate,  barColor: 'bg-amber-400'    },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{bar.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${bar.barColor} rounded-lg transition-all duration-500`}
                      style={{ width: `${(bar.value / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
                    {formatLakhs(bar.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Disparity flag */}
          {result.flag === 'below_market' ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-700">
                Your pay may be below market rate — Gap: {formatCurrency(result.gap)}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-700">Your compensation is competitive!</p>
            </div>
          )}

          {/* Factors */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Factors Considered
            </p>
            <div className="flex flex-wrap gap-2">
              {result.factors.map((f) => (
                <span key={f.name} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">
                  {f.name}: {f.value}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="card">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Suggestions
            </p>
            <ul className="space-y-2">
              {result.suggestions.map((txt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-amber-400 flex-shrink-0">★</span>
                  {txt}
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Data Sources
            </p>
            <p className="text-xs text-gray-500">
              Data sourced from: {result.sources.join(', ')}. Figures are approximate market averages as of 2025–26.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-gray-500">
              <strong className="text-gray-600">Disclaimer:</strong> These estimates are based on publicly available
              salary data and may not reflect exact figures. Use as a directional reference for negotiations.
            </p>
          </div>
        </>
      )}

      {/* ── Negotiation tips ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-lavender-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Negotiation Tips</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPS.map((tip, index) => (
            <button
              key={tip.title}
              type="button"
              onClick={() => setActiveTip((prev) => (prev === index ? null : index))}
              className="w-full text-left flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-lavender-50/50 to-white border border-lavender-100/50 hover:shadow-soft transition-all"
            >
              <span className="text-xl flex-shrink-0">{tip.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{tip.title}</p>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-lavender-500 transition-transform ${
                      activeTip === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{tip.desc}</p>
                {activeTip === index && (
                  <p className="text-xs text-lavender-700 mt-2 leading-relaxed">{tip.detail}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Equal Opportunity Growth Planner */}
      <EqualOpportunityGrowthPlanner profile={profile} />

      {/* ── Empathetic note ───────────────────────────────────────────────── */}
      <div className="card bg-gradient-to-r from-blush-50 to-lavender-50 border-blush-100/50">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-blush-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Remember, you're doing amazing things. 💜
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pay parity isn't just about numbers — it's about being valued for the work you do.
              These insights are here to empower you, not to overwhelm. Take it one step at a time.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
