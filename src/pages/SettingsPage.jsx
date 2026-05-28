import { Settings, Bell, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserData } from '../contexts/UserDataContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import Spinner from '../components/Spinner'

const settingSections = [
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { label: 'Spending alerts', desc: 'Get notified when spending exceeds daily limit', default: true },
      { label: 'Goal milestones', desc: 'Celebrate when you hit a savings milestone', default: true },
      { label: 'Weekly summary', desc: 'Receive a gentle weekly financial recap', default: true },
      { label: 'Pay parity updates', desc: 'Industry salary data refreshes', default: false },
    ],
  },
]

export default function SettingsPage() {
  const { logout, deleteAccount } = useAuth()
  const { profile, savings, expenses, goals, saveProfile } = useUserData()
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    themeOptions,
    languageOptions,
    t,
  } = useAppSettings()
  const navigate = useNavigate()
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [toggles, setToggles] = useState(() => {
    const initial = {}
    settingSections.forEach((section) => {
      section.items.forEach((item) => {
        initial[item.label] = item.default
      })
    })
    return initial
  })

  useEffect(() => {
    if (!profile) return
    if (profile.notificationSettings) {
      setToggles((prev) => ({ ...prev, ...profile.notificationSettings }))
    }
  }, [profile])

  const toggle = (label) => {
    setSettingsSaved(false)
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      await saveProfile({
        themePreference: theme,
        languagePreference: language,
        notificationSettings: toggles,
      })
      setSettingsSaved(true)
    } catch (err) {
      console.error('Error saving settings:', err)
      setSettingsSaved(false)
    } finally {
      setSavingSettings(false)
    }
  }

  function handleExportData() {
    const data = { profile, savings, expenses, goals, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finally-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    setDeleteError('')
    try {
      await deleteAccount()
      navigate('/landing')
    } catch (err) {
      console.error('Error deleting account:', err)
      setDeleteError(err.message || 'Failed to delete account. Please try again.')
      setDeletingAccount(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-lavender-500" />
          <h1 className="page-title">{t('settings.title')}</h1>
        </div>
        <p className="page-subtitle">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-lavender-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('settings.appearance')}</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.theme')}</p>
            <div className="flex flex-wrap gap-3">
              {themeOptions.map((option) => {
                const colorByTheme = {
                  light: 'bg-lavender-50 border-lavender-300 text-lavender-700',
                  'soft-pink': 'bg-blush-50 border-blush-200 text-blush-700',
                  mint: 'bg-mint-50 border-mint-200 text-mint-700',
                  dark: 'bg-gray-900 border-lavender-600 text-lavender-300',
                }

                return (
                <button
                  key={option.key}
                  onClick={() => {
                    setTheme(option.key)
                    setSettingsSaved(false)
                  }}
                  aria-pressed={theme === option.key}
                  aria-label={`Select ${option.label} theme`}
                  className={`px-4 py-2.5 rounded-2xl border-2 text-xs font-semibold transition-all ${
                    theme === option.key
                      ? `${colorByTheme[option.key]} shadow-soft`
                      : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-lavender-200 dark:hover:border-lavender-600'
                  }`}
                >
                  {option.key === 'dark' ? '🌙 ' : ''}{option.label}
                </button>
              )})}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.language')}</p>
            <select className="input-field text-sm max-w-xs" value={language} onChange={(e) => { setLanguage(e.target.value); setSettingsSaved(false) }}>
              {languageOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSaveSettings} disabled={savingSettings} className="btn-primary text-xs py-2 px-4">
              {savingSettings ? <Spinner size="sm" /> : t('settings.save')}
            </button>
            {settingsSaved && <p className="text-xs text-mint-600 font-medium">{t('settings.saved')}</p>}
          </div>
        </div>
      </div>

      {/* Toggle Sections */}
      {settingSections.map((section) => {
        const SIcon = section.icon
        return (
          <div key={section.title} className="card">
            <div className="flex items-center gap-2 mb-4">
              <SIcon className="w-4 h-4 text-lavender-400" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(item.label)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                      toggles[item.label] ? 'bg-lavender-400' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all duration-300 ${
                        toggles[item.label] ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Danger Zone */}
      <div className="card border-blush-100 dark:border-blush-900/30">
        <h3 className="text-sm font-semibold text-blush-600 dark:text-blush-400 mb-3">Account</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          <button onClick={handleExportData} className="btn-secondary text-xs py-2">Export All Data</button>
        </div>
        {deleteError && (
          <div className="mb-3 p-3 rounded-2xl bg-blush-50 dark:bg-blush-900/20 border border-blush-200 dark:border-blush-800">
            <p className="text-xs text-blush-600 dark:text-blush-400">{deleteError}</p>
          </div>
        )}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-2xl border border-blush-200 dark:border-blush-800 text-blush-500 dark:text-blush-400 text-xs font-medium hover:bg-blush-50 dark:hover:bg-blush-900/20 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blush-500 dark:text-blush-400">Are you sure? This cannot be undone.</span>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="px-3 py-1.5 rounded-xl bg-blush-500 dark:bg-blush-600 text-white text-xs font-semibold hover:bg-blush-600 dark:hover:bg-blush-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingAccount ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeleteError('')
              }}
              disabled={deletingAccount}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
