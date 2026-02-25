import type { Job, Candidate, AIAnalysis, InterviewMessage } from '@/types'
import { genAI } from './client'

// ===== STILLINGSANNONSE GENERATOR =====
export async function generateJobDescription(params: {
  title: string
  industry: string
  percentage: number
  location: string
  requirements: string
  keywords?: string
  companyName?: string
}): Promise<string> {
  const prompt = `Du er en profesjonell rekrutteringskonsulent. Skriv en engasjerende og profesjonell stillingsannonse på norsk basert på følgende informasjon:

Stillingstittel: ${params.title}
Bransje: ${params.industry}
Stillingsprosent: ${params.percentage}%
Arbeidssted: ${params.location}
Krav og kvalifikasjoner: ${params.requirements}
${params.keywords ? `Stikkord: ${params.keywords}` : ''}
${params.companyName ? `Bedrift: ${params.companyName}` : ''}

Annonsen skal:
- Starte med en kort, fengende ingress (2-3 setninger)
- Ha en seksjon "Om stillingen" med konkrete arbeidsoppgaver
- Ha en seksjon "Vi søker deg som" med klare krav og ønskede egenskaper
- Ha en seksjon "Vi tilbyr" med attraktive fordeler
- Avslutte med en oppfordring til å søke
- Være profesjonell, inkluderende og tillitsvekkende
- Ikke inneholde diskriminerende språk
- Være mellom 300-500 ord`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.7 },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ===== OPPFØLGINGSSPØRSMÅL GENERATOR =====
export async function generateFollowUpQuestions(params: {
  job: Job
  cvText: string
  language?: string
}): Promise<string[]> {
  const lang = params.language || 'norsk'

  const prompt = `Du er en erfaren rekrutterer. Analyser denne CV-en mot stillingsbeskrivelsen og generer 3-5 spesifikke oppfølgingsspørsmål på ${lang}.

Stillingstittel: ${params.job.title}
Stillingsbeskrivelse: ${params.job.description}
Stillingsprosent: ${params.job.percentage}%

Kandidatens CV:
${params.cvText}

Generer spørsmål som:
- Er spesifikke for kandidatens bakgrunn vs stillingens krav
- Adresserer eventuelle gap eller uklarheter (f.eks. om kandidaten er student og stillingen er 100%)
- Er åpne og inviterende, ikke konfronterende
- Avdekker motivasjon og egnethet

Svar kun med en JSON-array av spørsmål, ingen annen tekst:
["Spørsmål 1", "Spørsmål 2", ...]`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.6,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent(prompt)
  try {
    const content = result.response.text()
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : parsed.questions || []
  } catch {
    return []
  }
}

// ===== KANDIDATSCORING =====
export async function scoreCandidate(params: {
  job: Job
  candidate: Candidate
  cvText: string
  followUpAnswers?: Record<string, string>
}): Promise<{ score: number; reasoning: string }> {
  const prompt = `Du er en objektiv rekrutteringsekspert. Gi en score fra 0-100 for denne kandidatens match med stillingen.

STILLING:
Tittel: ${params.job.title}
Bransje: ${params.job.industry}
Prosent: ${params.job.percentage}%
Beskrivelse: ${params.job.description}

KANDIDAT CV:
${params.cvText}

${params.followUpAnswers ? `SVAR PÅ OPPFØLGINGSSPØRSMÅL:
${Object.entries(params.followUpAnswers).map(([q, a]) => `Spørsmål: ${q}\nSvar: ${a}`).join('\n\n')}` : ''}

Scorer basert på:
- Erfaring og kompetanse (40%)
- Utdanning (20%)
- Svar på oppfølgingsspørsmål (30%)
- Røde flagg (trekk poeng, -10%)

Svar med JSON:
{
  "score": [0-100],
  "reasoning": "Kort begrunnelse på norsk"
}`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent(prompt)
  try {
    const parsed = JSON.parse(result.response.text())
    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      reasoning: parsed.reasoning || '',
    }
  } catch {
    return { score: 0, reasoning: '' }
  }
}

// ===== AI-KANDIDATANALYSE =====
export async function analyzeCandidate(params: {
  job: Job
  candidate: Candidate
  cvText: string
  followUpAnswers?: Record<string, string>
  interviewTranscript?: InterviewMessage[]
}): Promise<AIAnalysis> {
  const prompt = `Du er en senior rekrutteringskonsulent. Lag en strukturert analyse av denne kandidaten på norsk.

STILLING: ${params.job.title} (${params.job.percentage}%, ${params.job.location})
BRANSJE: ${params.job.industry}
KRAV: ${params.job.description}

KANDIDAT CV:
${params.cvText}

${params.followUpAnswers ? `SVAR PÅ OPPFØLGINGSSPØRSMÅL:
${Object.entries(params.followUpAnswers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}` : ''}

${params.interviewTranscript ? `INTERVJUTRANSSKRIPT:
${params.interviewTranscript.map((m) => `${m.role === 'assistant' ? 'Intervjuer' : 'Kandidat'}: ${m.content}`).join('\n')}` : ''}

Svar med JSON:
{
  "strengths": ["Styrke 1", "Styrke 2", "Styrke 3"],
  "areasToExplore": ["Område 1 som bør avklares", "Område 2"],
  "suggestedQuestions": ["Konkret intervjuspørsmål 1", "Spørsmål 2", "Spørsmål 3"],
  "redFlags": ["Evt. rødt flagg 1"],
  "summary": "En kort, balansert oppsummering på 2-3 setninger"
}`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.5,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent(prompt)
  try {
    const parsed = JSON.parse(result.response.text())
    return {
      strengths: parsed.strengths || [],
      areasToExplore: parsed.areasToExplore || [],
      suggestedQuestions: parsed.suggestedQuestions || [],
      redFlags: parsed.redFlags || [],
      summary: parsed.summary || '',
    }
  } catch {
    return {
      strengths: [],
      areasToExplore: [],
      suggestedQuestions: [],
      redFlags: [],
      summary: '',
    }
  }
}

// ===== AI-INTERVJU =====
export async function runInterviewTurn(params: {
  job: Job
  candidate: Candidate
  cvText: string
  conversationHistory: InterviewMessage[]
  language?: string
}): Promise<string> {
  const lang = params.language || 'norsk'
  const isFirstMessage = params.conversationHistory.length === 0

  const systemInstruction = `Du er en profesjonell og vennlig rekrutterer som gjennomfører et strukturert jobbintervju på ${lang}.

STILLING: ${params.job.title} ved ${params.job.location}
BESKRIVELSE: ${params.job.description}

KANDIDAT CV (sammendrag):
${params.cvText.substring(0, 1000)}

Retningslinjer:
- Still ett spørsmål av gangen
- Følg opp kandidatens svar naturlig
- Vær profesjonell men vennlig
- Dekk: motivasjon, erfaring, kompetanse, kulturell match
- Ha 6-8 spørsmål totalt
- Avslutt med å informere at intervjuet er fullført og takk for deltagelse`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  })

  if (isFirstMessage) {
    const result = await model.generateContent(
      'Start med å ønske kandidaten velkommen og still det første spørsmålet.'
    )
    return result.response.text()
  }

  // Bygg chat-historikk – alle meldinger unntatt den siste
  const history = params.conversationHistory.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const lastMessage = params.conversationHistory[params.conversationHistory.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  return result.response.text()
}

// ===== INTERVJUOPPSUMMERING =====
export async function summarizeInterview(params: {
  job: Job
  transcript: InterviewMessage[]
}): Promise<string> {
  const transcriptText = params.transcript
    .map((m) => `${m.role === 'assistant' ? 'Intervjuer' : 'Kandidat'}: ${m.content}`)
    .join('\n')

  const prompt = `Lag en profesjonell oppsummering på norsk av dette jobbintervjuet for stillingen "${params.job.title}".

TRANSSKRIPT:
${transcriptText}

Oppsummeringen skal inkludere:
- Kandidatens motivasjon for stillingen
- Relevante ferdigheter og erfaringer som kom frem
- Kommunikasjonsstil og profesjonalitet
- Helhetsinntrykk
- Anbefaling (gå videre / vurder / ikke anbefalt)

Hold oppsummeringen på 150-250 ord.`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.5 },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ===== AVVISNINGSE-POST =====
export async function generateRejectionEmail(params: {
  candidateName: string
  jobTitle: string
  companyName: string
  language?: string
}): Promise<string> {
  const lang = params.language || 'norsk'

  const prompt = `Skriv en varm, personlig og ikke-generisk avslagsbrev på ${lang} til en jobbsøker.

Kandidat: ${params.candidateName}
Stilling: ${params.jobTitle}
Bedrift: ${params.companyName}

E-posten skal:
- Være personlig og ikke bruke klisjeer som "vi hadde mange gode kandidater"
- Anerkjenne kandidatens innsats spesifikt
- Være oppmuntrende og framtidsrettet
- Ikke nevne spesifikke grunner for avslaget
- Ha en naturlig, menneskelig tone
- Være 100-150 ord

Skriv kun e-postteksten, ingen emne-linje.`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.8 },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ===== ONBOARDING-EPOST =====
export async function generateOnboardingEmail(params: {
  candidateName: string
  jobTitle: string
  companyName: string
  startDate: string
  language?: string
}): Promise<string> {
  const prompt = `Skriv en varm velkomst-e-post på norsk til en nyansatt.

Navn: ${params.candidateName}
Stilling: ${params.jobTitle}
Bedrift: ${params.companyName}
Startdato: ${params.startDate}

E-posten skal:
- Ønske dem hjertelig velkommen
- Bekrefte startdato og praktisk informasjon
- Gi dem en god følelse for den kommende arbeidsplassen
- Nevne at mer informasjon og skjemaer vil følge
- Være entusiastisk men profesjonell
- Være 150-200 ord`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.7 },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ===== SPRÅKDETEKSJON =====
export async function detectLanguage(text: string): Promise<string> {
  const prompt = `Detect the language of this text and return only the language name in English (e.g., "Norwegian", "English", "Swedish", "Polish", etc.):

"${text.substring(0, 200)}"`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 10,
    },
  })

  const result = await model.generateContent(prompt)
  return result.response.text().trim() || 'Norwegian'
}
