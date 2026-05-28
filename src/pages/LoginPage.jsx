import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { motion } from 'framer-motion'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setLoading(true)
      if (resetMode) {
        await resetPassword(email)
        toast.success('Password reset email sent! Check your inbox. 📧')
        setResetMode(false)
      } else {
        await login(email, password)
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Failed to process request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--app-bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <BrandMark size="xl" className="mb-8 justify-center" />

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            {resetMode ? 'Reset Password' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            {resetMode ? 'Enter your email to receive a reset link.' : 'Log in to continue your journey 🌟'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            {!resetMode && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-lavender-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : resetMode ? 'Send Reset Link' : 'Log In'}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setResetMode(!resetMode)}
              className="text-sm text-lavender-500 font-medium hover:underline"
            >
              {resetMode ? 'Back to login' : 'Forgot Password?'}
            </button>
          </div>

          {!resetMode && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-lavender-500 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
