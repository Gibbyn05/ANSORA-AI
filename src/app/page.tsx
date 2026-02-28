import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { AnimateIn } from '@/components/ui/AnimateIn'
import {
  Briefcase, Users, Brain, MessageSquare, Star, ArrowRight,
  CheckCircle2, Globe, FileText, Zap, TrendingUp, Shield,
  ChevronRight, Quote,
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
    <div className="min-h-screen bg-[#06070E]">
      <Navbar userRole={userRole} userName={userName} />

      {/* ── HERO: Left-aligned (Prospect) + Dashboard mockup ─────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 lg:gap-16 items-center">

            {/* Left: Text block */}
            <div>
              <AnimateIn animation="slide-up" delay={0}>
                <div className="inline-flex items-center gap-2 bg-[#29524A]/20 border border-[#94A187]/35 px-4 py-1.5 rounded-full text-sm font-medium mb-7 text-white">
                  <Brain className="w-3.5 h-3.5" />
                  AI-drevet rekruttering
                </div>
              </AnimateIn>

              <AnimateIn animation="slide-up" delay={80}>
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-white mb-6">
                  Finn de riktige<br />
                  kandidatene med<br />
                  <span className="text-white">kunstig intelligens</span>
                </h1>
              </AnimateIn>

              <AnimateIn animation="slide-up" delay={160}>
                <p className="text-[#94A187] text-lg leading-relaxed mb-8 max-w-lg">
                  Ansora effektiviserer hele rekrutteringsprosessen – fra stillingsannonse til
                  ansettelse – med AI som scorer, analyserer og intervjuer kandidater automatisk.
                </p>
              </AnimateIn>

              {/* Dual CTA (Sasslo/Prospect pattern) */}
              <AnimateIn animation="slide-up" delay={240}>
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href="/auth/register">
                    <button className="inline-flex items-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] active:scale-95 text-black font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 text-[15px]">
                      Start gratis i dag
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/jobs">
                    <button className="inline-flex items-center gap-2 border border-[#94A187]/25 hover:border-[#94A187]/55 hover:bg-[#29524A]/15 active:scale-95 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 text-[15px]">
                      Se ledige stillinger
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </AnimateIn>

              {/* Social proof (Prospect inline pattern) */}
              <AnimateIn animation="slide-up" delay={320}>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {['B', 'T', 'K', 'M'].map((initial, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-[#1a2c24] border-2 border-[#06070E] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{initial}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 text-white fill-[#C5AFA0]" />
                      ))}
                    </div>
                    <span className="text-sm text-[#94A187]">
                      4.9/5 fra <span className="text-white">200+ bedrifter</span>
                    </span>
                  </div>
                </div>
              </AnimateIn>
            </div>

            {/* Right: Dashboard mockup (Visuo-inspired) */}
            <AnimateIn animation="slide-left" delay={200} className="relative">
              <div className="bg-[#0e1c17] border border-[#29524A]/30 rounded-2xl p-5 shadow-2xl">
                {/* Mock top bar */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#29524A]/25">
                  <span className="text-sm font-semibold text-white">Søkere — Frontend Utvikler</span>
                  <span className="text-xs bg-[#29524A]/20 text-white px-2.5 py-1 rounded-full border border-[#94A187]/35">
                    12 nye
                  </span>
                </div>

                {/* Mock candidate rows */}
                {[
                  { name: 'Marte S.', score: 94, status: 'Intervju', color: 'bg-green-900/40 text-green-400' },
                  { name: 'Jonas H.', score: 87, status: 'Ny', color: 'bg-[#29524A]/20 text-white' },
                  { name: 'Lena K.', score: 81, status: 'Ny', color: 'bg-[#29524A]/20 text-white' },
                  { name: 'Erik B.', score: 68, status: 'Vurderer', color: 'bg-orange-900/30 text-orange-400' },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 py-2.5 border-b border-[#29524A]/20 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#1a2c24] border border-[#94A187]/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-white">{c.name[0]}</span>
                    </div>
                    <span className="text-sm text-white flex-1">{c.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.color}`}>{c.score}</span>
                    <span className="text-[11px] text-[#3a5248] w-14 text-right">{c.status}</span>
                  </div>
                ))}

                {/* AI insight preview */}
                <div className="mt-4 p-3 bg-[#1a2c24] rounded-xl border border-[#29524A]/25">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Brain className="w-3.5 h-3.5 text-white" />
                    <span className="text-[11px] font-semibold text-white">AI-analyse · Marte S.</span>
                  </div>
                  <p className="text-[11px] text-[#7a8a7d] leading-relaxed">
                    Sterk teknisk bakgrunn i React/TS. Kommuniserer tydelig. Anbefales for intervju.
                  </p>
                </div>
              </div>

              {/* Floating stat badge */}
              <div className="absolute -top-4 -right-4 bg-[#0e1c17] border border-[#29524A]/30 rounded-xl px-4 py-3 shadow-xl animate-float">
                <div className="text-2xl font-bold text-white">10x</div>
                <div className="text-xs text-[#4a6358]">Raskere screening</div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP (Sasslo/Prospect) ────────────────────────────── */}
      <section className="py-10 border-y border-[#29524A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fade-in">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-[#2a3e36] mb-6">
              Brukt av bedrifter i hele Norge
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['Helse og omsorg', 'Bygg og anlegg', 'IT og teknologi', 'Handel og dagligvare', 'Lager og logistikk', 'Restaurant og servering'].map((name, i) => (
                <div key={name} className="px-4 py-2 rounded-full bg-[#29524A]/[0.08] border border-[#29524A]/25 text-sm text-[#3a5248] font-medium animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  {name}
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── 3-ICON QUICK FEATURES (Sasslo horizontal) ────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimateIn animation="slide-up" className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Alt du trenger for smart rekruttering</h2>
          <p className="text-[#7a8a7d] max-w-xl mx-auto leading-relaxed">
            En fullstendig plattform som håndterer hele prosessen fra annonse til ansettelse
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: 'AI-screening',
              desc: 'CV-analyse og automatisk scoring fra 0–100 basert på match mot stillingens krav. Du ser bare de beste.',
            },
            {
              icon: MessageSquare,
              title: 'AI-intervju 24/7',
              desc: 'Tekstbasert AI-intervju som stiller skreddersydde spørsmål og kvalifiserer kandidater automatisk.',
            },
            {
              icon: TrendingUp,
              title: 'Rangert oversikt',
              desc: 'Kandidater sorteres etter AI-score slik at du alltid tar beslutning på informert grunnlag.',
            },
          ].map((f, i) => (
            <AnimateIn key={f.title} animation="scale-in" delay={i * 100}>
              <div className="p-8 rounded-2xl border border-[#29524A]/25 bg-[#0e1c17] hover:border-[#94A187]/40 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-[#29524A]/20 border border-[#94A187]/35 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-[#7a8a7d] text-sm leading-relaxed">{f.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── ALTERNATING FEATURE ROWS (Visuo numbered + Sasslo checkmarks) ── */}
      <section className="pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">

        {/* Row 1: Stillingsbuilder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimateIn animation="slide-right" className="order-2 lg:order-1 bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">AI Stillingsbuilder</span>
            </div>
            <div className="space-y-2 mb-5">
              <div className="h-2.5 bg-[#29524A]/15 rounded-full w-full" />
              <div className="h-2.5 bg-[#29524A]/15 rounded-full w-4/5" />
              <div className="h-2.5 bg-[#29524A]/15 rounded-full w-3/4" />
              <div className="h-2.5 bg-[#29524A]/15 rounded-full w-5/6" />
            </div>
            <div className="flex items-start gap-2.5 p-3.5 bg-[#1a2c24] rounded-xl border border-[#29524A]/25">
              <Brain className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-white mb-1">AI genererer stillingsannonse</p>
                <p className="text-[11px] text-[#4a6358]">Frontend-utvikler med React/TS, remote-vennlig, Oslo…</p>
              </div>
            </div>
          </AnimateIn>
          <AnimateIn animation="slide-left" className="order-1 lg:order-2">
            <span className="text-white font-bold text-xs uppercase tracking-widest">Steg 01</span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-5 leading-snug">
              Opprett stillingen på sekunder
            </h2>
            <p className="text-[#94A187] mb-7 leading-relaxed">
              Skriv inn noen stikkord om stillingen, og la AI generere en profesjonell, engasjerende
              stillingsannonse tilpasset din bransje.
            </p>
            <ul className="space-y-3.5">
              {[
                'AI skriver hele annonsen basert på stikkord',
                'Forhåndsdefinerte maler per bransje',
                'Publiser med ett klikk',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#C5AFA0]">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </AnimateIn>
        </div>

        {/* Row 2: CV-screening */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimateIn animation="slide-right">
            <span className="text-white font-bold text-xs uppercase tracking-widest">Steg 02</span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-5 leading-snug">
              Automatisk screening av alle søkere
            </h2>
            <p className="text-[#94A187] mb-7 leading-relaxed">
              Når kandidater søker, analyserer AI automatisk CV og besvarer screeningspørsmål –
              uten at du løfter en finger.
            </p>
            <ul className="space-y-3.5">
              {[
                'CV-parsing og strukturert analyse',
                'Score 0–100 per kandidat basert på stillingens krav',
                'Flerspråklig – AI svarer alltid på norsk',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#C5AFA0]">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </AnimateIn>
          <AnimateIn animation="slide-left" className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">CV-analyse</span>
              </div>
              <div className="text-3xl font-bold text-white">94</div>
            </div>
            <div className="space-y-3.5">
              {[
                { label: 'Teknisk match', pct: 94 },
                { label: 'Erfaring', pct: 87 },
                { label: 'Kommunikasjon', pct: 78 },
                { label: 'Kulturell match', pct: 71 },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#4a6358]">{bar.label}</span>
                    <span className="text-[#94A187]">{bar.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#29524A]/12 rounded-full">
                    <div
                      className="h-1.5 bg-[#C5AFA0] rounded-full"
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>

        {/* Row 3: AI-intervju */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimateIn animation="slide-right" className="order-2 lg:order-1 bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">AI-intervju</span>
              <span className="ml-auto text-xs text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Pågår
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-[#29524A]/20 border border-[#94A187]/35 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                  <p className="text-xs text-[#C5AFA0]">Beskriv din erfaring med React og TypeScript i et produksjonsmiljø.</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-[#29524A]/10 border border-[#29524A]/25 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                  <p className="text-xs text-[#94A187]">Jeg har 4 år med React og har jobbet med store enterprise-prosjekter, inkludert…</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#29524A]/20 border border-[#94A187]/35 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                  <p className="text-xs text-[#C5AFA0]">Hvordan håndterer du state management i store React-applikasjoner?</p>
                </div>
              </div>
            </div>
          </AnimateIn>
          <AnimateIn animation="slide-left" className="order-1 lg:order-2">
            <span className="text-white font-bold text-xs uppercase tracking-widest">Steg 03</span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-5 leading-snug">
              AI gjennomfører intervjuet for deg
            </h2>
            <p className="text-[#94A187] mb-7 leading-relaxed">
              Kandidaten møter en intelligent AI som stiller skreddersydde spørsmål basert på
              stillingen og CV. Tilgjengelig 24/7, i kandidatens eget tempo.
            </p>
            <ul className="space-y-3.5">
              {[
                'Tekstbasert – komfortabelt for alle kandidater',
                'Skreddersydde spørsmål per stilling',
                'Anonymisert vurdering mulig',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#C5AFA0]">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </AnimateIn>
        </div>

        {/* Row 4: Beslutning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <AnimateIn animation="slide-right">
            <span className="text-white font-bold text-xs uppercase tracking-widest">Steg 04</span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-5 leading-snug">
              Ta beslutning på informert grunnlag
            </h2>
            <p className="text-[#94A187] mb-7 leading-relaxed">
              Sammenlign kandidater side om side, se dybdeanalyse fra AI og ta den riktige avgjørelsen
              raskere enn noensinne.
            </p>
            <ul className="space-y-3.5">
              {[
                'Rangert kandidatliste med AI-score',
                'Send jobbtilbud direkte fra plattformen',
                'Innhent referanser automatisk',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#C5AFA0]">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </AnimateIn>
          <AnimateIn animation="slide-left" className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-7">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-semibold text-white">Rangert liste</span>
              <span className="text-xs text-[#4a6358]">4 søkere</span>
            </div>
            {[
              { name: 'Marte S.', score: 94, rank: '#1', color: 'bg-green-900/40 text-green-400' },
              { name: 'Jonas H.', score: 87, rank: '#2', color: 'bg-[#29524A]/20 text-white' },
              { name: 'Lena K.', score: 81, rank: '#3', color: 'bg-[#29524A]/20 text-white' },
            ].map((c, i) => (
              <div key={c.name} className={`flex items-center gap-3 py-3 ${i < 2 ? 'border-b border-[#29524A]/20' : ''}`}>
                <span className="text-xs text-[#2a3e36] w-6 font-bold">{c.rank}</span>
                <div className="w-8 h-8 rounded-full bg-[#1a2c24] border border-[#94A187]/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white">{c.name[0]}</span>
                </div>
                <span className="text-sm text-white flex-1">{c.name}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.color}`}>{c.score}</span>
              </div>
            ))}
            <button className="mt-5 w-full text-xs text-white border border-[#94A187]/35 hover:bg-[#29524A]/15 rounded-xl py-3 transition-colors">
              Send tilbud til Marte S. →
            </button>
          </AnimateIn>
        </div>
      </section>

      {/* ── STATS ROW (Visuo 4-stat horizontal) ──────────────────────── */}
      <section className="py-24 bg-[#0e1c17] border-y border-[#29524A]/30 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-3">Resultater som teller</h2>
            <p className="text-[#7a8a7d]">Slik hjelper Ansora bedrifter over hele landet</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {[
              { value: '10x', label: 'Raskere screening', sub: 'vs. manuell prosess' },
              { value: '94%', label: 'Nøyaktighet i scoring', sub: 'AI-vurdering' },
              { value: '6+', label: 'Bransjer støttet', sub: 'forhåndstilpasset' },
              { value: '200+', label: 'Bedrifter', sub: 'bruker Ansora' },
            ].map((stat, i) => (
              <AnimateIn key={stat.label} animation="slide-up" delay={i * 100} className="text-center px-4">
                <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white font-semibold mb-1.5">{stat.label}</div>
                <div className="text-xs text-[#3a5248]">{stat.sub}</div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS: Bransjer + Extras ────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Bransjer */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Bransjetilpasset</h2>
            <p className="text-[#7a8a7d] mb-8 text-sm leading-relaxed">
              Forhåndsdefinerte maler og kriterier for din bransje – AI vet hva som gjelder.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🏥', label: 'Helse og omsorg' },
                { icon: '🏗️', label: 'Bygg og anlegg' },
                { icon: '🛒', label: 'Handel og dagligvare' },
                { icon: '🍽️', label: 'Restaurant og servering' },
                { icon: '📦', label: 'Lager og logistikk' },
                { icon: '💻', label: 'IT og teknologi' },
              ].map((industry, i) => (
                <div key={industry.label} className="flex items-center gap-3 p-4 rounded-xl border border-[#29524A]/25 bg-[#0e1c17] hover:border-[#94A187]/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  <span className="text-xl">{industry.icon}</span>
                  <p className="text-sm font-medium text-[#C5AFA0]">{industry.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Extra features */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-2">Kraftige tilleggsfunksjoner</h2>
            <p className="text-[#7a8a7d] mb-8 text-sm leading-relaxed">
              Alt du trenger for en komplett rekrutteringsprosess – samlet på ett sted.
            </p>
            {[
              { icon: Globe, title: 'Flerspråklig', desc: 'Kandidaten kommuniserer på sitt morsmål. Du mottar alltid norsk analyse.' },
              { icon: Shield, title: 'Anonymisert vurdering', desc: 'Skjul personidentifiserende info og ta objektive beslutninger.' },
              { icon: Users, title: 'Referansesjekk', desc: 'Send referanseforespørsler automatisk og motta strukturerte svar.' },
              { icon: Zap, title: 'Jobbtilbud digitalt', desc: 'Send, signer og administrer jobbtilbud direkte i plattformen.' },
            ].map((feat, i) => (
              <div key={feat.title} className="flex gap-4 p-4 rounded-xl border border-[#29524A]/25 bg-[#0e1c17] hover:border-[#94A187]/40 hover:translate-x-1 transition-all duration-200 animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                <div className="w-10 h-10 rounded-lg bg-[#29524A]/20 border border-[#94A187]/35 flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{feat.title}</h4>
                  <p className="text-xs text-[#7a8a7d] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (Visuo 3-card style) ───────────────────────── */}
      <section className="py-24 bg-[#0e1c17] border-y border-[#29524A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Hva bedriftene sier</h2>
            <p className="text-[#7a8a7d]">Ekte tilbakemeldinger fra norske rekrutterere</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Ansora spart oss for enorme mengder tid. Vi brukte uker på screening – nå er det gjort på timer. Uvurderlig verktøy.',
                name: 'Kristine M.',
                title: 'HR-leder, Helsegruppen AS',
                initials: 'KM',
              },
              {
                quote: 'Kvaliteten på kandidatene vi inviterer til intervju har økt dramatisk. AI-analysen er forbløffende presis og objektiv.',
                name: 'Thomas B.',
                title: 'Daglig leder, TechNord',
                initials: 'TB',
              },
              {
                quote: 'Vi rekrutterte 8 ansatte på tre uker. Uten Ansora hadde det tatt måneder. Anbefales på det sterkeste!',
                name: 'Lene H.',
                title: 'Rekrutteringssjef, Bygg & Co',
                initials: 'LH',
              },
            ].map((t, i) => (
              <AnimateIn key={t.name} animation="scale-in" delay={i * 120}>
              <div className="bg-[#06070E] border border-[#29524A]/25 rounded-2xl p-7 flex flex-col hover:border-[#94A187]/35 hover:-translate-y-1 transition-all duration-300">
                <Quote className="w-7 h-7 text-[#94A187]/50 mb-5 flex-shrink-0" />
                <p className="text-[#94A187] text-sm leading-relaxed flex-1 mb-7 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-[#29524A]/25">
                  <div className="w-10 h-10 rounded-full bg-[#1a2c24] border border-[#94A187]/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-[#3a5248]">{t.title}</div>
                  </div>
                  <div className="ml-auto flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-white fill-[#C5AFA0]" />
                    ))}
                  </div>
                </div>
              </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────── */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimateIn animation="scale-in">
        <div className="w-14 h-14 rounded-2xl bg-[#29524A]/20 border border-[#94A187]/35 flex items-center justify-center mx-auto mb-7">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-snug">
          Klar til å effektivisere rekrutteringen?
        </h2>
        <p className="text-[#94A187] mb-10 text-lg max-w-xl mx-auto leading-relaxed">
          Kom i gang gratis i dag og opplev kraften av AI-drevet rekruttering – ingen kredittkort nødvendig.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link href="/auth/register">
            <button className="inline-flex items-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold px-8 py-4 rounded-xl transition-all text-[15px]">
              Registrer bedrift gratis
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/jobs">
            <button className="inline-flex items-center gap-2 border border-[#94A187]/25 hover:border-[#94A187]/55 hover:bg-[#29524A]/15 text-white font-semibold px-8 py-4 rounded-xl transition-all text-[15px]">
              Søk som kandidat
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#4a6358]">
          {['Gratis å komme i gang', 'Ingen kredittkort', 'Kom i gang på minutter'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              {item}
            </div>
          ))}
        </div>
        </AnimateIn>
      </section>

      {/* ── FOOTER (Prospect multi-column) ───────────────────────────── */}
      <footer className="bg-[#0e1c17] border-t border-[#29524A]/25 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-[#29524A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">Ansora</span>
              </Link>
              <p className="text-sm text-[#3a5248] max-w-xs leading-relaxed mb-6">
                AI-drevet rekrutteringsplattform som hjelper norske bedrifter å finne de riktige
                kandidatene – raskere og mer objektivt.
              </p>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-white fill-[#C5AFA0]" />
                ))}
                <span className="text-xs text-[#3a5248] ml-1.5">4.9/5 fra 200+ bedrifter</span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2a3e36] mb-5">Plattform</p>
              <ul className="space-y-3">
                {[
                  { label: 'Ledige stillinger', href: '/jobs' },
                  { label: 'Registrer bedrift', href: '/auth/register' },
                  { label: 'Logg inn', href: '/auth/login' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[#3a5248] hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2a3e36] mb-5">Dashboard</p>
              <ul className="space-y-3">
                {[
                  { label: 'Bedriftsoversikt', href: '/dashboard/company' },
                  { label: 'Mine søknader', href: '/dashboard/candidate' },
                  { label: 'Opprett stilling', href: '/jobs/new' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[#3a5248] hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#29524A]/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#2a3e36]">© 2025 Ansora. Alle rettigheter forbeholdt.</p>
            <p className="text-xs text-[#1e3028]">AI-drevet rekrutteringsplattform · Norge</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
