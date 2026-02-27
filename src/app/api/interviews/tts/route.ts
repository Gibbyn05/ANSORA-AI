import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai/client'

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'nova' } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'Text er påkrevd' }, { status: 400 })
    }

    const openai = getOpenAIClient()
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('TTS-feil:', error)
    return NextResponse.json({ error: 'TTS feilet' }, { status: 500 })
  }
}
