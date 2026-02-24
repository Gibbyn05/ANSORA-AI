import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, createReferenceEmailHtml } from '@/lib/email/send'

// POST - Send referanseforespørsel
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { applicationId, refereeName, refereeEmail } = await req.json()

    // Hent søknad
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        candidates (name),
        jobs (title, companies (name))
      `)
      .eq('id', applicationId)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })
    }

    // Opprett referanse i databasen
    const { data: reference, error: refError } = await supabase
      .from('references')
      .insert({
        application_id: applicationId,
        referee_name: refereeName,
        referee_email: refereeEmail,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (refError) throw refError

    // Send e-post til referanse
    const formUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reference/${reference.id}`

    await sendEmail({
      to: refereeEmail,
      subject: `Referanseforespørsel for ${application.candidates.name}`,
      html: createReferenceEmailHtml({
        refereeName,
        candidateName: application.candidates.name,
        jobTitle: application.jobs.title,
        companyName: application.jobs.companies?.name || '',
        formUrl,
      }),
    })

    // Oppdater søknadsstatus
    await supabase
      .from('applications')
      .update({ status: 'reference_check' })
      .eq('id', applicationId)

    return NextResponse.json({ data: reference, message: 'Referanseforespørsel sendt' })
  } catch (error) {
    console.error('Feil ved sending av referanseforespørsel:', error)
    return NextResponse.json({ error: 'Feil ved sending av referanseforespørsel' }, { status: 500 })
  }
}
