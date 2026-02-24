'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Send, Bot, User, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react'
import type { InterviewMessage } from '@/types'
import React from 'react'

export default function InterviewPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const resolvedParams = React.use(params)
  const applicationId = resolvedParams.applicationId
  const router = useRouter()

  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startInterview = async () => {
    setLoading(true)
    setStarted(true)
    setError('')

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, message: null }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages(data.transcript)
      setIsCompleted(data.isCompleted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved start av intervju')
      setStarted(false)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || isCompleted) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setError('')

    // Legg til brukermelding umiddelbart
    const userMsg: InterviewMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, message: userMessage }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages(data.transcript)
      setIsCompleted(data.isCompleted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved sending av melding')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      {/* Topplinje */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard/candidate" className="text-gray-500 hover:text-navy transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-navy text-sm">AI-Intervju</h1>
            <p className="text-xs text-gray-500">Powered by Ansora</p>
          </div>
        </div>
        {isCompleted && (
          <div className="ml-auto flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fullført
          </div>
        )}
      </div>

      {/* Chat-område */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto">
        {!started ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Klar for AI-intervju?</h2>
            <p className="text-gray-500 mb-6 max-w-md leading-relaxed">
              Du vil nå gjennomføre et tekstbasert intervju med vår AI. Intervjuet tar ca. 10-15 minutter og vil bli lagret og vist til rekrutterer.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 text-left max-w-md w-full">
              <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Tips for intervjuet
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Svar ærlig og utfyllende</li>
                <li>• Gi konkrete eksempler når mulig</li>
                <li>• Du kan ta pauser mellom svarene</li>
                <li>• Skriv på det språket du er mest komfortabel med</li>
              </ul>
            </div>

            <Button onClick={startInterview} loading={loading} size="lg">
              <Bot className="w-5 h-5" />
              Start intervjuet
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-fade-in ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-primary to-blue-700'
                    : 'bg-gray-200'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4 text-gray-600" />
                  }
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'assistant'
                    ? 'bg-white border border-gray-100 shadow-sm rounded-tl-sm text-gray-700'
                    : 'bg-primary text-white rounded-tr-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${
                    msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('nb-NO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">Intervjuet er fullført!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Flott gjennomføring! Rekrutterer vil nå motta transskriptet og AI-analysen.
                </p>
                <Link href="/dashboard/candidate">
                  <Button size="lg">
                    Tilbake til dashboard
                  </Button>
                </Link>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Inputfelt */}
      {started && !isCompleted && (
        <div className="bg-white border-t border-gray-100 p-4">
          <div className="max-w-3xl mx-auto">
            {error && (
              <p className="text-red-600 text-sm mb-2">{error}</p>
            )}
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder="Skriv ditt svar... (Enter for å sende, Shift+Enter for ny linje)"
                className="flex-1 input resize-none text-sm max-h-40"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="md"
                className="flex-shrink-0 h-[46px] w-[46px] !px-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
