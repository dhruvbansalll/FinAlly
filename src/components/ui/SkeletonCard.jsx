/**
 * SkeletonCard — shimmering placeholder while content loads.
 *
 * Props:
 *   lines   – number of text lines to show (default 3)
 *   height  – explicit height for single-block skeleton (e.g. 'h-24')
 */
export function SkeletonCard({ lines = 3, height }) {
  if (height) {
    return <div className={`skeleton w-full ${height}`} aria-hidden="true" />
  }

  return (
    <div className="card space-y-3 animate-pulse" aria-hidden="true">
      <div className="skeleton h-5 w-2/5 rounded-xl" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded-lg"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonStat — shimmer for a stat card widget.
 */
export function SkeletonStat() {
  return (
    <div className="card p-4 space-y-3" aria-hidden="true">
      <div className="flex items-center gap-2.5">
        <div className="skeleton w-8 h-8 rounded-xl" />
        <div className="skeleton h-3 w-24 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-16 rounded-xl" />
      <div className="skeleton h-2.5 w-full rounded-lg" />
    </div>
  )
}
