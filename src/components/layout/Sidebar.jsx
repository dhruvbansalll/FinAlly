import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Scale,
  Receipt,
  Target,
  PiggyBank,
  TrendingUp,
  Calculator,
  FileText,
  Landmark,
  X,
} from 'lucide-react'
import { useAppSettings } from '../../contexts/AppSettingsContext'
import BrandMark from '../BrandMark'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/pay-parity', icon: Scale, labelKey: 'payParity' },
  { to: '/expenses', icon: Receipt, labelKey: 'expenses' },
  { to: '/savings', icon: PiggyBank, labelKey: 'savings' },
  { to: '/goals', icon: Target, labelKey: 'goals' },
  { to: '/investments', icon: TrendingUp, labelKey: 'investments' },
  { to: '/government-schemes', icon: Landmark, labelKey: 'governmentSchemes' },
  { to: '/taxation', icon: Calculator, labelKey: 'taxation' },
  { to: '/documents', icon: FileText, labelKey: 'documents' },
]

export default function Sidebar({ open, onClose }) {
  const { t } = useAppSettings()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogoClick() {
    onClose()
    if (location.pathname === '/') {
      // Already on dashboard — force a remount so it looks like a fresh navigation
      navigate(0)
    } else {
      navigate('/')
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          border-r flex flex-col
          backdrop-blur-xl
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <button
            onClick={handleLogoClick}
            className="hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="Go to Dashboard"
          >
            <BrandMark size="md" tagline={t('sidebar.tagline')} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-gradient-to-r from-lavender-100 to-blush-50 dark:from-lavender-900/60 dark:to-blush-900/30 text-lavender-700 dark:text-lavender-300 shadow-soft'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-lavender-50 dark:hover:bg-lavender-900/30 hover:text-lavender-600 dark:hover:text-lavender-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive ? 'text-lavender-500 dark:text-lavender-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-lavender-400'
                    }`}
                  />
                  <span>{t(`sidebar.nav.${labelKey}`)}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-lavender-400 animate-pulse-soft" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4">
          <a
            href="https://courageous-hummingbird-c36b37.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-3 rounded-2xl border transition-all duration-200 hover:border-[var(--ring-color)] hover:bg-lavender-50 dark:hover:bg-lavender-900/20"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#844dee' }}>Build App</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">Step-by-step guide to set up and run FinAlly on your own machine.</p>
          </a>
        </div>
      </aside>
    </>
  )
}
