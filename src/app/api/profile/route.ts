import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate, error } = await admin
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !candidate) return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 404 })
  return NextResponse.json({ candidate })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })

  const admin = createAdminClient()

  const { data: candidate } = await admin
    .from('candidates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!candidate) return NextResponse.json({ error: 'Kandidatprofil ikke funnet' }, { status: 404 })

  const contentType = req.headers.get('content-type') || ''

  // Multipart: profile picture or CV upload
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const profilePicture = formData.get('profile_picture') as File | null
    const cvFile = formData.get('cv') as File | null
    const updates: Record<string, string> = {}

    if (profilePicture) {
      const buffer = await profilePicture.arrayBuffer()
      const ext = profilePicture.name.split('.').pop() || 'jpg'
      const path = `${candidate.id}/avatar.${ext}`

      const { error: uploadErr } = await admin.storage
        .from('avatars')
        .upload(path, buffer, { contentType: profilePicture.type, upsert: true })

      if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

      const { data: urlData } = admin.storage.from('avatars').getPublicUrl(path)
      updates.profile_picture_url = urlData.publicUrl
    }

    if (cvFile) {
      const cvBuffer = await cvFile.arrayBuffer()
      const cvPath = `${candidate.id}/cv.pdf`

      const { error: cvUploadErr } = await admin.storage
        .from('cvs')
        .upload(cvPath, cvBuffer, { contentType: 'application/pdf', upsert: true })

      if (cvUploadErr) return NextResponse.json({ error: cvUploadErr.message }, { status: 500 })

      const { data: { publicUrl } } = admin.storage.from('cvs').getPublicUrl(cvPath)
      updates.cv_url = publicUrl

      // Parse CV text
      try {
        const pdfParse = require('pdf-parse')
        const pdfData = await pdfParse(Buffer.from(cvBuffer))
        updates.cv_text = pdfData.text
      } catch {
        // Non-fatal
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Ingen fil lastet opp' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('candidates')
      .update(updates)
      .eq('id', candidate.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ candidate: data })
  }

  // JSON: text field updates
  const body = await req.json()
  const allowed = ['name', 'phone', 'bio', 'skills', 'linkedin_url']
  const updates: Record<string, string> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Ingen felter å oppdatere' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('candidates')
    .update(updates)
    .eq('id', candidate.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidate: data })
}
