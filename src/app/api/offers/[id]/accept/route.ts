import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOnboardingEmail } from '@/lib/openai/prompts'
import { sendEmail, createOnboardingEmailHtml } from '@/lib/email/send'

// POST - Aksepter jobbtilbud
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Hent tilbud
    const { data: offer } = await supabase
      .from('job_offers')
      .select(`
        *,
        applications (
          id,
          candidates (name, email, language),
          jobs (title, companies (name))
        )
      `)
      .eq('id', id)
      .single()

    if (!offer) {
      return NextResponse.json({ error: 'Tilbud ikke funnet' }, { status: 404 })
    }

    // Oppdater tilbud
    const { data: updatedOffer, error } = await supabase
      .from('job_offers')
      .update({
        status: 'accepted',
        signed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Oppdater søknadsstatus til ansatt
    await supabase
      .from('applications')
      .update({ status: 'hired' })
      .eq('id', offer.applications.id)

    // Generer og send onboarding-e-post
    const candidateName = offer.applications.candidates.name
    const jobTitle = offer.applications.jobs.title
    const companyName = offer.applications.jobs.companies?.name || ''
    const startDate = new Date(offer.start_date).toLocaleDateString('nb-NO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const onboardingBody = await generateOnboardingEmail({
      candidateName,
      jobTitle,
      companyName,
      startDate,
    })

    await sendEmail({
      to: offer.applications.candidates.email,
      subject: `Velkommen til ${companyName}! 🎉`,
      html: createOnboardingEmailHtml({
        candidateName,
        jobTitle,
        companyName,
        startDate,
        emailBody: onboardingBody,
      }),
    })

    return NextResponse.json({
      data: updatedOffer,
      message: 'Tilbud akseptert! Velkommen om bord!',
    })
  } catch (error) {
    console.error('Feil ved aksept av tilbud:', error)
    return NextResponse.json({ error: 'Feil ved aksept av tilbud' }, { status: 500 })
  }
}
