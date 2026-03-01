-- Run this in Supabase SQL Editor to enable the messaging system

CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('company', 'candidate')),
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Allow companies and candidates to read/insert messages on their own applications
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage messages on their applications"
  ON messages FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can manage messages on their applications"
  ON messages FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN candidates ca ON ca.id = a.candidate_id
      WHERE ca.user_id = auth.uid()
    )
  );
