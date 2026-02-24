import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Hent alle publiserte stillinger (eller alle for innlogget bedrift)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry')
    const companyOnly = searchParams.get('company') === 'true'

    let query = supabase
      .from('jobs')
      .select(`
        *,
        companies (id, name, logo)
      `)
      .order('created_at', { ascending: false })

    if (companyOnly && user) {
      // Bedriftens egne stillinger
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (company) {
        query = query.eq('company_id', company.id)
      }
    } else {
      query = query.eq('status', 'published')
    }

    if (industry) {
      query = query.eq('industry', industry)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Feil ved henting av stillinger:', error)
    return NextResponse.json({ error: 'Feil ved henting av stillinger' }, { status: 500 })
  }
}

// POST - Opprett ny stilling
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Ingen bedriftsprofil funnet' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, industry, percentage, location, requirements, status } = body

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        company_id: company.id,
        title,
        description,
        industry,
        percentage: Number(percentage),
        location,
        requirements,
        status: status || 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Feil ved opprettelse av stilling:', error)
    return NextResponse.json({ error: 'Feil ved opprettelse av stilling' }, { status: 500 })
  }
}
