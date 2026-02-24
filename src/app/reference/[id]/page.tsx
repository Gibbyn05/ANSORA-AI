'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, Star } from 'lucide-react'
import React from 'react'

export default function ReferencePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  const referenceId = resolvedParams.id

  const [referenceData, setReferenceData] = useState<{
    referee_name: string
    response: Record<string, unknown> | null
    applications?: {
      candidates?: { name?: string }
      jobs?: { title?: string; companies?: { name?: string } }
    }
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Skjemastate
  const [relationship, setRelationship] = useState('')
  const [duration, setDuration] = useState('')
  const [strengths, setStrengths] = useState('')
  const [concerns, setConcerns] = useState('')
  const [rehire, setRehire] = useState('yes')
  const [rating, setRating] = useState(4)
  const [comments, setComments] = useState('')

  useEffect(() => {
    const fetchReference = async () => {
      try {
        const res = await fetch(`/api/references/${referenceId}`)
        const data = await res.json()
        if (data.data) {
          setReferenceData(data.data)
          if (data.data.response) {
            setSubmitted(true)
          }
        }
      } catch (err) {
        setError('Kunne ikke laste referanseskjema')
      } finally {
        setLoading(false)
      }
    }
    fetchReference()
  }, [referenceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/references/${referenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship,
          duration,
          strengths,
          concerns,
          rehire: rehire === 'yes',
          rating,
          comments,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved innsending')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Laster skjema...</div>
      </div>
    )
  }

  if (error && !referenceData) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-navy font-bold text-xl">Ansora</span>
          </div>
          <h1 className="text-2xl font-bold text-navy">Referanseforespørsel</h1>
          {referenceData && (
            <p className="text-gray-500 mt-2 text-sm">
              Du er oppgitt som referanse for{' '}
              <strong>{referenceData.applications?.candidates?.name}</strong>{' '}
              til stillingen{' '}
              <strong>{referenceData.applications?.jobs?.title}</strong>{' '}
              hos <strong>{referenceData.applications?.jobs?.companies?.name}</strong>
            </p>
          )}
        </div>

        {submitted ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Tusen takk!</h2>
            <p className="text-gray-500 text-sm">
              Din tilbakemelding er registrert og vil hjelpe oss å gjøre en rettferdig vurdering.
            </p>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Select
                label="Hva er ditt forhold til kandidaten? *"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                options={[
                  { value: 'Overordnet/Leder', label: 'Overordnet / Leder' },
                  { value: 'Kollega', label: 'Kollega' },
                  { value: 'Underordnet', label: 'Underordnet' },
                  { value: 'Kunde/Samarbeidspartner', label: 'Kunde / Samarbeidspartner' },
                ]}
                placeholder="Velg relasjon"
                required
              />

              <Input
                label="Hvor lenge har dere jobbet sammen? *"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="F.eks. 2 år og 3 måneder"
                required
              />

              <Textarea
                label="Hva er kandidatens største styrker? *"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={4}
                placeholder="Beskriv konkrete eksempler på kandidatens styrker..."
                required
              />

              <Textarea
                label="Er det noe du mener rekrutterer bør vite? (valgfritt)"
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                rows={3}
                placeholder="Evt. utviklingsområder eller andre relevante observasjoner..."
              />

              <Select
                label="Ville du ansatt denne personen igjen? *"
                value={rehire}
                onChange={(e) => setRehire(e.target.value)}
                options={[
                  { value: 'yes', label: 'Ja, absolutt' },
                  { value: 'maybe', label: 'Kanskje, avhengig av stilling' },
                  { value: 'no', label: 'Nei' },
                ]}
              />

              {/* Rating */}
              <div>
                <label className="label">Samlet vurdering *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {['', 'Under forventning', 'Noe under forventning', 'Møter forventning', 'Over forventning', 'Eksepsjonell'][rating]}
                </p>
              </div>

              <Textarea
                label="Ytterligere kommentarer (valgfritt)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Andre ting du ønsker å dele..."
              />

              <Button
                type="submit"
                loading={submitting}
                className="w-full"
                size="lg"
              >
                Send referansesvar
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Dine svar behandles konfidensielt og deles kun med rekrutteringsansvarlig.
              </p>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
