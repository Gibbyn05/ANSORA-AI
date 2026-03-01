'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { Message } from '@/types'

interface MessageThreadProps {
  applicationId: string
  senderRole: 'company' | 'candidate'
  initialMessages?: Message[]
}

export function MessageThread({ applicationId, senderRole, initialMessages = [] }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Mark incoming messages as read on mount
    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    }).catch(() => {})
  }, [applicationId])

  const sendMessage = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages((prev) => [...prev, data.message])
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved sending')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Message list */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-[#4a6358] text-center py-8">
            Ingen meldinger ennå. Send en melding for å starte samtalen.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_role === senderRole
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isOwn
                    ? 'bg-[#C5AFA0] text-black'
                    : 'bg-[#1a2c24] border border-[#94A187]/25 text-[#C5AFA0]'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? 'opacity-60' : 'text-[#4a6358]'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[#29524A]/25">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv en melding…"
          className="flex-1 bg-[#0e1c17] border border-[#29524A]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#3a5248] outline-none focus:border-[#94A187]/50 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !content.trim()}
          className="bg-[#C5AFA0] hover:bg-[#b09e91] text-black font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
