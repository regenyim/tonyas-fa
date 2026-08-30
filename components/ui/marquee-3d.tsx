'use client'
import { cn } from '@/lib/utils'

export type Marquee3DProps = {
  items: string[]
  className?: string
  speed?: number
}

export function Marquee3D({ items, className, speed = 20 }: Marquee3DProps) {
  const repeated = [...items, ...items, ...items, ...items]

  return (
    <div className={cn('overflow-hidden py-4', className)}>
      <div>
        <div className='relative flex overflow-hidden'>
          <div
            className='flex gap-12 whitespace-nowrap'
            style={{ animation: `marquee-scroll ${speed}s linear infinite` }}
          >
            {repeated.map((item, i) => (
              <span
                key={i}
                className='not-italic text-xs font-medium tracking-[0.14em] uppercase text-primary-foreground/80'
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
