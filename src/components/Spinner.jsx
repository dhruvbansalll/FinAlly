export default function Spinner({ size = 'md', className = '', label = 'Loading…' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center justify-center ${className}`}
    >
      <div
        aria-hidden="true"
        className={`${sizeClasses[size]} border-lavender-200 dark:border-lavender-800 border-t-lavender-500 rounded-full animate-spin`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
