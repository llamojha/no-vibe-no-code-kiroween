import { redirect } from 'next/navigation';
import LoginForm from '@/features/auth/components/LoginForm';
import { serverSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = serverSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
