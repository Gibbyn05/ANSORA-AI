import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai/client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'Lydfil er påkrevd' }, { status: 400 })
    }

    const openai = getOpenAIClient()
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Transkripsjonsfeil:', error)
    return NextResponse.json({ error: 'Transkripsjon feilet' }, { status: 500 })
  }
}
