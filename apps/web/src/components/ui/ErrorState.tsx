import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  title?:   string
}

export function ErrorState({ 
  message = "We're having trouble connecting to the Atelier network. Please check your connection and try again.", 
  onRetry,
  title = "Connection Error"
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center p-6 min-h-[400px]">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border-none shadow-premium bg-white">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-ink-900 leading-tight">
            {title}
          </h3>
          <p className="text-ink-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {onRetry && (
          <div className="pt-4">
            <Button 
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
