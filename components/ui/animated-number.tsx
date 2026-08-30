'use client'
import { cn, formatNumber } from '@/lib/utils'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

export type AnimatedNumberProps = {
  value: number
  from?: number
  className?: string
  springOptions?: { stiffness?: number; damping?: number; mass?: number }
  suffix?: string
  prefix?: string
}

export function AnimatedNumber({ value, from = 0, className, springOptions, suffix = '', prefix = '' }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const spring = useSpring(from, { stiffness: 60, damping: 20, mass: 1, ...springOptions })
  const display = useTransform(spring, (current) =>
    `${prefix}${formatNumber(Math.round(current))}${suffix}`
  )

  useEffect(() => {
    if (isInView) spring.set(value)
  }, [isInView, spring, value])

  return (
    <motion.span ref={ref} className={cn('tabular-nums', className)}>
      {display}
    </motion.span>
  )
}
