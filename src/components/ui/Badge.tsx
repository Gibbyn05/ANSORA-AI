import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
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
    if (score >= 80) return { bg: 'bg-green-50', text: 'text-green-700', ring: '#22c55e' }
    if (score >= 60) return { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: '#eab308' }
    if (score >= 40) return { bg: 'bg-orange-50', text: 'text-orange-700', ring: '#f97316' }
    return { bg: 'bg-red-50', text: 'text-red-700', ring: '#ef4444' }
  }

  const { bg, text, ring } = getColor()
  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', bg)}>
      <svg width="32" height="32" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#E5E7EB" strokeWidth="4" />
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
