import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Badge } from '@/components/ui/Badge'
import { translateStatus, formatDate, getIndustryLabel } from '@/lib/utils'
import {
  FileText, CheckCircle2, Briefcase,
  ArrowRight, Bot, Award, MapPin, Zap, User, Pencil,
  Search, TrendingUp, MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import type { ApplicationStatus, Industry, JobOffer, Application, Candidate } from '@/types'

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
          <div className="min-h-screen bg-[#06070E] flex items-center justify-center p-6 text-center">
            <div className="max-w-sm">
              <p className="text-white font-semibold mb-2">Databaseoppsett mangler</p>
              <p className="text-[#94A187] text-sm mb-6">
                {isRlsRecursion
                  ? 'RLS-policyen på «candidates»-tabellen er rekursiv. Fiks policyen i Supabase SQL Editor og legg til SUPABASE_SERVICE_ROLE_KEY på Vercel.'
                  : 'Kandidatprofilen kunne ikke opprettes. Legg til SUPABASE_SERVICE_ROLE_KEY på Vercel og sjekk RLS-policies i Supabase.'}
              </p>
              <a
                href="/api/auth/signout"
                className="inline-block text-sm font-semibold text-white border border-[#94A187]/45 px-5 py-2.5 rounded-xl hover:bg-[#29524A]/20 transition-colors"
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

  const appIds = applications?.map((a: Application) => a.id) || []

  const [{ data: offers }, { data: unreadMessages }] = await Promise.all([
    supabase
      .from('job_offers')
      .select(`*, applications (jobs (title, companies (name)))`)
      .in('application_id', appIds)
      .eq('status', 'pending'),
    appIds.length > 0
      ? supabase
          .from('messages')
          .select('application_id')
          .in('application_id', appIds)
          .eq('sender_role', 'company')
          .is('read_at', null)
          .then((res) => res.error ? { data: [] } : res)
      : Promise.resolve({ data: [] }),
  ])

  // Build a map of applicationId → unread count
  const unreadByApp: Record<string, number> = {}
  for (const msg of unreadMessages ?? []) {
    const m = msg as { application_id: string }
    unreadByApp[m.application_id] = (unreadByApp[m.application_id] ?? 0) + 1
  }

  // Profilstyrke
  const cand = candidate as unknown as Candidate
  const profileFields = [cand.name, cand.bio, cand.profile_picture_url, cand.phone, cand.cv_url || cand.cv_text]
  const completionPct = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100)

  const totalApps = applications?.length || 0
  const activeApps = applications?.filter((a: Application) => !['rejected', 'hired'].includes(a.status)).length || 0
  const interviewApps = applications?.filter((a: Application) => a.status === 'interview').length || 0
  const hiredApps = applications?.filter((a: Application) => a.status === 'hired').length || 0

  return (
    <div className="min-h-screen bg-[#06070E]">
      <Navbar userRole="candidate" userName={candidate.name} profilePictureUrl={candidate.profile_picture_url} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#3a5248] mb-1">Hjem</p>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-white">Hei, {candidate.name} 👋</h1>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/candidate/profile">
                <button className="inline-flex items-center gap-2 border border-[#29524A]/30 hover:border-[#94A187]/45 hover:bg-[#29524A]/[0.08] text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Min profil</span>
                </button>
              </Link>
              <Link href="/jobs">
                <button className="inline-flex items-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Finn stillinger</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Profilkort ─────────────────────────────────────────────── */}
        <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-5 mb-8 flex items-center gap-5">
          <div className="flex-shrink-0">
            {candidate.profile_picture_url ? (
              <img
                src={candidate.profile_picture_url}
                alt="Profilbilde"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#94A187]/25"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#1a2c24] border-2 border-[#94A187]/25 flex items-center justify-center">
                <User className="w-7 h-7 text-[#3a5248]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{candidate.name}</p>
            <p className="text-sm text-[#4a6358] mt-0.5 truncate">
              {candidate.bio || 'Ingen bio ennå – legg til en kort presentasjon av deg selv'}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 max-w-[180px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#4a6358]">Profilstyrke</span>
                  <span className="text-[10px] font-semibold text-white">{completionPct}%</span>
                </div>
                <div className="w-full bg-[#29524A]/15 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${completionPct >= 80 ? 'bg-green-500' : completionPct >= 50 ? 'bg-[#C5AFA0]' : 'bg-orange-500'}`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
              {completionPct < 100 && (
                <Link href="/dashboard/candidate/profile">
                  <span className="text-xs text-[#94A187] hover:text-white transition-colors">
                    Fullfør profil →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Hurtighandlinger ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link href="/jobs">
            <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-5 hover:border-[#C5AFA0]/40 hover:bg-[#29524A]/[0.08] transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center mb-4 text-[#C5AFA0] bg-[#C5AFA0]/10 border-[#C5AFA0]/25">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">Finn stillinger</h3>
              <p className="text-xs text-[#4a6358]">Bla gjennom ledige jobber som passer deg</p>
            </div>
          </Link>
          <Link href="/dashboard/candidate/profile">
            <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-5 hover:border-blue-500/40 hover:bg-blue-900/[0.06] transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center mb-4 text-blue-400 bg-blue-900/20 border-blue-500/20">
                <User className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white mb-1 text-sm">Min profil</h3>
              <p className="text-xs text-[#4a6358]">Oppdater CV, bio og kontaktinfo</p>
            </div>
          </Link>
          <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center mb-4 text-orange-400 bg-orange-900/20 border-orange-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white mb-1 text-sm">Aktivitet</h3>
            <p className="text-xs text-[#4a6358]">
              {totalApps > 0
                ? `${totalApps} søknad${totalApps !== 1 ? 'er' : ''} sendt totalt`
                : 'Ingen søknader ennå'}
            </p>
          </div>
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
                    <p className="text-sm text-[#94A187] mt-0.5">
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
            { icon: FileText, label: 'Totale søknader', value: totalApps, iconClass: 'text-white bg-[#29524A]/20 border-[#94A187]/35' },
            { icon: Briefcase, label: 'Aktive', value: activeApps, iconClass: 'text-blue-400 bg-blue-900/20 border-blue-500/20' },
            { icon: Bot, label: 'AI-intervju', value: interviewApps, iconClass: 'text-orange-400 bg-orange-900/20 border-orange-500/20' },
            { icon: CheckCircle2, label: 'Ansatt', value: hiredApps, iconClass: 'text-green-400 bg-green-900/20 border-green-500/20' },
          ].map((stat, i) => (
            <div key={stat.label} className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${stat.iconClass}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-[#94A187]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Application cards ─────────────────────────────────────── */}
        <div className="bg-[#0e1c17] border border-[#29524A]/25 rounded-2xl overflow-hidden animate-slide-up anim-delay-400">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#29524A]/25">
            <div>
              <p className="font-semibold text-white text-sm">Søknadshistorikk</p>
              <p className="text-[11px] text-[#3a5248] mt-0.5">{totalApps} søknad{totalApps !== 1 ? 'er' : ''}</p>
            </div>
            <Link href="/jobs">
              <button className="text-xs text-white hover:underline">
                Finn stillinger →
              </button>
            </Link>
          </div>

          {!applications || applications.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-2xl bg-[#29524A]/[0.08] border border-[#29524A]/25 flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-7 h-7 text-[#2a3e36]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ingen søknader ennå</h3>
              <p className="text-[#4a6358] text-sm mb-7 max-w-sm mx-auto">
                Finn en stilling du er interessert i og send din første søknad med AI-intervju
              </p>
              <Link href="/jobs">
                <button className="inline-flex items-center gap-2 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold px-6 py-3 rounded-xl transition-all text-sm">
                  Se ledige stillinger
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#29524A]/20">
              {applications.map((app: Application) => {
                const step = STATUS_STEP[app.status as ApplicationStatus] ?? 0
                const isRejected = app.status === 'rejected'
                const isHired = app.status === 'hired'

                return (
                  <div key={app.id} className="px-6 py-5 hover:bg-[#C5AFA0]/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      {/* Left: Company + Job info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#1a2c24] border border-[#94A187]/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {app.jobs?.companies?.logo ? (
                            <img src={app.jobs.companies.logo} alt="" className="w-10 h-10 object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {app.jobs?.companies?.name?.charAt(0).toUpperCase() ?? '?'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{app.jobs?.title}</p>
                          <div className="flex items-center gap-2 text-xs text-[#4a6358] mt-0.5">
                            <span>{app.jobs?.companies?.name}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {app.jobs?.location}
                            </span>
                            <span>·</span>
                            <span>{app.jobs?.percentage}%</span>
                          </div>
                          <p className="text-[11px] text-[#2a3e36] mt-1">Søkt {formatDate(app.created_at)}</p>
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
                            app.score >= 60 ? 'bg-[#29524A]/20 text-white' :
                            'bg-[#29524A]/12 text-[#94A187]'
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
                                  ? isHired ? 'bg-green-500' : 'bg-[#C5AFA0]'
                                  : 'bg-[#29524A]/15'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1.5">
                          {['Sendt', 'Vurderes', 'Intervju', 'Referanse', 'Tilbud', 'Ansatt'].map((label, i) => (
                            <span key={label} className={`text-[10px] ${i + 1 <= step ? 'text-white' : 'text-[#2a3e36]'}`}>
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
                          <button className="inline-flex items-center gap-1.5 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors">
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
                          <button className="inline-flex items-center gap-1.5 bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors">
                            Se jobbtilbud
                          </button>
                        </Link>
                      )}
                      <Link href={`/dashboard/candidate/messages/${app.id}`}>
                        <button className="relative inline-flex items-center gap-1.5 text-xs text-[#94A187] hover:text-white border border-[#29524A]/30 hover:border-[#94A187]/40 py-2 px-3 rounded-lg hover:bg-[#29524A]/10 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Meldinger
                          {(unreadByApp[app.id] ?? 0) > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C5AFA0] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                              {unreadByApp[app.id]}
                            </span>
                          )}
                        </button>
                      </Link>
                      <Link href={`/jobs/${app.job_id}`}>
                        <button className="text-xs text-[#4a6358] hover:text-white flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-[#29524A]/10 transition-colors">
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
