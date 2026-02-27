import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/signout
 *
 * Signs the user out by calling supabase.auth.signOut() server-side.
 * This clears the session cookies via Set-Cookie headers and redirects
 * to the login page. Used as a plain <a href> so it works without JS.
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const response = NextResponse.redirect(new URL('/auth/login', request.url))

  if (!url || !key) {
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  await supabase.auth.signOut()

  return response
}
