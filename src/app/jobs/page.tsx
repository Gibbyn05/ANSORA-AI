import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { Badge } from '@/components/ui/Badge'
import { getIndustryLabel, formatDate } from '@/lib/utils'
import { MapPin, Clock, Briefcase, Search, ArrowRight } from 'lucide-react'
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
    .select(`
      *,
      companies (id, name, logo)
    `)
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

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar userRole={userRole} userName={userName} />

      {/* Hero */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-3">Ledige stillinger</h1>
          <p className="text-white/70 mb-8">Finn din neste karrieremulighet</p>

          {/* Søkefelt */}
          <form method="GET" className="flex gap-3 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Søk stilling, sted..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary border-0"
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Søk
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - bransjefilter */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="card">
              <h3 className="font-semibold text-navy mb-4 text-sm uppercase tracking-wide">Bransje</h3>
              <div className="space-y-1">
                {INDUSTRIES.map((ind) => (
                  <Link
                    key={ind.value}
                    href={ind.value ? `/jobs?industry=${ind.value}${search ? `&search=${search}` : ''}` : `/jobs${search ? `?search=${search}` : ''}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      (industry || '') === ind.value
                        ? 'bg-primary text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {ind.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Stillingsliste */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 text-sm">
                <span className="font-semibold text-navy">{filteredJobs.length}</span> stilling{filteredJobs.length !== 1 ? 'er' : ''} funnet
              </p>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="card text-center py-16">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy mb-2">Ingen stillinger funnet</h3>
                <p className="text-gray-500 text-sm">Prøv et annet søkeord eller fjern filteret</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job: Job & { companies?: { name: string } }) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="card hover:shadow-md transition-all duration-200 cursor-pointer group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="neutral">{getIndustryLabel(job.industry as Industry)}</Badge>
                            <Badge variant="info">{job.percentage}%</Badge>
                          </div>
                          <h2 className="text-lg font-semibold text-navy group-hover:text-primary transition-colors">
                            {job.title}
                          </h2>
                          <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {(job as { companies?: { name: string } }).companies?.name || 'Bedrift'}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {formatDate(job.created_at)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                            {job.description.substring(0, 200)}...
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
