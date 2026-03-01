import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const applicationId = new URL(request.url).searchParams.get('application_id')
  if (!applicationId) return NextResponse.json({ error: 'application_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id, content } = await request.json()
  if (!application_id || !content?.trim()) {
    return NextResponse.json({ error: 'application_id and content required' }, { status: 400 })
  }

  const senderRole = user.user_metadata?.role as 'company' | 'candidate' | null
  if (!senderRole) return NextResponse.json({ error: 'Unknown role' }, { status: 403 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ application_id, sender_role: senderRole, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message })
}

export async function PATCH(request: NextRequest) {
  // Mark messages from the other party as read
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id } = await request.json()
  if (!application_id) return NextResponse.json({ error: 'application_id required' }, { status: 400 })

  const role = user.user_metadata?.role as 'company' | 'candidate'
  const otherRole = role === 'company' ? 'candidate' : 'company'

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('application_id', application_id)
    .eq('sender_role', otherRole)
    .is('read_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
