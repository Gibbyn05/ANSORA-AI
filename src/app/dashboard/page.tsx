import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Ruter brukeren til riktig dashboard basert på profil i databasen
export default async function DashboardRouter() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) redirect('/auth/login')

  const role = user.user_metadata?.role as string | undefined

  if (role === 'company') {
    redirect('/dashboard/company')
  } else if (role === 'candidate') {
    redirect('/dashboard/candidate')
  }

  // Rolle mangler – sjekk databasen
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (company) redirect('/dashboard/company')

  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (candidate) redirect('/dashboard/candidate')

  // Ingen profil funnet – send til bedriftsdashboard (auto-oppretter profil der)
  redirect('/dashboard/company')
}
