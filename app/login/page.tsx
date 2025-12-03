import { redirect } from 'next/navigation';
import LoginForm from '@/features/auth/components/LoginForm';
import { isAuthenticated } from '@/src/infrastructure/web/helpers/serverAuth';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Use the new authentication helper
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
