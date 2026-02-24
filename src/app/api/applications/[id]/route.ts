import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreCandidate, analyzeCandidate } from '@/lib/gemini/prompts'
import { generateRejectionEmail } from '@/lib/gemini/prompts'
import { sendEmail, createRejectionEmailHtml } from '@/lib/email/send'

// GET - Hent en søknad
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidates (id, name, email, cv_url, cv_text, language, phone),
        jobs (
          id, title, description, industry, percentage, location,
          companies (id, name, logo)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil:', error)
    return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
  }
}

// PATCH - Oppdater søknad (status, score, analyse, svar)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await req.json()
    const { action, ...updateData } = body

    // Spesielle handlinger
    if (action === 'submit_answers') {
      // Kandidat sender inn svar på oppfølgingsspørsmål
      const { data: application } = await supabase
        .from('applications')
        .select(`
          *,
          candidates (id, name, email, cv_text, language),
          jobs (*)
        `)
        .eq('id', id)
        .single()

      if (!application) {
        return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })
      }

      // Score kandidaten
      const { score, reasoning } = await scoreCandidate({
        job: application.jobs,
        candidate: application.candidates,
        cvText: application.candidates.cv_text || '',
        followUpAnswers: body.answers,
      })

      // Analyser kandidaten
      const aiAnalysis = await analyzeCandidate({
        job: application.jobs,
        candidate: application.candidates,
        cvText: application.candidates.cv_text || '',
        followUpAnswers: body.answers,
      })

      const { data, error } = await supabase
        .from('applications')
        .update({
          follow_up_answers: body.answers,
          score,
          scoring_reasoning: reasoning,
          ai_analysis: aiAnalysis,
          status: 'reviewing',
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data, score, aiAnalysis })
    }

    if (action === 'reject') {
      // Rekrutterer avslår kandidat og sender e-post
      const { data: application } = await supabase
        .from('applications')
        .select(`
          *,
          candidates (name, email, language),
          jobs (title, companies (name))
        `)
        .eq('id', id)
        .single()

      if (!application) {
        return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })
      }

      // Generer personlig avslag
      const rejectionBody = await generateRejectionEmail({
        candidateName: application.candidates.name,
        jobTitle: application.jobs.title,
        companyName: application.jobs.companies?.name || '',
        language: application.candidates.language,
      })

      // Send e-post
      await sendEmail({
        to: application.candidates.email,
        subject: `Ang. din søknad på ${application.jobs.title}`,
        html: createRejectionEmailHtml({
          candidateName: application.candidates.name,
          jobTitle: application.jobs.title,
          companyName: application.jobs.companies?.name || '',
          emailBody: rejectionBody,
        }),
      })

      const { data, error } = await supabase
        .from('applications')
        .update({ status: 'rejected', rejection_sent: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ data, message: 'Avslag sendt' })
    }

    // Standard oppdatering
    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil ved oppdatering av søknad:', error)
    return NextResponse.json({ error: 'Feil ved oppdatering' }, { status: 500 })
  }
}
