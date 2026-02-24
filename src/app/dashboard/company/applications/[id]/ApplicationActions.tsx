'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import {
  CheckCircle2, XCircle, UserCheck, Send, Users,
  ChevronDown, ChevronUp, Briefcase
} from 'lucide-react'
import type { ApplicationStatus } from '@/types'

interface ApplicationActionsProps {
  applicationId: string
  currentStatus: ApplicationStatus
  jobTitle: string
  hasOffer: boolean
  hasReferences: boolean
}

export function ApplicationActions({
  applicationId,
  currentStatus,
  jobTitle,
  hasOffer,
  hasReferences,
}: ApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showReferenceForm, setShowReferenceForm] = useState(false)
  const [showOfferForm, setShowOfferForm] = useState(false)

  // Referanseskjema state
  const [refName, setRefName] = useState('')
  const [refEmail, setRefEmail] = useState('')

  // Tilbudsskjema state
  const [startDate, setStartDate] = useState('')
  const [salary, setSalary] = useState('')
  const [benefits, setBenefits] = useState('')
  const [offerMessage, setOfferMessage] = useState('')

  const updateStatus = async (action: string) => {
    setLoading(action)
    setError('')

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'reject' ? { action: 'reject' } : { status: action }
        ),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod')
    } finally {
      setLoading(null)
    }
  }

  const sendReferenceRequest = async () => {
    if (!refName || !refEmail) return
    setLoading('reference')
    setError('')

    try {
      const res = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          refereeName: refName,
          refereeEmail: refEmail,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowReferenceForm(false)
      setRefName('')
      setRefEmail('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved sending')
    } finally {
      setLoading(null)
    }
  }

  const sendJobOffer = async () => {
    if (!startDate) return
    setLoading('offer')
    setError('')

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          startDate,
          salary,
          benefits,
          message: offerMessage,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowOfferForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved sending av tilbud')
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === 'rejected') {
    return (
      <Card>
        <div className="text-center py-4">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Kandidaten er avslått</p>
        </div>
      </Card>
    )
  }

  if (currentStatus === 'hired') {
    return (
      <Card>
        <div className="text-center py-4">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-navy text-sm">Kandidat er ansatt!</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="font-semibold text-navy mb-4 text-sm">Handlinger</h3>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-3">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {/* Gå videre */}
        {currentStatus === 'pending' && (
          <Button
            onClick={() => updateStatus('reviewing')}
            loading={loading === 'reviewing'}
            className="w-full"
            size="sm"
          >
            <UserCheck className="w-4 h-4" />
            Gå videre med kandidat
          </Button>
        )}

        {/* Send til intervju */}
        {(currentStatus === 'reviewing' || currentStatus === 'pending') && (
          <Button
            onClick={() => updateStatus('interview')}
            loading={loading === 'interview'}
            variant="secondary"
            className="w-full"
            size="sm"
          >
            <Send className="w-4 h-4" />
            Inviter til intervju
          </Button>
        )}

        {/* Referansesjekk */}
        {(currentStatus === 'reviewing' || currentStatus === 'interview') && !hasReferences && (
          <div>
            <Button
              onClick={() => setShowReferenceForm(!showReferenceForm)}
              variant="secondary"
              className="w-full"
              size="sm"
            >
              <Users className="w-4 h-4" />
              Send referanseforespørsel
              {showReferenceForm ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>

            {showReferenceForm && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-xl">
                <Input
                  label="Referansens navn"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  placeholder="Ola Nordmann"
                  className="text-sm"
                />
                <Input
                  label="Referansens e-post"
                  type="email"
                  value={refEmail}
                  onChange={(e) => setRefEmail(e.target.value)}
                  placeholder="referanse@epost.no"
                  className="text-sm"
                />
                <Button
                  onClick={sendReferenceRequest}
                  loading={loading === 'reference'}
                  className="w-full"
                  size="sm"
                >
                  Send forespørsel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Send jobbtilbud */}
        {['reviewing', 'interview', 'reference_check'].includes(currentStatus) && !hasOffer && (
          <div>
            <Button
              onClick={() => setShowOfferForm(!showOfferForm)}
              className="w-full"
              size="sm"
            >
              <Briefcase className="w-4 h-4" />
              Send jobbtilbud
              {showOfferForm ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>

            {showOfferForm && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-xl">
                <Input
                  label="Startdato *"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
                <Input
                  label="Lønn"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="F.eks. 600 000 kr/år"
                  className="text-sm"
                />
                <Textarea
                  label="Personlig melding"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Legg til en personlig hilsen..."
                  rows={3}
                  className="text-sm"
                />
                <Button
                  onClick={sendJobOffer}
                  loading={loading === 'offer'}
                  className="w-full"
                  size="sm"
                >
                  Send tilbud
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Avslå */}
        {currentStatus !== 'rejected' && currentStatus !== 'hired' && (
          <Button
            onClick={() => updateStatus('reject')}
            loading={loading === 'reject'}
            variant="danger"
            className="w-full"
            size="sm"
          >
            <XCircle className="w-4 h-4" />
            Avslutt søknad
          </Button>
        )}
      </div>
    </Card>
  )
}
