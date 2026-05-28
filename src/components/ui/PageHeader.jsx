import { motion } from 'framer-motion'

/**
 * PageHeader — consistent page-level heading with optional action button.
 *
 * Props:
 *   icon      – lucide-react component
 *   title     – string
 *   subtitle  – string
 *   action    – ReactNode (e.g. a button)
 */
export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-start justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-5 h-5 text-lavender-500 dark:text-lavender-400" aria-hidden="true" />}
          <h1 className="page-title">{title}</h1>
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </motion.div>
  )
}
