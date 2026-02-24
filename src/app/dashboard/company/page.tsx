import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getIndustryLabel, translateStatus } from '@/lib/utils'
import {
  Briefcase, Users, Plus, BarChart3, Eye, ArrowRight,
  TrendingUp, Clock, CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import type { Industry, ApplicationStatus } from '@/types'

const STATUS_VARIANT: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'neutral',
  reviewing: 'info',
  interview: 'warning',
  reference_check: 'warning',
  offer_sent: 'default',
  hired: 'success',
  rejected: 'danger',
}

export default async function CompanyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'company') {
    redirect('/auth/login')
  }

  // Hent bedriftsinfo
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) redirect('/auth/register')

  // Hent stillinger
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const jobIds = jobs?.map((j) => j.id) || []

  // Hent søknader
  const { data: applications } = jobIds.length > 0
    ? await supabase
        .from('applications')
        .select(`
          *,
          candidates (id, name, email),
          jobs (id, title)
        `)
        .in('job_id', jobIds)
        .order('score', { ascending: false, nullsFirst: false })
    : { data: [] }

  const totalJobs = jobs?.length || 0
  const publishedJobs = jobs?.filter((j) => j.status === 'published').length || 0
  const totalApplications = applications?.length || 0
  const pendingApplications = applications?.filter((a) => a.status === 'pending').length || 0

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar
        userRole="company"
        userName={company.name}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy">Rekrutteringsdashboard</h1>
            <p className="text-gray-500 mt-1">Velkommen tilbake, {company.name}</p>
          </div>
          <Link href="/jobs/new">
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ny stilling</span>
            </button>
          </Link>
        </div>

        {/* Statistikk */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Briefcase,
              label: 'Aktive stillinger',
              value: publishedJobs,
              total: totalJobs,
              color: 'text-primary bg-primary/10',
              change: `${totalJobs} totalt`,
            },
            {
              icon: Users,
              label: 'Totale søkere',
              value: totalApplications,
              color: 'text-purple-600 bg-purple-50',
              change: `${pendingApplications} venter`,
            },
            {
              icon: BarChart3,
              label: 'Under vurdering',
              value: applications?.filter((a) => a.status === 'reviewing').length || 0,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              icon: CheckCircle2,
              label: 'Ansatt',
              value: applications?.filter((a) => a.status === 'hired').length || 0,
              color: 'text-green-600 bg-green-50',
            },
          ].map((stat) => (
            <Card key={stat.label} padding="md">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-navy">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              {stat.change && (
                <div className="text-xs text-gray-400 mt-1">{stat.change}</div>
              )}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stillingsliste */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader
                title="Mine stillinger"
                action={
                  <Link href="/jobs/new">
                    <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Ny
                    </button>
                  </Link>
                }
              />

              {!jobs || jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Ingen stillinger ennå</p>
                  <Link href="/jobs/new">
                    <button className="btn-primary mt-4 text-sm py-2 px-4">
                      Opprett første stilling
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => {
                    const jobApplications = applications?.filter((a) => a.job_id === job.id) || []
                    return (
                      <Link key={job.id} href={`/dashboard/company/jobs/${job.id}`}>
                        <div className="p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-navy text-sm truncate group-hover:text-primary transition-colors">
                                {job.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {getIndustryLabel(job.industry as Industry)} · {job.percentage}%
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={job.status === 'published' ? 'success' : job.status === 'draft' ? 'neutral' : 'danger'}
                            >
                              {translateStatus(job.status)}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {jobApplications.length} søker{jobApplications.length !== 1 ? 'e' : ''}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Siste søknader */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="Nylige søknader"
                subtitle="Rangert etter AI-score"
              />

              {!applications || applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Ingen søknader ennå</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Publiser en stilling for å begynne å motta søknader
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 8).map((app) => (
                    <Link key={app.id} href={`/dashboard/company/applications/${app.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">
                            {app.candidates?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy text-sm group-hover:text-primary transition-colors">
                            {app.candidates?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {app.jobs?.title}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {app.score !== null && (
                            <div className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                              app.score >= 80 ? 'bg-green-50 text-green-700' :
                              app.score >= 60 ? 'bg-yellow-50 text-yellow-700' :
                              app.score >= 40 ? 'bg-orange-50 text-orange-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {app.score}
                            </div>
                          )}
                          <Badge variant={STATUS_VARIANT[app.status as ApplicationStatus] || 'neutral'}>
                            {translateStatus(app.status)}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}

                  {applications.length > 8 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-400">
                        +{applications.length - 8} flere søknader
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
