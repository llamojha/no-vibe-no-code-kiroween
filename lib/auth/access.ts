import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, UserTier } from '@/lib/supabase/types'

type Allowed = { allowed: true; userId: string; tier: UserTier }
type Denied = { allowed: false; response: NextResponse }
export type AccessResult = Allowed | Denied

export async function requirePaidOrAdmin(
  supabase: SupabaseClient<Database>,
): Promise<AccessResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    return { allowed: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!session) {
    return { allowed: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const userId = session.user.id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return { allowed: false, response: NextResponse.json({ error: 'Unable to verify access' }, { status: 500 }) }
  }

  const tier: UserTier = (profile?.tier ?? 'free') as UserTier
  const ok = tier === 'paid' || tier === 'admin'
  if (!ok) {
    return { allowed: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { allowed: true, userId, tier }
}

