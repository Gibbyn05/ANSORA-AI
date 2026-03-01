import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardHeader } from '@/components/ui/Card'
import { MessageThread } from '@/components/ui/MessageThread'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Message } from '@/types'

export default async function CandidateMessagesPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'candidate') {
    redirect('/auth/login')
  }

  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, name, profile_picture_url')
    .eq('user_id', user.id)
    .single()

  if (!candidate) redirect('/auth/login')

  // Verify this application belongs to the candidate
  const [{ data: application }, { data: messages }] = await Promise.all([
    supabase
      .from('applications')
      .select(`
        id,
        jobs (
          id, title,
          companies (name, logo)
        )
      `)
      .eq('id', applicationId)
      .eq('candidate_id', candidate.id)
      .single(),
    supabase
      .from('messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })
      .then((res: { data: unknown[] | null; error: unknown }) => res.error ? { data: [] } : res),
  ])

  if (!application) notFound()

  const job = application.jobs as { id: string; title: string; companies?: { name: string; logo?: string } } | null
  const company = job?.companies

  return (
    <div className="min-h-screen bg-[#06070E]">
      <Navbar userRole="candidate" userName={candidate.name} profilePictureUrl={candidate.profile_picture_url} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/candidate"
            className="inline-flex items-center gap-2 text-sm text-[#7a8a7d] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til dashboard
          </Link>

          {/* Company + job info */}
          <div className="flex items-center gap-3 mt-2">
            <div className="w-12 h-12 rounded-xl bg-[#1a2c24] border border-[#94A187]/25 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {company?.logo ? (
                <img src={company.logo} alt="" className="w-12 h-12 object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {company?.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{job?.title}</h1>
              <p className="text-sm text-[#7a8a7d]">{company?.name}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Meldinger"
            subtitle="Samtale med bedriften"
          />
          <MessageThread
            applicationId={applicationId}
            senderRole="candidate"
            initialMessages={(messages ?? []) as Message[]}
          />
        </Card>
      </div>
    </div>
  )
}
