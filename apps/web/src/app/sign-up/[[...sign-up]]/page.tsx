import { SignUp } from '@clerk/nextjs'

export default function SignUpPage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10 w-full">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-[32px] font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(248,50,134,0.5)]">
              Atelier
            </span>
          </div>
          <p className="text-[15px] text-ink-200 font-medium tracking-wide">
            Your personal AI stylist
          </p>
        </div>

        <SignUp
          appearance={{
            variables: {
              colorPrimary:    '#F83286',
              colorBackground: 'rgba(255,255,255,0.05)',
              colorText:       '#FFFFFF',
              colorTextSecondary: '#A465E1',
              colorInputBackground: 'rgba(0,0,0,0.3)',
              colorInputText:  '#FFFFFF',
              borderRadius:    '20px',
            },
            elements: {
              formButtonPrimary:
                'bg-brand hover:bg-brand-light text-[15px] font-bold transition-all shadow-[0_0_16px_rgba(248,50,134,0.4)]',
              card:
                'shadow-[0_16px_48px_rgba(0,0,0,0.5)] border border-white/10 rounded-[32px] backdrop-blur-3xl bg-ink-900/40',
              headerTitle:
                'font-bold text-white text-2xl tracking-tight',
              headerSubtitle:
                'text-ink-300 text-[14px]',
              socialButtonsBlockButton:
                'border border-white/10 text-[14px] font-bold text-white hover:bg-white/10 transition-colors backdrop-blur-md',
              formFieldInput:
                'text-[15px] border border-white/10 focus:ring-2 focus:ring-brand focus:border-brand rounded-[14px] transition-all bg-ink-900/50 text-white placeholder-ink-400',
              formFieldLabel:
                'text-ink-200 font-semibold',
              dividerLine:
                'bg-white/10',
              dividerText:
                'text-ink-400',
              footerActionLink:
                'text-brand hover:text-brand-light font-bold transition-colors text-[14px]',
              footerActionText:
                'text-ink-300',
              identityPreviewText:
                'text-white font-medium',
              identityPreviewEditButtonIcon:
                'text-brand hover:text-brand-light',
            },
          }}
        />
      </div>
    </div>
  )
}
