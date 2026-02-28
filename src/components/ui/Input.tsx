'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'input',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-[#7a8a7d]">{helperText}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Textarea({ label, error, helperText, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'input resize-none',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-[#7a8a7d]">{helperText}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'input appearance-none cursor-pointer',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  )
}
