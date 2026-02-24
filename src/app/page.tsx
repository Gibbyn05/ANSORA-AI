import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { Button } from '@/components/ui/Button'
import {
  Briefcase,
  Users,
  Brain,
  MessageSquare,
  Star,
  Shield,
  ArrowRight,
  CheckCircle2,
  Globe,
  FileText
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: 'company' | 'candidate' | null = null
  let userName: string | undefined

  if (user) {
    userRole = user.user_metadata?.role as 'company' | 'candidate' | null
    userName = user.user_metadata?.name || user.email?.split('@')[0]
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar userRole={userRole} userName={userName} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy/90 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
              <Brain className="w-4 h-4 text-blue-300" />
              AI-drevet rekruttering for fremtiden
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Finn de riktige kandidatene
              <span className="text-blue-300 block mt-2">med kunstig intelligens</span>
            </h1>

            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Ansora effektiviserer hele rekrutteringsprosessen – fra stillingsannonse til ansettelse –
              med avansert AI som scorer, analyserer og intervjuer kandidater for deg.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <button className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base shadow-lg shadow-primary/30">
                  Start rekruttering gratis
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/jobs">
                <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base border border-white/20">
                  Se ledige stillinger
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              {[
                { value: '10x', label: 'Raskere screening' },
                { value: '94%', label: 'Nøyaktighet i scoring' },
                { value: '6+', label: 'Bransjer støttet' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-blue-300">{stat.value}</div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 60C480 60 240 40 0 0L0 60Z" fill="#F8FBFF"/>
          </svg>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy mb-4">Alt du trenger for smart rekruttering</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            En fullstendig plattform som håndterer hele prosessen fra annonse til ansettelse
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Briefcase,
              title: 'AI Stillingsbuilder',
              description: 'Skriv inn stikkord og la AI generere en profesjonell, engasjerende stillingsannonse på sekunder.',
              color: 'bg-blue-50 text-primary',
            },
            {
              icon: FileText,
              title: 'CV-analyse og scoring',
              description: 'Automatisk parsing av CV og scoring fra 0-100 basert på match mot stillingens krav.',
              color: 'bg-purple-50 text-purple-600',
            },
            {
              icon: Brain,
              title: 'Dyp AI-analyse',
              description: 'Strukturert analyse med styrker, utviklingsområder og skreddersydde intervjuspørsmål.',
              color: 'bg-indigo-50 text-indigo-600',
            },
            {
              icon: MessageSquare,
              title: 'AI-intervju',
              description: 'Tekst-basert AI-intervju som kvalifiserer kandidater automatisk, tilgjengelig 24/7.',
              color: 'bg-green-50 text-green-600',
            },
            {
              icon: Globe,
              title: 'Flerspråklig',
              description: 'Automatisk språkdeteksjon – kandidaten kommuniserer på sitt morsmål, du mottar norsk analyse.',
              color: 'bg-teal-50 text-teal-600',
            },
            {
              icon: Shield,
              title: 'Anonymisert vurdering',
              description: 'Skjul personidentifiserende informasjon og ta objektive, upartiske rekrutteringsbeslutninger.',
              color: 'bg-orange-50 text-orange-600',
            },
          ].map((feature) => (
            <div key={feature.title} className="card hover:shadow-md transition-shadow duration-200">
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-navy mb-4">Slik fungerer det</h2>
            <p className="text-gray-500">Fra annonse til ansettelse i enkle steg</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-xl font-bold text-navy mb-8 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                For bedrifter
              </h3>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Opprett stilling', desc: 'Beskriv stillingen med noen stikkord, AI skriver annonsen' },
                  { step: '02', title: 'Motta søknader', desc: 'Kandidater søker og gjennomfører AI-screening automatisk' },
                  { step: '03', title: 'Se rangert liste', desc: 'Kandidater scores og rangeres – du ser de beste øverst' },
                  { step: '04', title: 'Ta beslutning', desc: 'Inviter til intervju, send tilbud, eller avslutt prosessen' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy">{item.title}</h4>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-navy mb-8 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                For kandidater
              </h3>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Finn stilling', desc: 'Bla gjennom aktuelle stillinger og finn din match' },
                  { step: '02', title: 'Last opp CV', desc: 'CV-en parsers automatisk, ingen manuell utfylling nødvendig' },
                  { step: '03', title: 'Svar på spørsmål', desc: 'AI stiller relevante spørsmål basert på din bakgrunn' },
                  { step: '04', title: 'Gjennomfør intervju', desc: 'Tekstbasert AI-intervju – ta det i ditt eget tempo' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy">{item.title}</h4>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry support */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-navy mb-4">Bransjetilpasset</h2>
          <p className="text-gray-500">Forhåndsdefinerte maler og kriterier for din bransje</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: '🏥', label: 'Helse og omsorg' },
            { icon: '🏗️', label: 'Bygg og anlegg' },
            { icon: '🛒', label: 'Butikk og dagligvare' },
            { icon: '🍽️', label: 'Restaurant og servering' },
            { icon: '📦', label: 'Lager og logistikk' },
            { icon: '💻', label: 'IT og teknologi' },
          ].map((industry) => (
            <div key={industry.label} className="card text-center hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-3xl mb-3">{industry.icon}</div>
              <p className="text-sm font-medium text-navy leading-tight">{industry.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Star className="w-12 h-12 text-blue-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Klar til å effektivisere rekrutteringen?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Kom i gang gratis i dag og opplev kraften av AI-drevet rekruttering
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <button className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all">
                Registrer bedrift
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/jobs">
              <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all border border-white/20">
                Søk som kandidat
              </button>
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/50">
            {['Gratis å komme i gang', 'Ingen kredittkort', 'Kom i gang på minutter'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy/95 text-white/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-bold text-white">Ansora</span>
          </div>
          <p className="text-sm">© 2025 Ansora. AI-drevet rekrutteringsplattform.</p>
        </div>
      </footer>
    </div>
  )
}
