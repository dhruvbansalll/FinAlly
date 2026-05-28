import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, Target, Shield, PiggyBank, ArrowRight, CheckCircle2 } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { motion } from 'framer-motion'

const features = [
  {
    icon: TrendingUp,
    title: 'Smart Expense Tracking',
    description: 'Visualize your spending with beautiful charts and AI-powered insights.',
    color: 'lavender',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set financial goals and track your progress with milestone celebrations.',
    color: 'blush',
  },
  {
    icon: Shield,
    title: 'Pay Parity Analysis',
    description: 'Understand your worth with salary benchmarks and equity insights.',
    color: 'mint',
  },
  {
    icon: PiggyBank,
    title: 'Investment Guidance',
    description: 'Get personalized investment recommendations tailored to your goals.',
    color: 'peach',
  },
]

const highlights = [
  'AI-powered financial advisor available 24/7',
  'Privacy-first: your data is yours, always',
  'Multi-language support: EN, हिन्दी, தமிழ், తెలుగు',
  'Beautiful, distraction-free design',
]

const colorMap = {
  lavender: 'from-lavender-400 to-lavender-500 bg-lavender-50 text-lavender-500',
  blush: 'from-blush-400 to-blush-500 bg-blush-50 text-blush-500',
  mint: 'from-mint-400 to-mint-500 bg-mint-50 text-mint-500',
  peach: 'from-peach-400 to-peach-500 bg-peach-50 text-peach-500',
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* Decorative blobs */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-lavender-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-blush-200/20 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 sticky top-0 z-20 backdrop-blur-xl border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--surface-bg) 80%, transparent)', borderColor: 'var(--card-border)' }}>
        <BrandMark size="md" />
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm">Log In</Link>
          <Link to="/signup" className="btn-primary text-sm">Sign Up Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-24 max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lavender-100/60 text-lavender-600 text-xs font-semibold mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Built for women, by women
        </motion.div>

        <motion.h2
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-100 leading-tight mb-5"
        >
          Take control of your
          <span className="gradient-text"> financial future</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-4 max-w-xl mx-auto"
        >
          FinAlly helps you track expenses, set goals, and build wealth — with gentle guidance and beautiful analytics designed just for you.
        </motion.p>

        <motion.ul
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="inline-flex flex-col items-start gap-2 mb-8 text-sm text-gray-500 dark:text-gray-400"
          aria-label="Key features"
        >
          {highlights.map((h) => (
            <li key={h} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-mint-500 flex-shrink-0" aria-hidden="true" />
              {h}
            </li>
          ))}
        </motion.ul>

        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show">
          <Link
            to="/signup"
            className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
          >
            Get Started Free <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 pb-24 max-w-6xl mx-auto" aria-labelledby="features-heading">
        <motion.h2
          id="features-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-bold text-gray-800 dark:text-gray-100 mb-10"
        >
          Everything you need, nothing you don't
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, i) => {
            const colors = colorMap[feat.color]
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                className="card text-center hover:-translate-y-1 transition-transform duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl ${colors.split(' ')[1]} flex items-center justify-center mx-auto mb-4`} aria-hidden="true">
                  <feat.icon className={`w-6 h-6 ${colors.split(' ')[2]}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">{feat.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feat.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-6 lg:mx-16 mb-16 px-8 py-10 rounded-3xl bg-gradient-to-r from-lavender-500 to-blush-400 text-white text-center shadow-soft-lg"
        aria-labelledby="cta-heading"
      >
        <h2 id="cta-heading" className="text-2xl font-bold mb-3">Ready to start your journey?</h2>
        <p className="text-white/80 text-sm mb-6 max-w-lg mx-auto">
          Join thousands of women taking charge of their financial story. It's free, beautiful, and built with ❤️ for you.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-white text-lavender-600 font-semibold px-8 py-3 rounded-2xl shadow-soft hover:shadow-soft-md hover:scale-[1.02] transition-all text-sm"
        >
          Create your free account <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.section>

      {/* Footer */}
      <footer className="text-center py-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <p className="text-xs text-gray-400">© 2026 FinAlly. Her Financial Ally. Made with 💜</p>
      </footer>
    </div>
  )
}
