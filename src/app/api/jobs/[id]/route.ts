import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Hent en spesifikk stilling
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (id, name, logo, website, description)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Stilling ikke funnet' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil ved henting av stilling:', error)
    return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
  }
}

// PATCH - Oppdater stilling
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

    const { data, error } = await supabase
      .from('jobs')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil ved oppdatering av stilling:', error)
    return NextResponse.json({ error: 'Feil ved oppdatering' }, { status: 500 })
  }
}

// DELETE - Slett stilling
export async function DELETE(
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

    const { error } = await supabase.from('jobs').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Stilling slettet' })
  } catch (error) {
    console.error('Feil ved sletting av stilling:', error)
    return NextResponse.json({ error: 'Feil ved sletting' }, { status: 500 })
  }
}
