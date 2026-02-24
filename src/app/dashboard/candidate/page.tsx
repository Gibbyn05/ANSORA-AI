import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { translateStatus, formatDate, getIndustryLabel } from '@/lib/utils'
import {
  FileText, MessageSquare, CheckCircle2, Briefcase,
  ArrowRight, Upload, Bot, Award
} from 'lucide-react'
import Link from 'next/link'
import type { ApplicationStatus, Industry, JobOffer, Application } from '@/types'

const STATUS_VARIANT: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'neutral',
  reviewing: 'info',
  interview: 'warning',
  reference_check: 'warning',
  offer_sent: 'default',
  hired: 'success',
  rejected: 'danger',
}

export default async function CandidateDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'candidate') {
    redirect('/auth/login')
  }

  // Hent kandidatprofil
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!candidate) redirect('/auth/register')

  // Hent søknader
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (
        id, title, location, percentage, industry, status,
        companies (name, logo)
      )
    `)
    .eq('candidate_id', candidate.id)
    .order('created_at', { ascending: false })

  // Hent jobbtilbud
  const { data: offers } = await supabase
    .from('job_offers')
    .select(`
      *,
      applications (
        jobs (title, companies (name))
      )
    `)
    .in(
      'application_id',
      applications?.map((a: Application) => a.id) || []
    )
    .eq('status', 'pending')

  const totalApps = applications?.length || 0
  const activeApps = applications?.filter((a: Application) => !['rejected', 'hired'].includes(a.status)).length || 0
  const interviewApps = applications?.filter((a: Application) => a.status === 'interview').length || 0
  const hiredApps = applications?.filter((a: Application) => a.status === 'hired').length || 0

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar
        userRole="candidate"
        userName={candidate.name}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy">Mine søknader</h1>
          <p className="text-gray-500 mt-1">Hei, {candidate.name}!</p>
        </div>

        {/* Ventende tilbud */}
        {offers && offers.length > 0 && (
          <div className="mb-6">
            {offers.map((offer: JobOffer & {
              applications?: { jobs?: { title?: string; companies?: { name?: string } } }
            }) => (
              <div key={offer.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-navy">Du har mottatt et jobbtilbud!</p>
                    <p className="text-sm text-gray-600">
                      {offer.applications?.jobs?.title} hos {offer.applications?.jobs?.companies?.name}
                    </p>
                  </div>
                </div>
                <Link href={`/offers/${offer.id}`}>
                  <button className="btn-primary text-sm whitespace-nowrap">
                    Se tilbud
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Statistikk */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Totale søknader', value: totalApps, color: 'text-primary bg-primary/10' },
            { icon: Briefcase, label: 'Aktive', value: activeApps, color: 'text-blue-600 bg-blue-50' },
            { icon: Bot, label: 'Intervju', value: interviewApps, color: 'text-orange-600 bg-orange-50' },
            { icon: CheckCircle2, label: 'Ansatt', value: hiredApps, color: 'text-green-600 bg-green-50' },
          ].map((stat) => (
            <Card key={stat.label} padding="md">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-navy">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Søknadsliste */}
        <Card>
          <CardHeader
            title="Søknadshistorikk"
            action={
              <Link href="/jobs">
                <button className="text-primary text-sm font-semibold hover:underline">
                  Finn stillinger →
                </button>
              </Link>
            }
          />

          {!applications || applications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">Ingen søknader ennå</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Finn en stilling du er interessert i og send din første søknad
              </p>
              <Link href="/jobs">
                <button className="btn-primary">
                  Se ledige stillinger
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-navy">{app.jobs?.title}</p>
                        <p className="text-sm text-gray-500">
                          {app.jobs?.companies?.name} · {app.jobs?.location} · {app.jobs?.percentage}%
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Søkt {formatDate(app.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={STATUS_VARIANT[app.status as ApplicationStatus] || 'neutral'}>
                        {translateStatus(app.status)}
                      </Badge>
                      {app.score !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          app.score >= 80 ? 'bg-green-100 text-green-700' :
                          app.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          Score: {app.score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Handlingslenker */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
                    {app.status === 'interview' && !app.interview_completed && (
                      <Link href={`/interview/${app.id}`}>
                        <button className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          Start AI-intervju
                        </button>
                      </Link>
                    )}
                    {app.status === 'interview' && app.interview_completed && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Intervju fullført
                      </span>
                    )}
                    {app.status === 'offer_sent' && (
                      <Link href={`/offers`}>
                        <button className="btn-primary text-xs py-1.5 px-3">
                          Se jobbtilbud
                        </button>
                      </Link>
                    )}
                    <Link href={`/jobs/${app.job_id}`}>
                      <button className="text-xs text-gray-500 hover:text-primary flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                        Se stilling
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
