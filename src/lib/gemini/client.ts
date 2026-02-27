import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
}

export function getModel(jsonMode = false): GenerativeModel {
  const genAI = new GoogleGenerativeAI(getApiKey())
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: jsonMode
      ? { responseMimeType: 'application/json' }
      : undefined,
  })
}
