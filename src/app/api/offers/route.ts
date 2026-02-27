import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOnboardingEmail } from '@/lib/openai/prompts'
import { sendEmail, createOfferEmailHtml, createOnboardingEmailHtml } from '@/lib/email/send'

// POST - Send jobbtilbud
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { applicationId, startDate, salary, benefits, message } = await req.json()

    // Hent søknad
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        candidates (name, email),
        jobs (title, companies (name))
      `)
      .eq('id', applicationId)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })
    }

    // Opprett tilbud
    const { data: offer, error: offerError } = await supabase
      .from('job_offers')
      .insert({
        application_id: applicationId,
        start_date: startDate,
        salary,
        benefits,
        message,
        status: 'pending',
      })
      .select()
      .single()

    if (offerError) throw offerError

    // Oppdater søknadsstatus
    await supabase
      .from('applications')
      .update({ status: 'offer_sent' })
      .eq('id', applicationId)

    // Send tilbud via e-post
    const offerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/offers/${offer.id}`

    await sendEmail({
      to: application.candidates.email,
      subject: `Jobbtilbud fra ${application.jobs.companies?.name || 'bedriften'}`,
      html: createOfferEmailHtml({
        candidateName: application.candidates.name,
        jobTitle: application.jobs.title,
        companyName: application.jobs.companies?.name || '',
        startDate: new Date(startDate).toLocaleDateString('nb-NO'),
        salary,
        offerUrl,
      }),
    })

    return NextResponse.json({ data: offer, message: 'Jobbtilbud sendt' })
  } catch (error) {
    console.error('Feil ved sending av jobbtilbud:', error)
    return NextResponse.json({ error: 'Feil ved sending av jobbtilbud' }, { status: 500 })
  }
}
