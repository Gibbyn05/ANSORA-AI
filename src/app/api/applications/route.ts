import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFollowUpQuestions, scoreCandidate, analyzeCandidate, detectLanguage } from '@/lib/gemini/prompts'

// POST - Send inn søknad med CV
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const formData = await req.formData()
    const jobId = formData.get('jobId') as string
    const cvFile = formData.get('cv') as File
    const coverLetter = formData.get('coverLetter') as string | null

    if (!jobId || !cvFile) {
      return NextResponse.json({ error: 'Mangler stilling-ID eller CV' }, { status: 400 })
    }

    // Hent kandidatprofil
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!candidate) {
      return NextResponse.json({ error: 'Ingen kandidatprofil funnet' }, { status: 403 })
    }

    // Sjekk om kandidaten allerede har søkt
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidate.id)
      .single()

    if (existingApp) {
      return NextResponse.json({ error: 'Du har allerede søkt på denne stillingen' }, { status: 409 })
    }

    // Last opp CV til Supabase Storage
    const cvBuffer = await cvFile.arrayBuffer()
    const cvPath = `${candidate.id}/${jobId}/cv.pdf`

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(cvPath, cvBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('CV-opplastingsfeil:', uploadError)
      return NextResponse.json({ error: 'Feil ved opplasting av CV' }, { status: 500 })
    }

    const { data: { publicUrl: cvUrl } } = supabase.storage.from('cvs').getPublicUrl(cvPath)

    // Parse CV-tekst med pdf-parse (server-side)
    let cvText = ''
    try {
      const pdfParseModule = await import('pdf-parse')
      const pdfParse = pdfParseModule.default ?? pdfParseModule
      const pdfData = await pdfParse(Buffer.from(cvBuffer))
      cvText = pdfData.text
    } catch (pdfError) {
      console.error('PDF-parsefeil:', pdfError)
      cvText = 'CV-tekst kunne ikke ekstraheres'
    }

    // Detekter språk
    const language = await detectLanguage(cvText || coverLetter || '')

    // Oppdater kandidatprofil med CV
    await supabase
      .from('candidates')
      .update({ cv_url: cvUrl, cv_text: cvText, language })
      .eq('id', candidate.id)

    // Hent stillingsinformasjon
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Stilling ikke funnet' }, { status: 404 })
    }

    // Generer oppfølgingsspørsmål basert på CV og stilling
    const followUpQuestions = await generateFollowUpQuestions({
      job,
      cvText,
      language,
    })

    // Opprett søknad
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: candidate.id,
        status: 'pending',
        follow_up_questions: followUpQuestions,
        cover_letter: coverLetter,
      })
      .select()
      .single()

    if (appError) throw appError

    return NextResponse.json({
      data: application,
      followUpQuestions,
    }, { status: 201 })

  } catch (error) {
    console.error('Feil ved innsending av søknad:', error)
    return NextResponse.json({ error: 'Feil ved innsending av søknad' }, { status: 500 })
  }
}

// GET - Hent søknader
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const role = user.user_metadata?.role

    if (role === 'candidate') {
      // Kandidat ser sine egne søknader
      const { data: candidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (id, title, location, percentage, status, companies (name, logo))
        `)
        .eq('candidate_id', candidate?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ data })
    } else {
      // Rekrutterer ser søknader for sine stillinger
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let query = supabase
        .from('applications')
        .select(`
          *,
          candidates (id, name, email, cv_url, language),
          jobs (id, title, company_id)
        `)
        .order('score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (jobId) {
        query = query.eq('job_id', jobId)
      } else {
        // Hent alle søknader for bedriftens stillinger
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', company?.id)

        const jobIds = jobs?.map((j) => j.id) || []
        if (jobIds.length > 0) {
          query = query.in('job_id', jobIds)
        }
      }

      const { data, error } = await query

      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('Feil ved henting av søknader:', error)
    return NextResponse.json({ error: 'Feil ved henting av søknader' }, { status: 500 })
  }
}
