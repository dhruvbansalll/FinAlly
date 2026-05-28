import logoSrc from '../assets/logo.png'

const sizeMap = {
  sm: { img: 'w-8 h-8', title: 'text-base', tagline: 'text-[9px]' },
  md: { img: 'w-9 h-9', title: 'text-lg', tagline: 'text-[10px]' },
  lg: { img: 'w-10 h-10', title: 'text-xl', tagline: 'text-[10px]' },
  xl: { img: 'w-24 h-24', title: 'text-[50px]', tagline: 'text-[22px]' },
}

export default function BrandMark({ size = 'md', tagline = 'Her Financial Ally', className = '' }) {
  const s = sizeMap[size] || sizeMap.md

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoSrc}
        alt="FinAlly logo"
        className={`${s.img} rounded-2xl object-contain`}
        draggable={false}
      />
      <div className="text-left">
        <h1 className={`${s.title} font-bold gradient-text leading-tight`}>FinAlly</h1>
        {tagline && (
          <p className={`${s.tagline} text-gray-400 dark:text-gray-500 leading-none`}>{tagline}</p>
        )}
      </div>
    </div>
  )
}
