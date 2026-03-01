import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/ui/Navbar'
import { JobsClient } from './JobsClient'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; search?: string }>
}) {
  const { industry, search } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const userRole = user?.user_metadata?.role as 'company' | 'candidate' | null

  let userName = user?.user_metadata?.name as string | undefined
  let profilePictureUrl: string | null = null

  const profilePromise = user
    ? userRole === 'candidate'
      ? supabase.from('candidates').select('name, profile_picture_url').eq('user_id', user.id).single()
      : userRole === 'company'
      ? supabase.from('companies').select('name').eq('user_id', user.id).single()
      : Promise.resolve({ data: null })
    : Promise.resolve({ data: null })

  const jobsQuery = supabase
    .from('jobs')
    .select(`*, companies (id, name, logo)`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const [{ data: jobs }, { data: profileData }] = await Promise.all([jobsQuery, profilePromise])

  if (profileData) {
    const p = profileData as { name?: string; profile_picture_url?: string }
    if (p.name) userName = p.name
    if (p.profile_picture_url) profilePictureUrl = p.profile_picture_url
  }

  return (
    <div className="min-h-screen bg-[#06070E]">
      <Navbar userRole={userRole} userName={userName} profilePictureUrl={profilePictureUrl} />

      {/* Hero */}
      <section className="pt-16 pb-10 border-b border-[#29524A]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight tracking-tight">
            Ledige stillinger
          </h1>
          <p className="text-[#7a8a7d] text-lg">
            Finn din neste karrieremulighet blant{' '}
            <span className="text-white">{jobs?.length ?? 0} aktive stillinger</span>
          </p>
        </div>
      </section>

      {/* Client component handles filtering, sorting, preview, map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobsClient
          jobs={(jobs ?? []) as Parameters<typeof JobsClient>[0]['jobs']}
          initialSearch={search ?? ''}
          initialIndustry={industry ?? ''}
          userRole={userRole}
        />
      </div>
    </div>
  )
}
