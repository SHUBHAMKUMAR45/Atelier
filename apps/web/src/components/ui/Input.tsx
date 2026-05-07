import * as React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-semibold text-ink-700 uppercase tracking-[0.08em]">{label}</label>}
      <input
        className={cn(
          'w-full bg-white border border-ink-200 px-4 h-11 rounded text-[14px] text-ink-900 placeholder:text-ink-400',
          'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all duration-150',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-[12px] text-ink-400">{hint}</p>}
    </div>
  )
}
