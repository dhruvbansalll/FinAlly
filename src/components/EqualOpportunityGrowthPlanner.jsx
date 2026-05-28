import { useState, useMemo } from 'react'
import {
  TrendingUp, Target, Lightbulb, ExternalLink,
  ChevronDown, Sparkles, Loader2, GraduationCap,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getAllyChatResponse } from '../utils/geminiApi'

const GROWTH_RATES = [
  { label: 'Slow (3%)', rate: 0.03 },
  { label: 'Average (5%)', rate: 0.05 },
  { label: 'Fast (8%)', rate: 0.08 },
  { label: 'Top (12%)', rate: 0.12 },
]

const CAREER_RESOURCES = [
  {
    title: 'Data Analytics & Excel Mastery',
    icon: '📊',
    tag: 'High Demand',
    tagColor: 'mint',
    desc: 'Data skills command 20-30% higher salaries across industries',
    platforms: [
      { name: 'Google Data Analytics Certificate', platform: 'Coursera', url: 'https://www.coursera.org/professional-certificates/google-data-analytics', free: false, duration: '6 months' },
      { name: 'Excel Skills for Business', platform: 'Coursera', url: 'https://www.coursera.org/specializations/excel', free: true, duration: '4 weeks' },
      { name: 'Data Analysis with Python', platform: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', free: true, duration: 'Self-paced' },
    ],
  },
  {
    title: 'Leadership & Management',
    icon: '👥',
    tag: 'Career Growth',
    tagColor: 'lavender',
    desc: 'Leadership skills are the #1 factor in promotion decisions',
    platforms: [
      { name: 'Leading People and Teams', platform: 'Coursera (U of Michigan)', url: 'https://www.coursera.org/specializations/leading-teams', free: false, duration: '5 months' },
      { name: 'Women in Leadership', platform: 'edX (UC San Diego)', url: 'https://www.edx.org/learn/leadership/university-of-california-san-diego-women-in-leadership', free: true, duration: '4 weeks' },
      { name: 'Management Skills', platform: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/paths/new-manager-foundations', free: false, duration: '10 hours' },
    ],
  },
  {
    title: 'Negotiation & Communication',
    icon: '🤝',
    tag: 'Pay Growth',
    tagColor: 'blush',
    desc: 'Women who negotiate earn 7-8% more than those who don\'t',
    platforms: [
      { name: 'Successful Negotiation', platform: 'Coursera (U of Michigan)', url: 'https://www.coursera.org/learn/negotiation-skills', free: true, duration: '7 weeks' },
      { name: 'Women\'s Salary Negotiation', platform: 'Udemy', url: 'https://www.udemy.com/topic/negotiation/', free: false, duration: '3 hours' },
      { name: 'Communication Skills', platform: 'Khan Academy', url: 'https://www.khanacademy.org/', free: true, duration: 'Self-paced' },
    ],
  },
  {
    title: 'Digital Marketing & AI',
    icon: '🚀',
    tag: 'Future Ready',
    tagColor: 'peach',
    desc: 'AI & digital skills are growing 3x faster than other roles',
    platforms: [
      { name: 'Google Digital Marketing Certificate', platform: 'Coursera', url: 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce', free: false, duration: '6 months' },
      { name: 'AI for Everyone', platform: 'Coursera (deeplearning.ai)', url: 'https://www.coursera.org/learn/ai-for-everyone', free: true, duration: '4 weeks' },
      { name: 'Digital Marketing', platform: 'Google Skillshop', url: 'https://skillshop.withgoogle.com/', free: true, duration: 'Self-paced' },
    ],
  },
  {
    title: 'Financial Literacy & Investing',
    icon: '💰',
    tag: 'Wealth Building',
    tagColor: 'mint',
    desc: 'Financially literate women earn & save 15% more over their careers',
    platforms: [
      { name: 'Personal & Family Financial Planning', platform: 'Coursera (U of Florida)', url: 'https://www.coursera.org/learn/family-planning', free: true, duration: '5 weeks' },
      { name: 'Stock Market for Beginners', platform: 'Zerodha Varsity', url: 'https://zerodha.com/varsity/', free: true, duration: 'Self-paced' },
      { name: 'Financial Markets', platform: 'Coursera (Yale)', url: 'https://www.coursera.org/learn/financial-markets-global', free: true, duration: '7 weeks' },
    ],
  },
]

function toNumber(value) {
  if (value === null || value === undefined) return 0
  const cleaned = String(value).replace(/,/g, '').trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n).toLocaleString()}`
}

export default function EqualOpportunityGrowthPlanner({ profile }) {
  const [selectedRate, setSelectedRate] = useState(1)
  const [expandedResource, setExpandedResource] = useState(null)
  const [aiAdvice, setAiAdvice] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const currentSalary = toNumber(profile?.salary)
  const hasCareerData = currentSalary > 0
  const rate = GROWTH_RATES[selectedRate].rate

  const chartData = useMemo(() => {
    if (!currentSalary) return []
    const data = []
    for (let y = 0; y <= 10; y++) {
      data.push({
        year: `${y}y`,
        salary: Math.round(currentSalary * Math.pow(1 + rate, y)),
        withUpskill: Math.round(currentSalary * Math.pow(1 + rate + 0.03, y)),
      })
    }
    return data
  }, [currentSalary, rate])

  const projectedSalary = currentSalary * Math.pow(1 + rate, 5)
  const projectedWithUpskill = currentSalary * Math.pow(1 + rate + 0.03, 5)
  const annualCurrent = currentSalary * 12
  const annualProjected = Math.round(projectedSalary) * 12

  async function getAiCareerAdvice() {
    if (aiAdvice) return
    setAiLoading(true)
    try {
      const response = await getAllyChatResponse(
        `Based on my profile, give me 4-5 specific career growth tips to increase my salary. Keep it under 150 words. Use bullet points.`,
        {
          name: profile?.name,
          salary: currentSalary,
        }
      )
      setAiAdvice(response)
    } catch {
      setAiAdvice('Could not load personalized advice right now. Try again later.')
    } finally {
      setAiLoading(false)
    }
  }

  if (!hasCareerData) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-lavender-50 flex items-center justify-center text-3xl mb-4">📈</div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Growth Analysis Unavailable</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
          Add your salary in your profile to unlock personalized growth projections and career recommendations.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-5 h-5 text-lavender-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Career Growth Planner</h2>
      </div>

      {/* Salary Projection Chart + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-lavender-500" />
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">10-Year Salary Projection</h3>
            </div>
          </div>

          <div className="flex gap-1.5 mb-4">
            {GROWTH_RATES.map((g, i) => (
              <button
                key={g.label}
                onClick={() => setSelectedRate(i)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                  selectedRate === i
                    ? 'bg-lavender-500 text-white shadow-soft'
                    : 'bg-lavender-50 dark:bg-lavender-900/20 text-gray-500 dark:text-gray-400 hover:bg-lavender-100'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b89dfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#b89dfc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="upskillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#67d8a4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#67d8a4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name === 'salary' ? 'Base Growth' : 'With Upskilling']}
                  contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid #ece3ff' }}
                />
                <Area type="monotone" dataKey="withUpskill" stroke="#67d8a4" fill="url(#upskillGrad)" strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="salary" stroke="#b89dfc" fill="url(#salGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-lavender-500 rounded" /> Base Growth</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-mint-500 rounded border-dashed" /> With Upskilling (+3%)</span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="card bg-gradient-to-br from-lavender-50/50 to-white dark:from-lavender-900/10 dark:to-transparent">
            <p className="text-[11px] text-gray-400 font-medium">Current Monthly</p>
            <p className="text-2xl font-bold text-lavender-600 dark:text-lavender-400">{formatCurrency(currentSalary)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Annual: {formatCurrency(annualCurrent)}</p>
          </div>
          <div className="card bg-gradient-to-br from-mint-50/50 to-white dark:from-mint-900/10 dark:to-transparent">
            <p className="text-[11px] text-gray-400 font-medium">Projected in 5 Years</p>
            <p className="text-2xl font-bold text-mint-600 dark:text-mint-400">{formatCurrency(projectedSalary)}</p>
            <p className="text-[10px] text-mint-500 mt-1">+{formatCurrency(projectedSalary - currentSalary)}/month</p>
          </div>
          <div className="card bg-gradient-to-br from-peach-50/50 to-white dark:from-peach-900/10 dark:to-transparent">
            <p className="text-[11px] text-gray-400 font-medium">With Upskilling (5 yrs)</p>
            <p className="text-2xl font-bold text-peach-600 dark:text-peach-400">{formatCurrency(projectedWithUpskill)}</p>
            <p className="text-[10px] text-peach-500 mt-1">+{formatCurrency(projectedWithUpskill - projectedSalary)} extra vs base</p>
          </div>
        </div>
      </div>

      {/* AI Career Advice */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">AI Career Growth Advice</h3>
          </div>
          {!aiAdvice && !aiLoading && (
            <button onClick={getAiCareerAdvice} className="btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Get Advice
            </button>
          )}
        </div>

        {aiLoading && (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="w-4 h-4 text-lavender-500 animate-spin" />
            <p className="text-xs text-gray-400">Analyzing your profile...</p>
          </div>
        )}

        {aiAdvice && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-lavender-50/50 to-mint-50/50 dark:from-lavender-900/10 dark:to-mint-900/10 border border-lavender-100/50 dark:border-lavender-800/30">
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{aiAdvice}</p>
          </div>
        )}

        {!aiAdvice && !aiLoading && (
          <p className="text-xs text-gray-400 text-center py-3">Click "Get Advice" for personalized AI career growth recommendations</p>
        )}
      </div>

      {/* Courses & Platforms */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-4 h-4 text-lavender-500" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Upskill & Earn More</h3>
          <span className="text-[10px] text-gray-400 ml-1">Real courses from top platforms</span>
        </div>

        <div className="space-y-2">
          {CAREER_RESOURCES.map((resource, idx) => {
            const isExpanded = expandedResource === idx
            return (
              <div key={idx} className="rounded-2xl border border-lavender-100/50 dark:border-lavender-900/30 overflow-hidden transition-all">
                <button
                  onClick={() => setExpandedResource(isExpanded ? null : idx)}
                  className="w-full text-left flex items-center gap-3 p-4 hover:bg-lavender-50/30 dark:hover:bg-lavender-900/10 transition-colors"
                >
                  <span className="text-xl flex-shrink-0">{resource.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{resource.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg bg-${resource.tagColor}-100 dark:bg-${resource.tagColor}-900/30 text-${resource.tagColor}-600 dark:text-${resource.tagColor}-400`}
                        style={{
                          backgroundColor: resource.tagColor === 'mint' ? '#d1fae5' : resource.tagColor === 'lavender' ? '#ede9fe' : resource.tagColor === 'blush' ? '#fce7f3' : '#ffedd5',
                          color: resource.tagColor === 'mint' ? '#059669' : resource.tagColor === 'lavender' ? '#7c3aed' : resource.tagColor === 'blush' ? '#db2777' : '#ea580c',
                        }}
                      >
                        {resource.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{resource.desc}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {resource.platforms.map((p, pi) => (
                      <a
                        key={pi}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-lavender-300 hover:shadow-soft transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-lavender-50 dark:bg-lavender-900/20 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4 text-lavender-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-lavender-600 transition-colors">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{p.platform}</span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400">{p.duration}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.free ? 'bg-mint-100 dark:bg-mint-900/30 text-mint-600' : 'bg-peach-100 dark:bg-peach-900/30 text-peach-600'}`}>
                              {p.free ? 'Free' : 'Paid'}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-lavender-500 transition-colors flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
