import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'surface' | 'bordered'
}

export const Card = ({ className, variant = 'default', ...props }: CardProps) => {
  const variants: Record<string, string> = {
    default:     'bg-white border border-ink-200 rounded shadow-soft',
    interactive: 'bg-white border border-ink-200 rounded shadow-soft hover:shadow-card hover:-translate-y-0.5 active:scale-[0.985] cursor-pointer transition-all duration-200',
    surface:     'bg-ink-50 border border-ink-100 rounded',
    bordered:    'bg-white border-2 border-ink-900 rounded',
  }
  return <div className={cn(variants[variant], 'overflow-hidden', className)} {...props} />
}

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('p-6', className)} {...props} />

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('p-6 pb-0', className)} {...props} />
