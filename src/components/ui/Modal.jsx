import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Accessible modal dialog.
 *
 * Props:
 *   open      – boolean
 *   onClose   – () => void
 *   title     – string
 *   children  – ReactNode
 *   size      – 'sm' | 'md' | 'lg'  (default 'md')
 */
export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Trap focus and close on Escape
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    closeButtonRef.current?.focus()

    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }[size]

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${sizeClass} rounded-3xl shadow-soft-lg p-6 z-10`}
            style={{ backgroundColor: 'var(--surface-bg)', border: '1px solid var(--card-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2
                id="modal-title"
                className="text-base font-bold text-gray-800 dark:text-gray-100"
              >
                {title}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-900/30 transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
