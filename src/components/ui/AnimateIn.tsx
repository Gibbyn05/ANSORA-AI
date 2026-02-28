'use client'

import React, { useEffect, useRef, useState } from 'react'

type Animation = 'slide-up' | 'slide-left' | 'slide-right' | 'scale-in' | 'fade-in'

interface AnimateInProps {
  children: React.ReactNode
  className?: string
  animation?: Animation
  delay?: number
  threshold?: number
  as?: keyof React.JSX.IntrinsicElements
}

const ANIM_CLASS: Record<Animation, string> = {
  'slide-up':    'animate-slide-up',
  'slide-left':  'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'scale-in':    'animate-scale-in',
  'fade-in':     'animate-fade-in',
}

export function AnimateIn({
  children,
  className = '',
  animation = 'slide-up',
  delay = 0,
  threshold = 0.12,
  as: Tag = 'div',
}: AnimateInProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement & HTMLDivElement>}
      className={`${visible ? ANIM_CLASS[animation] : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </Tag>
  )
}
