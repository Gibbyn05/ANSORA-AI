import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { translateStatus, formatDate } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, UserCheck, Send, FileText, Bot, User } from 'lucide-react'
import Link from 'next/link'
import type { ApplicationStatus, AIAnalysis, InterviewMessage, Reference, Message } from '@/types'
import { ApplicationActions } from './ApplicationActions'
import { MessageThread } from '@/components/ui/MessageThread'

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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user || user.user_metadata?.role !== 'company') {
    redirect('/auth/login')
  }

  const { data: application } = await supabase
    .from('applications')
    .select(`
      *,
      candidates (id, name, email, cv_url, cv_text, language, phone, profile_picture_url),
      jobs (
        id, title, description, industry, percentage, location,
        companies (id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (!application) notFound()

  // Hvis kandidat mangler e-post, hent fra auth og oppdater raden
  const candidate = application.candidates as { id: string; name: string | null; email: string | null; user_id?: string; cv_url?: string; cv_text?: string; language?: string; phone?: string | null; profile_picture_url?: string | null } | null
  if (candidate && !candidate.email) {
    try {
      const admin = createAdminClient()
      // Hent user_id fra candidates-tabellen
      const { data: candidateRow } = await admin
        .from('candidates')
        .select('user_id')
        .eq('id', candidate.id)
        .single()
      if (candidateRow?.user_id) {
        const { data: authUser } = await admin.auth.admin.getUserById(candidateRow.user_id)
        if (authUser?.user?.email) {
          await admin.from('candidates').update({ email: authUser.user.email }).eq('id', candidate.id)
          ;(application.candidates as typeof candidate).email = authUser.user.email
        }
      }
    } catch (_) { /* ikke-fatal */ }
  }

  // Hent referanser, jobbtilbud og meldinger parallelt
  const [{ data: references }, { data: offer }, { data: messages }] = await Promise.all([
    supabase.from('job_references').select('*').eq('application_id', id),
    supabase.from('job_offers').select('*').eq('application_id', id).single(),
    supabase.from('messages').select('*').eq('application_id', id).order('created_at', { ascending: true })
      .then((res: { data: unknown[] | null; error: unknown }) => res.error ? { data: [] } : res),
  ])

  const analysis = application.ai_analysis as AIAnalysis | null
  const transcript = application.interview_transcript as InterviewMessage[] | null
  const followUpAnswers = application.follow_up_answers as Record<string, string> | null

  return (
    <div className="min-h-screen bg-[#06070E]">
      <Navbar userRole="company" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/dashboard/company/jobs/${application.jobs?.id}`} className="inline-flex items-center gap-2 text-sm text-[#7a8a7d] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tilbake til stilling
          </Link>

          {/* Anonymisert visning toggle */}
          <Link
            href={`/dashboard/company/applications/${id}?anon=${!isAnonymous}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              isAnonymous
                ? 'bg-orange-900/30 text-orange-400'
                : 'bg-[#29524A]/15 text-[#94A187] hover:bg-[#29524A]/20'
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
                <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden bg-[#29524A]/20 flex items-center justify-center">
                  {isAnonymous ? (
                    <span className="text-white font-bold text-xl">?</span>
                  ) : application.candidates?.profile_picture_url ? (
                    <img
                      src={application.candidates.profile_picture_url}
                      alt={application.candidates.name || application.candidates.email}
                      className="w-16 h-16 object-cover"
                    />
                  ) : application.candidates?.name ? (
                    <span className="text-white font-bold text-xl">
                      {application.candidates.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-8 h-8 text-[#94A187]" />
                  )}
                </div>
                {isAnonymous ? (
                  <div>
                    <p className="font-semibold text-white">Anonymisert kandidat</p>
                    <p className="text-xs text-[#7a8a7d] mt-1">Personinfo skjult</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-white">
                      {application.candidates?.name || application.candidates?.email || 'Ukjent kandidat'}
                    </p>
                    {application.candidates?.name && (
                      <p className="text-sm text-[#94A187]">{application.candidates?.email}</p>
                    )}
                    {application.candidates?.phone && (
                      <p className="text-sm text-[#94A187]">{application.candidates?.phone}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7a8a7d]">Stilling</span>
                  <span className="font-medium text-white text-right">{application.jobs?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a8a7d]">Status</span>
                  <Badge variant={STATUS_VARIANT[application.status as ApplicationStatus] || 'neutral'}>
                    {translateStatus(application.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a8a7d]">Søknadsdato</span>
                  <span className="font-medium text-white">{formatDate(application.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a8a7d]">Språk</span>
                  <span className="font-medium text-white">{application.candidates?.language || 'Norsk'}</span>
                </div>
              </div>

              {/* Score */}
              {application.score != null && (
                <div className={`mt-4 p-4 rounded-xl text-center ${
                  application.score >= 80 ? 'bg-green-900/30' :
                  application.score >= 60 ? 'bg-yellow-900/30' :
                  application.score >= 40 ? 'bg-orange-900/30' :
                  'bg-red-900/30'
                }`}>
                  <div className={`text-4xl font-bold ${
                    application.score >= 80 ? 'text-green-400' :
                    application.score >= 60 ? 'text-yellow-400' :
                    application.score >= 40 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {application.score}
                    <span className="text-lg font-normal">/100</span>
                  </div>
                  <p className="text-xs text-[#7a8a7d] mt-1">AI-score</p>
                </div>
              )}

              {/* CV-lenke */}
              {!isAnonymous && application.candidates?.cv_url && (
                <a
                  href={application.candidates.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-white hover:underline"
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
                    <p className="text-xs font-semibold text-[#4a6358] uppercase tracking-wide mb-2">Oppsummering</p>
                    <p className="text-sm text-[#C5AFA0] leading-relaxed bg-[#29524A]/15 rounded-xl p-4">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Styrker */}
                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#4a6358] uppercase tracking-wide mb-2">Styrker</p>
                      <ul className="space-y-2">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[#C5AFA0]">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Områder å utforske */}
                  {analysis.areasToExplore && analysis.areasToExplore.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#4a6358] uppercase tracking-wide mb-2">Bør utforskes videre</p>
                      <ul className="space-y-2">
                        {analysis.areasToExplore.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[#C5AFA0]">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Foreslåtte spørsmål */}
                  {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#4a6358] uppercase tracking-wide mb-2">Foreslåtte intervjuspørsmål</p>
                      <ul className="space-y-2">
                        {analysis.suggestedQuestions.map((q, i) => (
                          <li key={i} className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-white">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Røde flagg */}
                  {analysis.redFlags && analysis.redFlags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#4a6358] uppercase tracking-wide mb-2">Røde flagg</p>
                      <ul className="space-y-2">
                        {analysis.redFlags.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-[#C5AFA0]">{f}</span>
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
                      <p className="text-sm font-semibold text-white mb-1">{question}</p>
                      <p className="text-sm text-[#94A187] bg-[#29524A]/15 rounded-xl px-4 py-3">
                        {answer || <span className="text-[#4a6358] italic">Ikke besvart</span>}
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
                  <div className="bg-[#29524A]/15 border border-[#94A187]/35 rounded-xl p-4 mb-5">
                    <p className="text-xs font-semibold text-white uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> AI-oppsummering
                    </p>
                    <p className="text-sm text-[#C5AFA0] leading-relaxed">
                      {application.interview_summary}
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {transcript.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        msg.role === 'assistant' ? 'bg-[#C5AFA0] text-black' : 'bg-[#29524A]/20 text-[#94A187]'
                      }`}>
                        {msg.role === 'assistant' ? 'AI' : 'K'}
                      </div>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-[#1a2c24] border border-[#94A187]/25 text-[#C5AFA0]'
                          : 'bg-[#29524A]/20 text-white'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Intervjuopptak */}
            {!isAnonymous && application.recording_url && (
              <Card>
                <CardHeader
                  title="Intervjuopptak"
                  subtitle="Spill av hele intervjuet"
                />
                <video
                  src={application.recording_url}
                  controls
                  className="w-full rounded-xl bg-black"
                  style={{ maxHeight: '360px' }}
                />
              </Card>
            )}

            {/* Meldinger */}
            <Card>
              <CardHeader
                title="Meldinger"
                subtitle="Ta kontakt med kandidaten direkte"
              />
              <MessageThread
                applicationId={id}
                senderRole="company"
                initialMessages={(messages ?? []) as Message[]}
              />
            </Card>

            {/* Referanser */}
            {references && references.length > 0 && (
              <Card>
                <CardHeader title="Referanser" />
                <div className="space-y-4">
                  {references.map((ref: Reference) => (
                    <div key={ref.id} className="border border-[#94A187]/25 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white text-sm">{ref.referee_name}</p>
                          <p className="text-xs text-[#94A187]">{ref.referee_email}</p>
                        </div>
                        <Badge variant={ref.response ? 'success' : 'neutral'}>
                          {ref.response ? 'Besvart' : 'Venter'}
                        </Badge>
                      </div>

                      {ref.response && (
                        <div className="mt-3 space-y-2 text-sm">
                          {Object.entries(ref.response).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-[#7a8a7d] capitalize">{key}:</span>
                              <span className="text-[#C5AFA0]">{String(value)}</span>
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
                    <span className="text-[#7a8a7d]">Startdato</span>
                    <span className="font-medium text-white">{new Date(offer.start_date).toLocaleDateString('nb-NO')}</span>
                  </div>
                  {offer.salary && (
                    <div className="flex justify-between">
                      <span className="text-[#7a8a7d]">Lønn</span>
                      <span className="font-medium text-white">{offer.salary}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#7a8a7d]">Tilbudsstatus</span>
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
