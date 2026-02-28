import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runInterviewTurn, summarizeInterview, analyzeCandidate } from '@/lib/openai/prompts'
import type { InterviewMessage } from '@/types'

// GET - Hent søknad med kamerainnstilling for intervjuet
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

  const applicationId = req.nextUrl.searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'applicationId påkrevd' }, { status: 400 })

  const { data: application, error } = await supabase
    .from('applications')
    .select('id, interview_completed, status, jobs(camera_required)')
    .eq('id', applicationId)
    .single()

  if (error || !application) return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })

  return NextResponse.json({
    camera_required: (application.jobs as { camera_required?: string })?.camera_required ?? 'optional',
    interview_completed: application.interview_completed,
    status: application.status,
  })
}

// POST - Send intervjumelding og motta AI-svar
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { applicationId, message } = await req.json()

    // Hent søknad med all relevant info
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        candidates (id, name, email, cv_text, language),
        jobs (*)
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 404 })
    }

    const currentTranscript: InterviewMessage[] = application.interview_transcript || []
    const isFirstMessage = currentTranscript.length === 0

    // Legg til brukermelding (om ikke første kall)
    let updatedTranscript = [...currentTranscript]
    if (message && !isFirstMessage) {
      updatedTranscript.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      })
    }

    // Sjekk om intervjuet er ferdig (maks 8 runder)
    const userMessages = updatedTranscript.filter((m) => m.role === 'user')
    const isCompleted = userMessages.length >= 7

    let aiResponse = ''

    if (!isCompleted) {
      // Kjør AI-intervjutur
      aiResponse = await runInterviewTurn({
        job: application.jobs,
        candidate: application.candidates,
        cvText: application.candidates.cv_text || '',
        conversationHistory: updatedTranscript,
        language: application.candidates.language,
      })

      // Legg til AI-svar i transskript
      updatedTranscript.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      })
    }

    // Oppdater intervjudata
    const updateData: Record<string, unknown> = {
      interview_transcript: updatedTranscript,
      status: isCompleted ? 'interview' : application.status,
    }

    if (isCompleted) {
      // Generer oppsummering og oppdater analyse
      const summary = await summarizeInterview({
        job: application.jobs,
        transcript: updatedTranscript,
      })

      const updatedAnalysis = await analyzeCandidate({
        job: application.jobs,
        candidate: application.candidates,
        cvText: application.candidates.cv_text || '',
        followUpAnswers: application.follow_up_answers || {},
        interviewTranscript: updatedTranscript,
      })

      updateData.interview_summary = summary
      updateData.interview_completed = true
      updateData.ai_analysis = updatedAnalysis
    }

    const { data: updated, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      message: aiResponse,
      transcript: updatedTranscript,
      isCompleted,
      application: updated,
    })

  } catch (error) {
    console.error('Feil i intervjurute:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Feil ved intervjugjennomføring: ${message}` }, { status: 500 })
  }
}
