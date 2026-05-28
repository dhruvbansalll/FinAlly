import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, Info, Sparkles, Plus, Trash2, TrendingDown,
  TrendingUp, CheckCircle2, MessageCircleHeart, Send, Bot, IndianRupee,
  ShieldCheck, Heart, Home, Wallet, PiggyBank, ChevronDown, ChevronUp,
  Landmark, BadgeCheck, Zap,
} from 'lucide-react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'
import PageHeader from '../components/ui/PageHeader'
import { computeTaxOldRegime, computeTaxNewRegime, compareRegimes, formatINR, formatINRShort } from '../utils/taxEngine'
import { getTaxChatResponse } from '../utils/geminiApi'

const TAX_SAVING_OPTIONS = [
  {
    id: '80C',
    icon: PiggyBank,
    title: 'Investments & Savings',
    subtitle: 'Section 80C',
    maxLimit: 150000,
    color: 'mint',
    description: 'Invest in PPF, ELSS mutual funds, EPF, life insurance, tax-saver FDs, or NSC. You can also claim tuition fees for your children.',
    examples: 'EPF (auto-deducted from salary), PPF, ELSS Mutual Funds, Life Insurance, Tax Saver FD, NSC',
    tip: 'If you\'re salaried, your EPF contribution already counts here. Check your payslip!',
    field: 'deductions80C',
  },
  {
    id: '80D',
    icon: Heart,
    title: 'Health Insurance',
    subtitle: 'Section 80D',
    maxLimit: 75000,
    color: 'blush',
    description: 'Premium paid for health insurance for yourself, spouse, children, and parents. Senior citizen parents get a higher limit.',
    examples: 'Self & family: up to ₹25,000 | Parents (below 60): ₹25,000 | Parents (60+): ₹50,000',
    tip: 'Don\'t forget preventive health checkups — ₹5,000 is covered within this limit.',
    field: 'deductions80D',
  },
  {
    id: 'HRA',
    icon: Home,
    title: 'House Rent',
    subtitle: 'HRA Exemption',
    maxLimit: 500000,
    color: 'peach',
    description: 'If you live in a rented house and receive HRA from your employer, a portion of your rent is tax-free.',
    examples: 'Actual HRA received, 50% of basic salary (metro), or rent paid minus 10% of basic — whichever is least',
    tip: 'Keep your rent receipts and landlord\'s PAN (if rent > ₹1L/year) to claim this.',
    field: 'hra',
  },
  {
    id: '24B',
    icon: ShieldCheck,
    title: 'Home Loan Interest',
    subtitle: 'Section 24(b)',
    maxLimit: 200000,
    color: 'lavender',
    description: 'If you have a home loan, the interest you pay each year can be deducted from your taxable income.',
    examples: 'Self-occupied property: up to ₹2,00,000/year interest deduction',
    tip: 'This is just for interest — the principal repayment falls under 80C.',
    field: 'homeLoanInterest',
  },
  {
    id: 'OTHER',
    icon: Wallet,
    title: 'Other Deductions',
    subtitle: '80E, 80G, etc.',
    maxLimit: 500000,
    color: 'lavender',
    description: 'Education loan interest (80E), donations to approved charities (80G), NPS extra deduction (80CCD) of ₹50,000, and more.',
    examples: 'Education loan interest, charitable donations, NPS (extra ₹50K), disability deductions',
    tip: 'NPS gives you an extra ₹50,000 deduction beyond the 80C limit — great for retirement!',
    field: 'otherDeductions',
  },
]

const NEW_REGIME_SAVING_OPTIONS = [
  {
    id: 'NPS_EMPLOYER',
    icon: Landmark,
    title: 'Employer NPS Contribution',
    subtitle: 'Section 80CCD(2)',
    maxLimit: 0,
    dynamicMax: true,
    color: 'mint',
    description: 'If your employer contributes to your NPS account, that amount is tax-free — up to 14% of your basic salary (Central Govt) or 10% (Private). This is one of the biggest tax-saving tools in the New Regime.',
    examples: 'If your basic salary is ₹6L/year and employer contributes 10%, that\'s ₹60,000 deduction',
    tip: 'Ask your employer to restructure your CTC to include NPS contribution — it\'s a win-win! This works even in the New Regime.',
    field: 'npsEmployer',
    applyable: true,
  },
  {
    id: 'NPS_SELF',
    icon: PiggyBank,
    title: 'Your NPS Contribution',
    subtitle: 'Section 80CCD(1B)',
    maxLimit: 50000,
    color: 'lavender',
    description: 'Your own contribution to NPS (National Pension System) gives you an extra ₹50,000 deduction. This is available in the New Regime and is separate from any employer contribution.',
    examples: 'Invest up to ₹50,000/year in your NPS Tier-1 account',
    tip: 'This is one of the few deductions the New Regime allows. Great for building a retirement corpus while saving tax.',
    field: 'nps80CCD1B',
    applyable: true,
  },
  {
    id: 'STD_DEDUCTION',
    icon: BadgeCheck,
    title: 'Standard Deduction',
    subtitle: 'Auto-applied',
    maxLimit: 75000,
    color: 'mint',
    description: 'A flat ₹75,000 deduction is automatically applied to your salary income in the New Regime. You don\'t need to do anything — this is already reducing your taxable income.',
    examples: 'If your income is ₹12,75,000 → taxable income becomes ₹12,00,000 → you may qualify for zero tax under 87A rebate!',
    tip: 'This means salaried individuals with gross income up to ₹12,75,000 pay ZERO tax in the New Regime.',
    field: null,
    applyable: false,
  },
  {
    id: 'REBATE_87A',
    icon: Zap,
    title: 'Zero Tax Rebate',
    subtitle: 'Section 87A',
    maxLimit: 1200000,
    color: 'peach',
    description: 'If your taxable income (after standard deduction) is ₹12,00,000 or less, you get a FULL rebate — meaning your entire tax is waived to zero. This is automatic.',
    examples: 'Gross income ₹12,75,000 − ₹75,000 standard deduction = ₹12,00,000 taxable → ZERO tax!',
    tip: 'If you\'re close to this limit, every small deduction (like NPS) can push you into the zero-tax zone.',
    field: null,
    applyable: false,
  },
]

function buildTaxChatResponse(text, formData, comparison) {
  const lower = text.toLowerCase()
  const gross = parseFloat(formData.grossIncome) || 0

  if (lower.match(/which regime|better regime|compare|recommend|should i (choose|pick|use)/)) {
    if (gross <= 0) return 'Please enter your gross income in the calculator above so I can compare both regimes for you.'
    const c = comparison
    let msg = `Based on your income of ${formatINR(gross)}:\n\n`
    msg += `Old Regime Tax: ${formatINR(c.old.totalTax)} (effective ${c.old.effectiveRate}%)\n`
    msg += `New Regime Tax: ${formatINR(c.new.totalTax)} (effective ${c.new.effectiveRate}%)\n\n`
    msg += `${c.summary}\n\n`
    if (c.recommended === 'old') {
      msg += 'The Old Regime works better when you have significant deductions (investments, rent, insurance). Make sure you have supporting documents.'
    } else {
      msg += 'The New Regime works better when your deductions are relatively low. It offers simpler filing with lower slab rates.'
    }
    return msg
  }

  if (lower.match(/deadline|due date|when.*file|last date|filing date/)) {
    return 'Key ITR filing deadlines for FY 2025-26 (AY 2026-27):\n\n' +
      '- Salaried / Non-audit: 31st July 2026\n' +
      '- Audit cases: 31st October 2026\n' +
      '- Revised return: 31st December 2026\n' +
      '- Belated return: 31st December 2026 (with penalty)\n\n' +
      'File early to get your refund faster!'
  }

  if (lower.match(/how.*file|step.*file|filing.*process|file.*return/)) {
    return 'Step-by-step ITR filing guide:\n\n' +
      '1. Collect documents: Form 16, bank statements, investment proofs\n' +
      '2. Go to incometax.gov.in and log in with PAN\n' +
      '3. Go to e-File > Income Tax Returns > File ITR\n' +
      '4. Select the correct ITR form and assessment year\n' +
      '5. Choose your tax regime (Old or New)\n' +
      '6. Fill in income details from Form 16\n' +
      '7. Enter deductions if using Old Regime\n' +
      '8. Verify tax computation and pay any remaining tax\n' +
      '9. Submit and e-verify using Aadhaar OTP\n\n' +
      'Keep your Form 16 handy — it has most of the information you need!'
  }

  if (lower.match(/how.*save|save.*tax|reduce.*tax|tax.*saving|tax.*benefit/)) {
    return 'Top ways to save tax (Old Regime):\n\n' +
      '1. Invest ₹1.5L in PPF/ELSS/EPF (Section 80C)\n' +
      '2. Get health insurance — save up to ₹75K (Section 80D)\n' +
      '3. Claim HRA if you pay rent\n' +
      '4. Home loan interest — up to ₹2L deduction\n' +
      '5. NPS — extra ₹50K beyond 80C limit\n\n' +
      'Scroll down on the calculator to see personalized suggestions!'
  }

  if (lower.match(/rebate|87a|no tax|zero tax/)) {
    return 'Rebate under Section 87A:\n\n' +
      'New Regime: No tax if taxable income ≤ ₹12,00,000\n(effectively zero tax up to ~₹12.75L gross for salaried)\n\n' +
      'Old Regime: No tax if taxable income ≤ ₹5,00,000\n\n' +
      'Enter your income above to check your eligibility!'
  }

  if (lower.match(/new regime|new tax/)) {
    return 'New Tax Regime (FY 2025-26):\n\n' +
      'Slabs:\n0-4L: 0% | 4-8L: 5% | 8-12L: 10%\n12-16L: 15% | 16-20L: 20% | 20-24L: 25% | >24L: 30%\n\n' +
      'Standard deduction: ₹75,000\n' +
      'Rebate: No tax up to ₹12L taxable income\n\n' +
      'Pros: Lower rates, simpler filing\n' +
      'Cons: No extra deductions allowed'
  }

  if (lower.match(/old regime|old tax/)) {
    return 'Old Tax Regime:\n\n' +
      'Slabs:\n0-2.5L: 0% | 2.5-5L: 5% | 5-10L: 20% | >10L: 30%\n\n' +
      'Standard deduction: ₹50,000\n' +
      'All deductions available: 80C, 80D, HRA, home loan, etc.\n\n' +
      'Best for: People with deductions exceeding ₹2-3L'
  }

  if (lower.match(/hello|hi|hey|help/)) {
    return 'Hi! I\'m your tax assistant. Try asking:\n\n' +
      '- "Which regime is better for me?"\n' +
      '- "How can I save tax?"\n' +
      '- "When is the filing deadline?"\n' +
      '- "How to file my return?"\n' +
      '- "What is the 87A rebate?"'
  }

  return 'I can help with tax-related questions! Try:\n\n' +
    '- "Which regime is better?"\n' +
    '- "How can I save tax?"\n' +
    '- "When is the filing deadline?"\n' +
    '- "How to file my return?"'
}

const taxQuickPrompts = [
  'Which regime is better?',
  'How can I save tax?',
  'Filing deadline?',
  'How to file return?',
  'What is 87A rebate?',
]

export default function TaxationPage() {
  const { currentUser } = useAuth()
  const { taxEntries, loading } = useUserData()

  const [computed, setComputed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingEntry, setSavingEntry] = useState(false)

  const [formData, setFormData] = useState({
    financialYear: '2025-26',
    regime: 'new',
    grossIncome: '',
    deductions80C: '',
    deductions80D: '',
    hra: '',
    homeLoanInterest: '',
    otherDeductions: '',
    npsEmployer: '',
    nps80CCD1B: '',
  })

  const [appliedDeductions, setAppliedDeductions] = useState({})
  const [expandedSuggestion, setExpandedSuggestion] = useState(null)

  const [chatMessages, setChatMessages] = useState([
    { id: 1, from: 'bot', text: 'Hi! I\'m your tax assistant. Ask me about regimes, deadlines, or how to save tax.' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatTyping, setChatTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const grossIncome = parseFloat(formData.grossIncome) || 0

  const comparison = useMemo(() => {
    if (grossIncome <= 0) return null
    return compareRegimes(grossIncome, formData)
  }, [grossIncome, formData])

  const baseTax = useMemo(() => {
    if (!comparison) return 0
    return formData.regime === 'old' ? comparison.old.totalTax : comparison.new.totalTax
  }, [comparison, formData.regime])

  const totalSavingsFromDeductions = useMemo(() => {
    if (!comparison) return 0
    const baseNoDeductions = compareRegimes(grossIncome, {})
    if (formData.regime === 'old') {
      return Math.max(baseNoDeductions.old.totalTax - comparison.old.totalTax, 0)
    }
    return Math.max(baseNoDeductions.new.totalTax - comparison.new.totalTax, 0)
  }, [comparison, grossIncome, formData])

  const totals = useMemo(() => {
    const totalIncome = taxEntries.reduce((sum, entry) => sum + (entry.grossIncome || 0), 0)
    const totalTaxPaid = taxEntries.reduce((sum, entry) => sum + (entry.taxPaid || 0), 0)
    const totalDeductions = taxEntries.reduce(
      (sum, entry) => sum + (entry.deductions80C || 0) + (entry.deductions80D || 0) + (entry.hra || 0) + (entry.homeLoanInterest || 0) + (entry.otherDeductions || 0),
      0,
    )
    return { totalIncome, totalTaxPaid, totalDeductions }
  }, [taxEntries])

  function handleCompute(e) {
    e.preventDefault()
    if (!formData.grossIncome) return
    setComputed(true)
  }

  function handleReset() {
    setComputed(false)
    setFormData({
      financialYear: '2025-26',
      regime: 'new',
      grossIncome: '',
      deductions80C: '',
      deductions80D: '',
      hra: '',
      homeLoanInterest: '',
      otherDeductions: '',
      npsEmployer: '',
      nps80CCD1B: '',
    })
    setAppliedDeductions({})
    setExpandedSuggestion(null)
  }

  function handleApplyDeduction(field, amount) {
    const val = String(Math.max(0, parseFloat(amount) || 0))
    setFormData(prev => ({ ...prev, [field]: val }))
    setAppliedDeductions(prev => ({ ...prev, [field]: true }))
  }

  function handleRemoveDeduction(field) {
    setFormData(prev => ({ ...prev, [field]: '' }))
    setAppliedDeductions(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSaveEntry() {
    if (!currentUser || !comparison) return
    setSavingEntry(true)
    const computedTax = formData.regime === 'old' ? comparison.old.totalTax : comparison.new.totalTax
    try {
      await addDoc(collection(db, 'taxEntries'), {
        userId: currentUser.uid,
        date: new Date().toISOString().split('T')[0],
        financialYear: formData.financialYear,
        regime: formData.regime,
        grossIncome: parseFloat(formData.grossIncome) || 0,
        deductions80C: parseFloat(formData.deductions80C) || 0,
        deductions80D: parseFloat(formData.deductions80D) || 0,
        hra: parseFloat(formData.hra) || 0,
        homeLoanInterest: parseFloat(formData.homeLoanInterest) || 0,
        otherDeductions: parseFloat(formData.otherDeductions) || 0,
        taxPaid: computedTax,
        computedTax,
        notes: '',
        createdAt: serverTimestamp(),
      })
      handleReset()
    } catch (err) {
      console.error('Error saving tax entry:', err)
    } finally {
      setSavingEntry(false)
    }
  }

  async function handleDeleteTaxEntry(id) {
    try {
      await deleteDoc(doc(db, 'taxEntries', id))
    } catch (err) {
      console.error('Error deleting tax entry:', err)
    }
  }

  async function sendChatMessage(text) {
    if (!text.trim()) return
    setChatMessages(prev => [...prev, { id: Date.now(), from: 'user', text: text.trim() }])
    setChatInput('')
    setChatTyping(true)

    try {
      const aiResponse = await getTaxChatResponse(text, {
        grossIncome: formData.grossIncome,
        regime: formData.regime,
        financialYear: formData.financialYear,
      })

      const response = aiResponse || buildTaxChatResponse(text, formData, comparison)

      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: response,
      }])
    } catch {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: buildTaxChatResponse(text, formData, comparison),
      }])
    } finally {
      setChatTyping(false)
    }
  }

  function RegimeCard({ result, isRecommended }) {
    const isOld = result.regime === 'old'
    return (
      <div className={`card p-5 relative ${isRecommended ? 'ring-2 ring-lavender-300 dark:ring-lavender-600' : ''}`}>
        {isRecommended && (
          <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-lavender-500 text-white text-[10px] font-bold">
            Recommended
          </div>
        )}
        <div className="flex items-center gap-2 mb-3">
          {isOld
            ? <TrendingDown className="w-4 h-4 text-peach-500" />
            : <TrendingUp className="w-4 h-4 text-mint-500" />}
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {isOld ? 'Old Regime' : 'New Regime'}
          </h4>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Gross Income</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{formatINR(result.grossIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Standard Deduction</span>
            <span className="font-medium text-mint-600">-{formatINR(result.stdDeduction)}</span>
          </div>
          {isOld && result.totalItemisedDeductions > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Your Deductions</span>
              <span className="font-medium text-mint-600">-{formatINR(result.totalItemisedDeductions)}</span>
            </div>
          )}
          {!isOld && result.totalExtraDeductions > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">NPS Deductions</span>
              <span className="font-medium text-mint-600">-{formatINR(result.totalExtraDeductions)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--card-border)' }}>
            <span className="text-gray-500">Taxable Income</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{formatINR(result.taxableIncome)}</span>
          </div>
          {result.rebate87A > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Rebate (87A)</span>
              <span className="font-medium text-mint-600">-{formatINR(result.rebate87A)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Cess (4%)</span>
            <span className="font-medium text-gray-600 dark:text-gray-300">{formatINR(result.cess)}</span>
          </div>
          <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--card-border)' }}>
            <span className="font-semibold text-gray-700 dark:text-gray-200">Total Tax</span>
            <span className="text-base font-bold text-lavender-600 dark:text-lavender-400">{formatINR(result.totalTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Effective Rate</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{result.effectiveRate}%</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        icon={Calculator}
        title="Tax Computation"
        subtitle="Simplify your taxes — see how much you owe, and how to save more"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-lavender-50 to-white dark:from-lavender-900/20 dark:to-transparent">
          <p className="text-xs text-gray-500 font-medium">Income Logged</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{formatINRShort(totals.totalIncome)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium">Deductions Logged</p>
          <p className="text-2xl font-bold text-mint-600 mt-1">{formatINRShort(totals.totalDeductions)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium">Tax Computed</p>
          <p className="text-2xl font-bold text-peach-600 mt-1">{formatINRShort(totals.totalTaxPaid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium">Saved Records</p>
          <p className="text-2xl font-bold text-lavender-600 mt-1">{taxEntries.length}</p>
        </div>
      </div>

      {/* Step 1: Simple Input Form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-lavender-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Tax Calculator</h3>
            <p className="text-[11px] text-gray-400">Enter your income to see your tax breakdown</p>
          </div>
        </div>

        <form onSubmit={handleCompute} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                Gross Annual Income *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  placeholder="e.g. 12,00,000"
                  value={formData.grossIncome}
                  onChange={(e) => {
                    setFormData({ ...formData, grossIncome: e.target.value })
                    if (computed) setComputed(false)
                  }}
                  className="input-field text-sm pl-8"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                Regime
              </label>
              <select
                value={formData.regime}
                onChange={(e) => {
                  setAppliedDeductions({})
                  setExpandedSuggestion(null)
                  setFormData(prev => ({ ...prev, regime: e.target.value }))
                }}
                className="input-field text-sm"
              >
                <option value="new">New Regime (Default)</option>
                <option value="old">Old Regime</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                Financial Year
              </label>
              <select
                value={formData.financialYear}
                onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                className="input-field text-sm"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Compute Tax
            </button>
            {computed && (
              <button type="button" onClick={handleReset} className="btn-secondary text-sm">
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Step 2: Tax Result */}
      <AnimatePresence>
        {computed && comparison && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Regime Comparison */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lavender-400" />
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Your Tax Breakdown</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RegimeCard result={comparison.old} isRecommended={comparison.recommended === 'old'} />
                <RegimeCard result={comparison.new} isRecommended={comparison.recommended === 'new'} />
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-lavender-50 to-mint-50 dark:from-lavender-900/20 dark:to-mint-900/20">
                <CheckCircle2 className="w-4 h-4 text-lavender-500 flex-shrink-0" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{comparison.summary}</p>
              </div>
            </div>

            {/* Step 3: Tax Saving Suggestions */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Save More Tax</h3>
                  <p className="text-[11px] text-gray-400">
                    Apply deductions to reduce your tax
                    {totalSavingsFromDeductions > 0 && (
                      <span className="text-mint-600 font-semibold ml-1">
                        — You're saving {formatINR(totalSavingsFromDeductions)} so far!
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Regime Tabs for Savings */}
              <div className="flex gap-2 mt-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAppliedDeductions({})
                    setExpandedSuggestion(null)
                    setFormData(prev => ({ ...prev, regime: 'old' }))
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    formData.regime === 'old'
                      ? 'bg-peach-500 text-white shadow-soft'
                      : 'bg-peach-50 dark:bg-peach-900/20 text-peach-600 dark:text-peach-400 border border-peach-200 dark:border-peach-800/30'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Old Regime ({TAX_SAVING_OPTIONS.length} options)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedDeductions({})
                    setExpandedSuggestion(null)
                    setFormData(prev => ({ ...prev, regime: 'new' }))
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    formData.regime === 'new'
                      ? 'bg-mint-500 text-white shadow-soft'
                      : 'bg-mint-50 dark:bg-mint-900/20 text-mint-600 dark:text-mint-400 border border-mint-200 dark:border-mint-800/30'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  New Regime ({NEW_REGIME_SAVING_OPTIONS.filter(o => o.applyable).length} options)
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={formData.regime}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {(formData.regime === 'old' ? TAX_SAVING_OPTIONS : NEW_REGIME_SAVING_OPTIONS).map((option) => {
                    const Icon = option.icon
                    const isExpanded = expandedSuggestion === option.id
                    const isApplyable = option.applyable !== false
                    const isApplied = option.field ? appliedDeductions[option.field] : false
                    const currentValue = option.field ? formData[option.field] : ''
                    const effectiveMax = option.dynamicMax ? Math.round(grossIncome * 0.14) : option.maxLimit

                    return (
                      <div
                        key={option.id}
                        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                          isApplied
                            ? 'border-mint-200 dark:border-mint-700 bg-mint-50/50 dark:bg-mint-900/10'
                            : !isApplyable
                              ? 'border-mint-100 dark:border-mint-800/30 bg-mint-50/30 dark:bg-mint-900/5'
                              : 'border-lavender-100/50 dark:border-lavender-800/30'
                        }`}
                        style={{ backgroundColor: (isApplied || !isApplyable) ? undefined : 'var(--surface-bg)' }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedSuggestion(isExpanded ? null : option.id)}
                          className="w-full flex items-center gap-3 p-4 text-left"
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isApplied
                              ? 'bg-mint-500 text-white'
                              : !isApplyable
                                ? 'bg-mint-200 dark:bg-mint-800/40 text-mint-600 dark:text-mint-400'
                                : ''
                          }`}
                            style={(!isApplied && isApplyable) ? {
                              backgroundColor: option.color === 'mint' ? '#dcfce7' : option.color === 'blush' ? '#ffe4e6' : option.color === 'peach' ? '#ffedd5' : '#ede9fe',
                            } : {}}
                          >
                            {isApplied ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{option.title}</span>
                              <span className="px-1.5 py-0.5 rounded-lg bg-lavender-100 dark:bg-lavender-900/30 text-[9px] font-semibold text-lavender-600 dark:text-lavender-400">
                                {option.subtitle}
                              </span>
                              {!isApplyable && (
                                <span className="px-1.5 py-0.5 rounded-lg bg-mint-100 dark:bg-mint-900/30 text-[9px] font-semibold text-mint-600 dark:text-mint-400">
                                  Auto-applied
                                </span>
                              )}
                              {isApplied && currentValue && (
                                <span className="text-xs font-bold text-mint-600">
                                  {formatINR(parseFloat(currentValue))} applied
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{option.description.substring(0, 80)}...</p>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3">
                                <div className="p-3 rounded-xl bg-lavender-50/50 dark:bg-lavender-900/10">
                                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {option.description}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-2">
                                    <span className="font-semibold">Examples:</span> {option.examples}
                                  </p>
                                </div>

                                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-mint-50 dark:bg-mint-900/10 border border-mint-100 dark:border-mint-800/30">
                                  <Info className="w-3.5 h-3.5 text-mint-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-mint-700 dark:text-mint-300">{option.tip}</p>
                                </div>

                                {isApplyable && option.field && (
                                  <>
                                    <div className="flex items-center gap-3">
                                      <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max={effectiveMax}
                                          placeholder={`Max: ₹${effectiveMax.toLocaleString('en-IN')}`}
                                          value={currentValue}
                                          onChange={(e) => setFormData(prev => ({ ...prev, [option.field]: e.target.value }))}
                                          className="input-field text-sm pl-7"
                                        />
                                      </div>
                                      {isApplied ? (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveDeduction(option.field)}
                                          className="px-4 py-2.5 rounded-2xl bg-blush-100 dark:bg-blush-900/20 text-blush-600 text-xs font-bold hover:bg-blush-200 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleApplyDeduction(option.field, currentValue || effectiveMax)}
                                          className="btn-primary text-xs py-2.5"
                                        >
                                          Apply
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-400">
                                      Maximum allowed: {formatINR(effectiveMax)}
                                      {option.dynamicMax && ' (14% of your gross income)'}
                                    </p>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Save Entry */}
            <div className="card bg-gradient-to-br from-lavender-50 to-mint-50 dark:from-lavender-900/20 dark:to-mint-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">
                    Your tax: {formatINR(baseTax)}
                    {totalSavingsFromDeductions > 0 && (
                      <span className="text-mint-600 ml-2 text-xs font-medium">
                        (saving {formatINR(totalSavingsFromDeductions)} with deductions)
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Save this computation to your tax records</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={savingEntry}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {savingEntry ? <Spinner size="sm" /> : <><Plus className="w-4 h-4" /> Save to Records</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tax Filing Help Chatbot */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircleHeart className="w-4 h-4 text-lavender-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">Tax Filing Help</h3>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
          <div className="h-56 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--app-bg)' }}>
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.from === 'bot' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.from === 'user'
                    ? 'bg-gradient-to-r from-lavender-400 to-lavender-500 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-800/80 border border-lavender-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-sm shadow-soft'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatTyping && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800/80 border border-lavender-100 dark:border-gray-700 px-3 py-2 rounded-xl rounded-bl-sm shadow-soft">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-lavender-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-lavender-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-lavender-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t scrollbar-hide" style={{ borderColor: 'var(--card-border)' }}>
            {taxQuickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => sendChatMessage(p)}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800/80 border border-lavender-100 dark:border-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:border-lavender-300 hover:text-lavender-600 transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput) }}
            className="flex items-center gap-2 p-3 border-t"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about tax filing, deductions, deadlines..."
              className="input-field text-xs flex-1"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-8 h-8 rounded-xl bg-gradient-to-r from-lavender-400 to-blush-400 flex items-center justify-center text-white shadow-soft hover:shadow-soft-md transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Tax Records Table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-4">Tax Records</h3>
        {loading ? (
          <Spinner className="py-8" />
        ) : taxEntries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No tax records yet. Compute your tax above and save it.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-lavender-100 dark:border-gray-700">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Date</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">FY</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Regime</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">Income</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">Deductions</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">Tax</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {taxEntries.map((entry) => {
                  const deductions =
                    (entry.deductions80C || 0) + (entry.deductions80D || 0) +
                    (entry.hra || 0) + (entry.homeLoanInterest || 0) + (entry.otherDeductions || 0)
                  return (
                    <tr key={entry.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-lavender-50/30 dark:hover:bg-lavender-900/10 transition-colors">
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{entry.date}</td>
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-medium">{entry.financialYear}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-xl text-[11px] font-semibold ${entry.regime === 'old' ? 'bg-peach-100 dark:bg-peach-900/30 text-peach-700 dark:text-peach-400' : 'bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-400'}`}>
                          {entry.regime === 'old' ? 'Old' : 'New'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">{formatINR(entry.grossIncome || 0)}</td>
                      <td className="py-2.5 px-3 text-right text-mint-700 dark:text-mint-400 font-semibold">{formatINR(deductions)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">{formatINR(entry.computedTax || entry.taxPaid || 0)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button onClick={() => handleDeleteTaxEntry(entry.id)} className="p-1 rounded-lg hover:bg-blush-50 dark:hover:bg-blush-900/20 text-gray-400 hover:text-blush-500 transition-colors">
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
    </div>
  )
}
