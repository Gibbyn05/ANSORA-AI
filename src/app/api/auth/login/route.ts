import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/login
 *
 * Handles email/password login server-side and sets the session cookies
 * directly in the HTTP response via Set-Cookie headers.
 *
 * This is more reliable than the browser-client approach (document.cookie)
 * because the cookies are guaranteed to be in the response before the
 * browser processes it — no async timing issues.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ error: 'Server ikke konfigurert' }, { status: 500 })
  }

  let email: string, password: string
  try {
    ;({ email, password } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })

  // Collect cookies prepared by the onAuthStateChange callback
  const pendingCookies: Parameters<typeof response.cookies.set>[] = []
  let resolveSetAll: (() => void) | undefined
  const setAllDone = new Promise<void>((r) => { resolveSetAll = r })

  const supabase = createServerClient(url, key, {
    cookies: {
      // Provide existing cookies so the server client can clean up old chunks
      getAll: () => request.cookies.getAll(),
      // Collect cookies; resolve the promise so we know they are ready
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          pendingCookies.push([name, value, options])
        )
        resolveSetAll?.()
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message ?? ''
    if (msg.toLowerCase().includes('email not confirmed')) {
      return NextResponse.json(
        { error: 'E-posten din er ikke bekreftet ennå. Sjekk innboksen din.' },
        { status: 401 },
      )
    }
    if (msg === 'Failed to fetch' || msg.toLowerCase().includes('fetch')) {
      return NextResponse.json(
        { error: 'Kunne ikke koble til serveren. Sjekk at Supabase-prosjektet er aktivt.' },
        { status: 503 },
      )
    }
    return NextResponse.json(
      { error: 'Feil e-post eller passord. Prøv igjen.' },
      { status: 401 },
    )
  }

  // Wait for the internal onAuthStateChange callback to call setAll (max 3 s)
  await Promise.race([setAllDone, new Promise<void>((r) => setTimeout(r, 3000))])

  // Write the session cookies into the HTTP response
  pendingCookies.forEach((args) => response.cookies.set(...args))

  return response
}
