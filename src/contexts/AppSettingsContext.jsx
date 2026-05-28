import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useUserData } from './UserDataContext'

const AppSettingsContext = createContext(null)

const translations = {
  en: {
    header: {
      searchPlaceholder: 'Search pages, tools, and features...',
      notifications: 'Notifications',
      noNotifications: 'No new notifications',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
    },
    sidebar: {
      tagline: 'Her Financial Ally',
      needHelp: 'Need help?',
      helpDesc: 'Chat with our AI advisor for personalized financial guidance.',
      startChat: 'Start Chat',
      nav: {
        dashboard: 'Dashboard',
        payParity: 'Pay Parity',
        expenses: 'Spending Tracker',
        savings: 'Savings',
        goals: 'Goals',
        investments: 'Investments',
        governmentSchemes: 'Govt Schemes',
        taxation: 'Tax Computation',
        documents: 'Documents',
        settings: 'Settings',
        chatbot: 'Chatbot',
        profile: 'Profile',
      },
    },
    settings: {
      title: 'Settings',
      subtitle: 'Customize your FinAlly experience. 🎨',
      appearance: 'Appearance',
      theme: 'Theme',
      currency: 'Currency',
      language: 'Language',
      save: 'Save Settings',
      saved: 'Changes saved',
    },
  },
  hi: {
    header: {
      searchPlaceholder: 'पेज, टूल और फीचर खोजें...',
      notifications: 'सूचनाएं',
      noNotifications: 'कोई नई सूचना नहीं',
      profile: 'प्रोफाइल',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट',
    },
    sidebar: {
      tagline: 'आपका वित्तीय साथी',
      needHelp: 'मदद चाहिए?',
      helpDesc: 'व्यक्तिगत वित्तीय मार्गदर्शन के लिए हमारे AI सलाहकार से चैट करें।',
      startChat: 'चैट शुरू करें',
      nav: {
        dashboard: 'डैशबोर्ड',
        payParity: 'पे पैरिटी',
        expenses: 'खर्च ट्रैकर',
        savings: 'बचत',
        goals: 'लक्ष्य',
        investments: 'निवेश',
        governmentSchemes: 'सरकारी योजनाएं',
        taxation: 'कर गणना',
        documents: 'दस्तावेज',
        settings: 'सेटिंग्स',
        chatbot: 'चैटबॉट',
        profile: 'प्रोफाइल',
      },
    },
    settings: {
      title: 'सेटिंग्स',
      subtitle: 'अपना FinAlly अनुभव अनुकूलित करें। 🎨',
      appearance: 'दिखावट',
      theme: 'थीम',
      currency: 'मुद्रा',
      language: 'भाषा',
      save: 'सेटिंग्स सहेजें',
      saved: 'परिवर्तन सहेजे गए',
    },
  },
  ta: {
    header: {
      searchPlaceholder: 'பக்கங்கள், கருவிகள், அம்சங்களை தேடுங்கள்...',
      notifications: 'அறிவிப்புகள்',
      noNotifications: 'புதிய அறிவிப்புகள் இல்லை',
      profile: 'சுயவிவரம்',
      settings: 'அமைப்புகள்',
      logout: 'வெளியேறு',
    },
    sidebar: {
      tagline: 'உங்கள் நிதி துணை',
      needHelp: 'உதவி வேண்டுமா?',
      helpDesc: 'தனிப்பயன் நிதி வழிகாட்டலுக்கு எங்கள் AI ஆலோசகருடன் உரையாடுங்கள்.',
      startChat: 'உரையாடலை தொடங்கு',
      nav: {
        dashboard: 'டாஷ்போர்டு',
        payParity: 'ஊதிய சமநிலை',
        expenses: 'செலவு ட்র்যாக்கர்',
        savings: 'சேமிப்பு',
        goals: 'இலக்குகள்',
        investments: 'முதலீடுகள்',
        governmentSchemes: 'அரசு திட்டங்கள்',
        taxation: 'வரி கணக்கீடு',
        documents: 'ஆவணங்கள்',
        settings: 'அமைப்புகள்',
        chatbot: 'அரட்டை உதவியாளர்',
        profile: 'சுயவிவரம்',
      },
    },
    settings: {
      title: 'அமைப்புகள்',
      subtitle: 'உங்கள் FinAlly அனுபவத்தை தனிப்பயனாக்குங்கள். 🎨',
      appearance: 'தோற்றம்',
      theme: 'தீம்',
      currency: 'நாணயம்',
      language: 'மொழி',
      save: 'அமைப்புகளை சேமிக்க',
      saved: 'மாற்றங்கள் சேமிக்கப்பட்டது',
    },
  },
  te: {
    header: {
      searchPlaceholder: 'పేజీలు, టూల్స్, ఫీచర్లు వెతకండి...',
      notifications: 'నోటిఫికేషన్లు',
      noNotifications: 'కొత్త నోటిఫికేషన్లు లేవు',
      profile: 'ప్రొఫైల్',
      settings: 'సెట్టింగ్స్',
      logout: 'లాగ్ అవుట్',
    },
    sidebar: {
      tagline: 'మీ ఆర్థిక సహచరుడు',
      needHelp: 'సహాయం కావాలా?',
      helpDesc: 'వ్యక్తిగత ఆర్థిక మార్గదర్శకత్వం కోసం మా AI సలహాదారుతో చాట్ చేయండి.',
      startChat: 'చాట్ ప్రారంభించండి',
      nav: {
        dashboard: 'డాష్‌బోర్డ్',
        payParity: 'వేతన సమానత్వం',
        expenses: 'ఖర్చు ట్రాకర్',
        savings: 'సేవింగ్స్',
        goals: 'లక్ష్యాలు',
        investments: 'ఇన్వెస్ట్మెంట్స్',
        governmentSchemes: 'ప్రభుత్వ పథకాలు',
        taxation: 'పన్ను గణన',
        documents: 'డాక్యుమెంట్స్',
        settings: 'సెట్టింగ్స్',
        chatbot: 'చాట్‌బాట్',
        profile: 'ప్రొఫైల్',
      },
    },
    settings: {
      title: 'సెట్టింగ్స్',
      subtitle: 'మీ FinAlly అనుభవాన్ని అనుకూలీకరించండి. 🎨',
      appearance: 'రూపం',
      theme: 'థీమ్',
      currency: 'కరెన్సీ',
      language: 'భాష',
      save: 'సెట్టింగ్స్ సేవ్ చేయండి',
      saved: 'మార్పులు సేవ్ అయ్యాయి',
    },
  },
}

const themeOptions = [
  { key: 'light', label: 'Light' },
  { key: 'soft-pink', label: 'Soft Pink' },
  { key: 'mint', label: 'Mint' },
  { key: 'dark', label: 'Dark' },
]

const languageOptions = [
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'हिन्दी' },
  { key: 'ta', label: 'தமிழ்' },
  { key: 'te', label: 'తెలుగు' },
]

function normalizeTheme(value) {
  const v = String(value || '').toLowerCase().trim()
  if (v === 'soft pink' || v === 'soft-pink') return 'soft-pink'
  if (v === 'mint') return 'mint'
  if (v === 'dark') return 'dark'
  return 'light'
}

function normalizeLanguage(value) {
  const v = String(value || '').toLowerCase().trim()
  return ['en', 'hi', 'ta', 'te'].includes(v) ? v : 'en'
}

function getLabelByTheme(themeKey) {
  const match = themeOptions.find((t) => t.key === themeKey)
  return match ? match.label : 'Light'
}

function getTranslationValue(dictionary, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), dictionary)
}

export function AppSettingsProvider({ children }) {
  const { profile } = useUserData()
  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem('finally.theme')))
  const [language, setLanguage] = useState(() => normalizeLanguage(localStorage.getItem('finally.language')))
  const [currency, setCurrency] = useState(() => localStorage.getItem('finally.currency') || 'INR')

  // darkMode is derived from theme — dark theme === dark mode on
  const darkMode = theme === 'dark'

  function toggleDarkMode() {
    setTheme((prev) => {
      if (prev === 'dark') {
        const restored = localStorage.getItem('finally.theme.prev') || 'light'
        return normalizeTheme(restored)
      } else {
        localStorage.setItem('finally.theme.prev', prev)
        return 'dark'
      }
    })
  }

  useEffect(() => {
    if (!profile) return
    setTheme(normalizeTheme(profile.themePreference))
    setLanguage(normalizeLanguage(profile.languagePreference))
    setCurrency(profile.currencyPreference || 'INR')
  }, [profile])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('finally.theme', theme)
    // Apply / remove Tailwind 'dark' class for dark: utilities
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', language)
    localStorage.setItem('finally.language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('finally.currency', currency)
  }, [currency])

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.en

    return {
      theme,
      setTheme,
      themeLabel: getLabelByTheme(theme),
      darkMode,
      toggleDarkMode,
      language,
      setLanguage,
      currency,
      setCurrency,
      themeOptions,
      languageOptions,
      t: (key) => getTranslationValue(dictionary, key) || getTranslationValue(translations.en, key) || key,
    }
  }, [theme, language, currency])

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider')
  }
  return ctx
}
