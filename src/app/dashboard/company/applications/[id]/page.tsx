import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { translateStatus, formatDate } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, UserCheck, Send, FileText, Bot } from 'lucide-react'
import Link from 'next/link'
import type { ApplicationStatus, AIAnalysis, InterviewMessage, Reference } from '@/types'
import { ApplicationActions } from './ApplicationActions'

const STATUS_VARIANT: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'neutral',
  reviewing: 'info',
  interview: 'warning',
  reference_check: 'warning',
  offer_sent: 'default',
  hired: 'success',
  rejected: 'danger',
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ anon?: string }>
}) {
  const { id } = await params
  const { anon } = await searchParams
  const isAnonymous = anon === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'company') {
    redirect('/auth/login')
  }

  const { data: application } = await supabase
    .from('applications')
    .select(`
      *,
      candidates (id, name, email, cv_url, cv_text, language, phone),
      jobs (
        id, title, description, industry, percentage, location,
        companies (id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (!application) notFound()

  // Hent referanser
  const { data: references } = await supabase
    .from('job_references')
    .select('*')
    .eq('application_id', id)

  // Hent jobbtilbud
  const { data: offer } = await supabase
    .from('job_offers')
    .select('*')
    .eq('application_id', id)
    .single()

  const analysis = application.ai_analysis as AIAnalysis | null
  const transcript = application.interview_transcript as InterviewMessage[] | null
  const followUpAnswers = application.follow_up_answers as Record<string, string> | null

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar userRole="company" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/dashboard/company/jobs/${application.jobs?.id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy">
            <ArrowLeft className="w-4 h-4" />
            Tilbake til stilling
          </Link>

          {/* Anonymisert visning toggle */}
          <Link
            href={`/dashboard/company/applications/${id}?anon=${!isAnonymous}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              isAnonymous
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isAnonymous ? '🔒 Anonymisert visning' : '👤 Bytt til anonym'}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Venstre kolonne */}
          <div className="space-y-5">
            {/* Kandidatprofil */}
            <Card>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-xl">
                    {isAnonymous ? '?' : application.candidates?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isAnonymous ? (
                  <div>
                    <p className="font-semibold text-navy">Anonymisert kandidat</p>
                    <p className="text-xs text-gray-400 mt-1">Personinfo skjult</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-navy">{application.candidates?.name}</p>
                    <p className="text-sm text-gray-500">{application.candidates?.email}</p>
                    {application.candidates?.phone && (
                      <p className="text-sm text-gray-500">{application.candidates?.phone}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Stilling</span>
                  <span className="font-medium text-navy text-right">{application.jobs?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge variant={STATUS_VARIANT[application.status as ApplicationStatus] || 'neutral'}>
                    {translateStatus(application.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Søknadsdato</span>
                  <span className="font-medium text-navy">{formatDate(application.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Språk</span>
                  <span className="font-medium text-navy">{application.candidates?.language || 'Norsk'}</span>
                </div>
              </div>

              {/* Score */}
              {application.score !== null && (
                <div className={`mt-4 p-4 rounded-xl text-center ${
                  application.score >= 80 ? 'bg-green-50' :
                  application.score >= 60 ? 'bg-yellow-50' :
                  application.score >= 40 ? 'bg-orange-50' :
                  'bg-red-50'
                }`}>
                  <div className={`text-4xl font-bold ${
                    application.score >= 80 ? 'text-green-600' :
                    application.score >= 60 ? 'text-yellow-600' :
                    application.score >= 40 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {application.score}
                    <span className="text-lg font-normal">/100</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">AI-score</p>
                </div>
              )}

              {/* CV-lenke */}
              {!isAnonymous && application.candidates?.cv_url && (
                <a
                  href={application.candidates.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  Last ned CV
                </a>
              )}
            </Card>

            {/* Handlinger */}
            <ApplicationActions
              applicationId={id}
              currentStatus={application.status as ApplicationStatus}
              jobTitle={application.jobs?.title || ''}
              hasOffer={!!offer}
              hasReferences={!!(references && references.length > 0)}
            />
          </div>

          {/* Høyre kolonne */}
          <div className="lg:col-span-2 space-y-5">
            {/* AI-analyse */}
            {analysis && (
              <Card>
                <CardHeader
                  title="AI-kandidatanalyse"
                  subtitle="Generert av Ansora AI"
                />

                <div className="space-y-5">
                  {/* Oppsummering */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Oppsummering</p>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Styrker */}
                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Styrker</p>
                      <ul className="space-y-2">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Områder å utforske */}
                  {analysis.areasToExplore && analysis.areasToExplore.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bør utforskes videre</p>
                      <ul className="space-y-2">
                        {analysis.areasToExplore.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Foreslåtte spørsmål */}
                  {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Foreslåtte intervjuspørsmål</p>
                      <ul className="space-y-2">
                        {analysis.suggestedQuestions.map((q, i) => (
                          <li key={i} className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-navy">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Røde flagg */}
                  {analysis.redFlags && analysis.redFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Røde flagg</p>
                      <ul className="space-y-2">
                        {analysis.redFlags.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Oppfølgingsspørsmål og svar */}
            {followUpAnswers && Object.keys(followUpAnswers).length > 0 && (
              <Card>
                <CardHeader title="Oppfølgingsspørsmål og svar" />
                <div className="space-y-4">
                  {Object.entries(followUpAnswers).map(([question, answer], i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-navy mb-1">{question}</p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                        {answer || <span className="text-gray-400 italic">Ikke besvart</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Intervjutransskript */}
            {transcript && transcript.length > 0 && (
              <Card>
                <CardHeader
                  title="AI-Intervju transskript"
                  subtitle={application.interview_completed ? 'Fullført' : 'Pågår'}
                />

                {application.interview_summary && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> AI-oppsummering
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {application.interview_summary}
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {transcript.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        msg.role === 'assistant' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {msg.role === 'assistant' ? 'AI' : 'K'}
                      </div>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-gray-50 text-gray-700'
                          : 'bg-primary/10 text-navy'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Referanser */}
            {references && references.length > 0 && (
              <Card>
                <CardHeader title="Referanser" />
                <div className="space-y-4">
                  {references.map((ref: Reference) => (
                    <div key={ref.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-navy text-sm">{ref.referee_name}</p>
                          <p className="text-xs text-gray-500">{ref.referee_email}</p>
                        </div>
                        <Badge variant={ref.response ? 'success' : 'neutral'}>
                          {ref.response ? 'Besvart' : 'Venter'}
                        </Badge>
                      </div>

                      {ref.response && (
                        <div className="mt-3 space-y-2 text-sm">
                          {Object.entries(ref.response).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-gray-400 capitalize">{key}:</span>
                              <span className="text-gray-700">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Jobbtilbud */}
            {offer && (
              <Card>
                <CardHeader title="Sendt jobbtilbud" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Startdato</span>
                    <span className="font-medium">{new Date(offer.start_date).toLocaleDateString('nb-NO')}</span>
                  </div>
                  {offer.salary && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lønn</span>
                      <span className="font-medium">{offer.salary}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tilbudsstatus</span>
                    <Badge variant={offer.status === 'accepted' ? 'success' : offer.status === 'declined' ? 'danger' : 'neutral'}>
                      {offer.status === 'accepted' ? 'Akseptert' : offer.status === 'declined' ? 'Avslått' : 'Venter svar'}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
