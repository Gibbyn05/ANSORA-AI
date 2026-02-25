import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[#d7fe03]/10 text-[#d7fe03]',
  success: 'bg-green-900/30 text-green-400',
  warning: 'bg-yellow-900/30 text-yellow-400',
  danger: 'bg-red-900/30 text-red-400',
  info: 'bg-blue-900/30 text-blue-400',
  neutral: 'bg-white/10 text-[#999]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  )
}

// Score badge med ring
export function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return { bg: 'bg-green-900/30', text: 'text-green-400', ring: '#22c55e' }
    if (score >= 60) return { bg: 'bg-yellow-900/30', text: 'text-yellow-400', ring: '#eab308' }
    if (score >= 40) return { bg: 'bg-orange-900/30', text: 'text-orange-400', ring: '#f97316' }
    return { bg: 'bg-red-900/30', text: 'text-red-400', ring: '#ef4444' }
  }

  const { bg, text, ring } = getColor()
  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', bg)}>
      <svg width="32" height="32" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#333" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke={ring}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          className="score-ring"
        />
      </svg>
      <span className={cn('text-lg font-bold', text)}>{score}</span>
    </div>
  )
}
