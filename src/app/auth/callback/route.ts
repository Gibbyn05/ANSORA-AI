import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle errors from Supabase (e.g. expired link)
  if (error) {
    const msg = error_description ?? error
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(msg)}`
    )
  }

  const supabase = await createClient()

  // PKCE flow (code exchange)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }
  }

  // Email confirmation / magic link (token_hash flow)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'recovery' | 'invite',
    })
    if (verifyError) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(verifyError.message)}`
      )
    }
  }

  // Get confirmed user
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const role = user.user_metadata?.role as 'company' | 'candidate' | undefined
    const name = user.user_metadata?.name as string | undefined
    const email = user.email ?? ''

    // Use admin client to bypass RLS when creating the profile
    const admin = createAdminClient()

    if (role === 'company') {
      const { data: existing } = await admin
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await admin.from('companies').insert({ user_id: user.id, name: name ?? email, email })
      }
      return NextResponse.redirect(`${origin}/dashboard/company`)
    } else {
      const { data: existing } = await admin
        .from('candidates')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await admin.from('candidates').insert({ user_id: user.id, name: name ?? email, email })
      }
      return NextResponse.redirect(`${origin}/dashboard/candidate`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
