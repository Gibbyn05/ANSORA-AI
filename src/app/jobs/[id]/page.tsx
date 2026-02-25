import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { getIndustryLabel } from '@/lib/utils'
import {
  MapPin, Clock, Building2, ArrowLeft, Users,
  CheckCircle2, Briefcase, Gift, UserCheck, Globe,
  Percent,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplyButton } from './ApplyButton'
import type { Industry } from '@/types'

// ── Parser ───────────────────────────────────────────────────────────────────

type SectionType = 'intro' | 'om-stillingen' | 'vi-soker' | 'vi-tilbyr' | 'avslutning' | 'annet'
type Section = { title: string | null; lines: string[]; type: SectionType }

function getSectionType(title: string | null): SectionType {
  if (!title) return 'intro'
  const t = title.toLowerCase()
  if (t.includes('om stilling') || t.includes('oppgave') || t.includes('rolle')) return 'om-stillingen'
  if (t.includes('søker') || t.includes('krav') || t.includes('kvalifikasjon') || t.includes('deg som')) return 'vi-soker'
  if (t.includes('tilbyr') || t.includes('fordel') || t.includes('hos oss')) return 'vi-tilbyr'
  return 'annet'
}

function strip(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s+/, '')
    .replace(/:$/, '')
    .trim()
}

function isHeadingLine(line: string): boolean {
  const t = line.trim()
  if (t.match(/^#{1,3} /)) return true
  if (t.match(/^\*\*[^*]+:?\*\*\s*$/)) return true
  if (t.match(/^[A-ZÆØÅ][^.!?]{3,40}:\s*$/) && !t.startsWith('-')) return true
  return false
}

function parseDescription(text: string): Section[] {
  const sections: Section[] = []
  let current: { title: string | null; lines: string[] } = { title: null, lines: [] }

  const flush = () => {
    if (current.lines.some((l) => l.trim())) {
      sections.push({ title: current.title, lines: [...current.lines], type: getSectionType(current.title) })
    }
  }

  for (const line of text.split('\n')) {
    const inlineHeading = line.match(/^\*\*([^*]{3,40}):?\*\*[:\s]+(.+)/)
    if (inlineHeading) {
      flush()
      current = { title: inlineHeading[1].trim(), lines: [strip(inlineHeading[2])] }
      continue
    }
    if (isHeadingLine(line)) {
      flush()
      current = { title: strip(line), lines: [] }
    } else {
      current.lines.push(strip(line))
    }
  }
  flush()

  // Drop a lone title-only first section
  if (sections.length > 0 && sections[0].title === null) {
    const first = sections[0].lines.filter((l) => l.trim())
    if (first.length === 1 && first[0].toLowerCase().includes('stillingsannonse')) sections.shift()
  }

  // Tag trailing prose-only section as closing
  if (sections.length > 0) {
    const last = sections[sections.length - 1]
    const hasBullets = last.lines.some((l) => /^[-•*]/.test(l.trim()))
    if (!hasBullets && last.lines.filter((l) => l.trim()).length <= 4)
      sections[sections.length - 1] = { ...last, type: 'avslutning' }
  }

  return sections
}

// ── Section label config ──────────────────────────────────────────────────────

const SECTION_META: Record<SectionType, {
  dot: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  accent: string   // left border color class
  dotBg: string
}> = {
  'intro':       { dot: 'bg-primary',    label: '',               icon: Briefcase,  accent: 'border-primary',   dotBg: 'bg-blue-50' },
  'om-stillingen':{ dot: 'bg-blue-500',  label: 'Om stillingen',  icon: Briefcase,  accent: 'border-blue-400',  dotBg: 'bg-blue-50' },
  'vi-soker':    { dot: 'bg-emerald-500',label: 'Vi søker deg som',icon: UserCheck, accent: 'border-emerald-400',dotBg: 'bg-emerald-50' },
  'vi-tilbyr':   { dot: 'bg-violet-500', label: 'Vi tilbyr',      icon: Gift,       accent: 'border-violet-400', dotBg: 'bg-violet-50' },
  'annet':       { dot: 'bg-gray-400',   label: '',               icon: Briefcase,  accent: 'border-gray-300',  dotBg: 'bg-gray-50' },
  'avslutning':  { dot: 'bg-gray-300',   label: '',               icon: Briefcase,  accent: 'border-gray-200',  dotBg: 'bg-gray-50' },
}

const BULLET_COLOR: Record<SectionType, string> = {
  'intro':        'text-primary',
  'om-stillingen':'text-blue-500',
  'vi-soker':     'text-emerald-500',
  'vi-tilbyr':    'text-violet-500',
  'annet':        'text-gray-400',
  'avslutning':   'text-gray-300',
}

// ── Section component ─────────────────────────────────────────────────────────

function DescriptionSection({ section, isLast }: { section: Section; isLast: boolean }) {
  const paras = section.lines.filter((l) => l.trim())
  const meta = SECTION_META[section.type]
  const bulletColor = BULLET_COLOR[section.type]

  const bullets: string[] = []
  const prose: string[] = []
  for (const line of paras) {
    const t = line.trim()
    if (/^[-•*]/.test(t)) bullets.push(t.replace(/^[-•*]\s+/, ''))
    else prose.push(t)
  }

  /* ── Intro: big lead text, no header ── */
  if (section.type === 'intro') {
    return (
      <div className={`px-8 pt-8 ${isLast ? 'pb-8' : 'pb-6 border-b border-gray-100'}`}>
        {paras.map((line, i) => (
          <p key={i} className="text-gray-700 text-base leading-8 font-medium">{line}</p>
        ))}
      </div>
    )
  }

  /* ── Closing: italic, no header ── */
  if (section.type === 'avslutning') {
    return (
      <div className={`px-8 pt-6 ${isLast ? 'pb-8' : 'pb-6'}`}>
        {paras.map((line, i) => (
          <p key={i} className="text-gray-500 text-sm leading-7 italic">{line}</p>
        ))}
      </div>
    )
  }

  /* ── Named sections ── */
  return (
    <div className={`px-8 pt-7 ${isLast ? 'pb-8' : 'pb-6 border-b border-gray-100'}`}>
      {/* Section label pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-widest`} style={{ color: 'inherit' }}>
          <span className={
            section.type === 'om-stillingen' ? 'text-blue-600' :
            section.type === 'vi-soker' ? 'text-emerald-600' :
            section.type === 'vi-tilbyr' ? 'text-violet-600' :
            'text-gray-500'
          }>
            {section.title}
          </span>
        </span>
      </div>

      <div className="space-y-5">
        {/* Prose paragraphs */}
        {prose.length > 0 && (
          <div className="space-y-2">
            {prose.map((line, i) => (
              <p key={i} className="text-gray-600 text-sm leading-7">{line}</p>
            ))}
          </div>
        )}

        {/* Bullet list */}
        {bullets.length > 0 && (
          <ul className="space-y-2.5">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className={`w-[18px] h-[18px] mt-[2px] flex-shrink-0 ${bulletColor}`} />
                <span className="text-gray-700 text-[15px] leading-7">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role as 'company' | 'candidate' | null
  const userName = user?.user_metadata?.name

  const { data: job } = await supabase
    .from('jobs')
    .select('*, companies (id, name, logo, website, description)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { count: applicationCount } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', id)

  let hasApplied = false
  if (user && userRole === 'candidate') {
    const { data: candidate } = await supabase
      .from('candidates').select('id').eq('user_id', user.id).single()
    if (candidate) {
      const { data: existing } = await supabase
        .from('applications').select('id')
        .eq('job_id', id).eq('candidate_id', candidate.id).single()
      hasApplied = !!existing
    }
  }

  const sections = parseDescription(job.description)

  const postedDays = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const postedLabel =
    postedDays === 0 ? 'Publisert i dag' :
    postedDays === 1 ? 'Publisert i går' :
    `Publisert for ${postedDays} d. siden`

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <Navbar userRole={userRole} userName={userName} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle stillinger
        </Link>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
          <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-indigo-500" />

          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              {/* Logo */}
              <div className="flex-shrink-0 hidden sm:block">
                {job.companies?.logo ? (
                  <img
                    src={job.companies.logo}
                    alt={job.companies?.name}
                    className="w-[72px] h-[72px] rounded-xl object-contain bg-gray-50 border border-gray-100 p-1"
                  />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-sm">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary mb-1">
                  {job.companies?.name || 'Bedrift'}
                </p>
                <h1 className="text-[26px] sm:text-3xl font-bold text-navy leading-tight tracking-tight">
                  {job.title}
                </h1>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Chip icon={MapPin}    text={job.location} />
                  <Chip icon={Percent}   text={`${job.percentage}% stilling`} />
                  <Chip icon={Clock}     text={postedLabel} />
                  <Chip icon={Users}     text={`${applicationCount ?? 0} søkere`} />
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
                    {getIndustryLabel(job.industry as Industry)}
                  </span>
                  {postedDays <= 3 && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
                      Ny
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop apply */}
              <div className="hidden lg:block flex-shrink-0 w-52 pt-1">
                <ApplyButton
                  jobId={job.id}
                  userRole={userRole}
                  hasApplied={hasApplied}
                  isLoggedIn={!!user}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Body grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

          {/* Description card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {sections.map((s, i) => (
              <DescriptionSection key={i} section={s} isLast={i === sections.length - 1} />
            ))}
          </div>

          {/* Sticky sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Apply */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-indigo-600 px-6 py-5">
                <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">Interessert?</p>
                <p className="text-white font-bold text-lg leading-tight">{job.title}</p>
                <p className="text-white/70 text-sm mt-0.5">{job.companies?.name}</p>
              </div>
              <div className="p-5">
                <ApplyButton
                  jobId={job.id}
                  userRole={userRole}
                  hasApplied={hasApplied}
                  isLoggedIn={!!user}
                />
                {!hasApplied && userRole === 'candidate' && (
                  <p className="text-xs text-gray-400 text-center mt-3">
                    Din CV og profil sendes direkte til bedriften
                  </p>
                )}
              </div>
            </div>

            {/* Job specs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                Stillingsinformasjon
              </p>
              <div className="space-y-0">
                <InfoRow icon={Building2} label="Bransje"        value={getIndustryLabel(job.industry as Industry)} />
                <InfoRow icon={Percent}   label="Stillingsprosent" value={`${job.percentage}%`} />
                <InfoRow icon={MapPin}    label="Arbeidssted"    value={job.location} />
                <InfoRow icon={Users}     label="Antall søkere"  value={String(applicationCount ?? 0)} last />
              </div>
            </div>

            {/* Company */}
            {job.companies && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Om bedriften
                </p>
                <div className="flex items-center gap-3 mb-3">
                  {job.companies.logo ? (
                    <img
                      src={job.companies.logo}
                      alt={job.companies.name}
                      className="w-10 h-10 rounded-lg object-contain border border-gray-100 bg-gray-50 p-0.5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <p className="font-bold text-navy text-sm">{job.companies.name}</p>
                </div>
                {job.companies.description && (
                  <p className="text-sm text-gray-500 leading-6 mb-3">{job.companies.description}</p>
                )}
                {job.companies.website && (
                  <a
                    href={job.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Besøk nettsiden
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile apply bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3 z-40">
          <ApplyButton
            jobId={job.id}
            userRole={userRole}
            hasApplied={hasApplied}
            isLoggedIn={!!user}
          />
        </div>
        <div className="lg:hidden h-20" />
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Chip({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      {text}
    </span>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  last?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 py-3 ${!last ? 'border-b border-gray-50' : ''}`}>
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-navy truncate">{value}</p>
      </div>
    </div>
  )
}
