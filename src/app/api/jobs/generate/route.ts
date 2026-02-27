import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJobDescription } from '@/lib/gemini/prompts'
import { getIndustryLabel } from '@/lib/utils'
import type { Industry } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await req.json()
    const { title, industry, percentage, location, requirements, keywords } = body

    if (!title || !industry || !percentage || !location) {
      return NextResponse.json({ error: 'Mangler påkrevde felt' }, { status: 400 })
    }

    // Hent bedriftsnavn
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('user_id', user.id)
      .single()

    const description = await generateJobDescription({
      title,
      industry: getIndustryLabel(industry as Industry),
      percentage: Number(percentage),
      location,
      requirements,
      keywords,
      companyName: company?.name,
    })

    return NextResponse.json({ description })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Feil ved generering av stillingsannonse:', msg)

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY er ikke konfigurert' }, { status: 500 })
    }
    return NextResponse.json({ error: `AI-generering feilet: ${msg}` }, { status: 500 })
  }
}
