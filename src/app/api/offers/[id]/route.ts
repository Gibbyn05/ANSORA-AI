import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Hent tilbud (for kandidat)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('job_offers')
      .select(`
        *,
        applications (
          candidates (name, email),
          jobs (
            title, location, percentage,
            companies (name)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Tilbud ikke funnet' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil:', error)
    return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
  }
}

// PATCH - Oppdater tilbud (f.eks. avslå)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('job_offers')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil:', error)
    return NextResponse.json({ error: 'Feil ved oppdatering' }, { status: 500 })
  }
}
