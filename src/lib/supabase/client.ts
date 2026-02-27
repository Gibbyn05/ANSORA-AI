import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || !url.startsWith('https://')) {
    // Supabase not configured — return a no-op stub so the app renders
    // without throwing. Auth operations will return empty/error responses.
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({}),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => {
        const stub: Record<string, unknown> = {}
        for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order', 'single']) {
          stub[m] = () => stub
        }
        stub['then'] = (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(resolve)
        return stub
      },
    } as unknown as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(url, key)
}
