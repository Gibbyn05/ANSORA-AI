'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Mic, CheckCircle2, Bot, Sparkles, Camera, CameraOff, VideoOff, Square } from 'lucide-react'
import type { InterviewMessage } from '@/types'

type Phase = 'idle' | 'ai-speaking' | 'listening' | 'processing' | 'uploading' | 'completed'
type CameraRequired = 'disabled' | 'optional' | 'required'

// Voice Activity Detection constants
const VAD_SILENCE_THRESHOLD = 10  // avg amplitude below this = silence
const VAD_SILENCE_MS = 2000       // 2s consecutive silence → auto-submit
const VAD_MIN_SPEECH_MS = 800     // must have spoken ≥0.8s before silence detection kicks in

const STATUS_LABELS: Record<Phase, string> = {
  idle: '',
  'ai-speaking': 'AI snakker...',
  listening: 'Lytter...',
  processing: 'Behandler...',
  uploading: 'Lagrer opptak...',
  completed: 'Intervjuet er fullført',
}

export default function InterviewPage({ params }: { params: { applicationId: string } }) {
  const { applicationId } = params

  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<InterviewMessage[]>([])
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')
  const [micBars, setMicBars] = useState<number[]>(Array(20).fill(4))
  // 0–100: how close to auto-submitting on silence
  const [silenceProgress, setSilenceProgress] = useState(0)

  // Camera
  const [cameraRequired, setCameraRequired] = useState<CameraRequired>('optional')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // Persistent mic stream (lives for the entire interview)
  const micStreamRef = useRef<MediaStream | null>(null)

  // Per-turn recorder (audio only, for transcription)
  const turnRecorderRef = useRef<MediaRecorder | null>(null)
  const turnChunksRef = useRef<Blob[]>([])

  // Full-interview recorder (video+audio or audio-only, for company playback)
  const fullRecorderRef = useRef<MediaRecorder | null>(null)
  const fullChunksRef = useRef<Blob[]>([])
  const fullMimeTypeRef = useRef<string>('audio/webm')

  // Audio analysis
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // VAD
  const lastSoundRef = useRef<number>(Date.now())
  const hasSpokeRef = useRef(false)
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingStartRef = useRef<number>(0)

  // Allows sendMessage → startListening cycle without circular useCallback deps
  const startListeningRef = useRef<() => Promise<void>>(() => Promise.resolve())

  // Fetch camera_required
  useEffect(() => {
    fetch(`/api/interviews?applicationId=${applicationId}`)
      .then(r => r.json())
      .then(d => { if (d.camera_required) setCameraRequired(d.camera_required as CameraRequired) })
      .catch(() => {})
  }, [applicationId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current)
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      cameraStreamRef.current?.getTracks().forEach(t => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  // ── Camera helpers ────────────────────────────────────────────────────────

  const startCamera = useCallback(async (): Promise<boolean> => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      cameraStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setCameraEnabled(true)
      return true
    } catch {
      setCameraError('Kunne ikke få tilgang til kamera. Sjekk tillatelser i nettleseren.')
      if (cameraRequired === 'required') {
        setError('Kamera er påkrevd for dette intervjuet. Gi tilgang og prøv igjen.')
      }
      return false
    }
  }, [cameraRequired])

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach(t => t.stop())
    cameraStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraEnabled(false)
  }, [])

  const toggleCamera = useCallback(() => {
    if (cameraEnabled) stopCamera()
    else startCamera()
  }, [cameraEnabled, startCamera, stopCamera])

  // ── Mic visualiser ────────────────────────────────────────────────────────

  const stopMicViz = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    setMicBars(Array(20).fill(4))
    audioCtxRef.current?.close()
    audioCtxRef.current = null
  }, [])

  // ── Full-interview recording ──────────────────────────────────────────────

  const startFullRecording = useCallback(() => {
    if (!micStreamRef.current) return

    // Combine video (if available) + audio
    const tracks: MediaStreamTrack[] = [
      ...(cameraStreamRef.current?.getVideoTracks() ?? []),
      ...micStreamRef.current.getAudioTracks(),
    ]
    const stream = new MediaStream(tracks)

    const hasVideo = tracks.some(t => t.kind === 'video')
    const mimeType = hasVideo
      ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm'
        : 'audio/webm')
      : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4')

    fullMimeTypeRef.current = mimeType
    fullChunksRef.current = []

    const recorder = new MediaRecorder(stream, { mimeType })
    fullRecorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) fullChunksRef.current.push(e.data) }
    recorder.start(1000) // chunk every 1s
  }, [])

  const uploadRecording = useCallback(async () => {
    if (fullChunksRef.current.length === 0) return
    try {
      const mimeType = fullMimeTypeRef.current
      const blob = new Blob(fullChunksRef.current, { type: mimeType })
      const ext = mimeType.startsWith('video/') ? 'webm'
        : mimeType === 'audio/mp4' ? 'm4a' : 'webm'

      const fd = new FormData()
      fd.append('applicationId', applicationId)
      fd.append('recording', blob, `interview.${ext}`)
      await fetch('/api/interviews/recording', { method: 'POST', body: fd })
    } catch (e) {
      console.warn('Opplasting av opptak feilet:', e)
    }
  }, [applicationId])

  // ── TTS ───────────────────────────────────────────────────────────────────

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

  // ── Interview API ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (userText: string | null) => {
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

    const lastAI = [...(data.transcript as InterviewMessage[])].reverse().find(m => m.role === 'assistant')
    if (lastAI) {
      setPhase('ai-speaking')
      setCaption(lastAI.content)
      await playTTS(lastAI.content)
    }

    if (data.isCompleted) {
      fullRecorderRef.current?.stop()
      setPhase('uploading')
      await uploadRecording()
      setPhase('completed')
      stopCamera()
    } else {
      // Automatically start listening after AI finishes speaking
      await startListeningRef.current()
    }
  }, [applicationId, playTTS, uploadRecording, stopCamera])

  // ── Auto-listen with VAD ──────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (!micStreamRef.current) return
    setError('')

    // Reset VAD state
    turnChunksRef.current = []
    hasSpokeRef.current = false
    lastSoundRef.current = Date.now()
    recordingStartRef.current = Date.now()
    setSilenceProgress(0)

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const audioStream = new MediaStream(micStreamRef.current.getAudioTracks())
    const turnRecorder = new MediaRecorder(audioStream, { mimeType })
    turnRecorderRef.current = turnRecorder

    turnRecorder.ondataavailable = e => { if (e.data.size > 0) turnChunksRef.current.push(e.data) }

    turnRecorder.onstop = async () => {
      if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null }
      stopMicViz()
      setSilenceProgress(0)

      const blob = new Blob(turnChunksRef.current, { type: mimeType })
      try {
        setPhase('processing')
        const fd = new FormData()
        fd.append('audio', blob, `recording.${mimeType === 'audio/mp4' ? 'm4a' : 'webm'}`)

        const tr = await fetch('/api/interviews/transcribe', { method: 'POST', body: fd })
        const td = await tr.json()
        if (!tr.ok) throw new Error(td.error)

        const text: string = td.text?.trim() ?? ''
        if (!text) {
          setError('Ingen tale oppdaget – lytter på nytt...')
          await startListeningRef.current()
          return
        }

        setCaption(text)
        await sendMessage(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Feil – lytter på nytt om 2s...')
        setTimeout(() => { startListeningRef.current() }, 2000)
      }
    }

    // Audio analyser for mic visualiser + VAD
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    ctx.createMediaStreamSource(audioStream).connect(analyser)

    const tick = () => {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length

      if (avg > VAD_SILENCE_THRESHOLD) {
        lastSoundRef.current = Date.now()
        hasSpokeRef.current = true
      }

      setMicBars(Array.from({ length: 20 }, (_, i) => {
        const idx = Math.floor((i / 20) * data.length)
        return Math.max(4, (data[idx] / 255) * 60)
      }))

      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()

    // VAD checker – fires every 80ms
    vadIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current
      const silenceMs = Date.now() - lastSoundRef.current

      if (hasSpokeRef.current && elapsed >= VAD_MIN_SPEECH_MS) {
        setSilenceProgress(Math.min(100, (silenceMs / VAD_SILENCE_MS) * 100))
        if (silenceMs >= VAD_SILENCE_MS) {
          turnRecorder.stop()
        }
      }
    }, 80)

    turnRecorder.start()
    setPhase('listening')
  }, [sendMessage, stopMicViz])

  // Keep ref in sync so sendMessage can call it without circular deps
  useEffect(() => { startListeningRef.current = startListening }, [startListening])

  // ── Start interview ───────────────────────────────────────────────────────

  const startInterview = async () => {
    setPhase('processing')
    setError('')
    try {
      if (cameraRequired === 'required') {
        const ok = await startCamera()
        if (!ok) { setPhase('idle'); return }
      }

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = mic

      // Small delay to let camera stream settle before starting full recording
      setTimeout(() => startFullRecording(), 100)

      await sendMessage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feil ved start')
      setPhase('idle')
    }
  }

  // ── Manual stop (fallback for users who want to submit early) ─────────────

  const submitNow = () => {
    if (turnRecorderRef.current?.state === 'recording') {
      turnRecorderRef.current.stop()
    }
  }

  const cameraLabel = cameraRequired === 'required' ? 'Kamera er påkrevd'
    : cameraRequired === 'optional' ? 'Kamera er valgfritt' : null

  // ── Idle / start screen ───────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-[#06070E] flex flex-col">
        <header className="bg-[#0e1c17] border-b border-[#94A187]/25 px-4 py-3 flex items-center gap-4">
          <Link href="/dashboard/candidate" className="text-[#7a8a7d] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C5AFA0] rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="font-semibold text-white text-sm">AI-Intervju</h1>
              <p className="text-xs text-[#7a8a7d]">Powered by Ansora</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-24 h-24 bg-[#29524A]/20 rounded-full flex items-center justify-center mb-6 border border-[#94A187]/35">
            <Mic className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Klar for AI-intervju?</h2>
          <p className="text-[#94A187] mb-6 max-w-md leading-relaxed">
            Du vil gjennomføre en naturlig stemmesamtale med vår AI. Intervjuet tar ca. 10–15 minutter og lagres for rekrutterer.
          </p>

          {cameraLabel && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
              cameraRequired === 'required'
                ? 'bg-orange-900/20 border-orange-500/30 text-orange-300'
                : 'bg-blue-900/20 border-blue-500/20 text-blue-300'
            }`}>
              <Camera className="w-4 h-4 flex-shrink-0" />
              <span>{cameraLabel} for dette intervjuet</span>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 mb-8 text-left max-w-md w-full">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              Slik fungerer det
            </h3>
            <ul className="space-y-2 text-sm text-[#94A187]">
              <li>• AI-en stiller spørsmål – svar naturlig med stemmen din</li>
              <li>• Den lytter automatisk og oppdager når du er ferdig</li>
              <li>• Snakk tydelig i et stille rom</li>
              <li>• Gi konkrete eksempler når mulig</li>
              {cameraRequired !== 'disabled' && (
                <li>• {cameraRequired === 'required' ? 'Kamera er påkrevd – sørg for god belysning' : 'Du kan aktivere kamera hvis du ønsker'}</li>
              )}
            </ul>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <Button onClick={startInterview} size="lg">
            <Mic className="w-5 h-5" />
            Start samtaleintervju
          </Button>
        </div>
      </div>
    )
  }

  // ── Main interview interface ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#06070E] flex flex-col">
      <header className="bg-[#0e1c17] border-b border-[#94A187]/25 px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard/candidate" className="text-[#7a8a7d] hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C5AFA0] rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm">AI-Intervju</h1>
            <p className="text-xs text-[#7a8a7d]">Powered by Ansora</p>
          </div>
        </div>
        {phase === 'completed' && (
          <div className="ml-auto flex items-center gap-1.5 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fullført
          </div>
        )}
        {phase !== 'completed' && messages.length > 0 && (
          <p className="ml-auto text-xs text-[#4a6358]">
            {messages.filter(m => m.role === 'user').length} / 7 svar
          </p>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Camera panel */}
        {cameraRequired !== 'disabled' && (
          <div className="lg:w-72 lg:border-r border-b lg:border-b-0 border-[#29524A]/25 bg-[#06070E] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4a6358] font-semibold uppercase tracking-wider">Kamera</span>
              {cameraRequired === 'optional' && phase !== 'completed' && (
                <button
                  onClick={toggleCamera}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    cameraEnabled
                      ? 'bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50'
                      : 'bg-[#29524A]/12 text-[#94A187] border border-[#29524A]/30 hover:bg-[#29524A]/20'
                  }`}
                >
                  {cameraEnabled ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                  {cameraEnabled ? 'Skru av' : 'Skru på'}
                </button>
              )}
              {cameraRequired === 'required' && (
                <span className="text-xs text-orange-400 font-medium">Påkrevd</span>
              )}
            </div>

            <div className="relative aspect-video bg-[#0e1c17] rounded-xl border border-[#29524A]/25 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover ${cameraEnabled ? 'block' : 'hidden'}`}
              />
              {!cameraEnabled && (
                <div className="flex flex-col items-center gap-2 text-[#2a3e36]">
                  <VideoOff className="w-8 h-8" />
                  <span className="text-xs">Kamera av</span>
                </div>
              )}
              {cameraEnabled && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_#4ade80]" />
              )}
            </div>

            {cameraError && <p className="text-xs text-red-400 leading-relaxed">{cameraError}</p>}
          </div>
        )}

        {/* Main voice interface */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 py-8">

          {/* Avatar with glow rings */}
          <div className="relative flex items-center justify-center">
            {phase === 'ai-speaking' && (
              <>
                <div className="absolute w-60 h-60 rounded-full bg-[#29524A]/15 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute w-48 h-48 rounded-full bg-[#29524A]/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              </>
            )}
            {phase === 'listening' && (
              <>
                <div className="absolute w-60 h-60 rounded-full bg-[#94A187]/10 animate-ping" style={{ animationDuration: '1.6s' }} />
                <div className="absolute w-48 h-48 rounded-full bg-[#94A187]/15 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.4s' }} />
              </>
            )}

            <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              phase === 'ai-speaking' ? 'bg-[#29524A]/25 border-white shadow-[0_0_60px_#29524A50]'
              : phase === 'listening' ? 'bg-[#94A187]/15 border-[#94A187] shadow-[0_0_60px_#94A18730]'
              : phase === 'completed' ? 'bg-green-900/30 border-green-500'
              : 'bg-[#1a2c24] border-[#94A187]/25'
            }`}>
              {phase === 'completed' ? (
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              ) : phase === 'listening' ? (
                <Mic className="w-16 h-16 text-[#94A187]" />
              ) : (
                <Bot className={`w-16 h-16 ${phase === 'ai-speaking' ? 'text-white' : 'text-[#3a5248]'}`} />
              )}
            </div>
          </div>

          {/* Status */}
          <p className="text-[#4a6358] text-xs font-semibold tracking-widest uppercase">
            {STATUS_LABELS[phase]}
          </p>

          {/* Waveform */}
          <div className="flex items-center justify-center gap-[3px] h-16 w-52">
            {phase === 'ai-speaking'
              ? Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="w-1.5 rounded-full bg-[#C5AFA0]"
                    style={{ height: '4px', animation: 'voice-bar 0.7s ease-in-out infinite alternate', animationDelay: `${i * 0.04}s` }}
                  />
                ))
              : micBars.map((h, i) => (
                  <div key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${phase === 'listening' ? 'bg-[#94A187]' : 'bg-[#2a2a2a]'}`}
                    style={{ height: `${h}px` }}
                  />
                ))}
          </div>

          {/* Silence countdown bar – only visible when user is speaking & about to auto-submit */}
          {phase === 'listening' && silenceProgress > 5 && (
            <div className="w-52 flex flex-col items-center gap-1.5">
              <div className="w-full h-1 bg-[#1a2c24] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#94A187] rounded-full transition-all duration-100"
                  style={{ width: `${silenceProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-[#3a5248]">Sender automatisk når du er ferdig...</p>
            </div>
          )}

          {/* Caption */}
          {caption && (
            <p className="max-w-sm text-center text-white/60 text-sm leading-relaxed italic px-4">
              &ldquo;{caption}&rdquo;
            </p>
          )}

          {error && <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="p-8 flex justify-center border-t border-[#29524A]/20">
        {phase === 'completed' ? (
          <Link href="/dashboard/candidate">
            <Button size="lg">
              <CheckCircle2 className="w-5 h-5" />
              Tilbake til dashboard
            </Button>
          </Link>
        ) : phase === 'listening' ? (
          // Manual submit button as fallback
          <button
            onClick={submitNow}
            className="flex items-center gap-2 text-sm text-[#4a6358] hover:text-white border border-[#29524A]/40 hover:border-[#94A187]/40 px-5 py-2.5 rounded-full transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            Send svar nå
          </button>
        ) : (
          /* processing / ai-speaking / uploading – spinner placeholder */
          <div className="w-14 h-14 rounded-full bg-[#0e1c17] border border-[#94A187]/25 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#444] animate-bounce"
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
