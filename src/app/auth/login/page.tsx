'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { LogIn, Eye, EyeOff, Brain, CheckCircle2, Star, TrendingUp, Users } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) setError(decodeURIComponent(err))
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
        setError('Kunne ikke koble til serveren. Sjekk at Supabase-prosjektet er aktivt.')
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('E-posten din er ikke bekreftet ennå. Sjekk innboksen din.')
      } else {
        setError('Feil e-post eller passord. Prøv igjen.')
      }
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <Input
        label="E-postadresse"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="din@epost.no"
        required
        autoComplete="email"
      />

      <div className="relative">
        <Input
          label="Passord"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-[#666] hover:text-[#999] transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#d7fe03] hover:bg-[#c8ef00] disabled:opacity-60 text-black font-semibold px-6 py-3.5 rounded-xl transition-all text-[15px]"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        {loading ? 'Logger inn…' : 'Logg inn'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── Left decorative panel (Prospect split-screen) ────────── */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#111111] border-r border-white/[0.07] flex-col justify-between p-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#d7fe03] rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-base">A</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Ansora</span>
        </Link>

        {/* Main content */}
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Rekruttering som<br />jobber for deg
          </h2>
          <p className="text-[#666] leading-relaxed mb-10">
            AI screener kandidater, gjennomfører intervjuer og rangerer søkere – automatisk.
          </p>

          <div className="space-y-5">
            {[
              { icon: Brain, title: 'AI-screening', desc: 'Automatisk CV-analyse og scoring 0–100' },
              { icon: TrendingUp, title: 'Rangert oversikt', desc: 'Se de beste kandidatene øverst' },
              { icon: Users, title: 'AI-intervju 24/7', desc: 'Tekstbasert kvalifisering hele døgnet' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#d7fe03]/10 border border-[#d7fe03]/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-[#d7fe03]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-[#555] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial quote */}
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-5">
          <div className="flex mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 text-[#d7fe03] fill-[#d7fe03]" />
            ))}
          </div>
          <p className="text-sm text-[#888] italic leading-relaxed mb-4">
            &ldquo;Ansora spart oss for uker med manuell screening. AI-analysen er forbløffende presis.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#d7fe03]">KM</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Kristine M.</p>
              <p className="text-[11px] text-[#444]">HR-leder, Helsegruppen AS</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#d7fe03] rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-base">A</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">Ansora</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Logg inn</h1>
          <p className="text-[#555] text-sm mb-8">Velkommen tilbake!</p>

          <Suspense fallback={<div className="h-48 animate-pulse bg-white/[0.03] rounded-xl" />}>
            <LoginForm />
          </Suspense>

          <p className="text-sm text-[#555] text-center mt-7">
            Har du ikke konto?{' '}
            <Link href="/auth/register" className="text-[#d7fe03] font-semibold hover:underline">
              Registrer deg gratis
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <Link href="/" className="text-xs text-[#333] hover:text-[#666] transition-colors">
              ← Tilbake til forsiden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
