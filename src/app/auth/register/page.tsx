'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import {
  Briefcase, User, Eye, EyeOff, CheckCircle2,
  Brain, TrendingUp, Users, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'company' | 'candidate'

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('company')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.')
      } else if (signUpError.message === 'Failed to fetch' || signUpError.message.includes('fetch')) {
        setError('Kunne ikke koble til serveren. Sjekk at Supabase-prosjektet er aktivt.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      if (role === 'company') {
        const { error: companyError } = await supabase.from('companies').insert({
          user_id: data.user.id,
          name,
          email,
        })
        if (companyError) console.error('Feil ved opprettelse av bedriftsprofil:', companyError)
      } else {
        const { error: candidateError } = await supabase.from('candidates').insert({
          user_id: data.user.id,
          name,
          email,
        })
        if (candidateError) console.error('Feil ved opprettelse av kandidatprofil:', candidateError)
      }

      router.push(role === 'company' ? '/dashboard/company' : '/dashboard/candidate')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── Left decorative panel ─────────────────────────────────── */}
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
            Kom i gang på<br />under 5 minutter
          </h2>
          <p className="text-[#666] leading-relaxed mb-10">
            Opprett konto og publiser din første stilling i dag – AI tar seg av resten.
          </p>

          <div className="space-y-5">
            {[
              { icon: Brain, title: 'Ingen opplæring nødvendig', desc: 'AI håndterer screening og intervju automatisk' },
              { icon: TrendingUp, title: 'Resultater fra dag én', desc: 'Se rangerte søkere umiddelbart etter publisering' },
              { icon: Users, title: 'Gratis å starte', desc: 'Ingen kredittkort, ingen bindingstid' },
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '10x', label: 'Raskere' },
            { value: '94%', label: 'Nøyaktighet' },
            { value: '200+', label: 'Bedrifter' },
          ].map((s) => (
            <div key={s.label} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-[#d7fe03]">{s.value}</div>
              <div className="text-[11px] text-[#444] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form panel ─────────────────────────────────────── */}
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

          <h1 className="text-2xl font-bold text-white mb-1">Opprett konto</h1>
          <p className="text-[#555] text-sm mb-8">Kom i gang med AI-rekruttering</p>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-3">Hvem er du?</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'company', icon: Briefcase, label: 'Bedrift', sub: 'Jeg vil rekruttere' },
                { value: 'candidate', icon: User, label: 'Kandidat', sub: 'Jeg søker jobb' },
              ] as const).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    role === r.value
                      ? 'border-[#d7fe03] bg-[#d7fe03]/5 text-[#d7fe03]'
                      : 'border-white/[0.08] text-[#555] hover:border-white/[0.2] hover:text-white'
                  )}
                >
                  <r.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-[11px] opacity-70">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Input
              label={role === 'company' ? 'Bedriftsnavn' : 'Fullt navn'}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'company' ? 'Ditt firma AS' : 'Ola Nordmann'}
              required
            />

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
                placeholder="Minimum 8 tegn"
                required
                autoComplete="new-password"
                helperText="Minimum 8 tegn"
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
              {loading && (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
              {loading ? 'Oppretter konto…' : role === 'company' ? 'Opprett bedriftskonto' : 'Opprett kandidatkonto'}
            </button>

            <div className="flex items-start gap-2 text-xs text-[#444] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#d7fe03]/60 flex-shrink-0 mt-0.5" />
              <span>Ved å registrere deg godtar du våre brukervilkår og personvernregler.</span>
            </div>
          </form>

          <p className="text-sm text-[#555] text-center mt-7">
            Har du allerede konto?{' '}
            <Link href="/auth/login" className="text-[#d7fe03] font-semibold hover:underline">
              Logg inn
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
