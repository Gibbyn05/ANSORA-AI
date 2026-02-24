import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Hent referanseskjema (for referanseperson)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('job_references')
      .select(`
        id,
        referee_name,
        referee_email,
        response,
        responded_at,
        application_id,
        applications (
          candidates (name),
          jobs (title, companies (name))
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Referanse ikke funnet' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil:', error)
    return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
  }
}

// PATCH - Send inn referansesvar
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const response = await req.json()

    const { data, error } = await supabase
      .from('job_references')
      .update({
        response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, message: 'Referansesvar mottatt. Tusen takk!' })
  } catch (error) {
    console.error('Feil ved innsending av referansesvar:', error)
    return NextResponse.json({ error: 'Feil ved innsending' }, { status: 500 })
  }
}
