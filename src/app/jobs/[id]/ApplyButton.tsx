'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, LogIn, Send } from 'lucide-react'

interface ApplyButtonProps {
  jobId: string
  userRole: 'company' | 'candidate' | null
  hasApplied: boolean
  isLoggedIn: boolean
}

export function ApplyButton({ jobId, userRole, hasApplied, isLoggedIn }: ApplyButtonProps) {
  if (hasApplied) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-green-400 font-semibold mb-2">
          <CheckCircle2 className="w-5 h-5" />
          Du har søkt
        </div>
        <p className="text-xs text-[#666]">Vi har mottatt din søknad</p>
        <Link href="/dashboard/candidate" className="text-primary text-sm hover:underline mt-2 block">
          Se mine søknader →
        </Link>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center">
        <p className="text-sm text-[#999] mb-4">Logg inn for å søke på denne stillingen</p>
        <Link href={`/auth/login`}>
          <Button className="w-full" size="lg">
            <LogIn className="w-4 h-4" />
            Logg inn for å søke
          </Button>
        </Link>
        <Link href="/auth/register" className="text-primary text-sm hover:underline mt-3 block">
          Opprett konto gratis →
        </Link>
      </div>
    )
  }

  if (userRole === 'company') {
    return (
      <div className="text-center text-sm text-[#666]">
        <p>Bedriftskontoer kan ikke søke på stillinger</p>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/apply/${jobId}`}>
        <Button className="w-full" size="lg">
          <Send className="w-4 h-4" />
          Søk på stillingen
        </Button>
      </Link>
      <p className="text-xs text-[#666] text-center mt-2">
        Du vil laste opp CV og svare på noen spørsmål
      </p>
    </div>
  )
}
