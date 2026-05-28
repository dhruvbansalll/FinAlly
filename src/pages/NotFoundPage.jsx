import { Link } from 'react-router-dom'
import { Home, Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-blush-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-lavender-400 to-blush-400 flex items-center justify-center mx-auto mb-6 shadow-soft-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Page not found</h2>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track! 🌸
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  )
}
