'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Mic, MicOff, CheckCircle2, Bot, Sparkles } from 'lucide-react'
import type { InterviewMessage } from '@/types'

type Phase =
  | 'idle'
  | 'ai-speaking'
  | 'user-turn'
  | 'recording'
  | 'processing'
  | 'completed'

const STATUS_LABELS: Record<Phase, string> = {
  idle: '',
  'ai-speaking': 'AI snakker...',
  'user-turn': 'Trykk for å svare',
  recording: 'Tar opp – trykk for å stoppe',
  processing: 'Behandler...',
  completed: 'Intervjuet er fullført',
}

export default function InterviewPage({
  params,
}: {
  params: { applicationId: string }
}) {
  const { applicationId } = params

  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [micBars, setMicBars] = useState<number[]>(Array(20).fill(4))

  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  // --- Mic waveform ---
  const startMicViz = (stream: MediaStream) => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    ctx.createMediaStreamSource(stream).connect(analyser)

    const tick = () => {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      setMicBars(
        Array.from({ length: 20 }, (_, i) => {
          const idx = Math.floor((i / 20) * data.length)
          return Math.max(4, (data[idx] / 255) * 60)
        })
      )
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const stopMicViz = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    setMicBars(Array(20).fill(4))
    audioCtxRef.current?.close()
    audioCtxRef.current = null
  }

  // --- TTS playback ---
  const playTTS = useCallback(async (text: string): Promise<void> => {
    const res = await fetch('/api/interviews/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('TTS feilet')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    return new Promise((resolve, reject) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Avspilling feilet')) }
      audio.play().catch(reject)
    })
  }, [])

  // --- Interview API ---
  const sendMessage = useCallback(
    async (userText: string | null) => {
      setPhase('processing')
      setError('')

      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, message: userText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages(data.transcript)

      const lastAI = [...(data.transcript as InterviewMessage[])]
        .reverse()
        .find((m) => m.role === 'assistant')

      if (lastAI) {
        setPhase('ai-speaking')
        setCaption(lastAI.content)
        await playTTS(lastAI.content)
      }

      if (data.isCompleted) {
        setPhase('completed')
      } else {
        setPhase('user-turn')
      }
    },
    [applicationId, playTTS]
  )

  // --- Recording ---
  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        stopMicViz()

        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext = mimeType === 'audio/mp4' ? 'mp4' : 'webm'

        try {
          setPhase('processing')
          const fd = new FormData()
          fd.append('audio', blob, `recording.${ext}`)

          const tr = await fetch('/api/interviews/transcribe', {
            method: 'POST',
            body: fd,
          })
          const td = await tr.json()
          if (!tr.ok) throw new Error(td.error)

          const text: string = td.text?.trim() ?? ''
          if (!text) {
            setError('Ingen tale registrert – prøv igjen.')
            setPhase('user-turn')
            return
          }

          setCaption(text)
          await sendMessage(text)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Feil ved behandling')
          setPhase('user-turn')
        }
      }

      startMicViz(stream)
      recorder.start()
      setPhase('recording')
    } catch {
      setError('Kunne ikke få tilgang til mikrofon. Sjekk tillatelser i nettleseren.')
    }
  }

  const stopRecording = () => recorderRef.current?.stop()

  // --- Start screen ---
  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <header className="bg-[#111111] border-b border-white/10 px-4 py-3 flex items-center gap-4">
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
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-24 h-24 bg-[#d7fe03]/10 rounded-full flex items-center justify-center mb-6 border border-[#d7fe03]/20">
            <Mic className="w-12 h-12 text-[#d7fe03]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Klar for AI-intervju?</h2>
          <p className="text-[#999] mb-6 max-w-md leading-relaxed">
            Du vil gjennomføre et stemmebasert intervju med vår AI. Intervjuet tar ca. 10–15 minutter og lagres for rekrutterer.
          </p>

          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 mb-8 text-left max-w-md w-full">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d7fe03]" />
              Tips for intervjuet
            </h3>
            <ul className="space-y-2 text-sm text-[#999]">
              <li>• Svar ærlig og utfyllende</li>
              <li>• Snakk tydelig inn i mikrofonen</li>
              <li>• Gi konkrete eksempler når mulig</li>
              <li>• Sørg for at du er i et stille rom</li>
            </ul>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <Button
            onClick={async () => {
              setPhase('processing')
              try {
                await sendMessage(null)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Feil ved start')
                setPhase('idle')
              }
            }}
            size="lg"
          >
            <Mic className="w-5 h-5" />
            Start stemmeintervjuet
          </Button>
        </div>
      </div>
    )
  }

  // --- Voice interface ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="bg-[#111111] border-b border-white/10 px-4 py-3 flex items-center gap-4">
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
        {phase === 'completed' && (
          <div className="ml-auto flex items-center gap-1.5 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fullført
          </div>
        )}
        {/* Question progress */}
        {phase !== 'completed' && messages.length > 0 && (
          <p className="ml-auto text-xs text-[#555]">
            {messages.filter((m) => m.role === 'user').length} / 7 svar
          </p>
        )}
      </header>

      {/* Voice interface */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10">

        {/* Avatar with glow rings */}
        <div className="relative flex items-center justify-center">
          {phase === 'ai-speaking' && (
            <>
              <div className="absolute w-60 h-60 rounded-full bg-[#d7fe03]/5 animate-ping"
                style={{ animationDuration: '2s' }} />
              <div className="absolute w-48 h-48 rounded-full bg-[#d7fe03]/10 animate-ping"
                style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            </>
          )}
          {phase === 'recording' && (
            <>
              <div className="absolute w-60 h-60 rounded-full bg-red-500/5 animate-ping"
                style={{ animationDuration: '1.4s' }} />
              <div className="absolute w-48 h-48 rounded-full bg-red-500/10 animate-ping"
                style={{ animationDuration: '1.4s', animationDelay: '0.3s' }} />
            </>
          )}

          <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
            phase === 'ai-speaking'
              ? 'bg-[#d7fe03]/15 border-[#d7fe03] shadow-[0_0_60px_#d7fe0330]'
              : phase === 'recording'
              ? 'bg-red-500/15 border-red-500 shadow-[0_0_60px_#ef444430]'
              : phase === 'completed'
              ? 'bg-green-900/30 border-green-500'
              : 'bg-[#1a1a1a] border-white/10'
          }`}>
            {phase === 'completed' ? (
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            ) : phase === 'recording' ? (
              <Mic className="w-16 h-16 text-red-400" />
            ) : (
              <Bot className={`w-16 h-16 ${phase === 'ai-speaking' ? 'text-[#d7fe03]' : 'text-[#444]'}`} />
            )}
          </div>
        </div>

        {/* Status label */}
        <p className="text-[#555] text-xs font-semibold tracking-widest uppercase">
          {STATUS_LABELS[phase]}
        </p>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[3px] h-16 w-52">
          {phase === 'ai-speaking'
            ? Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-[#d7fe03]"
                  style={{
                    height: '4px',
                    animation: 'voice-bar 0.7s ease-in-out infinite alternate',
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))
            : micBars.map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    phase === 'recording' ? 'bg-red-400' : 'bg-[#2a2a2a]'
                  }`}
                  style={{ height: `${h}px` }}
                />
              ))}
        </div>

        {/* Caption */}
        {caption && (
          <p className="max-w-sm text-center text-white/60 text-sm leading-relaxed italic px-4">
            &ldquo;{caption}&rdquo;
          </p>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>
        )}
      </div>

      {/* Mic / control button */}
      <div className="p-10 flex justify-center">
        {phase === 'completed' ? (
          <Link href="/dashboard/candidate">
            <Button size="lg">
              <CheckCircle2 className="w-5 h-5" />
              Tilbake til dashboard
            </Button>
          </Link>
        ) : phase === 'user-turn' ? (
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-[#d7fe03] hover:bg-[#c5eb00] active:scale-95 transition-all duration-150 flex items-center justify-center shadow-[0_0_40px_#d7fe0340] hover:shadow-[0_0_60px_#d7fe0360]"
            aria-label="Start opptak"
          >
            <Mic className="w-8 h-8 text-black" />
          </button>
        ) : phase === 'recording' ? (
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-150 flex items-center justify-center shadow-[0_0_40px_#ef444440] animate-pulse"
            aria-label="Stopp opptak"
          >
            <MicOff className="w-8 h-8 text-white" />
          </button>
        ) : (
          /* processing / ai-speaking – inactive placeholder */
          <div className="w-20 h-20 rounded-full bg-[#111] border border-white/10 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#444] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
