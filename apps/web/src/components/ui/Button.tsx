import * as React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'brand'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none tracking-[0.05em] uppercase text-[12px]'

    const variants: Record<string, string> = {
      primary:   'bg-ink-900 text-white hover:bg-ink-700 active:scale-[0.98] rounded-sm',
      brand:     'bg-brand text-white hover:bg-brand-dark active:scale-[0.98] rounded-sm shadow-[0_4px_16px_-2px_rgba(46,91,142,0.35)]',
      secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200 active:scale-[0.98] rounded-sm',
      ghost:     'text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-sm normal-case tracking-normal text-[13px]',
      outline:   'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white active:scale-[0.98] rounded-sm',
    }

    const sizes: Record<string, string> = {
      sm:   'h-8 px-4',
      md:   'h-10 px-6',
      lg:   'h-12 px-8 text-[13px]',
      icon: 'w-10 h-10 p-0 rounded-sm normal-case tracking-normal',
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
