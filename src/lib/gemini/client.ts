import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini-klient kun brukt server-side
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
