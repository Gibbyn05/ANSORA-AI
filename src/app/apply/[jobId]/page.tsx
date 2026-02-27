'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import {
  Upload, FileText, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Send, AlertCircle, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ApplyPage({
  params,
}: {
  params: { jobId: string }
}) {
  const { jobId } = params
  const router = useRouter()

  const [step, setStep] = useState<'upload' | 'questions' | 'submitted'>('upload')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [uploading, setUploading] = useState(false)
  const [applicationId, setApplicationId] = useState('')
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittingAnswers, setSubmittingAnswers] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Kun PDF-filer støttes')
    } else if (file.size > MAX_FILE_SIZE) {
      setError(`Filen er for stor (${(file.size / 1024 / 1024).toFixed(1)} MB). Maks 4 MB tillatt.`)
    } else {
      setError('')
      setCvFile(file)
    }
  }, [])

  const handleUpload = async () => {
    if (!cvFile) {
      setError('Last opp CV-en din')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('cv', cvFile)
      if (coverLetter) formData.append('coverLetter', coverLetter)

      const res = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Feil ved innsending av søknad')
      }

      setApplicationId(data.data.id)
      setFollowUpQuestions(data.followUpQuestions || [])

      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        setStep('questions')
      } else {
        setStep('submitted')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved innsending')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitAnswers = async () => {
    setSubmittingAnswers(true)
    setError('')

    try {
      const answerMap: Record<string, string> = {}
      followUpQuestions.forEach((q, i) => {
        answerMap[q] = answers[i] || ''
      })

      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_answers',
          answers: answerMap,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStep('submitted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved innsending av svar')
    } finally {
      setSubmittingAnswers(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#d7fe03] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="text-white font-bold text-xl">Ansora</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">
            {step === 'upload' && 'Send inn søknad'}
            {step === 'questions' && 'Oppfølgingsspørsmål'}
            {step === 'submitted' && 'Søknad mottatt!'}
          </h1>
          <p className="text-[#999] mt-1 text-sm">
            {step === 'upload' && 'Last opp CV-en din for å komme i gang'}
            {step === 'questions' && 'AI har generert spørsmål basert på din bakgrunn og stillingen'}
            {step === 'submitted' && 'Din søknad er nå registrert og under vurdering'}
          </p>
        </div>

        {/* Stegindikator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { label: 'Last opp CV', key: 'upload' },
            { label: 'Spørsmål', key: 'questions' },
            { label: 'Ferdig', key: 'submitted' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 sm:gap-4">
              <div className={`flex items-center gap-2 ${
                step === s.key ? 'text-[#d7fe03]' : 'text-[#555]'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  step === s.key
                    ? 'border-[#d7fe03] bg-[#d7fe03] text-black'
                    : (i === 0 && (step === 'questions' || step === 'submitted')) ||
                      (i === 1 && step === 'submitted')
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-white/20 text-[#555]'
                }`}>
                  {(i === 0 && (step === 'questions' || step === 'submitted')) ||
                   (i === 1 && step === 'submitted')
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : i + 1}
                </div>
                <span className="hidden sm:block text-sm font-medium">{s.label}</span>
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-white/10" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Steg 1: Last opp CV */}
        {step === 'upload' && (
          <Card>
            <div className="space-y-6">
              {/* Filopplasting */}
              <div>
                <label className="label">CV (PDF) *</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                    isDragging
                      ? 'border-[#d7fe03] bg-[#d7fe03]/5'
                      : cvFile
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-white/10 hover:border-[#d7fe03]/50 hover:bg-white/5'
                  )}
                  onClick={() => document.getElementById('cv-upload')?.click()}
                >
                  {cvFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-10 h-10 text-green-400" />
                      <p className="font-semibold text-green-400">{cvFile.name}</p>
                      <p className="text-sm text-green-400/70">
                        {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        className="text-sm text-[#666] hover:text-red-400 mt-2"
                        onClick={(e) => { e.stopPropagation(); setCvFile(null) }}
                      >
                        Fjern fil
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Upload className="w-7 h-7 text-[#555]" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Dra og slipp CV her</p>
                        <p className="text-sm text-[#999] mt-1">eller klikk for å velge fil</p>
                      </div>
                      <p className="text-xs text-[#555] bg-white/5 px-3 py-1 rounded-full">
                        Kun PDF, maks 4 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="cv-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > MAX_FILE_SIZE) {
                      setError(`Filen er for stor (${(file.size / 1024 / 1024).toFixed(1)} MB). Maks 4 MB tillatt.`)
                      e.target.value = ''
                    } else {
                      setError('')
                      setCvFile(file)
                    }
                  }}
                />
              </div>

              <Textarea
                label="Søknadsbrev (valgfritt)"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Fortell litt om deg selv og hvorfor du søker denne stillingen..."
                helperText="Valgfritt, men kan styrke søknaden din"
              />

              <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#d7fe03] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">AI analyserer din søknad</p>
                  <p className="text-xs text-[#999] mt-1">
                    CV-en din parses automatisk og AI genererer skreddersydde spørsmål basert på din bakgrunn og stillingens krav.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                loading={uploading}
                size="lg"
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyserer CV...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Send søknad
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Steg 2: Oppfølgingsspørsmål */}
        {step === 'questions' && (
          <Card>
            <div className="bg-[#d7fe03]/5 border border-[#d7fe03]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#d7fe03] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#d7fe03]">AI-genererte spørsmål</p>
                <p className="text-xs text-[#999] mt-1">
                  Disse spørsmålene er laget spesifikt for deg basert på din CV og stillingens krav
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {followUpQuestions.map((question, index) => (
                <div key={index}>
                  <label className="label">
                    Spørsmål {index + 1} av {followUpQuestions.length}
                  </label>
                  <p className="text-sm font-medium text-white mb-2">{question}</p>
                  <Textarea
                    value={answers[index] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                    rows={3}
                    placeholder="Skriv ditt svar her..."
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep('upload')}
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Tilbake
                </Button>
                <Button
                  onClick={handleSubmitAnswers}
                  loading={submittingAnswers}
                  size="lg"
                  className="flex-1"
                >
                  <Send className="w-4 h-4" />
                  Send inn svar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Steg 3: Ferdig */}
        {step === 'submitted' && (
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Søknad sendt!</h2>
            <p className="text-[#999] mb-8 max-w-sm mx-auto">
              Din søknad er mottatt og er nå under AI-analyse. Du vil høre fra oss snart!
            </p>

            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 mb-8 text-left">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d7fe03]" />
                Neste steg
              </h3>
              <ul className="space-y-2 text-sm text-[#999]">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#d7fe03]/10 rounded-full flex items-center justify-center text-[#d7fe03] text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  Rekrutterer gjennomgår din søknad og AI-analysen
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#d7fe03]/10 rounded-full flex items-center justify-center text-[#d7fe03] text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  Du kan bli invitert til et AI-intervju direkte i appen
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#d7fe03]/10 rounded-full flex items-center justify-center text-[#d7fe03] text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  Rekrutterer kontakter deg med neste steg
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/candidate">
                <Button size="lg">
                  Se mine søknader
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="secondary" size="lg">
                  Se flere stillinger
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
