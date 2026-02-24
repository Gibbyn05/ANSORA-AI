import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getIndustryLabel, formatDate } from '@/lib/utils'
import { MapPin, Clock, Percent, Building2, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ApplyButton } from './ApplyButton'
import type { Industry } from '@/types'

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
    .select(`
      *,
      companies (id, name, logo, website, description)
    `)
    .eq('id', id)
    .single()

  if (!job) notFound()

  // Tell antall søkere
  const { count: applicationCount } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', id)

  // Sjekk om kandidaten allerede har søkt
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

  const paragraphs = job.description.split('\n').filter(Boolean)

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar userRole={userRole} userName={userName} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Tilbake til stillinger
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hoveddel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="info">{getIndustryLabel(job.industry as Industry)}</Badge>
                    <Badge variant="neutral">{job.percentage}%</Badge>
                    {job.status === 'published' && <Badge variant="success">Aktiv</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-navy">{job.title}</h1>
                  <p className="text-gray-500 font-medium mt-1">
                    {job.companies?.name || 'Bedrift'}
                  </p>
                </div>
                {job.companies?.logo && (
                  <img
                    src={job.companies.logo}
                    alt={job.companies.name}
                    className="w-16 h-16 rounded-xl object-contain border border-gray-100"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 pb-6 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4" />
                  {job.percentage}% stilling
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Publisert {formatDate(job.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {applicationCount || 0} søkere
                </span>
              </div>

              {/* Stillingsannonse */}
              <div className="mt-6 prose prose-sm max-w-none text-gray-600 space-y-3">
                {paragraphs.map((para: string, i: number) => {
                  if (para.startsWith('##')) {
                    return (
                      <h2 key={i} className="text-lg font-bold text-navy mt-6 mb-2">
                        {para.replace(/^##\s+/, '')}
                      </h2>
                    )
                  }
                  if (para.startsWith('#')) {
                    return (
                      <h1 key={i} className="text-xl font-bold text-navy mt-6 mb-2">
                        {para.replace(/^#\s+/, '')}
                      </h1>
                    )
                  }
                  if (para.startsWith('-') || para.startsWith('•')) {
                    return (
                      <li key={i} className="list-disc list-inside text-gray-600">
                        {para.replace(/^[-•]\s+/, '')}
                      </li>
                    )
                  }
                  return <p key={i} className="text-gray-600 leading-relaxed">{para}</p>
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Søk-knapp */}
            <Card>
              <ApplyButton
                jobId={job.id}
                userRole={userRole}
                hasApplied={hasApplied}
                isLoggedIn={!!user}
              />
            </Card>

            {/* Om bedriften */}
            {job.companies && (
              <Card>
                <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Om bedriften
                </h3>
                <p className="font-medium text-navy text-sm">{job.companies.name}</p>
                {job.companies.description && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {job.companies.description}
                  </p>
                )}
                {job.companies.website && (
                  <a
                    href={job.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-2 block"
                  >
                    Besøk nettside →
                  </a>
                )}
              </Card>
            )}

            {/* Stillingsinformasjon */}
            <Card>
              <h3 className="font-semibold text-navy mb-3">Stillingsinformasjon</h3>
              <dl className="space-y-2 text-sm">
                {[
                  { label: 'Bransje', value: getIndustryLabel(job.industry as Industry) },
                  { label: 'Stillingsprosent', value: `${job.percentage}%` },
                  { label: 'Arbeidssted', value: job.location },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <dt className="text-gray-500">{item.label}</dt>
                    <dd className="font-medium text-navy text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
