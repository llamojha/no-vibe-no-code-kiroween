'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { capture } from '@/features/analytics/posthogClient';

const LoginForm: React.FC = () => {
  const router = useRouter();
  const { supabase, session, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => !!session, [session]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase) {
        setErrorMessage('Supabase client is not ready.');
        setStatus('error');
        return;
      }
      if (!email) {
        setErrorMessage('Please enter your email address.');
        setStatus('error');
        return;
      }

      setStatus('submitting');
      setErrorMessage(null);
      capture('login', { method: 'magic_link' });

      // Build the callback URL and preserve any ?next=... from the current URL
      const redirectTo = (() => {
        if (typeof window === 'undefined') return '/auth/callback';
        const callbackUrl = new URL('/auth/callback', window.location.origin);
        const currentUrl = new URL(window.location.href);
        const next = currentUrl.searchParams.get('next');
        if (next) callbackUrl.searchParams.set('next', next);
        return callbackUrl.toString();
      })();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error('Error sending magic link', error);
        setErrorMessage(error.message ?? 'Failed to send magic link. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('sent');
      // Heuristic: also count as signup intent
      capture('signup', { method: 'magic_link' });
    },
    [email, supabase],
  );

  if (!isLoading && isAuthenticated) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-slate-200 px-4">
      <div className="w-full max-w-md bg-primary/60 border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-4">
          Sign in to Continue
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Enter your email to receive a one-time magic link. No password required.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300">
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full px-4 py-3 bg-black/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 rounded-none"
              placeholder="you@example.com"
              required
              disabled={status === 'submitting' || status === 'sent'}
            />
          </label>
          <button
            type="submit"
            disabled={status === 'submitting' || status === 'sent'}
            className="w-full py-3 bg-secondary/80 text-white font-bold uppercase tracking-widest border border-secondary hover:bg-secondary transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Sending magic link...' : 'Send magic link'}
          </button>
        </form>
        {status === 'sent' && (
          <p className="mt-6 text-sm text-accent text-center">
            Magic link sent! Check your inbox and follow the link to sign in.
          </p>
        )}
        {status === 'error' && errorMessage && (
          <p className="mt-6 text-sm text-red-400 text-center">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
