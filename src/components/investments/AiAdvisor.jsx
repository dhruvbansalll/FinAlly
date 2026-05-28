import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { getInvestmentAdvice } from '../../utils/geminiApi'
import { useUserData } from '../../contexts/UserDataContext'

export default function AiAdvisor({ lifeStage }) {
  const { investments, profile, goals } = useUserData()
  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef(null)

  function animateText(fullText) {
    setIsTyping(true)
    setDisplayedText('')
    let idx = 0
    intervalRef.current = setInterval(() => {
      idx += 3
      if (idx >= fullText.length) {
        setDisplayedText(fullText)
        setIsTyping(false)
        clearInterval(intervalRef.current)
      } else {
        setDisplayedText(fullText.substring(0, idx))
      }
    }, 10)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function handleGetAdvice() {
    setLoading(true)
    setAdvice(null)
    setDisplayedText('')
    try {
      const result = await getInvestmentAdvice({
        portfolio: investments,
        profile,
        lifeStage,
      })
      setAdvice(result)
      animateText(result)
    } catch (err) {
      console.error('AI Advisor error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-100">AI Investment Advisor</h3>
            <p className="text-[11px] text-gray-400">Personalized advice powered by Gemini</p>
          </div>
        </div>
        {advice && (
          <button
            onClick={handleGetAdvice}
            className="p-2 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 text-gray-400 hover:text-lavender-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {!advice && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Get personalized investment advice based on your portfolio, profile, and life stage.
            {lifeStage && (
              <span className="block mt-1 text-lavender-500 font-semibold">
                Life stage: {lifeStage.replace('-', ' ')}
              </span>
            )}
          </p>
          <button
            onClick={handleGetAdvice}
            className="btn-primary text-sm flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Get Personalized Advice
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-lavender-500 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Analyzing your portfolio...</p>
        </div>
      )}

      {advice && !loading && (
        <div className="bg-gradient-to-br from-lavender-50/50 to-mint-50/50 dark:from-lavender-900/20 dark:to-mint-900/10 rounded-2xl p-5">
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {displayedText}
            {isTyping && <span className="inline-block w-1.5 h-4 bg-lavender-500 animate-pulse ml-0.5" />}
          </div>
        </div>
      )}
    </motion.div>
  )
}
