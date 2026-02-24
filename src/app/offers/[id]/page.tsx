'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, XCircle, Award, Briefcase, Calendar, Banknote } from 'lucide-react'
import React from 'react'

interface OfferData {
  id: string
  start_date: string
  salary?: string
  benefits?: string
  message?: string
  status: 'pending' | 'accepted' | 'declined'
  signed_at?: string
  applications?: {
    candidates?: { name?: string; email?: string }
    jobs?: {
      title?: string
      location?: string
      percentage?: number
      companies?: { name?: string }
    }
  }
}

export default function OfferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = React.use(params)
  const offerId = resolvedParams.id

  const [offer, setOffer] = useState<OfferData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await fetch(`/api/offers/${offerId}`)
        const data = await res.json()
        if (data.data) setOffer(data.data)
      } catch {
        setError('Kunne ikke laste tilbud')
      } finally {
        setLoading(false)
      }
    }
    fetchOffer()
  }, [offerId])

  const handleAccept = async () => {
    setAccepting(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOffer(prev => prev ? { ...prev, status: 'accepted' } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved aksept')
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    setDeclining(true)
    setError('')
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOffer(prev => prev ? { ...prev, status: 'declined' } : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil')
    } finally {
      setDeclining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Laster tilbud...</div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Tilbud ikke funnet</p>
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
        </div>

        {offer.status === 'accepted' ? (
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-2">Tilbud akseptert!</h2>
            <p className="text-gray-500 mb-2">
              Gratulerer, {offer.applications?.candidates?.name}!
            </p>
            <p className="text-gray-500 text-sm">
              Du har akseptert stillingen som{' '}
              <strong>{offer.applications?.jobs?.title}</strong>{' '}
              hos <strong>{offer.applications?.jobs?.companies?.name}</strong>.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              En velkomst-e-post er sendt til {offer.applications?.candidates?.email}
            </p>
          </Card>
        ) : offer.status === 'declined' ? (
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-2">Tilbud avslått</h2>
            <p className="text-gray-500 text-sm">
              Du har takket nei til dette tilbudet.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-1">Gratulerer!</h1>
              <p className="text-gray-500 text-sm">
                Du har mottatt et jobbtilbud
              </p>
            </div>

            {/* Tilbudsdetaljer */}
            <div className="bg-gradient-to-b from-blue-50 to-blue-50/30 border border-blue-100 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Stilling</p>
                  <p className="font-semibold text-navy">
                    {offer.applications?.jobs?.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {offer.applications?.jobs?.companies?.name} ·{' '}
                    {offer.applications?.jobs?.location} ·{' '}
                    {offer.applications?.jobs?.percentage}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Startdato</p>
                  <p className="font-semibold text-navy">
                    {new Date(offer.start_date).toLocaleDateString('nb-NO', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {offer.salary && (
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Lønn</p>
                    <p className="font-semibold text-navy">{offer.salary}</p>
                  </div>
                </div>
              )}

              {offer.benefits && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Fordeler</p>
                  <p className="text-sm text-gray-700">{offer.benefits}</p>
                </div>
              )}
            </div>

            {offer.message && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-400 mb-1">Melding fra arbeidsgiver</p>
                <p className="text-sm text-gray-700 leading-relaxed italic">"{offer.message}"</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                loading={accepting}
                size="lg"
                className="w-full"
              >
                <CheckCircle2 className="w-5 h-5" />
                Aksepter jobbtilbud
              </Button>

              <Button
                onClick={handleDecline}
                loading={declining}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                <XCircle className="w-5 h-5" />
                Takk nei
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              Ved å akseptere bekrefter du at du ønsker å starte i stillingen på angitt dato.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
