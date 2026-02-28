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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userRole="company" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/company" className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-white mb-6 transition-colors">
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
              <h1 className="text-xl font-bold text-white">{job.title}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#999]">
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
              <Users className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-[#999]">Ingen søknader mottatt ennå</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wide py-3 pr-4">
                      Rang
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wide py-3 pr-4">
                      Kandidat
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wide py-3 pr-4">
                      Score
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wide py-3 pr-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wide py-3 pr-4">
                      Søknadsdato
                    </th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map((app: Application, index: number) => (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 pr-4">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-900/40 text-yellow-400' :
                          index === 1 ? 'bg-white/10 text-[#999]' :
                          index === 2 ? 'bg-orange-900/30 text-orange-400' :
                          'bg-white/5 text-[#666]'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {app.candidates?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{app.candidates?.name}</p>
                            <p className="text-xs text-[#666]">{app.candidates?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {app.score != null ? (
                          <div className={`inline-flex items-center font-bold text-sm px-2.5 py-1 rounded-lg ${
                            app.score >= 80 ? 'bg-green-900/40 text-green-400' :
                            app.score >= 60 ? 'bg-yellow-900/40 text-yellow-400' :
                            app.score >= 40 ? 'bg-orange-900/40 text-orange-400' :
                            'bg-red-900/40 text-red-400'
                          }`}>
                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                            {app.score}/100
                          </div>
                        ) : (
                          <span className="text-[#444] text-sm">–</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={STATUS_VARIANT[app.status as ApplicationStatus] || 'neutral'}>
                          {translateStatus(app.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-sm text-[#999]">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="py-3">
                        <Link href={`/dashboard/company/applications/${app.id}`}>
                          <button className="text-white text-sm font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
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
