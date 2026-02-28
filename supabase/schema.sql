-- =====================================================
-- ANSORA - Supabase Database Schema
-- =====================================================
-- Kjør denne SQL-filen i Supabase SQL Editor
-- =====================================================

-- Aktiver UUID-generering
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLER
-- =====================================================

-- Bedrifter
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stillinger
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL CHECK (industry IN (
    'helse-og-omsorg', 'bygg-og-anlegg', 'butikk-og-dagligvare',
    'restaurant-og-servering', 'lager-og-logistikk', 'it-og-teknologi', 'annet'
  )),
  percentage INTEGER NOT NULL DEFAULT 100 CHECK (percentage > 0 AND percentage <= 100),
  location TEXT NOT NULL,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  camera_required TEXT NOT NULL DEFAULT 'optional' CHECK (camera_required IN ('disabled', 'optional', 'required')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kandidater
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cv_url TEXT,
  cv_text TEXT,
  language TEXT DEFAULT 'Norwegian',
  phone TEXT,
  profile_picture_url TEXT,
  bio TEXT,
  skills TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Søknader
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'interview', 'reference_check',
    'offer_sent', 'hired', 'rejected'
  )),
  ai_analysis JSONB,
  interview_transcript JSONB DEFAULT '[]'::JSONB,
  interview_summary TEXT,
  follow_up_questions JSONB DEFAULT '[]'::JSONB,
  follow_up_answers JSONB DEFAULT '{}'::JSONB,
  interview_completed BOOLEAN DEFAULT FALSE,
  rejection_sent BOOLEAN DEFAULT FALSE,
  cover_letter TEXT,
  scoring_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

-- Referanser
CREATE TABLE IF NOT EXISTS job_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  referee_name TEXT NOT NULL,
  referee_email TEXT NOT NULL,
  response JSONB,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobbtilbud
CREATE TABLE IF NOT EXISTS job_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  salary TEXT,
  benefits TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;

-- Companies RLS
CREATE POLICY "Bedrifter kan se sin egen profil" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Bedrifter kan oppdatere sin profil" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Brukere kan opprette bedriftsprofil" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs RLS - offentlig lesing for publiserte stillinger
CREATE POLICY "Publiserte stillinger er offentlige" ON jobs
  FOR SELECT USING (status = 'published' OR company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Bedrifter kan opprette stillinger" ON jobs
  FOR INSERT WITH CHECK (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Bedrifter kan oppdatere sine stillinger" ON jobs
  FOR UPDATE USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Bedrifter kan slette sine stillinger" ON jobs
  FOR DELETE USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));

-- Candidates RLS
CREATE POLICY "Kandidater kan se sin profil" ON candidates
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE a.candidate_id = candidates.id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Kandidater kan opprette profil" ON candidates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kandidater kan oppdatere sin profil" ON candidates
  FOR UPDATE USING (auth.uid() = user_id);

-- Applications RLS
CREATE POLICY "Kandidater ser sine søknader" ON applications
  FOR SELECT USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
    OR
    job_id IN (SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.user_id = auth.uid())
  );

CREATE POLICY "Kandidater kan opprette søknader" ON applications
  FOR INSERT WITH CHECK (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
  );

CREATE POLICY "Oppdatering av søknader" ON applications
  FOR UPDATE USING (
    candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
    OR
    job_id IN (SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.user_id = auth.uid())
  );

-- References RLS
CREATE POLICY "Rekrutterere kan se referanser" ON job_references
  FOR SELECT USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Kan opprette referanser" ON job_references
  FOR INSERT WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Kan oppdatere referanser" ON job_references
  FOR UPDATE USING (true);

-- Job offers RLS
CREATE POLICY "Kan se jobbtilbud" ON job_offers
  FOR SELECT USING (
    application_id IN (
      SELECT a.id FROM applications a
      WHERE a.candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
      OR a.job_id IN (SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.user_id = auth.uid())
    )
  );

CREATE POLICY "Kan opprette tilbud" ON job_offers
  FOR INSERT WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Kan oppdatere tilbud" ON job_offers
  FOR UPDATE USING (
    application_id IN (
      SELECT a.id FROM applications a
      WHERE a.candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid())
      OR a.job_id IN (SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE c.user_id = auth.uid())
    )
  );

-- =====================================================
-- STORAGE BUCKET FOR CV-FILER
-- =====================================================
-- Kjør disse kommandoene manuelt i Supabase Dashboard > Storage:
-- 1. Opprett bucket "cvs" med public: false
-- 2. Opprett bucket "company-logos" med public: true

-- =====================================================
-- INDEKSER FOR YTELSE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_score ON applications(score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_references_application_id ON job_references(application_id);

-- =====================================================
-- MIGRASJON: Legg til nye kolonner (kjør hvis tabeller allerede eksisterer)
-- =====================================================
-- ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
-- ALTER TABLE candidates ADD COLUMN IF NOT EXISTS bio TEXT;
-- ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT;
-- ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
-- ALTER TABLE jobs ADD COLUMN IF NOT EXISTS camera_required TEXT NOT NULL DEFAULT 'optional' CHECK (camera_required IN ('disabled', 'optional', 'required'));
-- Opprett bucket "avatars" med public: true i Supabase Dashboard > Storage

-- Admin-godkjenning for bedrifter:
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;
-- UPDATE companies SET approved = TRUE; -- Godkjenn eksisterende bedrifter automatisk

-- Bedriftsverifisering (org.nr og kontaktinfo fra Brønnøysundregistrene):
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS org_number TEXT;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS city TEXT;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_description TEXT;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_count INTEGER;
