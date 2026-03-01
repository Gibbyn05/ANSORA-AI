// ===== BRUKERROLLER =====
export type UserRole = 'company' | 'candidate'

// ===== BEDRIFT =====
export interface Company {
  id: string
  user_id?: string
  name: string
  email: string
  logo?: string
  website?: string
  description?: string
  approved: boolean
  created_at: string
  // Verifiseringsfelter fra Brønnøysundregistrene
  org_number?: string
  phone?: string
  address?: string
  city?: string
  industry_description?: string
  employee_count?: number
}

// ===== BRØNNØYSUNDREGISTRENE =====
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

// ===== STILLING =====
export type JobStatus = 'draft' | 'published' | 'closed'

export type Industry =
  | 'helse-og-omsorg'
  | 'bygg-og-anlegg'
  | 'butikk-og-dagligvare'
  | 'restaurant-og-servering'
  | 'lager-og-logistikk'
  | 'it-og-teknologi'
  | 'annet'

export type CameraRequired = 'disabled' | 'optional' | 'required'

export interface Job {
  id: string
  company_id: string
  title: string
  description: string
  industry: Industry
  percentage: number
  location: string
  requirements?: string
  status: JobStatus
  camera_required: CameraRequired
  deadline?: string
  created_at: string
  companies?: Company
}

export interface Message {
  id: string
  application_id: string
  sender_role: 'company' | 'candidate'
  content: string
  read_at?: string
  created_at: string
}

// ===== KANDIDAT =====
export interface Candidate {
  id: string
  user_id: string
  name: string
  email: string
  cv_url?: string
  cv_text?: string
  language: string
  phone?: string
  profile_picture_url?: string
  bio?: string
  skills?: string
  linkedin_url?: string
  created_at: string
}

// ===== SØKNAD =====
export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'interview'
  | 'reference_check'
  | 'offer_sent'
  | 'hired'
  | 'rejected'

export interface AIAnalysis {
  strengths: string[]
  areasToExplore: string[]
  suggestedQuestions: string[]
  redFlags?: string[]
  summary: string
}

export interface Application {
  id: string
  job_id: string
  candidate_id: string
  score?: number
  status: ApplicationStatus
  ai_analysis?: AIAnalysis
  interview_completed?: boolean
  interview_transcript?: InterviewMessage[]
  interview_summary?: string
  follow_up_answers?: Record<string, string>
  rejection_sent?: boolean
  anonymous_view?: boolean
  recording_url?: string
  created_at: string
  jobs?: Job
  candidates?: Candidate
}

// ===== INTERVJU =====
export interface InterviewMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: string
}

// ===== REFERANSER =====
export interface Reference {
  id: string
  application_id: string
  referee_name: string
  referee_email: string
  response?: ReferenceResponse
  sent_at?: string
  responded_at?: string
  created_at: string
}

export interface ReferenceResponse {
  relationship: string
  duration: string
  strengths: string
  concerns?: string
  rehire: boolean
  rating: number
  comments?: string
}

// ===== JOBBTILBUD =====
export interface JobOffer {
  id: string
  application_id: string
  job_id: string
  candidate_id: string
  start_date: string
  salary?: string
  benefits?: string
  message?: string
  status: 'pending' | 'accepted' | 'declined'
  signed_at?: string
  created_at: string
}

// ===== BRANSJEMALER =====
export interface IndustryTemplate {
  industry: Industry
  label: string
  predefinedQuestions: string[]
  scoringCriteria: string[]
  commonRequirements: string[]
}

// ===== API RESPONSE TYPER =====
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ===== SKJEMA TYPER =====
export interface JobFormData {
  title: string
  industry: Industry
  percentage: number
  location: string
  requirements: string
  keywords?: string
}

export interface ApplicationFormData {
  name: string
  email: string
  coverLetter?: string
}
