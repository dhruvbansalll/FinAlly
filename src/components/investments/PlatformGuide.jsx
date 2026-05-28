import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { getPlatformRecommendation } from '../../utils/geminiApi'

const ASSET_CATEGORIES = [
  { id: 'stocks-etfs', label: 'Stocks & ETFs', emoji: '📈' },
  { id: 'mutual-funds', label: 'Mutual Funds', emoji: '🏦' },
  { id: 'fixed-deposits', label: 'Fixed Deposits', emoji: '🔒' },
  { id: 'gold', label: 'Gold', emoji: '🪙' },
  { id: 'ppf-ssy', label: 'PPF / SSY', emoji: '🏛️' },
]

const FALLBACK_PLATFORMS = {
  'stocks-etfs': [
    { name: 'Zerodha', bestFor: 'Active traders & long-term investors', fees: '₹0 equity delivery, ₹20/order intraday', rating: 5, whyWomen: 'Most trusted platform with excellent learning resources (Varsity)' },
    { name: 'Groww', bestFor: 'Beginners & mobile-first users', fees: '₹0 equity delivery, ₹20/order intraday', rating: 4, whyWomen: 'Simplest interface — perfect for first-time investors' },
    { name: 'Upstox', bestFor: 'Cost-conscious active traders', fees: '₹0 equity delivery, ₹20/order intraday', rating: 4, whyWomen: 'Low-cost with powerful charting tools' },
    { name: 'Angel One', bestFor: 'Research-driven investors', fees: '₹0 equity delivery, ₹20/order intraday', rating: 4, whyWomen: 'Free advisory and research reports for informed decisions' },
  ],
  'mutual-funds': [
    { name: 'Kuvera', bestFor: 'Direct mutual fund investors', fees: 'Completely free, no commissions', rating: 5, whyWomen: 'Goal-based investing with family portfolio tracking' },
    { name: 'Coin by Zerodha', bestFor: 'Zerodha users wanting MFs', fees: 'Free for direct plans', rating: 4, whyWomen: 'Integrated with Zerodha — one platform for everything' },
    { name: 'Groww', bestFor: 'Beginners exploring mutual funds', fees: 'Free for direct plans', rating: 4, whyWomen: 'Simple SIP setup with auto-debit — truly hands-off' },
    { name: 'Paytm Money', bestFor: 'UPI-savvy investors', fees: 'Free for direct plans', rating: 3, whyWomen: 'Familiar Paytm interface — easy transition to investing' },
  ],
  'fixed-deposits': [
    { name: 'SBI FD', bestFor: 'Trust and safety seekers', fees: 'No fees, 6.5-7.1% interest', rating: 4, whyWomen: 'Highest trust factor — government backing gives peace of mind' },
    { name: 'Post Office TD', bestFor: 'Tax-saving FD under 80C', fees: 'No fees, 7.0-7.5% interest', rating: 4, whyWomen: 'Available at every post office — perfect for tier 2/3 cities' },
    { name: 'Bajaj Finance FD', bestFor: 'Higher returns on FD', fees: 'No fees, 7.4-8.1% interest', rating: 4, whyWomen: 'Special higher rates for senior citizen women' },
    { name: 'Shriram Finance FD', bestFor: 'High-yield corporate FD', fees: 'No fees, 8.0-9.0% interest', rating: 3, whyWomen: 'Among the highest FD rates — great for wealth building' },
  ],
  'gold': [
    { name: 'Sovereign Gold Bonds (SGB)', bestFor: 'Long-term gold investors', fees: 'No making charges, 2.5% annual interest', rating: 5, whyWomen: 'Gold + interest income — better than physical gold. Tax-free on maturity' },
    { name: 'Digital Gold (Groww/Paytm)', bestFor: 'Small gold investments', fees: 'Buy from ₹1, 3% spread', rating: 3, whyWomen: 'Start with tiny amounts — great for building gold savings slowly' },
    { name: 'Gold ETFs', bestFor: 'Demat gold investors', fees: '0.5-1% expense ratio', rating: 4, whyWomen: 'No storage worry, highly liquid, trade like stocks' },
    { name: 'Gold Mutual Funds', bestFor: 'SIP in gold', fees: '0.5-1.5% expense ratio', rating: 4, whyWomen: 'Monthly SIP in gold — systematic and disciplined' },
  ],
  'ppf-ssy': [
    { name: 'Post Office', bestFor: 'Traditional savers', fees: 'No fees', rating: 4, whyWomen: 'Widest network — accessible everywhere in India' },
    { name: 'SBI', bestFor: 'Online banking users', fees: 'No fees', rating: 4, whyWomen: 'Online PPF management through SBI net banking' },
    { name: 'ICICI Bank', bestFor: 'Digital-first banking', fees: 'No fees', rating: 4, whyWomen: 'Fully digital SSY/PPF opening and management' },
    { name: 'HDFC Bank', bestFor: 'Premium banking users', fees: 'No fees', rating: 4, whyWomen: 'Seamless PPF/SSY linked to savings account' },
  ],
}

export default function PlatformGuide() {
  const [activeCategory, setActiveCategory] = useState('stocks-etfs')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [aiContent, setAiContent] = useState({})
  const [direction, setDirection] = useState(0)

  const platforms = FALLBACK_PLATFORMS[activeCategory] || []

  async function loadAiContent(categoryId) {
    if (aiContent[categoryId]) return
    const result = await getPlatformRecommendation(
      ASSET_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId
    )
    if (result) {
      setAiContent(prev => ({ ...prev, [categoryId]: result }))
    }
  }

  function handleCategoryChange(id) {
    setActiveCategory(id)
    setCurrentIndex(0)
    setDirection(0)
    loadAiContent(id)
  }

  function goNext() {
    if (currentIndex < platforms.length - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
    }
  }

  const platform = platforms[currentIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center">
          <Monitor className="w-4 h-4 text-mint-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Platform Guide</h3>
          <p className="text-[11px] text-gray-400">Best platforms for each investment type</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {ASSET_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-lavender-500 text-white'
                : 'bg-lavender-50 dark:bg-lavender-900/20 text-gray-600 dark:text-gray-300 hover:bg-lavender-100'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {platform && (
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-lavender-50 dark:bg-lavender-900/20 hover:bg-lavender-100 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-lavender-600" />
          </button>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeCategory}-${currentIndex}`}
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-5 rounded-2xl bg-gradient-to-br from-lavender-50/50 to-white dark:from-lavender-900/10 dark:to-gray-800/30 border border-lavender-100/50 dark:border-lavender-800/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-gray-700 dark:text-gray-200">{platform.name}</h4>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`w-3.5 h-3.5 ${si < platform.rating ? 'text-peach-400 fill-peach-400' : 'text-gray-200 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-semibold">Best for:</span> {platform.bestFor}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="font-semibold">Fees:</span> {platform.fees}
                </p>
                <div className="px-3 py-2 rounded-xl bg-blush-50 dark:bg-blush-900/20 border border-blush-100 dark:border-blush-800/30">
                  <p className="text-[11px] text-blush-600 dark:text-blush-400 font-medium">
                    {platform.whyWomen}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              {platforms.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i) }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex
                      ? 'bg-lavender-500 w-5'
                      : 'bg-lavender-200 dark:bg-lavender-700 hover:bg-lavender-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={goNext}
            disabled={currentIndex === platforms.length - 1}
            className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center transition-all bg-lavender-50 dark:bg-lavender-900/20 hover:bg-lavender-100 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-lavender-600" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
