import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronRight, TrendingUp, TrendingDown,
  Lightbulb, ExternalLink, Newspaper, ArrowRight, X, Loader2,
} from 'lucide-react'
import { getDailyLesson, explainConcept } from '../../utils/geminiApi'
import { getMarketOverview, getMarketIndices } from '../../utils/marketApi'
import { fetchFinanceNews } from '../../utils/newsApi'
import Modal from '../ui/Modal'

const CONCEPTS = [
  'What is an ETF?',
  'SmallCap vs MidCap vs LargeCap',
  'What are Commodities?',
  'Mutual Funds: Direct vs Regular',
  'What is NAV?',
  'Debt vs Equity Funds',
  'Index Funds Explained',
  'Power of Compounding',
  'What is SIP?',
]

function MarketTicker() {
  const [market, setMarket] = useState(null)
  const [indices, setIndices] = useState(null)
  const tickerRef = useRef(null)

  useEffect(() => {
    getMarketOverview().then(setMarket)
    getMarketIndices().then(setIndices)
  }, [])

  const items = []
  if (indices) {
    items.push(
      { label: 'NIFTY 50', value: indices.nifty.value, change: indices.nifty.change, up: indices.nifty.direction === 'up' },
      { label: 'SENSEX', value: indices.sensex.value, change: indices.sensex.change, up: indices.sensex.direction === 'up' },
    )
  }
  if (market) {
    if (market.topGainers?.[0]) {
      const g = market.topGainers[0]
      items.push({ label: `Top Gainer: ${g.ticker}`, value: `$${g.price}`, change: g.change, up: true })
    }
    if (market.topLosers?.[0]) {
      const l = market.topLosers[0]
      items.push({ label: `Top Loser: ${l.ticker}`, value: `$${l.price}`, change: l.change, up: false })
    }
  }

  if (items.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-3">
      <div
        ref={tickerRef}
        className="flex gap-6 animate-marquee"
        style={{ animation: 'marquee 20s linear infinite' }}
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-gray-400 font-medium">{item.label}</span>
            <span className="text-sm text-white font-bold">{item.value}</span>
            <span className={`text-xs font-semibold ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {item.up ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
              {item.change}
            </span>
            <span className="text-gray-600">|</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

function DailyLearningCard() {
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dayNumber, setDayNumber] = useState(() => {
    return parseInt(localStorage.getItem('ally_lesson_day') || '1', 10)
  })

  useEffect(() => {
    setLoading(true)
    getDailyLesson(dayNumber).then(data => {
      setLesson(data)
      setLoading(false)
    })
  }, [dayNumber])

  function handleNext() {
    const next = dayNumber + 1
    localStorage.setItem('ally_lesson_day', String(next))
    setDayNumber(next)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-lavender-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">Daily Lesson</h3>
            <p className="text-[11px] text-gray-400">Day {dayNumber} of 20</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full bg-lavender-100 dark:bg-lavender-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-lavender-600 transition-all duration-500"
              style={{ width: `${Math.min((dayNumber / 20) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{Math.min(dayNumber, 20)}/20</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse py-4">
          <div className="skeleton h-4 w-3/4 rounded-lg" />
          <div className="skeleton h-3 w-full rounded-lg" />
          <div className="skeleton h-3 w-full rounded-lg" />
          <div className="skeleton h-3 w-2/3 rounded-lg" />
        </div>
      ) : lesson ? (
        <>
          <div className="bg-gradient-to-br from-lavender-50 to-mint-50 dark:from-lavender-900/20 dark:to-mint-900/20 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-lavender-600 dark:text-lavender-400 mb-2">
              {lesson.topic}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line prose-sm">
              {lesson.content?.substring(0, 800)}
              {lesson.content?.length > 800 && '...'}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            Next Lesson <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      ) : null}
    </motion.div>
  )
}

function ConceptExplorerGrid() {
  const [selectedConcept, setSelectedConcept] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConceptClick(concept) {
    setSelectedConcept(concept)
    setLoading(true)
    const result = await explainConcept(concept)
    setExplanation(result)
    setLoading(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CONCEPTS.map((concept) => (
          <motion.button
            key={concept}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConceptClick(concept)}
            className="text-left p-4 rounded-2xl bg-gradient-to-br from-lavender-50/50 to-white dark:from-lavender-900/20 dark:to-gray-800/50 border border-lavender-100/50 dark:border-lavender-800/30 hover:shadow-soft transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-peach-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{concept}</span>
            </div>
            <p className="text-[11px] text-gray-400">Tap to learn</p>
          </motion.button>
        ))}
      </div>

      <Modal
        open={!!selectedConcept}
        onClose={() => setSelectedConcept(null)}
        title={selectedConcept || ''}
        size="lg"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-lavender-500 animate-spin" />
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto">
            {explanation}
          </div>
        )}
      </Modal>
    </>
  )
}

function MarketNewsFeed() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceNews().then(articles => {
      setNews(articles)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-shrink-0 w-72 card animate-pulse">
            <div className="skeleton h-32 w-full rounded-xl mb-3" />
            <div className="skeleton h-4 w-3/4 rounded-lg mb-2" />
            <div className="skeleton h-3 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
      {news.map((article, i) => (
        <motion.a
          key={i}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex-shrink-0 w-72 rounded-2xl border border-lavender-100/50 dark:border-lavender-800/30 overflow-hidden hover:shadow-soft transition-all group"
          style={{ backgroundColor: 'var(--surface-bg)' }}
        >
          {article.image && (
            <div className="h-32 overflow-hidden">
              <img
                src={article.image}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}
          <div className="p-4">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 line-clamp-2 mb-1">
              {article.title}
            </p>
            <p className="text-[11px] text-gray-400 line-clamp-2 mb-2">{article.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-lavender-500 font-semibold">{article.source?.name}</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  )
}

export default function LearnSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="px-3 py-1 rounded-full bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-400 text-xs font-bold">
          Phase 1
        </span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Learn</h2>
        <p className="text-xs text-gray-400 ml-2">Build your investment knowledge</p>
      </div>

      <MarketTicker />
      <DailyLearningCard />

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-peach-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">Concept Explorer</h3>
        </div>
        <ConceptExplorerGrid />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-lavender-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">Market News</h3>
        </div>
        <MarketNewsFeed />
      </div>
    </motion.section>
  )
}
