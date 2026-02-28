import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { getIndustryLabel } from '@/lib/utils'
import {
  MapPin, Clock, Building2, ArrowLeft,
  Users, Globe, Percent, Send, LogIn, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplyButton } from './ApplyButton'
import type { Industry } from '@/types'

// ── Parser ───────────────────────────────────────────────────────────────────

type Section = { title: string | null; lines: string[] }

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
  let current: Section = { title: null, lines: [] }

  const flush = () => {
    if (current.lines.some((l) => l.trim()))
      sections.push({ title: current.title, lines: [...current.lines] })
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

  if (sections.length > 0 && sections[0].title === null) {
    const first = sections[0].lines.filter((l) => l.trim())
    if (first.length === 1 && first[0].toLowerCase().includes('stillingsannonse'))
      sections.shift()
  }

  return sections
}

// ── Section renderer ──────────────────────────────────────────────────────────

function DescriptionSection({ section, isLast }: { section: Section; isLast: boolean }) {
  const paras = section.lines.filter((l) => l.trim())
  const bullets: string[] = []
  const prose: string[] = []

  for (const line of paras) {
    const t = line.trim()
    if (/^[-•*]/.test(t)) bullets.push(t.replace(/^[-•*]\s+/, ''))
    else prose.push(t)
  }

  return (
    <div className={`${!isLast ? 'pb-7 mb-7 border-b border-white/[0.06]' : ''}`}>
      {section.title && (
        <h2 className="text-white font-semibold text-[17px] mb-4 leading-snug">
          {section.title}
        </h2>
      )}
      {prose.length > 0 && (
        <div className="space-y-3">
          {prose.map((line, i) => (
            <p key={i} className="text-[#8a8a8a] text-[15px] leading-7">{line}</p>
          ))}
        </div>
      )}
      {bullets.length > 0 && (
        <ul className={`space-y-2.5 ${prose.length > 0 ? 'mt-4' : ''}`}>
          {bullets.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
              <span className="text-[#8a8a8a] text-[15px] leading-7">{item}</span>
            </li>
          ))}
        </ul>
      )}
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
    postedDays === 0 ? 'I dag' :
    postedDays === 1 ? 'I går' :
    `${postedDays} d. siden`

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userRole={userRole} userName={userName} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-[#555] hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle stillinger
        </Link>

        {/* ── Hero (no card, sits on dark bg) ──────────────────────────────── */}
        <div className="mb-8">
          {/* Company row */}
          <div className="flex items-center gap-3 mb-5">
            {job.companies?.logo ? (
              <img
                src={job.companies.logo}
                alt={job.companies?.name}
                className="w-9 h-9 rounded-md object-contain bg-[#1a1a1a] border border-white/10 p-0.5"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#555]" />
              </div>
            )}
            <span className="text-[#a1a1a1] text-sm font-medium">{job.companies?.name || 'Bedrift'}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-5">
            {job.title}
          </h1>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <DarkChip icon={MapPin}   text={job.location} />
            <DarkChip icon={Percent}  text={`${job.percentage}%`} />
            <DarkChip icon={Clock}    text={postedLabel} />
            <DarkChip icon={Users}    text={`${applicationCount ?? 0} søkere`} />
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
              {getIndustryLabel(job.industry as Industry)}
            </span>
            {postedDays <= 3 && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black">
                Ny
              </span>
            )}
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

          {/* Description */}
          <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-7 sm:p-8">
            {sections.map((s, i) => (
              <DescriptionSection key={i} section={s} isLast={i === sections.length - 1} />
            ))}
          </div>

          {/* Sticky sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Apply card */}
            <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-5">
              <DarkApplySection
                jobId={job.id}
                userRole={userRole}
                hasApplied={hasApplied}
                isLoggedIn={!!user}
              />
            </div>

            {/* Fact table */}
            <div className="bg-[#111111] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#555]">
                  Om stillingen
                </p>
              </div>
              <div className="divide-y divide-white/[0.05]">
                <DarkFactRow label="Arbeidsgiver"     value={job.companies?.name || '—'} />
                <DarkFactRow label="Bransje"          value={getIndustryLabel(job.industry as Industry)} />
                <DarkFactRow label="Sted"             value={job.location} />
                <DarkFactRow label="Stillingsprosent" value={`${job.percentage}%`} />
                <DarkFactRow label="Søkere"           value={String(applicationCount ?? 0)} />
                <DarkFactRow label="Publisert"        value={postedLabel} />
              </div>
            </div>

            {/* Company */}
            {job.companies && (
              <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#555] mb-4">
                  Om bedriften
                </p>
                <div className="flex items-center gap-3 mb-3">
                  {job.companies.logo ? (
                    <img
                      src={job.companies.logo}
                      alt={job.companies.name}
                      className="w-9 h-9 rounded-md object-contain bg-[#1a1a1a] border border-white/10 p-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#555]" />
                    </div>
                  )}
                  <p className="font-semibold text-white text-sm">{job.companies.name}</p>
                </div>
                {job.companies.description && (
                  <p className="text-[13px] text-[#666] leading-relaxed mb-3">{job.companies.description}</p>
                )}
                {job.companies.website && (
                  <a
                    href={job.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-white text-sm font-medium hover:underline"
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-white/[0.07] px-4 py-3 z-40">
          <DarkApplySection
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

// ── Dark apply section (lime CTA) ─────────────────────────────────────────────

function DarkApplySection({
  jobId,
  userRole,
  hasApplied,
  isLoggedIn,
}: {
  jobId: string
  userRole: 'company' | 'candidate' | null
  hasApplied: boolean
  isLoggedIn: boolean
}) {
  if (hasApplied) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-white font-semibold mb-1.5">
          <CheckCircle2 className="w-5 h-5" />
          Du har søkt
        </div>
        <p className="text-xs text-[#555] mb-2">Vi har mottatt din søknad</p>
        <Link href="/dashboard/candidate" className="text-white text-sm hover:underline">
          Se mine søknader →
        </Link>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div>
        <Link href="/auth/login" className="block w-full">
          <button className="w-full inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-5 py-3 rounded-lg text-[15px] hover:bg-[#e0e0e0] transition-colors">
            <LogIn className="w-4 h-4" />
            Logg inn for å søke
          </button>
        </Link>
        <Link href="/auth/register" className="text-white text-sm hover:underline mt-3 block text-center">
          Opprett gratis konto →
        </Link>
      </div>
    )
  }

  if (userRole === 'company') {
    return (
      <p className="text-center text-sm text-[#555]">Bedriftskontoer kan ikke søke</p>
    )
  }

  return (
    <div>
      <Link href={`/apply/${jobId}`} className="block w-full">
        <button className="w-full inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-5 py-3 rounded-lg text-[15px] hover:bg-[#e0e0e0] transition-colors">
          <Send className="w-4 h-4" />
          Søk på stillingen
        </button>
      </Link>
      <p className="text-[11px] text-[#444] text-center mt-2.5">
        CV og profil sendes direkte til bedriften
      </p>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function DarkChip({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-white/[0.08] text-xs font-medium text-[#777]">
      <Icon className="w-3.5 h-3.5 text-[#555]" />
      {text}
    </span>
  )
}

function DarkFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <span className="text-xs text-[#555] flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-[#ccc] text-right">{value}</span>
    </div>
  )
}
