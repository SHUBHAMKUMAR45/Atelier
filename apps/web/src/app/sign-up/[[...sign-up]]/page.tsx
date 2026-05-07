import Image from 'next/image'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F7] flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-ink-900 overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop" alt="AI Fashion Stylist - editorial fashion" fill className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/60 to-ink-900/20" />
        <div className="relative z-10 p-14 flex flex-col justify-between h-full">
          <Link href="/" className="font-display text-2xl font-black text-white tracking-tighter">Atelier</Link>
          <div>
            <h2 className="font-display text-[42px] font-bold text-white leading-tight mb-4">Start Your<br /><em className="font-normal">AI Styling</em><br />Journey.</h2>
            <p className="text-white/60 text-[15px] leading-relaxed max-w-sm">Join thousands discovering their perfect style with AI-powered outfit curation tailored to them.</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="font-display text-2xl font-black text-ink-900 tracking-tighter">Atelier</Link>
          </div>
          <div className="mb-6">
            <h1 className="font-display text-[28px] font-bold mb-1">Create account</h1>
            <p className="text-[14px] text-ink-400">Join Atelier — your AI fashion stylist</p>
          </div>
          <SignUp appearance={{ elements: {
            rootBox: 'w-full',
            card: 'w-full shadow-none border border-ink-200 rounded p-6 bg-white',
            headerTitle: 'hidden', headerSubtitle: 'hidden',
            formButtonPrimary: 'btn-brand w-full justify-center normal-case text-[13px] tracking-normal',
            formFieldInput: 'input-field',
            footerAction: 'text-[13px] text-ink-400',
          }}} />
        </div>
      </div>
    </div>
  )
}
