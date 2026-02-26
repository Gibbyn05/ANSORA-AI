'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
      return { error: 'Kunne ikke koble til serveren. Sjekk at Supabase-prosjektet er aktivt.' }
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'E-posten din er ikke bekreftet ennå. Sjekk innboksen din.' }
    }
    return { error: 'Feil e-post eller passord. Prøv igjen.' }
  }

  return { success: true }
}
