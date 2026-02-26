'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Send, Bot, User, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react'
import type { InterviewMessage } from '@/types'


export default function InterviewPage({
  params,
}: {
  params: { applicationId: string }
}) {
  
  const { applicationId } = params
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Topplinje */}
      <div className="bg-[#111111] border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard/candidate" className="text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#d7fe03] rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm">AI-Intervju</h1>
            <p className="text-xs text-[#666]">Powered by Ansora</p>
          </div>
        </div>
        {isCompleted && (
          <div className="ml-auto flex items-center gap-1.5 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fullført
          </div>
        )}
      </div>

      {/* Chat-område */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto">
        {!started ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-[#d7fe03]/10 rounded-full flex items-center justify-center mb-6 border border-[#d7fe03]/20">
              <Bot className="w-12 h-12 text-[#d7fe03]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Klar for AI-intervju?</h2>
            <p className="text-[#999] mb-6 max-w-md leading-relaxed">
              Du vil nå gjennomføre et tekstbasert intervju med vår AI. Intervjuet tar ca. 10-15 minutter og vil bli lagret og vist til rekrutterer.
            </p>

            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 mb-8 text-left max-w-md w-full">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d7fe03]" />
                Tips for intervjuet
              </h3>
              <ul className="space-y-2 text-sm text-[#999]">
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
                    ? 'bg-[#d7fe03]'
                    : 'bg-white/10'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-black" />
                    : <User className="w-4 h-4 text-[#999]" />
                  }
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'assistant'
                    ? 'bg-[#1a1a1a] border border-white/10 rounded-tl-sm text-[#ccc]'
                    : 'bg-[#d7fe03] text-black rounded-tr-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${
                    msg.role === 'user' ? 'text-black/50' : 'text-[#555]'
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
                <div className="w-8 h-8 rounded-full bg-[#d7fe03] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-[#444] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Intervjuet er fullført!</h3>
                <p className="text-[#999] text-sm mb-6">
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
        <div className="bg-[#111111] border-t border-white/10 p-4">
          <div className="max-w-3xl mx-auto">
            {error && (
              <p className="text-red-400 text-sm mb-2">{error}</p>
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
