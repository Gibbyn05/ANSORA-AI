import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Badge } from '@/components/ui/Badge'
import { getIndustryLabel, translateStatus } from '@/lib/utils'
import {
  Briefcase, Users, Plus, BarChart3, ArrowRight,
  CheckCircle2, Brain, TrendingUp, Clock, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import type { Industry, ApplicationStatus, Job, Application } from '@/types'

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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) redirect('/auth/login')

  let { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!company) {
    const name = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'Bedrift'

    // Try with the user's own session first (works when RLS allows INSERT for own user_id)
    const { data: created } = await supabase
      .from('companies')
      .insert({ user_id: user.id, name, email: user.email ?? '' })
      .select('*')
      .single()

    if (created) {
      company = created
    } else {
      // Fall back to the admin client (service role key bypasses RLS)
      const admin = createAdminClient()
      const { data: adminCreated } = await admin
        .from('companies')
        .insert({ user_id: user.id, name, email: user.email ?? '' })
        .select('*')
        .single()

      if (adminCreated) {
        company = adminCreated
      } else {
        // IMPORTANT: do NOT redirect('/auth/login') here — the middleware will
        // redirect the logged-in user straight back to /dashboard, creating an
        // infinite redirect loop (ERR_TOO_MANY_REDIRECTS).
        // Show an error page instead.
        return (
          <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-white font-semibold mb-2">Kunne ikke opprette bedriftsprofil</p>
              <p className="text-[#888] text-sm mb-6">
                Det kan skyldes en databasefeil eller manglende tilgang. Logg ut og inn igjen.
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

  // Bedriften venter på godkjenning
  if (!company.approved) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar userRole="company" userName={company.name} />
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 bg-[#d7fe03]/10 border border-[#d7fe03]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-[#d7fe03]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Kontoen din er til godkjenning</h1>
            <p className="text-[#888] text-sm leading-relaxed mb-8">
              Vi bekrefter at <span className="text-white font-medium">{company.name}</span> er en reell virksomhet før kontoen aktiveres.
              Du vil få e-post til <span className="text-white font-medium">{company.email}</span> når vi har behandlet forespørselen din.
            </p>
            <div className="bg-[#111] border border-white/[0.07] rounded-xl p-5 text-left mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-3">Hva skjer nå?</p>
              <ul className="space-y-2 text-sm text-[#888]">
                <li className="flex items-start gap-2"><span className="text-[#d7fe03] mt-0.5">1.</span> Ansora-teamet ser over forespørselen din</li>
                <li className="flex items-start gap-2"><span className="text-[#d7fe03] mt-0.5">2.</span> Du mottar e-post med bekreftelse</li>
                <li className="flex items-start gap-2"><span className="text-[#d7fe03] mt-0.5">3.</span> Etter godkjenning kan du poste stillinger og se søkere</li>
              </ul>
            </div>
            <a
              href="/api/auth/signout"
              className="text-sm text-[#555] hover:text-white transition-colors"
            >
              Logg ut
            </a>
          </div>
        </div>
      </div>
    )
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const jobIds = jobs?.map((j: Job) => j.id) || []

  const { data: applications } = jobIds.length > 0
    ? await supabase
        .from('applications')
        .select(`*, candidates (id, name, email), jobs (id, title)`)
        .in('job_id', jobIds)
        .order('score', { ascending: false, nullsFirst: false })
    : { data: [] }

  const totalJobs = jobs?.length || 0
  const publishedJobs = jobs?.filter((j: Job) => j.status === 'published').length || 0
  const totalApplications = applications?.length || 0
  const pendingApplications = applications?.filter((a: Application) => a.status === 'pending').length || 0
  const reviewingApplications = applications?.filter((a: Application) => a.status === 'reviewing').length || 0
  const hiredApplications = applications?.filter((a: Application) => a.status === 'hired').length || 0

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userRole="company" userName={company.name} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-1">Rekrutteringsdashboard</p>
            <h1 className="text-2xl font-bold text-white">Hei, {company.name} 👋</h1>
          </div>
          <Link href="/jobs/new">
            <button className="inline-flex items-center gap-2 bg-[#d7fe03] hover:bg-[#c8ef00] text-black font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ny stilling</span>
            </button>
          </Link>
        </div>

        {/* ── Stats row (Visuo 4-stat pattern) ──────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: Briefcase,
              label: 'Aktive stillinger',
              value: publishedJobs,
              sub: `${totalJobs} totalt`,
              iconClass: 'text-[#d7fe03] bg-[#d7fe03]/10 border-[#d7fe03]/20',
            },
            {
              icon: Users,
              label: 'Totale søkere',
              value: totalApplications,
              sub: `${pendingApplications} venter svar`,
              iconClass: 'text-purple-400 bg-purple-900/20 border-purple-500/20',
            },
            {
              icon: BarChart3,
              label: 'Under vurdering',
              value: reviewingApplications,
              sub: 'AI-analysert',
              iconClass: 'text-blue-400 bg-blue-900/20 border-blue-500/20',
            },
            {
              icon: CheckCircle2,
              label: 'Ansatt',
              value: hiredApplications,
              sub: 'via Ansora',
              iconClass: 'text-green-400 bg-green-900/20 border-green-500/20',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111111] border border-white/[0.07] rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${stat.iconClass}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-[#888]">{stat.label}</div>
              <div className="text-xs text-[#444] mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main content grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Job list (1/3) */}
          <div className="bg-[#111111] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <p className="font-semibold text-white text-sm">Mine stillinger</p>
                <p className="text-[11px] text-[#444] mt-0.5">{totalJobs} stilling{totalJobs !== 1 ? 'er' : ''}</p>
              </div>
              <Link href="/jobs/new">
                <button className="text-xs text-[#d7fe03] border border-[#d7fe03]/20 hover:bg-[#d7fe03]/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Ny
                </button>
              </Link>
            </div>

            {!jobs || jobs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-5 h-5 text-[#333]" />
                </div>
                <p className="text-[#666] text-sm mb-4">Ingen stillinger ennå</p>
                <Link href="/jobs/new">
                  <button className="text-sm text-[#d7fe03] border border-[#d7fe03]/20 hover:bg-[#d7fe03]/5 px-4 py-2 rounded-xl transition-colors">
                    Opprett første stilling
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {jobs.map((job: Job) => {
                  const jobApplications = applications?.filter((a: Application) => a.job_id === job.id) || []
                  return (
                    <Link key={job.id} href={`/dashboard/company/jobs/${job.id}`}>
                      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate group-hover:text-[#d7fe03] transition-colors">
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              job.status === 'published' ? 'bg-green-900/30 text-green-400' :
                              job.status === 'draft' ? 'bg-white/5 text-[#555]' :
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {translateStatus(job.status)}
                            </span>
                            <span className="text-[11px] text-[#444]">
                              {jobApplications.length} søk{jobApplications.length !== 1 ? 'ere' : 'er'}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#d7fe03] transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Applications table (2/3, Visuo numbered list) */}
          <div className="lg:col-span-2 bg-[#111111] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <p className="font-semibold text-white text-sm">Søkere rangert etter AI-score</p>
                <p className="text-[11px] text-[#444] mt-0.5">{totalApplications} totalt</p>
              </div>
              {totalApplications > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[#555]">
                  <Brain className="w-3.5 h-3.5 text-[#d7fe03]" />
                  AI-sortert
                </div>
              )}
            </div>

            {!applications || applications.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-5 h-5 text-[#333]" />
                </div>
                <p className="text-[#666] font-medium mb-1">Ingen søknader ennå</p>
                <p className="text-sm text-[#444]">
                  Publiser en stilling for å begynne å motta søknader
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {/* Table header */}
                <div className="grid grid-cols-[28px_1fr_120px_80px_80px] gap-3 px-6 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#333]">#</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#333]">Kandidat</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#333]">Stilling</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#333] text-center">Score</span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#333] text-right">Status</span>
                </div>

                {applications.slice(0, 10).map((app: Application, idx: number) => (
                  <Link key={app.id} href={`/dashboard/company/applications/${app.id}`}>
                    <div className="grid grid-cols-[28px_1fr_120px_80px_80px] gap-3 items-center px-6 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                      <span className="text-xs font-bold text-[#333]">{idx + 1}</span>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#d7fe03]">
                            {app.candidates?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-[#d7fe03] transition-colors truncate">
                          {app.candidates?.name}
                        </span>
                      </div>

                      <span className="text-xs text-[#555] truncate">{app.jobs?.title}</span>

                      <div className="text-center">
                        {app.score != null ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            app.score >= 80 ? 'bg-green-900/40 text-green-400' :
                            app.score >= 60 ? 'bg-[#d7fe03]/10 text-[#d7fe03]' :
                            app.score >= 40 ? 'bg-orange-900/30 text-orange-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {app.score}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#333]">—</span>
                        )}
                      </div>

                      <div className="text-right">
                        <Badge variant={STATUS_VARIANT[app.status as ApplicationStatus] || 'neutral'}>
                          {translateStatus(app.status)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}

                {applications.length > 10 && (
                  <div className="px-6 py-3.5 text-center">
                    <p className="text-xs text-[#444]">+{applications.length - 10} flere søknader</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
