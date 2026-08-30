import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  const abs = Math.abs(Math.round(n))
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return n < 0 ? `−${formatted}` : formatted
}

export function formatPrice(n: number): string {
  return `${formatNumber(n)} Ft`
}
