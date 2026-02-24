# Ansora – AI-drevet rekrutteringsplattform

Ansora er en fullstendig AI-drevet rekrutteringsplattform bygget med Next.js 14, Supabase og OpenAI. Plattformen effektiviserer hele rekrutteringsprosessen – fra stillingsannonse til digital signering av jobbtilbud.

## Teknisk stack

| Teknologi | Bruk |
|-----------|------|
| **Next.js 14** | Frontend + API routes (App Router) |
| **Supabase** | PostgreSQL database, autentisering, fillagring |
| **OpenAI GPT-4o** | AI-funksjoner (intervju, analyse, scoring) |
| **Tailwind CSS** | Styling |
| **TypeScript** | Hele prosjektet |
| **Resend** | E-postsending |

## Funksjoner

### For bedrifter/rekrutterere
- **AI Stillingsbuilder** – Generer profesjonelle stillingsannonser fra stikkord
- **Kandidatrangering** – Automatisk AI-scoring fra 0-100
- **Dyp AI-analyse** – Styrker, røde flagg og foreslåtte spørsmål per kandidat
- **Anonymisert vurdering** – Skjul personidentifiserende informasjon
- **Referansesjekk** – Automatiske e-poster til referanser med digitalt skjema
- **Jobbtilbud** – Send og motta digital aksept av jobbtilbud
- **Rekrutteringsdashboard** – Komplett oversikt over alle kandidater og stillinger

### For kandidater
- **CV-opplasting** – PDF-parsing og automatisk tekstekstraksjon
- **AI-oppfølgingsspørsmål** – Personaliserte spørsmål basert på CV og stilling
- **AI-intervju** – Tekstbasert intervju tilgjengelig 24/7
- **Kandidatdashboard** – Oversikt over alle søknader og status
- **Digital stillingssignering** – Aksepter jobbtilbud direkte i appen

### AI-funksjoner
- Automatisk språkdeteksjon og flerspråklig støtte
- Generering av personlig avslagsbrev
- Onboarding-e-post ved ansettelse
- Bransjemaler for 6 bransjer

## Oppsett

### 1. Klon prosjektet

```bash
git clone <repo-url>
cd ANSORA-AI
npm install
```

### 2. Sett opp miljøvariabler

```bash
cp .env.local.example .env.local
```

Fyll ut `.env.local` med dine nøkler:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ditt-prosjekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_anon_nøkkel
SUPABASE_SERVICE_ROLE_KEY=din_service_role_nøkkel

# OpenAI
OPENAI_API_KEY=sk-...

# Resend (e-post)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@dittdomene.no

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Sett opp Supabase

1. Opprett et prosjekt på [supabase.com](https://supabase.com)
2. Gå til **SQL Editor** og kjør filen `supabase/schema.sql`
3. Gå til **Storage** og opprett to buckets:
   - `cvs` (privat) – for CV-filer
   - `company-logos` (offentlig) – for bedriftslogger

### 4. Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Prosjektstruktur

```
src/
├── app/
│   ├── api/                    # API routes (server-side)
│   │   ├── applications/       # Søknadsbehandling + AI-scoring
│   │   ├── interviews/         # AI-intervju
│   │   ├── jobs/               # Stillingsbehandling + AI-generator
│   │   ├── offers/             # Jobbtilbud
│   │   └── references/         # Referansesjekk
│   ├── auth/                   # Innlogging og registrering
│   ├── apply/[jobId]/          # Kandidatsøknad med CV-opplasting
│   ├── dashboard/
│   │   ├── company/            # Rekrutterer-dashboard
│   │   └── candidate/          # Kandidat-dashboard
│   ├── interview/[id]/         # AI-intervju chat
│   ├── jobs/                   # Offentlig stillingsliste + ny stilling
│   ├── offers/[id]/            # Digital aksept av jobbtilbud
│   └── reference/[id]/         # Referanseskjema
├── components/
│   └── ui/                     # Gjenbrukbare UI-komponenter
├── lib/
│   ├── email/                  # E-postsending (Resend)
│   ├── openai/                 # OpenAI-prompts og klient
│   ├── supabase/               # Supabase-klienter (client/server/middleware)
│   └── utils.ts                # Hjelpefunksjoner og bransjemaler
└── types/                      # TypeScript-typer
```

## Databasestruktur

| Tabell | Beskrivelse |
|--------|-------------|
| `companies` | Bedriftsprofiler |
| `jobs` | Stillingsannonser |
| `candidates` | Kandidatprofiler med CV-data |
| `applications` | Søknader med score og AI-analyse |
| `references` | Referanseforespørsler og svar |
| `job_offers` | Jobbtilbud med digital signering |

## Sikkerhet

- Alle OpenAI API-kall gjøres server-side (aldri i frontend)
- Row Level Security (RLS) aktivert for alle Supabase-tabeller
- Alle hemmeligheter lagres i miljøvariabler
- PDF-filer lagres sikkert i privat Supabase Storage bucket

## Bransjemaler

Plattformen har innebygde maler for:
- Helse og omsorg
- Bygg og anlegg
- Butikk og dagligvare
- Restaurant og servering
- Lager og logistikk
- IT og teknologi

## Produksjonsdeploy

```bash
npm run build
npm start
```

Anbefalt: Deploy på [Vercel](https://vercel.com) for best Next.js-støtte.

```bash
npx vercel
```

---

Bygget med Next.js 14 · Supabase · OpenAI GPT-4o · Tailwind CSS
