import { useState } from 'react'
import { MessageCircleHeart, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ChatbotBubble() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {/* Expanded menu */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-lavender-200 dark:border-lavender-700/50 p-4 w-72 animated-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">FinAlly Assistant</h3>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Close chatbot menu"
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Get instant answers about your finances, spending trends, goals, and more! 🌸
          </p>
          <Link
            to="/chatbot"
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-lavender-400 to-blush-400 text-white text-xs font-semibold hover:shadow-soft-md transition-all"
          >
            <MessageCircleHeart className="w-4 h-4" />
            Open Chat
          </Link>
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Open financial chatbot"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center text-white shadow-lg hover:shadow-lg-md transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
      >
        <MessageCircleHeart className="w-6 h-6" />
      </button>
    </div>
  )
}
