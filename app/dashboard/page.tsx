import { redirect } from 'next/navigation';
import UserDashboard from '@/features/dashboard/components/UserDashboard';
import { serverSupabase } from '@/lib/supabase/server';
import { mapSavedAnalysesRow } from '@/lib/supabase/mappers';
import type { SavedAnalysesRow } from '@/lib/supabase/types';
import type { SavedAnalysisRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = serverSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('saved_analyses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .returns<SavedAnalysesRow[]>();

  if (error) {
    console.error('Error fetching saved analyses', error);
  }

  const initialAnalyses: SavedAnalysisRecord[] = data?.map(mapSavedAnalysesRow) ?? [];

  return <UserDashboard initialAnalyses={initialAnalyses} sessionUserId={session!.user.id} />;
}
