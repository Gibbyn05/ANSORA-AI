'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[#C5AFA0] text-black hover:bg-[#b09e91] focus:ring-[#94A187]',
    secondary: 'bg-[#1a2c24] text-white border border-[#94A187]/25 hover:bg-[#29524A]/40 focus:ring-[#94A187]/40',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-[#94A187] hover:bg-[#29524A]/15 hover:text-white focus:ring-[#94A187]/40',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-5 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06070E]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
