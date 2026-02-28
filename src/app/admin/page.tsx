'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Building2,
  Mail, Globe, RefreshCw, Loader2,
} from 'lucide-react'

interface CompanyRow {
  id: string
  name: string
  email: string
  website?: string
  description?: string
  approved: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/companies')
    if (res.status === 403) {
      router.replace('/dashboard')
      return
    }
    const data = await res.json()
    if (data.companies) setCompanies(data.companies)
    else setError(data.error ?? 'Feil ved lasting')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const handleAction = async (companyId: string, action: 'approve' | 'reject', companyName: string) => {
    setActionLoading(companyId + action)
    const res = await fetch('/api/admin/companies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, action }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Feil')
    } else {
      setCompanies((prev) =>
        action === 'reject'
          ? prev.filter((c) => c.id !== companyId)
          : prev.map((c) => c.id === companyId ? { ...c, approved: true } : c)
      )
      showToast(action === 'approve' ? `${companyName} er godkjent ✓` : `${companyName} er avvist`)
    }
    setActionLoading(null)
  }

  const pending = companies.filter((c) => !c.approved)
  const approved = companies.filter((c) => c.approved)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#111] border border-green-500/30 text-green-400 text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-1">Ansora</p>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#d7fe03]" />
              Admin – Bedriftsgodkjenning
            </h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-white/[0.1] hover:border-white/[0.2] text-[#888] hover:text-white text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Oppdater
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#d7fe03] animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-orange-400" />
                <h2 className="font-semibold text-white text-sm">Venter på godkjenning</h2>
                {pending.length > 0 && (
                  <span className="ml-1 bg-orange-900/40 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>

              {pending.length === 0 ? (
                <div className="bg-[#111] border border-white/[0.07] rounded-2xl px-6 py-10 text-center">
                  <p className="text-[#555] text-sm">Ingen bedrifter venter på godkjenning</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((c) => (
                    <div key={c.id} className="bg-[#111] border border-orange-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-900/30 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1 text-xs text-[#666]">
                              <Mail className="w-3 h-3" />
                              {c.email}
                            </span>
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[#d7fe03] hover:underline"
                              >
                                <Globe className="w-3 h-3" />
                                {c.website}
                              </a>
                            )}
                            <span className="text-xs text-[#444]">Registrert {formatDate(c.created_at)}</span>
                          </div>
                          {c.description && (
                            <p className="text-xs text-[#666] mt-1.5 max-w-sm">{c.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAction(c.id, 'reject', c.name)}
                          disabled={actionLoading !== null}
                          className="inline-flex items-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-900/20 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === c.id + 'reject' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Avvis
                        </button>
                        <button
                          onClick={() => handleAction(c.id, 'approve', c.name)}
                          disabled={actionLoading !== null}
                          className="inline-flex items-center gap-1.5 bg-[#d7fe03] hover:bg-[#c8ef00] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === c.id + 'approve' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Godkjenn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Approved */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h2 className="font-semibold text-white text-sm">Godkjente bedrifter</h2>
                <span className="ml-1 text-xs text-[#444]">({approved.length})</span>
              </div>

              {approved.length === 0 ? (
                <div className="bg-[#111] border border-white/[0.07] rounded-2xl px-6 py-10 text-center">
                  <p className="text-[#555] text-sm">Ingen godkjente bedrifter ennå</p>
                </div>
              ) : (
                <div className="bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/[0.04]">
                    {approved.map((c) => (
                      <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-900/20 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{c.name}</p>
                            <p className="text-xs text-[#555]">{c.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-[#444]">{formatDate(c.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
