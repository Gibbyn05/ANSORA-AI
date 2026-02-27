import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Chainable query stub — returned when Supabase env vars are not configured.
// All builder methods return the same stub so chains like
// .from('x').select('*').eq('id', 1).single() work without errors.
function createQueryStub() {
  const stub: Record<string, unknown> = {}
  for (const m of [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'contains', 'containedBy', 'overlaps', 'not',
    'or', 'and', 'filter', 'match', 'order', 'limit', 'range',
    'textSearch', 'returns', 'throwOnError',
  ]) {
    stub[m] = () => stub
  }
  stub['single'] = async () => ({ data: null, error: null })
  stub['maybeSingle'] = async () => ({ data: null, error: null })
  stub['then'] = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null }).then(resolve, reject)
  return stub as ReturnType<ReturnType<typeof createServerClient>['from']>
}

function createStubClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => createQueryStub(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as ReturnType<typeof createServerClient>
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || !isValidUrl(url)) {
    return createStubClient()
  }

  try {
    const cookieStore = await cookies()
    return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component - ignorerer cookie-sett feil
        }
      },
    },
  })
  } catch {
    return createStubClient()
  }
}

// Admin-klient for server-side operasjoner som krever elevated privileges
export async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || !isValidUrl(url)) {
    return createStubClient()
  }

  try {
    const cookieStore = await cookies()
    return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // ignorerer
        }
      },
    },
  })
  } catch {
    return createStubClient()
  }
}
