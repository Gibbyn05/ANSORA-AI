'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LogIn, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
        setError('Kunne ikke koble til serveren. Sjekk at Supabase-prosjektet er aktivt og at miljøvariablene er satt i Vercel.')
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('E-posten din er ikke bekreftet ennå. Sjekk innboksen din og klikk på bekreftelseslenken.')
      } else {
        setError('Feil e-post eller passord. Prøv igjen.')
      }
      setLoading(false)
      return
    }

    // Full reload til /dashboard – server-siden router til riktig dashboard
    window.location.href = '/dashboard'
  }

  return (
    <div className="card shadow-md">
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
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
          <LogIn className="w-4 h-4" />
          Logg inn
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[#999]">
          Har du ikke konto?{' '}
          <Link href="/auth/register" className="text-[#d7fe03] font-semibold hover:underline">
            Registrer deg
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#d7fe03] rounded-xl flex items-center justify-center shadow-lg shadow-[#d7fe03]/20">
              <span className="text-black font-bold text-lg">A</span>
            </div>
            <span className="text-white font-bold text-2xl">Ansora</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Logg inn</h1>
          <p className="text-[#999] mt-1 text-sm">Velkommen tilbake!</p>
        </div>

        <Suspense fallback={<div className="card shadow-md h-48 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-[#666] mt-6">
          <Link href="/" className="hover:text-[#999]">← Tilbake til forsiden</Link>
        </p>
      </div>
    </div>
  )
}
