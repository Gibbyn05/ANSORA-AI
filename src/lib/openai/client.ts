import OpenAI from 'openai'

// OpenAI-klient kun brukt server-side
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
