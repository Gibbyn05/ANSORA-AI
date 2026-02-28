import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { getIndustryLabel, formatDate } from '@/lib/utils'
import { MapPin, Clock, Briefcase, Search, ArrowRight, Building2, Users } from 'lucide-react'
import Link from 'next/link'
import type { Job, Industry } from '@/types'

const INDUSTRIES = [
  { value: '', label: 'Alle bransjer' },
  { value: 'helse-og-omsorg', label: 'Helse og omsorg' },
  { value: 'bygg-og-anlegg', label: 'Bygg og anlegg' },
  { value: 'butikk-og-dagligvare', label: 'Butikk og dagligvare' },
  { value: 'restaurant-og-servering', label: 'Restaurant og servering' },
  { value: 'lager-og-logistikk', label: 'Lager og logistikk' },
  { value: 'it-og-teknologi', label: 'IT og teknologi' },
]

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; search?: string }>
}) {
  const { industry, search } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role as 'company' | 'candidate' | null
  const userName = user?.user_metadata?.name

  let query = supabase
    .from('jobs')
    .select(`*, companies (id, name, logo)`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (industry) {
    query = query.eq('industry', industry)
  }

  const { data: jobs } = await query
  const filteredJobs = jobs?.filter((job: Job) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      job.title.toLowerCase().includes(s) ||
      job.location.toLowerCase().includes(s) ||
      job.description.toLowerCase().includes(s)
    )
  }) || []

  const postedDays = (date: string) =>
    Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userRole={userRole} userName={userName} />

      {/* ── HERO (Prospect left-aligned style) ───────────────────────── */}
      <section className="pt-16 pb-12 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
              Ledige stillinger
            </h1>
            <p className="text-[#666] text-lg mb-8">
              Finn din neste karrieremulighet blant{' '}
              <span className="text-white">{jobs?.length ?? 0} aktive stillinger</span>
            </p>

            {/* Search bar */}
            <form method="GET" className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#444]" />
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Søk på stilling, sted eller bransje..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white bg-[#111111] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-[#3a3a3a] text-[15px] transition-all"
                />
                {industry && (
                  <input type="hidden" name="industry" value={industry} />
                )}
              </div>
              <button
                type="submit"
                className="bg-white hover:bg-[#e0e0e0] text-black px-6 py-3.5 rounded-xl font-semibold transition-colors text-[15px] flex-shrink-0"
              >
                Søk
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── INDUSTRY FILTER: Horizontal pills (Sasslo/modern pattern) ── */}
      <section className="py-5 border-b border-white/[0.05] sticky top-16 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {INDUSTRIES.map((ind) => (
              <Link
                key={ind.value}
                href={
                  ind.value
                    ? `/jobs?industry=${ind.value}${search ? `&search=${search}` : ''}`
                    : `/jobs${search ? `?search=${search}` : ''}`
                }
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                  (industry || '') === ind.value
                    ? 'bg-white text-black'
                    : 'bg-white/[0.04] border border-white/[0.07] text-[#666] hover:text-white hover:border-white/[0.15]'
                }`}
              >
                {ind.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOB LISTING ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Count + active filter */}
        <div className="flex items-center justify-between mb-7">
          <p className="text-sm text-[#555]">
            <span className="text-white font-semibold">{filteredJobs.length}</span>{' '}
            stilling{filteredJobs.length !== 1 ? 'er' : ''}{' '}
            {industry && (
              <span>
                i <span className="text-white">{getIndustryLabel(industry as Industry)}</span>
              </span>
            )}
            {search && (
              <span>
                {' '}for <span className="text-white">&ldquo;{search}&rdquo;</span>
              </span>
            )}
          </p>
          {(industry || search) && (
            <Link
              href="/jobs"
              className="text-xs text-[#555] hover:text-white transition-colors border border-white/[0.07] px-3 py-1.5 rounded-full"
            >
              Fjern filter ×
            </Link>
          )}
        </div>

        {filteredJobs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-[#333]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ingen stillinger funnet</h3>
            <p className="text-[#555] text-sm mb-6 max-w-sm">
              Prøv et annet søkeord eller fjern bransjefilter for å se alle stillinger.
            </p>
            <Link
              href="/jobs"
              className="text-sm text-white border border-white/20 hover:bg-white/5 px-5 py-2.5 rounded-xl transition-colors"
            >
              Vis alle stillinger
            </Link>
          </div>
        ) : (
          /* Job cards grid (Visuo-inspired cards) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredJobs.map((job: Job & { companies?: { name: string; logo?: string } }) => {
              const days = postedDays(job.created_at)
              const isNew = days <= 3
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <article className="group bg-[#111111] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.18] hover:bg-[#141414] transition-all duration-200 cursor-pointer h-full flex flex-col">

                    {/* Top row: company + badges */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {job.companies?.logo ? (
                          <img
                            src={job.companies.logo}
                            alt={job.companies.name}
                            className="w-9 h-9 rounded-lg object-contain bg-[#1a1a1a] border border-white/10 p-0.5 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-[#444]" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-[#555] font-medium">
                            {job.companies?.name || 'Bedrift'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isNew && (
                          <span className="text-[11px] font-semibold bg-white text-black px-2.5 py-1 rounded-full">
                            Ny
                          </span>
                        )}
                        <span className="text-[11px] text-[#444] border border-white/[0.07] px-2.5 py-1 rounded-full">
                          {job.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-[17px] font-semibold text-white group-hover:text-white transition-colors mb-2 leading-snug">
                      {job.title}
                    </h2>

                    {/* Industry pill */}
                    <span className="inline-flex items-center text-[11px] font-medium text-white bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full mb-3 w-fit">
                      {getIndustryLabel(job.industry as Industry)}
                    </span>

                    {/* Description preview */}
                    <p className="text-sm text-[#555] line-clamp-2 leading-relaxed flex-1 mb-4">
                      {job.description.replace(/[#*_]/g, '').substring(0, 180)}…
                    </p>

                    {/* Bottom meta row */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                      <div className="flex items-center gap-4 text-xs text-[#444]">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {days === 0 ? 'I dag' : days === 1 ? 'I går' : `${days}d siden`}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
