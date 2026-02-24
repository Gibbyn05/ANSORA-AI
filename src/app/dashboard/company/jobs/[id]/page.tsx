import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { translateStatus, getIndustryLabel, formatDate } from '@/lib/utils'
import { ArrowLeft, Users, MapPin, Percent, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import type { Industry, ApplicationStatus, Application } from '@/types'

const STATUS_VARIANT: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'neutral',
  reviewing: 'info',
  interview: 'warning',
  reference_check: 'warning',
  offer_sent: 'default',
  hired: 'success',
  rejected: 'danger',
}

export default async function CompanyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'company') {
    redirect('/auth/login')
  }

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (id, name)
    `)
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      candidates (id, name, email, language, cv_url)
    `)
    .eq('job_id', id)
    .order('score', { ascending: false, nullsFirst: false })

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar userRole="company" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/company" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6">
          <ArrowLeft className="w-4 h-4" />
          Tilbake til dashboard
        </Link>

        {/* Stillingsinformasjon */}
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant={job.status === 'published' ? 'success' : job.status === 'draft' ? 'neutral' : 'danger'}>
                  {translateStatus(job.status)}
                </Badge>
                <Badge variant="info">{getIndustryLabel(job.industry as Industry)}</Badge>
              </div>
              <h1 className="text-xl font-bold text-navy">{job.title}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" />{job.percentage}%</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{applications?.length || 0} søkere</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Kandidatliste */}
        <Card>
          <CardHeader
            title="Søkere"
            subtitle={`Rangert etter AI-score · ${applications?.length || 0} totalt`}
          />

          {!applications || applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Ingen søknader mottatt ennå</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">
                      Rang
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">
                      Kandidat
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">
                      Score
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 pr-4">
                      Søknadsdato
                    </th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app: Application, index: number) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-3 pr-4">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-50 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {app.candidates?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-navy text-sm">{app.candidates?.name}</p>
                            <p className="text-xs text-gray-400">{app.candidates?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {app.score != null ? (
                          <div className={`inline-flex items-center font-bold text-sm px-2.5 py-1 rounded-lg ${
                            app.score >= 80 ? 'bg-green-50 text-green-700' :
                            app.score >= 60 ? 'bg-yellow-50 text-yellow-700' :
                            app.score >= 40 ? 'bg-orange-50 text-orange-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                            {app.score}/100
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm">–</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={STATUS_VARIANT[app.status as ApplicationStatus] || 'neutral'}>
                          {translateStatus(app.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-500">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="py-3">
                        <Link href={`/dashboard/company/applications/${app.id}`}>
                          <button className="text-primary text-sm font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                            Se detaljer →
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
