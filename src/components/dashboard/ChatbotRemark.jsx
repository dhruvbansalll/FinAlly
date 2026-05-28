import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircleHeart, Sparkles } from 'lucide-react'
import { useUserData } from '../../contexts/UserDataContext'

export default function ChatbotRemark() {
  const { profile, totalExpenses, totalSavings } = useUserData()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  const name = profile?.name?.split(' ')[0] || 'there'

  let message
  if (totalExpenses === 0 && totalSavings === 0) {
    message = `Welcome, ${name}! 🌸 Start by adding your expenses and savings to get personalized insights. I'm here to help you on your financial journey! 💜`
  } else if (totalSavings > totalExpenses) {
    message = `Great job, ${name}! 🌸 You're saving more than you spend — that's amazing progress. Keep building those healthy financial habits! 💜`
  } else {
    message = `Hey ${name}, your expenses are a bit high this period. Let's look at ways to optimize your spending and boost your savings! 🌱💜`
  }

  return (
    <div className="card bg-gradient-to-r from-lavender-50 to-blush-50 border-lavender-200/50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center shadow-soft flex-shrink-0">
          <MessageCircleHeart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs font-semibold text-lavender-700 dark:text-gray-700">Ally, your AI Advisor</p>
            <Sparkles className="w-3 h-3 text-lavender-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-700 leading-relaxed">
            {message}
          </p>
          {!dismissed && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate('/chatbot')}
                className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-gray-200 text-lavender-600 dark:text-gray-700 text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all"
              >
                Tell me more
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 rounded-xl text-gray-400 dark:text-gray-700 text-xs font-medium hover:text-lavender-500 transition-colors"
              >
                Thanks, Ally! 💛
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
