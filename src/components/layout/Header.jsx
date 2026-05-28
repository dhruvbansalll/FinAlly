import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, Bell, Settings, Menu, LogOut, User, ChevronDown, X, Sun, Moon, AlertCircle, Target, TrendingDown, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUserData } from '../../contexts/UserDataContext'
import { useAppSettings } from '../../contexts/AppSettingsContext'

function getSearchItems(t) {
  return [
    { label: t('sidebar.nav.dashboard'), desc: 'Overview and summary', to: '/', keywords: ['home', 'overview', 'summary'] },
    { label: t('sidebar.nav.expenses'), desc: 'Track and analyze spending', to: '/expenses', keywords: ['spending', 'cost', 'transactions'] },
    { label: t('sidebar.nav.savings'), desc: 'Savings entries and goals', to: '/savings', keywords: ['save', 'emergency fund'] },
    { label: t('sidebar.nav.goals'), desc: 'Financial goals progress', to: '/goals', keywords: ['target', 'goal tracking'] },
    { label: t('sidebar.nav.investments'), desc: 'Portfolio and returns', to: '/investments', keywords: ['sip', 'stocks', 'mutual funds'] },
    { label: t('sidebar.nav.taxation'), desc: 'Income, deductions, tax records', to: '/taxation', keywords: ['tax', '80c', '80d', 'regime'] },
    { label: t('sidebar.nav.payParity'), desc: 'Salary fairness and negotiation tips', to: '/pay-parity', keywords: ['salary', 'parity', 'negotiation'] },
    { label: t('sidebar.nav.chatbot'), desc: 'Financial Q&A assistant', to: '/chatbot', keywords: ['assistant', 'chat', 'ally'] },
    { label: t('sidebar.nav.documents'), desc: 'Upload and manage documents', to: '/documents', keywords: ['files', 'upload', 'proof'] },
    { label: t('sidebar.nav.settings'), desc: 'Theme, language, notifications', to: '/settings', keywords: ['preferences', 'appearance', 'privacy'] },
    { label: t('sidebar.nav.profile'), desc: 'Personal and salary information', to: '/profile', keywords: ['account', 'salary', 'skills'] },
  ]
}

export default function Header({ onMenuToggle }) {
  const { currentUser, logout } = useAuth()
  const { profile, expenses, goals, currentMonthExpenses } = useUserData()
  const { t, darkMode, toggleDarkMode } = useAppSettings()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [readNotifs, setReadNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('finally.readNotifs') || '[]') } catch { return [] }
  })
  const [searchText, setSearchText] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Build real notifications from user data
  const notifications = useMemo(() => {
    const items = []
    const budget = profile?.monthlyBudget || 0
    const savingsTarget = profile?.monthlySavingsTarget || 0
    const spent = currentMonthExpenses || 0

    if (budget > 0) {
      const pct = Math.round((spent / budget) * 100)
      if (pct >= 100) {
        items.push({ id: 'budget-exceeded', icon: AlertCircle, color: 'text-blush-500', bg: 'bg-blush-50 dark:bg-blush-900/20', title: 'Budget exceeded!', desc: `You've spent ${pct}% of your ₹${budget.toLocaleString()} monthly budget.`, to: '/expenses' })
      } else if (pct >= 80) {
        items.push({ id: 'budget-warning', icon: AlertCircle, color: 'text-peach-500', bg: 'bg-peach-50 dark:bg-peach-900/20', title: 'Approaching budget limit', desc: `${pct}% of your monthly budget used. ₹${(budget - spent).toLocaleString()} remaining.`, to: '/expenses' })
      }
    }

    if (!profile?.profileComplete) {
      items.push({ id: 'profile-incomplete', icon: User, color: 'text-lavender-500', bg: 'bg-lavender-50 dark:bg-lavender-900/20', title: 'Complete your profile', desc: 'Add your salary and role to unlock pay parity insights and financial guidance.', to: '/profile' })
    }

    const overdueGoals = (goals || []).filter((g) => g.deadline && new Date(g.deadline) < new Date() && (g.current || 0) < g.target)
    if (overdueGoals.length > 0) {
      items.push({ id: 'goals-overdue', icon: Target, color: 'text-blush-500', bg: 'bg-blush-50 dark:bg-blush-900/20', title: `${overdueGoals.length} goal${overdueGoals.length > 1 ? 's' : ''} past deadline`, desc: `You have unfinished goals past their target date. Review and update them.`, to: '/goals' })
    }

    const goalsSoon = (goals || []).filter((g) => {
      if (!g.deadline || (g.current || 0) >= g.target) return false
      const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 7
    })
    if (goalsSoon.length > 0) {
      items.push({ id: 'goals-soon', icon: Target, color: 'text-peach-500', bg: 'bg-peach-50 dark:bg-peach-900/20', title: `Goal deadline in ${Math.ceil((new Date(goalsSoon[0].deadline) - new Date()) / (1000 * 60 * 60 * 24))} days`, desc: `"${goalsSoon[0].name}" is due soon. Check your progress!`, to: '/goals' })
    }

    if (savingsTarget > 0 && (expenses || []).length > 5) {
      const today = new Date()
      const thisMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      const thisMonthTotal = (expenses || []).filter((e) => e.date?.startsWith(thisMonthKey)).reduce((s, e) => s + (e.amount || 0), 0)
      const salary = profile?.salary || 0
      if (salary > 0 && (salary - thisMonthTotal) < savingsTarget) {
        items.push({ id: 'savings-low', icon: TrendingDown, color: 'text-peach-500', bg: 'bg-peach-50 dark:bg-peach-900/20', title: 'Savings target at risk', desc: `Your remaining balance may not meet your ₹${savingsTarget.toLocaleString()} savings target this month.`, to: '/savings' })
      }
    }

    return items
  }, [profile, expenses, goals, currentMonthExpenses])

  const unreadNotifs = notifications.filter((n) => !readNotifs.includes(n.id))
  const hasUnread = unreadNotifs.length > 0

  function handleOpenNotif() {
    setNotifOpen(!notifOpen)
    if (!notifOpen && hasUnread) {
      const allIds = notifications.map((n) => n.id)
      setReadNotifs(allIds)
      localStorage.setItem('finally.readNotifs', JSON.stringify(allIds))
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/landing')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const displayName = profile?.name || currentUser?.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()
  const avatarUrl = profile?.avatarUrl || ''

  const normalized = searchText.trim().toLowerCase()
  const searchItems = getSearchItems(t)
  const searchResults = (normalized ? searchItems.filter((item) => {
    const haystack = `${item.label} ${item.desc} ${item.keywords.join(' ')}`.toLowerCase()
    return haystack.includes(normalized)
  }) : searchItems).slice(0, 6)

  function goToResult(item) {
    navigate(item.to)
    setSearchText('')
    setSearchOpen(false)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (!searchResults.length) return
    goToResult(searchResults[0])
  }

  return (
    <header className="sticky top-0 z-30 bg-[var(--surface-bg)]/80 backdrop-blur-xl border-b transition-colors duration-300" style={{ borderColor: 'var(--card-border)' }}>
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        {/* Left side */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <form ref={searchRef} onSubmit={handleSearchSubmit} className="relative max-w-md flex-1" role="search">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              aria-label={t('header.searchPlaceholder')}
              placeholder={t('header.searchPlaceholder')}
              value={searchText}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => { setSearchText(e.target.value); setSearchOpen(true) }}
              className="input-field pl-10 py-2.5 text-sm"
            />
            {searchOpen && (
              <div
                role="listbox"
                aria-label="Search results"
                className="absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-soft-lg overflow-hidden z-50 border"
                style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">No matching pages found.</div>
                ) : (
                  searchResults.map((item) => (
                    <button
                      key={`${item.to}-${item.label}`}
                      type="button"
                      role="option"
                      onClick={() => goToResult(item)}
                      className="w-full text-left px-4 py-3 hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors border-b last:border-b-0"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{item.desc}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 ml-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-all duration-200 group"
          >
            {darkMode
              ? <Sun className="w-[18px] h-[18px] text-yellow-400 group-hover:scale-110 transition-transform" />
              : <Moon className="w-[18px] h-[18px] text-gray-400 group-hover:text-lavender-500 transition-colors" />
            }
          </button>

          {/* Notification bell — dot only when unread notifications exist */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotif}
              aria-label={t('header.notifications')}
              aria-expanded={notifOpen}
              className="relative p-2.5 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors group"
            >
              <Bell className="w-[18px] h-[18px] text-gray-400 group-hover:text-lavender-500 dark:group-hover:text-lavender-400 transition-colors" />
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-blush-400 rounded-full ring-2 ring-white dark:ring-gray-900" aria-hidden="true" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-soft-lg border overflow-hidden z-50" style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('header.notifications')}</p>
                    {notifications.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-lavender-100 dark:bg-lavender-900/40 text-lavender-600 dark:text-lavender-400 text-[10px] font-bold">{notifications.length}</span>
                    )}
                  </div>
                  <button onClick={() => setNotifOpen(false)} aria-label="Close notifications" className="p-1 rounded-lg hover:bg-lavender-50 dark:hover:bg-lavender-900/30">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-mint-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">All caught up!</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t('header.noNotifications')}</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => {
                      const NIcon = notif.icon
                      return (
                        <button
                          key={notif.id}
                          onClick={() => { navigate(notif.to); setNotifOpen(false) }}
                          className="w-full text-left px-4 py-3 hover:bg-lavender-50 dark:hover:bg-lavender-900/20 border-b last:border-b-0 transition-colors"
                          style={{ borderColor: 'var(--card-border)' }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`w-7 h-7 rounded-xl ${notif.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <NIcon className={`w-3.5 h-3.5 ${notif.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-snug">{notif.title}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{notif.desc}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings icon */}
          <button
            onClick={() => navigate('/settings')}
            aria-label={t('header.settings')}
            className="p-2.5 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors group"
          >
            <Settings className="w-[18px] h-[18px] text-gray-400 group-hover:text-lavender-500 dark:group-hover:text-lavender-400 transition-colors" />
          </button>

          {/* User dropdown — Profile + Logout only */}
          <div className="relative ml-1 pl-3 border-l" ref={dropdownRef} style={{ borderColor: 'var(--card-border)' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-2xl px-2 py-1 hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">{displayName}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{currentUser?.email}</p>
              </div>
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${displayName} profile photo`} className="w-9 h-9 rounded-2xl object-cover shadow-soft" />
              ) : (
                <div aria-hidden="true" className="w-9 h-9 rounded-2xl bg-gradient-to-br from-lavender-300 to-blush-300 flex items-center justify-center text-white text-sm font-bold shadow-soft">
                  {initials}
                </div>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div role="menu" className="absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-soft-lg border py-2 z-50" style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--card-border)' }}>
                <button
                  role="menuitem"
                  onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" /> {t('header.profile')}
                </button>
                <div className="border-t my-1" style={{ borderColor: 'var(--card-border)' }} />
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-blush-500 hover:bg-blush-50 dark:hover:bg-blush-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
