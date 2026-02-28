import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div className={cn('bg-[#0e1c17] rounded-xl border border-[#94A187]/25', paddings[padding], className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-[#94A187] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  )
}
