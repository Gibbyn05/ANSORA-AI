'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Briefcase, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
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
  const [success, setSuccess] = useState(false)

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
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Denne e-postadressen er allerede registrert. Prøv å logge inn.')
      } else if (signUpError.message === 'Failed to fetch' || signUpError.message.includes('fetch')) {
        setError('Kunne ikke koble til serveren. Sjekk at Supabase-prosjektet er aktivt og at miljøvariablene er satt i Vercel.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      // Opprett profil i riktig tabell
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

      // Redirect til riktig dashboard
      if (role === 'company') {
        router.push('/dashboard/company')
      } else {
        router.push('/dashboard/candidate')
      }
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#d7fe03] rounded-xl flex items-center justify-center shadow-lg shadow-[#d7fe03]/20">
              <span className="text-black font-bold text-lg">A</span>
            </div>
            <span className="text-white font-bold text-2xl">Ansora</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Opprett konto</h1>
          <p className="text-[#999] mt-1 text-sm">Kom i gang med AI-rekruttering</p>
        </div>

        <div className="card shadow-md">
          {/* Rollevalg */}
          <div className="mb-6">
            <p className="label mb-2">Hvem er du?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('company')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  role === 'company'
                    ? 'border-[#d7fe03] bg-[#d7fe03]/5 text-[#d7fe03]'
                    : 'border-white/10 text-[#999] hover:border-white/20'
                )}
              >
                <Briefcase className="w-6 h-6" />
                <span className="text-sm font-semibold">Bedrift</span>
                <span className="text-xs text-center leading-tight opacity-70">Jeg vil rekruttere</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  role === 'candidate'
                    ? 'border-[#d7fe03] bg-[#d7fe03]/5 text-[#d7fe03]'
                    : 'border-white/10 text-[#999] hover:border-white/20'
                )}
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-semibold">Kandidat</span>
                <span className="text-xs text-center leading-tight opacity-70">Jeg søker jobb</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
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
                className="absolute right-3 top-[38px] text-[#666] hover:text-[#999]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {role === 'company' ? 'Opprett bedriftskonto' : 'Opprett kandidatkonto'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="flex items-start gap-2 text-xs text-[#666]">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Ved å registrere deg godtar du våre brukervilkår og personvernregler.</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-[#999]">
              Har du allerede konto?{' '}
              <Link href="/auth/login" className="text-[#d7fe03] font-semibold hover:underline">
                Logg inn
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#666] mt-6">
          <Link href="/" className="hover:text-[#999]">← Tilbake til forsiden</Link>
        </p>
      </div>
    </div>
  )
}
