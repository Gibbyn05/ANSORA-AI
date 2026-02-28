import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Max 500 MB – intervjuopptak kan bli store
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

    const formData = await req.formData()
    const applicationId = formData.get('applicationId') as string
    const recordingFile = formData.get('recording') as File | null

    if (!applicationId || !recordingFile) {
      return NextResponse.json({ error: 'Mangler applicationId eller opptak' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Bekreft at søknaden tilhører denne brukeren
    const { data: candidate } = await admin
      .from('candidates')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!candidate) return NextResponse.json({ error: 'Ingen kandidat funnet' }, { status: 403 })

    const { data: application } = await admin
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('candidate_id', candidate.id)
      .single()

    if (!application) return NextResponse.json({ error: 'Søknad ikke funnet' }, { status: 403 })

    // Last opp til Supabase Storage
    const buffer = await recordingFile.arrayBuffer()
    const ext = recordingFile.name.split('.').pop() ?? 'webm'
    const path = `${applicationId}/interview.${ext}`

    const { error: uploadError } = await admin.storage
      .from('recordings')
      .upload(path, buffer, {
        contentType: recordingFile.type || 'video/webm',
        upsert: true,
      })

    if (uploadError) {
      console.error('Opplastingsfeil:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('recordings').getPublicUrl(path)

    // Lagre URL på søknaden
    await admin
      .from('applications')
      .update({ recording_url: publicUrl })
      .eq('id', applicationId)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Recording upload error:', err)
    return NextResponse.json({ error: 'Intern serverfeil' }, { status: 500 })
  }
}
