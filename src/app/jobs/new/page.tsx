'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import {
  Sparkles, Save, Eye, ArrowLeft, CheckCircle2, Loader2,
  Briefcase, MapPin, Percent, FileText
} from 'lucide-react'
import Link from 'next/link'
import type { Industry } from '@/types'

const INDUSTRY_OPTIONS = [
  { value: 'helse-og-omsorg', label: 'Helse og omsorg' },
  { value: 'bygg-og-anlegg', label: 'Bygg og anlegg' },
  { value: 'butikk-og-dagligvare', label: 'Butikk og dagligvare' },
  { value: 'restaurant-og-servering', label: 'Restaurant og servering' },
  { value: 'lager-og-logistikk', label: 'Lager og logistikk' },
  { value: 'it-og-teknologi', label: 'IT og teknologi' },
  { value: 'annet', label: 'Annet' },
]

export default function NewJobPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [industry, setIndustry] = useState<Industry>('it-og-teknologi')
  const [percentage, setPercentage] = useState('100')
  const [location, setLocation] = useState('')
  const [requirements, setRequirements] = useState('')
  const [keywords, setKeywords] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'preview'>('form')

  const handleGenerate = async () => {
    if (!title || !industry || !percentage || !location) {
      setError('Fyll ut tittel, bransje, stillingsprosent og arbeidssted')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/jobs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, industry, percentage, location, requirements, keywords }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setDescription(data.description)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved generering')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          industry,
          percentage: Number(percentage),
          location,
          requirements,
          status,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push('/dashboard/company')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved lagring')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/company" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Tilbake til dashboard
          </Link>
          <h1 className="text-2xl font-bold text-navy">Opprett ny stilling</h1>
          <p className="text-gray-500 mt-1">
            Fyll ut informasjonen og la AI generere en profesjonell stillingsannonse
          </p>
        </div>

        {/* Stegindikator */}
        <div className="flex items-center gap-3 mb-8">
          {['Stillingsinformasjon', 'Forhåndsvisning og publisering'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === 'form' && i === 0
                  ? 'bg-primary text-white'
                  : step === 'preview' && i === 1
                  ? 'bg-primary text-white'
                  : step === 'preview' && i === 0
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step === 'preview' && i === 0 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${
                (step === 'form' && i === 0) || (step === 'preview' && i === 1)
                  ? 'text-navy'
                  : 'text-gray-400'
              }`}>
                {label}
              </span>
              {i < 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {step === 'form' && (
          <Card>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Input
                    label="Stillingstittel *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="F.eks. Sykepleier, Backend-utvikler, Butikkmedarbeider"
                  />
                </div>

                <Select
                  label="Bransje *"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as Industry)}
                  options={INDUSTRY_OPTIONS}
                />

                <Input
                  label="Stillingsprosent *"
                  type="number"
                  min="10"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="100"
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Arbeidssted *"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="F.eks. Oslo, Bergen, Hjemmekontor"
                  />
                </div>
              </div>

              <Textarea
                label="Krav og kvalifikasjoner"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                placeholder="Beskriv krav til utdanning, erfaring og egenskaper..."
                helperText="AI vil bruke dette til å generere mer presis stillingsannonse"
              />

              <Textarea
                label="Stikkord og nøkkelord (valgfritt)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={3}
                placeholder="F.eks. teamarbeid, selvstendig, kundeservice, agile..."
                helperText="Legg til stikkord som beskriver kulturen og arbeidsmiljøet"
              />

              <div className="pt-2">
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  {generating ? 'Genererer annonse...' : 'Generer stillingsannonse med AI'}
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  AI vil skrive en profesjonell stillingsannonse basert på informasjonen du har fylt ut
                </p>
              </div>
            </div>
          </Card>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Generert stillingsannonse
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('form')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Rediger info
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">Generert av AI</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Du kan redigere teksten nedenfor før du publiserer
                  </p>
                </div>
              </div>

              <Textarea
                label="Stillingsannonse (rediger etter behov)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            </Card>

            {/* Stillingsoversikt */}
            <Card>
              <h3 className="font-semibold text-navy mb-4">Stillingsoversikt</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  { icon: Briefcase, label: 'Tittel', value: title },
                  { icon: MapPin, label: 'Sted', value: location },
                  { icon: Percent, label: 'Prosent', value: `${percentage}%` },
                  { icon: FileText, label: 'Bransje', value: INDUSTRY_OPTIONS.find(o => o.value === industry)?.label || industry },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </span>
                    <span className="font-medium text-navy">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Handlingsknapper */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSave('published')}
                loading={saving}
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Eye className="w-5 h-5" />
                Publiser stilling
              </Button>
              <Button
                onClick={() => handleSave('draft')}
                loading={saving}
                variant="secondary"
                size="lg"
              >
                <Save className="w-5 h-5" />
                Lagre som utkast
              </Button>
              <Button
                onClick={handleGenerate}
                loading={generating}
                variant="ghost"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                Regenerer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
