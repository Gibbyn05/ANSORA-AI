import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Industry, IndustryTemplate } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formater dato til norsk format
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Hent farge basert på score
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50'
  if (score >= 60) return 'text-yellow-600 bg-yellow-50'
  if (score >= 40) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

// Oversett status til norsk
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: 'Venter',
    reviewing: 'Under vurdering',
    interview: 'Intervju',
    reference_check: 'Referansesjekk',
    offer_sent: 'Tilbud sendt',
    hired: 'Ansatt',
    rejected: 'Avslått',
    draft: 'Utkast',
    published: 'Publisert',
    closed: 'Avsluttet',
  }
  return translations[status] || status
}

// Bransjemaler
export const industryTemplates: IndustryTemplate[] = [
  {
    industry: 'helse-og-omsorg',
    label: 'Helse og omsorg',
    predefinedQuestions: [
      'Har du relevant helsefaglig utdanning eller erfaring?',
      'Er du komfortabel med å jobbe med sårbare grupper?',
      'Har du erfaring med medisinsk dokumentasjon?',
      'Kan du arbeide turnus/helg?',
      'Har du førstehjelpskurs?',
    ],
    scoringCriteria: [
      'Helsefaglig utdanning',
      'Relevant arbeidserfaring',
      'Empati og omsorgsevne',
      'Norsk kommunikasjonsevne',
      'Fleksibilitet med arbeidstid',
    ],
    commonRequirements: [
      'Helsefagarbeider eller tilsvarende',
      'Norsk autorisasjon om relevant',
      'Evne til å jobbe selvstendig',
      'God kommunikasjonsevne',
    ],
  },
  {
    industry: 'bygg-og-anlegg',
    label: 'Bygg og anlegg',
    predefinedQuestions: [
      'Hvilke fagbrev eller sertifikater har du?',
      'Har du erfaring med HMS-prosedyrer?',
      'Kan du operere tunge maskiner?',
      'Har du gyldig sertifikat for høydearbeid?',
      'Har du bil og førerkort klasse B?',
    ],
    scoringCriteria: [
      'Fagbrev og sertifikater',
      'Praktisk erfaring',
      'HMS-kunnskap',
      'Fysisk form',
      'Pålitelighet',
    ],
    commonRequirements: [
      'Relevant fagbrev',
      'Erfaring fra bransjen',
      'HMS-kort',
      'Fysisk god form',
    ],
  },
  {
    industry: 'butikk-og-dagligvare',
    label: 'Butikk og dagligvare',
    predefinedQuestions: [
      'Har du erfaring fra detaljhandel?',
      'Er du komfortabel med kasse og betalingsløsninger?',
      'Kan du arbeide fleksibelt med turnus og helger?',
      'Har du erfaring med varebestilling og lagerstyring?',
      'Beskriv din kundeserviceerfaring.',
    ],
    scoringCriteria: [
      'Kundeserviceerfaring',
      'Kasseerfaring',
      'Fleksibilitet',
      'Pålitelighet',
      'Teamarbeid',
    ],
    commonRequirements: [
      'God kundeserviceevne',
      'Fleksibel arbeidstid',
      'Norsk taleferdighet',
      'Erfaring er en fordel',
    ],
  },
  {
    industry: 'restaurant-og-servering',
    label: 'Restaurant og servering',
    predefinedQuestions: [
      'Har du erfaring fra restaurant eller kafé?',
      'Har du mattrygghetskurs?',
      'Kan du arbeide kvelds- og helgeskift?',
      'Har du erfaring med bestillingsystemer?',
      'Kan du jobbe raskt under press?',
    ],
    scoringCriteria: [
      'Serveringserfaring',
      'Mattrygghet',
      'Stressmestring',
      'Teamwork',
      'Fleksibilitet',
    ],
    commonRequirements: [
      'Erfaring fra serveringsbransjen',
      'Mattrygghetskurs',
      'Fleksibel arbeidstid',
      'Godt humør og energi',
    ],
  },
  {
    industry: 'lager-og-logistikk',
    label: 'Lager og logistikk',
    predefinedQuestions: [
      'Har du erfaring fra lager eller distribusjon?',
      'Har du truck- eller gaffeltruck-sertifikat?',
      'Er du komfortabel med fysisk arbeid?',
      'Har du erfaring med WMS-systemer?',
      'Kan du arbeide skift?',
    ],
    scoringCriteria: [
      'Lagererfaring',
      'Trucksertifikat',
      'Fysisk kapasitet',
      'Pålitelighet',
      'Systemkunnskap',
    ],
    commonRequirements: [
      'Lagererfaring',
      'Trucksertifikat er en fordel',
      'Fysisk god form',
      'Evne til å arbeide selvstendig',
    ],
  },
  {
    industry: 'it-og-teknologi',
    label: 'IT og teknologi',
    predefinedQuestions: [
      'Hvilke programmeringsspråk behersker du?',
      'Har du erfaring med agile utviklingsmetoder?',
      'Kan du vise til relevante prosjekter eller GitHub-profil?',
      'Har du erfaring med skytjenester (AWS, Azure, GCP)?',
      'Hvilken utviklingsstack foretrekker du og hvorfor?',
    ],
    scoringCriteria: [
      'Teknisk kompetanse',
      'Relevant erfaring',
      'Problemløsningsevne',
      'Samarbeidsevne',
      'Læringsvilje',
    ],
    commonRequirements: [
      'Relevant teknisk utdanning eller erfaring',
      'Gode kommunikasjonsevner',
      'Evne til å jobbe i team',
      'Oppdatert fagkunnskap',
    ],
  },
]

export function getIndustryTemplate(industry: Industry): IndustryTemplate | undefined {
  return industryTemplates.find((t) => t.industry === industry)
}

export function getIndustryLabel(industry: Industry): string {
  return industryTemplates.find((t) => t.industry === industry)?.label || industry
}
