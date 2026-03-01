'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import {
  Briefcase, User, Eye, EyeOff, CheckCircle2,
  Brain, TrendingUp, Users, Search, Loader2, Building2, MapPin, Phone, ChevronDown, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BrregResult } from '@/types'

type Role = 'company' | 'candidate'

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('company')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Bedriftsfelter
  const [brregLoading, setBrregLoading] = useState(false)
  const [brregResults, setBrregResults] = useState<BrregResult[]>([])
  const [brregSearched, setBrregSearched] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<BrregResult | null>(null)
  const [orgNumber, setOrgNumber] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [employeeCount, setEmployeeCount] = useState<number>(0)

  const router = useRouter()

  const searchBrreg = async () => {
    const query = name.trim()
    if (!query) return
    setBrregLoading(true)
    setBrregSearched(true)
    setBrregResults([])
    setSelectedCompany(null)

    const isOrgNr = /^\d{9}$/.test(query.replace(/\s/g, ''))
    const url = isOrgNr
      ? `/api/company/lookup?orgnr=${query.replace(/\s/g, '')}`
      : `/api/company/lookup?name=${encodeURIComponent(query)}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      setBrregResults(data.results ?? [])
    } catch {
      setBrregResults([])
    } finally {
      setBrregLoading(false)
    }
  }

  const selectCompany = (c: BrregResult) => {
    setSelectedCompany(c)
    setName(c.name)
    setOrgNumber(c.orgnr)
    setCompanyPhone(c.phone)
    setCompanyAddress(c.address)
    setCompanyCity(c.city)
    setCompanyIndustry(c.industry)
    setEmployeeCount(c.employees)
    setBrregResults([])
  }

  const clearSelection = () => {
    setSelectedCompany(null)
    setOrgNumber('')
    setCompanyPhone('')
    setCompanyAddress('')
    setCompanyCity('')
    setCompanyIndustry('')
    setEmployeeCount(0)
    setBrregSearched(false)
  }

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
          org_number: orgNumber || null,
          phone: companyPhone || null,
          address: companyAddress || null,
          city: companyCity || null,
          industry_description: companyIndustry || null,
          employee_count: employeeCount || null,
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
    <div className="min-h-screen bg-[#06070E] flex">

      {/* ── Left decorative panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#0e1c17] border-r border-[#29524A]/25 flex-col justify-between p-12">
        {/* Logo */}
        <Link href="/">
          <Image src="/LogoA.png" alt="Ansora" width={120} height={40} className="h-10 w-auto" />
        </Link>

        {/* Main content */}
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Kom i gang på<br />under 5 minutter
          </h2>
          <p className="text-[#7a8a7d] leading-relaxed mb-10">
            Opprett konto og publiser din første stilling i dag – AI tar seg av resten.
          </p>

          <div className="space-y-5">
            {[
              { icon: Brain, title: 'Ingen opplæring nødvendig', desc: 'AI håndterer screening og intervju automatisk' },
              { icon: TrendingUp, title: 'Resultater fra dag én', desc: 'Se rangerte søkere umiddelbart etter publisering' },
              { icon: Users, title: 'Gratis å starte', desc: 'Ingen kredittkort, ingen bindingstid' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#29524A]/20 border border-[#94A187]/35 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-[#4a6358] mt-0.5">{f.desc}</p>
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
            <div key={s.label} className="bg-[#06070E] border border-[#29524A]/25 rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-[11px] text-[#3a5248] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/">
              <Image src="/LogoA.png" alt="Ansora" width={120} height={40} className="h-10 w-auto" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Opprett konto</h1>
          <p className="text-[#4a6358] text-sm mb-8">Kom i gang med AI-rekruttering</p>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#4a6358] uppercase tracking-widest mb-3">Hvem er du?</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'company', icon: Briefcase, label: 'Bedrift', sub: 'Jeg vil rekruttere' },
                { value: 'candidate', icon: User, label: 'Kandidat', sub: 'Jeg søker jobb' },
              ] as const).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); clearSelection() }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    role === r.value
                      ? 'border-white bg-[#29524A]/15 text-white'
                      : 'border-[#29524A]/30 text-[#4a6358] hover:border-[#94A187]/45 hover:text-white'
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

            {/* Bedriftsnavn med søk */}
            {role === 'company' ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Bedriftsnavn"
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (selectedCompany) clearSelection() }}
                      placeholder="Europris Molde"
                      required
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchBrreg() } }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={searchBrreg}
                    disabled={brregLoading || !name.trim()}
                    title="Finn bedrift i Brønnøysundregistrene"
                    className="mt-[22px] flex items-center gap-1.5 border border-white/[0.12] hover:border-white/40 text-[#7a8a7d] hover:text-white bg-[#0e1c17] px-3 h-[42px] rounded-xl transition-colors disabled:opacity-40 text-xs font-medium whitespace-nowrap"
                  >
                    {brregLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Search className="w-4 h-4" />}
                    Finn
                  </button>
                </div>

                {/* Søkeresultater */}
                {brregResults.length > 0 && (
                  <div className="bg-[#0e1c17] border border-[#29524A]/30 rounded-xl overflow-hidden">
                    <p className="text-[10px] text-[#3a5248] px-3 pt-2 pb-1 uppercase tracking-wider">
                      Velg din bedrift
                    </p>
                    {brregResults.map((c) => (
                      <button
                        key={c.orgnr}
                        type="button"
                        onClick={() => selectCompany(c)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#29524A]/12 transition-colors border-t border-[#29524A]/20 first:border-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white leading-tight">{c.name}</p>
                            <p className="text-[11px] text-[#4a6358] mt-0.5">
                              {c.orgnr}{c.city ? ` · ${c.city}` : ''}{c.orgForm ? ` · ${c.orgForm}` : ''}
                            </p>
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 text-[#3a5248] rotate-[-90deg] flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Ingen resultater */}
                {brregSearched && !brregLoading && brregResults.length === 0 && !selectedCompany && (
                  <p className="text-xs text-[#4a6358] px-1">
                    Ingen treff i Brønnøysundregistrene. Du kan registrere deg likevel.
                  </p>
                )}

                {/* Valgt bedrift */}
                {selectedCompany && (
                  <div className="bg-[#0d1a00] border border-[#94A187]/35 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-[#29524A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-white">
                            Hentet fra Brønnøysundregistrene
                          </p>
                          <p className="text-xs text-white font-medium truncate">{selectedCompany.name}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-[#3a5248] hover:text-[#94A187] flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-[11px] text-[#7a8a7d]">Org.nr: {selectedCompany.orgnr}</span>
                      {selectedCompany.city && (
                        <span className="flex items-center gap-1 text-[11px] text-[#7a8a7d]">
                          <MapPin className="w-2.5 h-2.5" />
                          {selectedCompany.city}
                        </span>
                      )}
                      {selectedCompany.phone && (
                        <span className="flex items-center gap-1 text-[11px] text-[#7a8a7d]">
                          <Phone className="w-2.5 h-2.5" />
                          {selectedCompany.phone}
                        </span>
                      )}
                      {selectedCompany.industry && (
                        <span className="text-[11px] text-[#7a8a7d] truncate">{selectedCompany.industry}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Org.nr felt (manuell innskriving om ikke funnet) */}
                {!selectedCompany && (
                  <div>
                    <Input
                      label="Org.nr (anbefalt for verifisering)"
                      type="text"
                      value={orgNumber}
                      onChange={(e) => setOrgNumber(e.target.value)}
                      placeholder="123 456 789"
                    />
                    <p className="text-[11px] text-[#3a5248] mt-1 px-1">
                      Org.nr hjelper oss bekrefte at dette er en ekte bedrift
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Input
                label="Fullt navn"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ola Nordmann"
                required
              />
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
                placeholder="Minimum 8 tegn"
                required
                autoComplete="new-password"
                helperText="Minimum 8 tegn"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-[#7a8a7d] hover:text-[#94A187] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] disabled:opacity-60 text-black font-semibold px-6 py-3.5 rounded-xl transition-all text-[15px]"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
              {loading ? 'Oppretter konto…' : role === 'company' ? 'Opprett bedriftskonto' : 'Opprett kandidatkonto'}
            </button>

            <div className="flex items-start gap-2 text-xs text-[#3a5248] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-white/60 flex-shrink-0 mt-0.5" />
              <span>Ved å registrere deg godtar du våre brukervilkår og personvernregler.</span>
            </div>
          </form>

          <p className="text-sm text-[#4a6358] text-center mt-7">
            Har du allerede konto?{' '}
            <Link href="/auth/login" className="text-white font-semibold hover:underline">
              Logg inn
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-[#29524A]/25 text-center">
            <Link href="/" className="text-xs text-[#2a3e36] hover:text-[#7a8a7d] transition-colors">
              ← Tilbake til forsiden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
