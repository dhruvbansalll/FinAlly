import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const RETURN_PRESETS = [
  { label: 'Conservative', rate: 8, color: 'mint' },
  { label: 'Moderate', rate: 12, color: 'lavender' },
  { label: 'Aggressive', rate: 15, color: 'blush' },
]

function formatCurrency(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n).toLocaleString()}`
}

function calculateSIP(monthly, rate, years) {
  const monthlyRate = rate / 100 / 12
  const months = years * 12
  const invested = monthly * months
  const futureValue = monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate)
  return { invested, futureValue: Math.round(futureValue), gains: Math.round(futureValue - invested) }
}

export default function SipCalculator() {
  const [monthly, setMonthly] = useState(5000)
  const [returnRate, setReturnRate] = useState(12)
  const [years, setYears] = useState(10)

  const result = useMemo(() => calculateSIP(monthly, returnRate, years), [monthly, returnRate, years])

  const chartData = useMemo(() => {
    const data = []
    for (let y = 0; y <= years; y++) {
      const { invested, futureValue } = calculateSIP(monthly, returnRate, y)
      data.push({ year: `Yr ${y}`, invested, value: futureValue })
    }
    return data
  }, [monthly, returnRate, years])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="card p-3 !rounded-xl shadow-lg text-xs">
        <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        <p className="text-lavender-600">Value: {formatCurrency(payload[0]?.value || 0)}</p>
        <p className="text-gray-400">Invested: {formatCurrency(payload[1]?.value || 0)}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-peach-100 dark:bg-peach-900/30 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-peach-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">SIP Calculator</h3>
          <p className="text-[11px] text-gray-400">See how your money grows over time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Monthly SIP Amount</label>
              <span className="text-sm font-bold text-lavender-600">₹{monthly.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-lavender-500"
              style={{
                background: `linear-gradient(to right, #b89dfc ${((monthly - 500) / 99500) * 100}%, #ece3ff ${((monthly - 500) / 99500) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">₹500</span>
              <span className="text-[10px] text-gray-400">₹1,00,000</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 block">Expected Return Rate</label>
            <div className="flex gap-2">
              {RETURN_PRESETS.map(preset => (
                <button
                  key={preset.rate}
                  onClick={() => setReturnRate(preset.rate)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    returnRate === preset.rate
                      ? `bg-${preset.color}-500 text-white shadow-soft`
                      : `bg-${preset.color}-50 dark:bg-${preset.color}-900/20 text-gray-600 dark:text-gray-300`
                  }`}
                  style={returnRate === preset.rate ? {
                    background: preset.color === 'mint' ? '#67d8a4' : preset.color === 'lavender' ? '#b89dfc' : '#ff9db8',
                  } : {}}
                >
                  {preset.label} ({preset.rate}%)
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Duration</label>
              <span className="text-sm font-bold text-lavender-600">{years} years</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-lavender-500"
              style={{
                background: `linear-gradient(to right, #b89dfc ${((years - 1) / 29) * 100}%, #ece3ff ${((years - 1) / 29) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">1 year</span>
              <span className="text-[10px] text-gray-400">30 years</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-2xl bg-lavender-50 dark:bg-lavender-900/20">
              <p className="text-[10px] text-gray-400 mb-1">Invested</p>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{formatCurrency(result.invested)}</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-mint-50 dark:bg-mint-900/20">
              <p className="text-[10px] text-gray-400 mb-1">Returns</p>
              <p className="text-sm font-bold text-mint-600">{formatCurrency(result.gains)}</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-gradient-to-br from-lavender-50 to-mint-50 dark:from-lavender-900/20 dark:to-mint-900/10">
              <p className="text-[10px] text-gray-400 mb-1">Total Value</p>
              <p className="text-sm font-bold text-lavender-700 dark:text-lavender-300">{formatCurrency(result.futureValue)}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sipValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b89dfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#b89dfc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sipInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#67d8a4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#67d8a4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece3ff" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#b89dfc" fill="url(#sipValue)" strokeWidth={2} />
                <Area type="monotone" dataKey="invested" stroke="#67d8a4" fill="url(#sipInvested)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-blush-50 dark:bg-blush-900/10 border border-blush-100 dark:border-blush-800/30">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blush-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blush-700 dark:text-blush-300 leading-relaxed">
                Starting early compensates for career breaks — even pausing SIP for 2 years,
                your corpus stays ahead of someone who started 5 years later.
                Compounding rewards the patient investor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
