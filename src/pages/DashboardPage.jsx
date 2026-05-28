import { motion } from 'framer-motion'
import LifeOverview from '../components/dashboard/LifeOverview'
import QuickSummary from '../components/dashboard/QuickSummary'
import ChatbotRemark from '../components/dashboard/ChatbotRemark'
import GoalSnapshot from '../components/dashboard/GoalSnapshot'
import { useUserData } from '../contexts/UserDataContext'
import Spinner from '../components/Spinner'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

export default function DashboardPage() {
  const { profile, loading } = useUserData()

  if (loading) return <Spinner className="py-20" size="lg" label="Loading dashboard…" />

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'
  const displayName = profile?.name || 'there'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {greeting}, {displayName}! {greetingEmoji}
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Here's your financial overview for today.
        </p>
      </motion.div>

      {/* Life Overview */}
      <motion.div variants={itemVariants}>
        <LifeOverview />
      </motion.div>

      {/* Quick Summary Stats + Donut */}
      <motion.div variants={itemVariants}>
        <QuickSummary />
      </motion.div>

      {/* Bottom row: Chatbot + Goals */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChatbotRemark />
        <GoalSnapshot />
      </motion.div>
    </motion.div>
  )
}
