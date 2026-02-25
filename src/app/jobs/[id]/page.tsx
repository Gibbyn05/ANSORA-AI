import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { getIndustryLabel } from '@/lib/utils'
import { MapPin, Clock, Building2, ArrowLeft, Users, Globe, Percent } from 'lucide-react'
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

  // Drop lone "Stillingsannonse: …" intro line
  if (sections.length > 0 && sections[0].title === null) {
    const first = sections[0].lines.filter((l) => l.trim())
    if (first.length === 1 && first[0].toLowerCase().includes('stillingsannonse'))
      sections.shift()
  }

  return sections
}

// ── Section renderer ──────────────────────────────────────────────────────────

function DescriptionSection({ section }: { section: Section }) {
  const paras = section.lines.filter((l) => l.trim())
  const bullets: string[] = []
  const prose: string[] = []

  for (const line of paras) {
    const t = line.trim()
    if (/^[-•*]/.test(t)) bullets.push(t.replace(/^[-•*]\s+/, ''))
    else prose.push(t)
  }

  return (
    <div className="mb-7 last:mb-0">
      {section.title && (
        <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
      )}
      {prose.length > 0 && (
        <div className="space-y-3">
          {prose.map((line, i) => (
            <p key={i} className="text-gray-700 text-[15px] leading-relaxed">{line}</p>
          ))}
        </div>
      )}
      {bullets.length > 0 && (
        <ul className="mt-2 space-y-2 pl-4">
          {bullets.map((item, i) => (
            <li key={i} className="text-gray-700 text-[15px] leading-relaxed list-disc">{item}</li>
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
    `${postedDays} dager siden`

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar userRole={userRole} userName={userName} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Back */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle stillinger
        </Link>

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-5 items-start">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Company bar */}
            <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-center gap-4">
              {job.companies?.logo ? (
                <img
                  src={job.companies.logo}
                  alt={job.companies?.name}
                  className="w-14 h-14 rounded object-contain bg-gray-50 border border-gray-100 p-1 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{job.companies?.name || 'Bedrift'}</p>
                {job.companies?.website && (
                  <a
                    href={job.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                  >
                    <Globe className="w-3 h-3" />
                    Vis nettside
                  </a>
                )}
              </div>
            </div>

            {/* Title + meta */}
            <div className="bg-white rounded-lg border border-gray-200 px-6 pt-6 pb-2">
              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">{job.title}</h1>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 pb-5 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4" />
                  {job.percentage}%
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {postedLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {applicationCount ?? 0} søkere
                </span>
              </div>

              {/* Description */}
              <div className="py-6">
                {sections.map((s, i) => (
                  <DescriptionSection key={i} section={s} />
                ))}
              </div>

              {/* Mobile apply */}
              <div className="lg:hidden border-t border-gray-100 py-5">
                <ApplyButton
                  jobId={job.id}
                  userRole={userRole}
                  hasApplied={hasApplied}
                  isLoggedIn={!!user}
                />
              </div>
            </div>
          </div>

          {/* ── Sticky sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-5">

            {/* Apply */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <ApplyButton
                jobId={job.id}
                userRole={userRole}
                hasApplied={hasApplied}
                isLoggedIn={!!user}
              />
              {!hasApplied && userRole === 'candidate' && (
                <p className="text-xs text-gray-400 text-center mt-2.5">
                  CV og profil sendes til bedriften
                </p>
              )}
            </div>

            {/* Fact table */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              <div className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Om stillingen</p>
              </div>
              <FactRow label="Arbeidsgiver" value={job.companies?.name || '—'} />
              <FactRow label="Bransje"      value={getIndustryLabel(job.industry as Industry)} />
              <FactRow label="Sted"         value={job.location} />
              <FactRow label="Stillingsprosent" value={`${job.percentage}%`} />
              <FactRow label="Antall søkere" value={String(applicationCount ?? 0)} />
              <FactRow label="Publisert"    value={postedLabel} />
            </div>

            {/* Company blurb */}
            {job.companies?.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Om bedriften</p>
                <p className="text-sm text-gray-600 leading-relaxed">{job.companies.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}
