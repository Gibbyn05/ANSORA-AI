'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, XCircle, Award, Briefcase, Calendar, Banknote } from 'lucide-react'


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
  params: { id: string }
}) {
  
  const { id: offerId } = params

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
      <div className="min-h-screen bg-[#06070E] flex items-center justify-center">
        <div className="animate-pulse text-[#7a8a7d]">Laster tilbud...</div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#06070E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#94A187]">Tilbud ikke funnet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06070E] py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <Image src="/LogoA.png" alt="Ansora" width={120} height={40} className="h-10 w-auto" />
          </div>
        </div>

        {offer.status === 'accepted' ? (
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Tilbud akseptert!</h2>
            <p className="text-[#94A187] mb-2">
              Gratulerer, {offer.applications?.candidates?.name}!
            </p>
            <p className="text-[#94A187] text-sm">
              Du har akseptert stillingen som{' '}
              <strong className="text-white">{offer.applications?.jobs?.title}</strong>{' '}
              hos <strong className="text-white">{offer.applications?.jobs?.companies?.name}</strong>.
            </p>
            <p className="text-sm text-[#4a6358] mt-4">
              En velkomst-e-post er sendt til {offer.applications?.candidates?.email}
            </p>
          </Card>
        ) : offer.status === 'declined' ? (
          <Card className="text-center py-12">
            <div className="w-20 h-20 bg-[#29524A]/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-[#4a6358]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Tilbud avslått</h2>
            <p className="text-[#94A187] text-sm">
              Du har takket nei til dette tilbudet.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#29524A]/20 border border-[#94A187]/35 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Gratulerer!</h1>
              <p className="text-[#94A187] text-sm">
                Du har mottatt et jobbtilbud
              </p>
            </div>

            {/* Tilbudsdetaljer */}
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-white flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#4a6358]">Stilling</p>
                  <p className="font-semibold text-white">
                    {offer.applications?.jobs?.title}
                  </p>
                  <p className="text-sm text-[#94A187]">
                    {offer.applications?.jobs?.companies?.name} ·{' '}
                    {offer.applications?.jobs?.location} ·{' '}
                    {offer.applications?.jobs?.percentage}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#4a6358]">Startdato</p>
                  <p className="font-semibold text-white">
                    {new Date(offer.start_date).toLocaleDateString('nb-NO', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {offer.salary && (
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-white flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#4a6358]">Lønn</p>
                    <p className="font-semibold text-white">{offer.salary}</p>
                  </div>
                </div>
              )}

              {offer.benefits && (
                <div>
                  <p className="text-xs text-[#4a6358] mb-1">Fordeler</p>
                  <p className="text-sm text-[#C5AFA0]">{offer.benefits}</p>
                </div>
              )}
            </div>

            {offer.message && (
              <div className="bg-[#29524A]/15 border border-[#94A187]/25 rounded-xl p-4 mb-6">
                <p className="text-xs text-[#4a6358] mb-1">Melding fra arbeidsgiver</p>
                <p className="text-sm text-[#C5AFA0] leading-relaxed italic">"{offer.message}"</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
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

            <p className="text-xs text-[#4a6358] text-center mt-4">
              Ved å akseptere bekrefter du at du ønsker å starte i stillingen på angitt dato.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
