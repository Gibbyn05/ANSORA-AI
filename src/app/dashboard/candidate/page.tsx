import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Badge } from '@/components/ui/Badge'
import { translateStatus, formatDate, getIndustryLabel } from '@/lib/utils'
import {
  FileText, MessageSquare, CheckCircle2, Briefcase,
  ArrowRight, Bot, Award, Building2, MapPin, Zap,
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

const STATUS_STEP: Record<ApplicationStatus, number> = {
  pending: 1,
  reviewing: 2,
  interview: 3,
  reference_check: 4,
  offer_sent: 5,
  hired: 6,
  rejected: 0,
}

export default async function CandidateDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) redirect('/auth/login')

  let { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!candidate) {
    const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'Kandidat'

    // 'language' is NOT NULL in the schema — must be provided or insert fails
    const newCandidate = { user_id: user.id, name, email: user.email ?? '', language: 'no' }

    // Try with the user's own session first
    const { data: created, error: e1 } = await supabase
      .from('candidates')
      .insert(newCandidate)
      .select('*')
      .single()

    if (created) {
      candidate = created
    } else {
      // Fall back to admin client
      const admin = createAdminClient()
      const { data: adminCreated, error: e2 } = await admin
        .from('candidates')
        .insert(newCandidate)
        .select('*')
        .single()

      if (adminCreated) {
        candidate = adminCreated
      } else {
        // IMPORTANT: do NOT redirect('/auth/login') here — the middleware will
        // redirect the logged-in user straight back to /dashboard, creating an
        // infinite redirect loop (ERR_TOO_MANY_REDIRECTS).
        //
        // Root causes identified from debug output:
        // 1. RLS policy on candidates has infinite recursion (code 42P17)
        //    → fix by dropping & recreating policies in Supabase SQL Editor
        // 2. SUPABASE_SERVICE_ROLE_KEY not set on Vercel → add it
        const isRlsRecursion = (e1 as { code?: string } | null)?.code === '42P17'
        return (
          <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
            <div className="max-w-sm">
              <p className="text-white font-semibold mb-2">Databaseoppsett mangler</p>
              <p className="text-[#888] text-sm mb-6">
                {isRlsRecursion
                  ? 'RLS-policyen på «candidates»-tabellen er rekursiv. Fiks policyen i Supabase SQL Editor og legg til SUPABASE_SERVICE_ROLE_KEY på Vercel.'
                  : 'Kandidatprofilen kunne ikke opprettes. Legg til SUPABASE_SERVICE_ROLE_KEY på Vercel og sjekk RLS-policies i Supabase.'}
              </p>
              <a
                href="/api/auth/signout"
                className="inline-block text-sm font-semibold text-[#d7fe03] border border-[#d7fe03]/30 px-5 py-2.5 rounded-xl hover:bg-[#d7fe03]/10 transition-colors"
              >
                Logg ut
              </a>
            </div>
          </div>
        )
      }
    }
  }

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

  const { data: offers } = await supabase
    .from('job_offers')
    .select(`*, applications (jobs (title, companies (name)))`)
    .in('application_id', applications?.map((a: Application) => a.id) || [])
    .eq('status', 'pending')

  const totalApps = applications?.length || 0
  const activeApps = applications?.filter((a: Application) => !['rejected', 'hired'].includes(a.status)).length || 0
  const interviewApps = applications?.filter((a: Application) => a.status === 'interview').length || 0
  const hiredApps = applications?.filter((a: Application) => a.status === 'hired').length || 0

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userRole="candidate" userName={candidate.name} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-1">Mine søknader</p>
            <h1 className="text-2xl font-bold text-white">Hei, {candidate.name} 👋</h1>
          </div>
          <Link href="/jobs">
            <button className="inline-flex items-center gap-2 border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.03] text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Finn stillinger</span>
            </button>
          </Link>
        </div>

        {/* ── Pending offer alert ───────────────────────────────────── */}
        {offers && offers.length > 0 && (
          <div className="mb-8">
            {offers.map((offer: JobOffer & {
              applications?: { jobs?: { title?: string; companies?: { name?: string } } }
            }) => (
              <div key={offer.id} className="bg-green-900/10 border-2 border-green-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-900/30 rounded-xl border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Du har mottatt et jobbtilbud!</p>
                    <p className="text-sm text-[#999] mt-0.5">
                      {offer.applications?.jobs?.title} hos {offer.applications?.jobs?.companies?.name}
                    </p>
                  </div>
                </div>
                <Link href={`/offers/${offer.id}`}>
                  <button className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm flex-shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                    Se tilbud
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats row (Visuo pattern) ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: FileText, label: 'Totale søknader', value: totalApps, iconClass: 'text-[#d7fe03] bg-[#d7fe03]/10 border-[#d7fe03]/20' },
            { icon: Briefcase, label: 'Aktive', value: activeApps, iconClass: 'text-blue-400 bg-blue-900/20 border-blue-500/20' },
            { icon: Bot, label: 'AI-intervju', value: interviewApps, iconClass: 'text-orange-400 bg-orange-900/20 border-orange-500/20' },
            { icon: CheckCircle2, label: 'Ansatt', value: hiredApps, iconClass: 'text-green-400 bg-green-900/20 border-green-500/20' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111111] border border-white/[0.07] rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${stat.iconClass}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-[#888]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Application cards ─────────────────────────────────────── */}
        <div className="bg-[#111111] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div>
              <p className="font-semibold text-white text-sm">Søknadshistorikk</p>
              <p className="text-[11px] text-[#444] mt-0.5">{totalApps} søknad{totalApps !== 1 ? 'er' : ''}</p>
            </div>
            <Link href="/jobs">
              <button className="text-xs text-[#d7fe03] hover:underline">
                Finn stillinger →
              </button>
            </Link>
          </div>

          {!applications || applications.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-7 h-7 text-[#333]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ingen søknader ennå</h3>
              <p className="text-[#555] text-sm mb-7 max-w-sm mx-auto">
                Finn en stilling du er interessert i og send din første søknad med AI-intervju
              </p>
              <Link href="/jobs">
                <button className="inline-flex items-center gap-2 bg-[#d7fe03] hover:bg-[#c8ef00] text-black font-semibold px-6 py-3 rounded-xl transition-all text-sm">
                  Se ledige stillinger
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {applications.map((app: Application) => {
                const step = STATUS_STEP[app.status as ApplicationStatus] ?? 0
                const isRejected = app.status === 'rejected'
                const isHired = app.status === 'hired'

                return (
                  <div key={app.id} className="px-6 py-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Left: Company + Job info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-[#444]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{app.jobs?.title}</p>
                          <div className="flex items-center gap-2 text-xs text-[#555] mt-0.5">
                            <span>{app.jobs?.companies?.name}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {app.jobs?.location}
                            </span>
                            <span>·</span>
                            <span>{app.jobs?.percentage}%</span>
                          </div>
                          <p className="text-[11px] text-[#333] mt-1">Søkt {formatDate(app.created_at)}</p>
                        </div>
                      </div>

                      {/* Right: Score + Status */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge variant={STATUS_VARIANT[app.status as ApplicationStatus] || 'neutral'}>
                          {translateStatus(app.status)}
                        </Badge>
                        {app.score != null && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            app.score >= 80 ? 'bg-green-900/40 text-green-400' :
                            app.score >= 60 ? 'bg-[#d7fe03]/10 text-[#d7fe03]' :
                            'bg-white/[0.05] text-[#888]'
                          }`}>
                            Score: {app.score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar (Sasslo-inspired) */}
                    {!isRejected && (
                      <div className="mb-4">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((s) => (
                            <div
                              key={s}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                s <= step
                                  ? isHired ? 'bg-green-500' : 'bg-[#d7fe03]'
                                  : 'bg-white/[0.06]'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1.5">
                          {['Sendt', 'Vurderes', 'Intervju', 'Referanse', 'Tilbud', 'Ansatt'].map((label, i) => (
                            <span key={label} className={`text-[10px] ${i + 1 <= step ? 'text-[#d7fe03]' : 'text-[#333]'}`}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="mb-4 px-3 py-2 bg-red-900/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400">Søknaden ble ikke videreført denne gang.</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {app.status === 'interview' && !app.interview_completed && (
                        <Link href={`/interview/${app.id}`}>
                          <button className="inline-flex items-center gap-1.5 bg-[#d7fe03] hover:bg-[#c8ef00] text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors">
                            <Bot className="w-3.5 h-3.5" />
                            Start AI-intervju
                          </button>
                        </Link>
                      )}
                      {app.status === 'interview' && app.interview_completed && (
                        <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium bg-green-900/20 px-3 py-2 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Intervju fullført
                        </span>
                      )}
                      {app.status === 'offer_sent' && (
                        <Link href={`/offers`}>
                          <button className="inline-flex items-center gap-1.5 bg-[#d7fe03] hover:bg-[#c8ef00] text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors">
                            Se jobbtilbud
                          </button>
                        </Link>
                      )}
                      <Link href={`/jobs/${app.job_id}`}>
                        <button className="text-xs text-[#555] hover:text-[#d7fe03] flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
                          Se stilling
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
