import OpenAI from 'openai'

// Lazy-initialisering – klienten opprettes kun ved første kall, ikke ved build-tid
let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}
