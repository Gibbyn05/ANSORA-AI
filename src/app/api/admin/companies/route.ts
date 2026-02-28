import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  return !!adminEmail && !!email && email.toLowerCase() === adminEmail.toLowerCase()
}

// GET - Hent alle bedrifter (pending + godkjente)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: companies, error } = await admin
    .from('companies')
    .select('id, name, email, website, description, approved, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ companies })
}

// PATCH - Godkjenn eller avvis en bedrift
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 403 })
  }

  const body = await req.json()
  const { companyId, action } = body as { companyId: string; action: 'approve' | 'reject' }

  if (!companyId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (action === 'reject') {
    // Slett bedriften (og brukeren mister tilgang automatisk)
    const { error } = await admin.from('companies').delete().eq('id', companyId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'rejected' })
  }

  // Godkjenn
  const { data, error } = await admin
    .from('companies')
    .update({ approved: true })
    .eq('id', companyId)
    .select('id, name, email')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, action: 'approved', company: data })
}
