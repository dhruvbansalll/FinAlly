import { motion } from 'framer-motion'

/**
 * EmptyState — displayed when a list has no items.
 *
 * Props:
 *   icon      – lucide-react icon component
 *   title     – string
 *   message   – string
 *   action    – { label, onClick } | null
 */
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-3xl bg-lavender-100 dark:bg-lavender-900/40 flex items-center justify-center mb-4 shadow-soft">
          <Icon className="w-8 h-8 text-lavender-400 dark:text-lavender-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-1">{title}</h3>
      {message && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-5 text-sm"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
