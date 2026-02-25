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

    // Redirect basert på rolle – bruk window.location for full reload
    // slik at session-cookies sendes riktig med neste request
    const role = data.user?.user_metadata?.role
    if (role === 'company') {
      window.location.href = '/dashboard/company'
    } else if (role === 'candidate') {
      window.location.href = '/dashboard/candidate'
    } else {
      // Rolle mangler i metadata – sjekk databasen
      const supabaseCheck = createClient()
      const { data: company } = await supabaseCheck
        .from('companies')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()
      window.location.href = company ? '/dashboard/company' : '/dashboard/candidate'
    }
  }

  return (
    <div className="card shadow-md">
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
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
        <p className="text-sm text-gray-500">
          Har du ikke konto?{' '}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            Registrer deg
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-navy font-bold text-2xl">Ansora</span>
          </Link>
          <h1 className="text-2xl font-bold text-navy">Logg inn</h1>
          <p className="text-gray-500 mt-1 text-sm">Velkommen tilbake!</p>
        </div>

        <Suspense fallback={<div className="card shadow-md h-48 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-gray-600">← Tilbake til forsiden</Link>
        </p>
      </div>
    </div>
  )
}
