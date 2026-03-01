'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  MapPin, Clock, ArrowRight, X, Calendar, Briefcase,
  LayoutList, Map, ChevronDown, Search, SlidersHorizontal,
} from 'lucide-react'
import { getIndustryLabel } from '@/lib/utils'
import type { Job, Industry } from '@/types'

const MapView = dynamic(() => import('./MapView').then(m => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-[#0e1c17] border border-[#29524A]/25 flex items-center justify-center" style={{ height: 520 }}>
      <p className="text-[#4a6358] text-sm">Laster kart...</p>
    </div>
  ),
})

type SortMode = 'newest' | 'oldest' | 'pct_high' | 'pct_low'
type ViewMode = 'list' | 'map'

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Nyeste først',
  oldest: 'Eldste først',
  pct_high: 'Stillingsprosent (høy)',
  pct_low: 'Stillingsprosent (lav)',
}

const INDUSTRIES = [
  { value: '', label: 'Alle bransjer' },
  { value: 'helse-og-omsorg', label: 'Helse og omsorg' },
  { value: 'bygg-og-anlegg', label: 'Bygg og anlegg' },
  { value: 'butikk-og-dagligvare', label: 'Butikk og dagligvare' },
  { value: 'restaurant-og-servering', label: 'Restaurant og servering' },
  { value: 'lager-og-logistikk', label: 'Lager og logistikk' },
  { value: 'it-og-teknologi', label: 'IT og teknologi' },
  { value: 'annet', label: 'Annet' },
]

type JobWithCompany = Job & { companies?: { id?: string; name: string; logo?: string } }

interface JobsClientProps {
  jobs: JobWithCompany[]
  initialSearch?: string
  initialIndustry?: string
  userRole?: 'company' | 'candidate' | null
}

function postedLabel(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (days === 0) return 'I dag'
  if (days === 1) return 'I går'
  return `${days}d siden`
}

function deadlineLabel(deadline: string) {
  const d = new Date(deadline)
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CompanyAvatar({ job }: { job: JobWithCompany }) {
  if (job.companies?.logo) {
    return (
      <img
        src={job.companies.logo}
        alt={job.companies.name}
        className="w-10 h-10 rounded-xl object-contain bg-[#1a2c24] border border-[#94A187]/25 p-0.5 flex-shrink-0"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-[#1a2c24] border border-[#94A187]/25 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-white">
        {job.companies?.name?.charAt(0).toUpperCase() ?? '?'}
      </span>
    </div>
  )
}

export function JobsClient({ jobs, initialSearch = '', initialIndustry = '', userRole }: JobsClientProps) {
  const [search, setSearch] = useState(initialSearch)
  const [industry, setIndustry] = useState(initialIndustry)
  const [sort, setSort] = useState<SortMode>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedJob, setSelectedJob] = useState<JobWithCompany | null>(null)
  const [sortOpen, setSortOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = [...jobs]

    if (industry) list = list.filter(j => j.industry === industry)

    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(j =>
        j.title.toLowerCase().includes(s) ||
        j.location.toLowerCase().includes(s) ||
        (j.companies?.name ?? '').toLowerCase().includes(s) ||
        j.description.toLowerCase().includes(s)
      )
    }

    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'pct_high') return b.percentage - a.percentage
      if (sort === 'pct_low') return a.percentage - b.percentage
      return 0
    })

    return list
  }, [jobs, search, industry, sort])

  const handleJobSelect = useCallback((job: JobWithCompany) => {
    setSelectedJob(job)
    setViewMode('list')
  }, [])

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a5248]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søk på tittel, sted, bedrift..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white bg-[#0e1c17] border border-[#29524A]/30 focus:outline-none focus:ring-2 focus:ring-[#94A187] focus:border-transparent placeholder-[#3a3a3a] text-sm"
          />
        </div>

        {/* Industry filter */}
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="bg-[#0e1c17] border border-[#29524A]/30 text-sm text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#94A187]"
        >
          {INDUSTRIES.map(ind => (
            <option key={ind.value} value={ind.value} className="bg-[#0e1c17]">
              {ind.label}
            </option>
          ))}
        </select>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-2 bg-[#0e1c17] border border-[#29524A]/30 text-sm text-white rounded-xl px-4 py-2.5 hover:border-[#94A187]/40 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#4a6358]" />
            {SORT_LABELS[sort]}
            <ChevronDown className="w-3.5 h-3.5 text-[#4a6358]" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a2c24] border border-[#29524A]/35 rounded-xl py-1 z-50 shadow-xl">
              {(Object.entries(SORT_LABELS) as [SortMode, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSort(key); setSortOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sort === key ? 'text-white bg-[#29524A]/30' : 'text-[#94A187] hover:text-white hover:bg-[#29524A]/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-[#0e1c17] border border-[#29524A]/30 rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              viewMode === 'list' ? 'bg-[#29524A]/40 text-white' : 'text-[#4a6358] hover:text-white'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              viewMode === 'map' ? 'bg-[#29524A]/40 text-white' : 'text-[#4a6358] hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">Kart</span>
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#4a6358] mb-5">
        <span className="text-white font-semibold">{filtered.length}</span>{' '}
        stilling{filtered.length !== 1 ? 'er' : ''}
        {industry && <span> i <span className="text-white">{INDUSTRIES.find(i => i.value === industry)?.label}</span></span>}
        {search && <span> for &ldquo;<span className="text-white">{search}</span>&rdquo;</span>}
      </p>

      {/* ── Map view ─────────────────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <MapView jobs={filtered} onJobSelect={handleJobSelect} selectedJobId={selectedJob?.id} />
      )}

      {/* ── List + Preview split ──────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className={`flex gap-5 items-start transition-all`}>
          {/* Job list */}
          <div className={`flex-1 min-w-0 grid gap-4 ${selectedJob ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {filtered.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#29524A]/[0.08] border border-[#29524A]/25 flex items-center justify-center mb-5">
                  <Briefcase className="w-7 h-7 text-[#2a3e36]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ingen stillinger funnet</h3>
                <p className="text-[#4a6358] text-sm max-w-xs">
                  Prøv andre søkeord eller fjern filtrene
                </p>
              </div>
            ) : (
              filtered.map(job => {
                const isNew = new Date(job.created_at).getTime() > Date.now() - 3 * 86400000
                const isSelected = selectedJob?.id === job.id
                return (
                  <article
                    key={job.id}
                    onClick={() => setSelectedJob(isSelected ? null : job)}
                    className={`group bg-[#0e1c17] border rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col ${
                      isSelected
                        ? 'border-[#C5AFA0]/60 bg-[#1a2c24]'
                        : 'border-[#29524A]/25 hover:border-white/[0.18] hover:bg-[#141414]'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar job={job} />
                        <div>
                          <p className="text-xs text-[#4a6358] font-medium">{job.companies?.name ?? 'Bedrift'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isNew && (
                          <span className="text-[11px] font-semibold bg-[#C5AFA0] text-black px-2.5 py-1 rounded-full">Ny</span>
                        )}
                        <span className="text-[11px] text-[#3a5248] border border-[#29524A]/25 px-2.5 py-1 rounded-full">{job.percentage}%</span>
                      </div>
                    </div>

                    <h2 className="text-[16px] font-semibold text-white mb-2 leading-snug">{job.title}</h2>

                    <span className="inline-flex text-[11px] font-medium text-white bg-[#29524A]/20 border border-[#94A187]/35 px-2.5 py-0.5 rounded-full mb-3 w-fit">
                      {getIndustryLabel(job.industry as Industry)}
                    </span>

                    <p className="text-sm text-[#4a6358] line-clamp-2 leading-relaxed flex-1 mb-4">
                      {job.description.replace(/[#*_]/g, '').substring(0, 160)}…
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[#29524A]/20">
                      <div className="flex items-center gap-3 text-xs text-[#3a5248] flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{postedLabel(job.created_at)}</span>
                        {job.deadline && (
                          <span className="flex items-center gap-1 text-orange-400/80"><Calendar className="w-3.5 h-3.5" />Frist: {deadlineLabel(job.deadline)}</span>
                        )}
                      </div>
                      <ArrowRight className={`w-4 h-4 flex-shrink-0 transition-all ${isSelected ? 'text-[#C5AFA0] rotate-90' : 'text-[#2a3e36] group-hover:text-white group-hover:translate-x-0.5'}`} />
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {/* ── Preview panel ─────────────────────────────────────────────── */}
          {selectedJob && (
            <div className="w-full lg:w-[400px] flex-shrink-0 bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl overflow-hidden sticky top-20">
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-[#29524A]/25">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyAvatar job={selectedJob} />
                  <div className="min-w-0">
                    <p className="text-xs text-[#4a6358]">{selectedJob.companies?.name}</p>
                    <h3 className="font-semibold text-white text-sm leading-snug">{selectedJob.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 rounded-lg text-[#4a6358] hover:text-white hover:bg-[#29524A]/15 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Meta */}
              <div className="px-5 py-4 border-b border-[#29524A]/25 grid grid-cols-2 gap-3">
                {[
                  { label: 'Sted', value: selectedJob.location, icon: MapPin },
                  { label: 'Prosent', value: `${selectedJob.percentage}%`, icon: Briefcase },
                  ...(selectedJob.deadline ? [{ label: 'Søknadsfrist', value: deadlineLabel(selectedJob.deadline), icon: Calendar }] : []),
                  { label: 'Publisert', value: postedLabel(selectedJob.created_at), icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <p className="text-[10px] text-[#3a5248] uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm text-white font-medium flex items-center gap-1">
                      <Icon className="w-3.5 h-3.5 text-[#4a6358] flex-shrink-0" />
                      {value}
                    </p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[10px] text-[#3a5248] uppercase tracking-wide mb-0.5">Bransje</p>
                  <span className="inline-flex text-[11px] font-medium text-white bg-[#29524A]/20 border border-[#94A187]/35 px-2.5 py-0.5 rounded-full">
                    {getIndustryLabel(selectedJob.industry as Industry)}
                  </span>
                </div>
              </div>

              {/* Description preview */}
              <div className="px-5 py-4 max-h-64 overflow-y-auto border-b border-[#29524A]/25">
                <p className="text-sm text-[#7a8a7d] leading-relaxed whitespace-pre-wrap">
                  {selectedJob.description.replace(/[#*_]/g, '').substring(0, 600)}
                  {selectedJob.description.length > 600 ? '…' : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="p-5 flex flex-col gap-2">
                {userRole === 'company' ? (
                  <Link href={`/dashboard/company/jobs/${selectedJob.id}`}>
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
                      Se detaljer
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <Link href={`/apply/${selectedJob.id}`}>
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
                      Søk på stilling
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                )}
                <Link href={`/jobs/${selectedJob.id}`}>
                  <button className="w-full inline-flex items-center justify-center gap-2 border border-[#29524A]/30 hover:border-[#94A187]/45 hover:bg-[#29524A]/[0.08] text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm">
                    Åpne hele annonsen
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
