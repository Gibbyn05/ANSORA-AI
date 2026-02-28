import { NextRequest, NextResponse } from 'next/server'

const BRREG_BASE = 'https://data.brreg.no/enhetsregisteret/api/enheter'

interface BrregEnhet {
  organisasjonsnummer: string
  navn: string
  organisasjonsform?: { beskrivelse: string }
  forretningsadresse?: {
    adresse?: string[]
    postnummer?: string
    poststed?: string
  }
  telefon?: string
  mobil?: string
  hjemmeside?: string
  naeringskode1?: { kode: string; beskrivelse: string }
  antallAnsatte?: number
  stiftelsesdato?: string
  slettedato?: string
}

export interface BrregResult {
  orgnr: string
  name: string
  orgForm: string
  address: string
  city: string
  phone: string
  website: string
  industry: string
  employees: number
}

function formatCompany(e: BrregEnhet): BrregResult {
  const addr = e.forretningsadresse
  const streetLine = addr?.adresse?.[0] ?? ''
  const zip = addr?.postnummer ?? ''
  const city = addr?.poststed ?? ''
  const cityLine = zip && city ? `${zip} ${city}` : city || zip
  const fullAddress = [streetLine, cityLine].filter(Boolean).join(', ')

  return {
    orgnr: e.organisasjonsnummer,
    name: e.navn,
    orgForm: e.organisasjonsform?.beskrivelse ?? '',
    address: fullAddress,
    city,
    phone: e.telefon ?? e.mobil ?? '',
    website: e.hjemmeside ?? '',
    industry: e.naeringskode1?.beskrivelse ?? '',
    employees: e.antallAnsatte ?? 0,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim()
  const orgnr = searchParams.get('orgnr')?.replace(/\s/g, '')

  if (!name && !orgnr) {
    return NextResponse.json({ error: 'name eller orgnr påkrevd' }, { status: 400 })
  }

  try {
    if (orgnr) {
      const res = await fetch(`${BRREG_BASE}/${orgnr}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return NextResponse.json({ results: [] })
      const data: BrregEnhet = await res.json()
      if (data.slettedato) return NextResponse.json({ results: [] })
      return NextResponse.json({ results: [formatCompany(data)] })
    }

    // Søk på navn
    const url = `${BRREG_BASE}?navn=${encodeURIComponent(name!)}&size=8`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return NextResponse.json({ results: [] })
    const data = await res.json()
    const enheter: BrregEnhet[] = data._embedded?.enheter ?? []
    // Filtrer ut slettede enheter
    const active = enheter.filter((e) => !e.slettedato)
    return NextResponse.json({ results: active.map(formatCompany) })
  } catch {
    return NextResponse.json({ error: 'Kunne ikke hente bedriftsinfo' }, { status: 500 })
  }
}
