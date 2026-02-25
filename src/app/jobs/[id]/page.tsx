import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { Badge } from '@/components/ui/Badge'
import { getIndustryLabel, formatDate } from '@/lib/utils'
import {
  MapPin, Clock, Building2, ArrowLeft, Users,
  CheckCircle2, Briefcase, Gift, UserCheck, Globe,
  Percent, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplyButton } from './ApplyButton'
import type { Industry } from '@/types'

// ── Description parser ──────────────────────────────────────────────────────

type SectionType = 'intro' | 'om-stillingen' | 'vi-soker' | 'vi-tilbyr' | 'avslutning' | 'annet'

type Section = {
  title: string | null
  lines: string[]
  type: SectionType
}

function getSectionType(title: string | null): SectionType {
  if (!title) return 'intro'
  const t = title.toLowerCase()
  if (t.includes('om stilling') || t.includes('arbeidsoppgave') || t.includes('rolle') || t.includes('oppgave')) return 'om-stillingen'
  if (t.includes('søker') || t.includes('krav') || t.includes('kvalifikasjon') || t.includes('deg som')) return 'vi-soker'
  if (t.includes('tilbyr') || t.includes('fordel') || t.includes('vi gir') || t.includes('hos oss')) return 'vi-tilbyr'
  return 'annet'
}

/** Remove markdown syntax from a plain text string */
function strip(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.+?)\*/g, '$1')       // *italic*
    .replace(/^#+\s+/, '')             // ## heading prefix
    .replace(/:$/, '')                 // trailing colon
    .trim()
}

/** Returns true when a line is a standalone heading (not content) */
function isHeadingLine(line: string): boolean {
  const t = line.trim()
  if (t.match(/^#{1,3} /)) return true
  // **Heading:** or **Heading** on its own line
  if (t.match(/^\*\*[^*]+:?\*\*\s*$/) || t.match(/^\*\*[^*]+:\*\*\s*$/)) return true
  // Heading: with no extra text after (e.g. "Om stillingen:")
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
    // Handle "**Heading:** content on same line" format
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
      // Strip inline markdown from content lines before storing
      current.lines.push(strip(line))
    }
  }
  flush()

  // Skip a first section that is only the job title (e.g. "Stillingsannonse: ...")
  if (sections.length > 0 && sections[0].title === null) {
    const firstLines = sections[0].lines.filter((l) => l.trim())
    if (firstLines.length === 1 && firstLines[0].toLowerCase().includes('stillingsannonse')) {
      sections.shift()
    }
  }

  // Mark last text-only section as closing paragraph
  if (sections.length > 0) {
    const last = sections[sections.length - 1]
    const hasBullets = last.lines.some((l) => l.trim().startsWith('-') || l.trim().startsWith('•'))
    if (!hasBullets && last.lines.filter((l) => l.trim()).length <= 4) {
      sections[sections.length - 1] = { ...last, type: 'avslutning' }
    }
  }

  return sections
}

// ── Section renderer ─────────────────────────────────────────────────────────

const sectionConfig: Record<SectionType, {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  border: string
  titleColor: string
}> = {
  'om-stillingen': {
    icon: Briefcase,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'border-blue-100',
    titleColor: 'text-blue-800',
  },
  'vi-soker': {
    icon: UserCheck,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    border: 'border-green-100',
    titleColor: 'text-green-800',
  },
  'vi-tilbyr': {
    icon: Gift,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    border: 'border-purple-100',
    titleColor: 'text-purple-800',
  },
  'annet': {
    icon: Sparkles,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-500',
    border: 'border-gray-100',
    titleColor: 'text-navy',
  },
  'intro': {
    icon: Sparkles,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-400',
    border: 'border-gray-100',
    titleColor: 'text-navy',
  },
  'avslutning': {
    icon: Sparkles,
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-400',
    border: 'border-gray-100',
    titleColor: 'text-navy',
  },
}

const bulletIconColors: Record<SectionType, string> = {
  'om-stillingen': 'text-blue-500',
  'vi-soker': 'text-green-500',
  'vi-tilbyr': 'text-purple-500',
  'annet': 'text-gray-400',
  'intro': 'text-gray-400',
  'avslutning': 'text-gray-400',
}

function DescriptionSection({ section }: { section: Section }) {
  const paras = section.lines.filter((l) => l.trim())
  const bulletColor = bulletIconColors[section.type]

  if (section.type === 'intro') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
        {paras.map((line, i) => (
          <p key={i} className="text-gray-700 leading-relaxed text-base font-medium">{line}</p>
        ))}
      </div>
    )
  }

  if (section.type === 'avslutning') {
    return (
      <div className="border-t border-gray-100 pt-6 mt-2">
        {paras.map((line, i) => (
          <p key={i} className="text-gray-600 leading-relaxed italic text-sm">{line}</p>
        ))}
      </div>
    )
  }

  const cfg = sectionConfig[section.type]
  const Icon = cfg.icon

  const bullets: string[] = []
  const prose: string[] = []
  for (const line of paras) {
    const trimmed = line.trim()
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      bullets.push(trimmed.replace(/^[-•*]\s+/, ''))
    } else {
      prose.push(trimmed)
    }
  }

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
      {/* Section header */}
      <div className={`${cfg.iconBg} px-6 py-4 flex items-center gap-3`}>
        <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>
        <h2 className={`font-bold text-base ${cfg.titleColor}`}>{section.title}</h2>
      </div>

      {/* Content */}
      <div className="bg-white px-6 py-5 space-y-4">
        {prose.length > 0 && (
          <div className="space-y-2">
            {prose.map((line, i) => (
              <p key={i} className="text-gray-600 leading-relaxed text-sm">{line}</p>
            ))}
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="space-y-2.5">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${bulletColor}`} />
                <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
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
    .select(`*, companies (id, name, logo, website, description)`)
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
      .from('candidates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (candidate) {
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('candidate_id', candidate.id)
        .single()
      hasApplied = !!existingApp
    }
  }

  const sections = parseDescription(job.description)

  // Days since posted
  const postedDays = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const isNew = postedDays <= 3

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar userRole={userRole} userName={userName} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake til stillinger
        </Link>

        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Top gradient strip */}
          <div className="h-2 bg-gradient-to-r from-primary to-indigo-500" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* Company logo */}
              <div className="flex-shrink-0">
                {job.companies?.logo ? (
                  <img
                    src={job.companies.logo}
                    alt={job.companies.name}
                    className="w-16 h-16 rounded-2xl object-contain border border-gray-100 bg-gray-50"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Title + company + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="info">{getIndustryLabel(job.industry as Industry)}</Badge>
                  {job.status === 'published' && <Badge variant="success">Aktiv</Badge>}
                  {isNew && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      ✦ Ny
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-navy leading-tight">{job.title}</h1>
                <p className="text-gray-500 font-medium mt-1 text-lg">
                  {job.companies?.name || 'Bedrift'}
                </p>

                {/* Metadata pills */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <MetaPill icon={MapPin} label={job.location} />
                  <MetaPill icon={Percent} label={`${job.percentage}% stilling`} />
                  <MetaPill icon={Clock} label={
                    postedDays === 0 ? 'Publisert i dag' :
                    postedDays === 1 ? 'Publisert i går' :
                    `Publisert for ${postedDays} dager siden`
                  } />
                  <MetaPill icon={Users} label={`${applicationCount || 0} søkere`} />
                </div>
              </div>

              {/* CTA on desktop */}
              <div className="hidden sm:block flex-shrink-0 w-48">
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

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: description */}
          <div className="lg:col-span-2 space-y-4">
            {sections.map((section, i) => (
              <DescriptionSection key={i} section={section} />
            ))}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">

            {/* Apply card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <ApplyButton
                jobId={job.id}
                userRole={userRole}
                hasApplied={hasApplied}
                isLoggedIn={!!user}
              />
              {!hasApplied && userRole === 'candidate' && (
                <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                  Din CV og profil sendes til bedriften
                </p>
              )}
            </div>

            {/* Job specs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-navy mb-4 text-sm uppercase tracking-wide">
                Stillingsinformasjon
              </h3>
              <div className="space-y-3">
                <SpecRow label="Bransje" value={getIndustryLabel(job.industry as Industry)} />
                <SpecRow label="Stillingsprosent" value={`${job.percentage}%`} />
                <SpecRow label="Arbeidssted" value={job.location} />
                <SpecRow label="Antall søkere" value={`${applicationCount || 0}`} />
              </div>
            </div>

            {/* Company card */}
            {job.companies && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-navy mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Om bedriften
                </h3>

                <div className="flex items-center gap-3 mb-3">
                  {job.companies.logo ? (
                    <img
                      src={job.companies.logo}
                      alt={job.companies.name}
                      className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-gray-50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <p className="font-semibold text-navy text-sm">{job.companies.name}</p>
                </div>

                {job.companies.description && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">
                    {job.companies.description}
                  </p>
                )}

                {job.companies.website && (
                  <a
                    href={job.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary text-sm hover:underline font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Besøk nettside
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile apply button */}
        <div className="sm:hidden mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function MetaPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      {label}
    </span>
  )
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-navy">{value}</span>
    </div>
  )
}
