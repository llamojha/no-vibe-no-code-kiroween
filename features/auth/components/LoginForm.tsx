"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { capture } from "@/features/analytics/posthogClient";

const LoginForm: React.FC = () => {
  const router = useRouter();
  const { t } = useLocale();
  const { supabase, session, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => !!session, [session]);

  // Password login handler
  const handlePasswordLogin = useCallback(async () => {
    if (!supabase || !email || !password) return;

    setStatus("submitting");
    setErrorMessage(null);
    capture("login", { method: "password" });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in with password", error);
      setErrorMessage(error.message ?? t("passwordLoginError"));
      setStatus("error");
      return;
    }

    // Success - redirect will happen via auth state change
    router.replace("/dashboard");
  }, [email, password, supabase, router, t]);

  // Magic link handler
  const handleMagicLink = useCallback(async () => {
    if (!supabase || !email) return;

    setStatus("submitting");
    setErrorMessage(null);
    capture("login", { method: "magic_link" });

    const redirectTo = (() => {
      if (typeof window === "undefined") return "/auth/callback";
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      const currentUrl = new URL(window.location.href);
      const next = currentUrl.searchParams.get("next");
      if (next) callbackUrl.searchParams.set("next", next);
      return callbackUrl.toString();
    })();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Error sending magic link", error);
      setErrorMessage(error.message ?? t("magicLinkError"));
      setStatus("error");
      return;
    }

    setStatus("sent");
    capture("signup", { method: "magic_link" });
  }, [email, supabase, t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase) {
        setErrorMessage("Supabase client is not ready.");
        setStatus("error");
        return;
      }
      if (!email) {
        setErrorMessage(t("emailRequired"));
        setStatus("error");
        return;
      }

      // If password is provided, use password auth; otherwise use magic link
      if (password) {
        await handlePasswordLogin();
      } else {
        await handleMagicLink();
      }
    },
    [email, password, supabase, handlePasswordLogin, handleMagicLink, t]
  );

  if (!isLoading && isAuthenticated) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-slate-200 px-4">
      <div className="w-full max-w-md bg-primary/60 border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-4">
          {t("signInTitle")}
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          {t("signInSubtitle")}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t("emailAddressLabel")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full px-4 py-3 bg-black/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 rounded-none"
              placeholder={t("emailPlaceholder")}
              required
              disabled={status === "submitting" || status === "sent"}
            />
          </label>

          {/* Toggle to show password field */}
          {!showPassword && status !== "sent" && (
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="text-sm text-slate-400 hover:text-accent transition underline"
            >
              {t("usePasswordInstead")}
            </button>
          )}

          {/* Password field (optional) */}
          {showPassword && (
            <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300">
              {t("passwordLabel")}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full px-4 py-3 bg-black/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 rounded-none"
                placeholder={t("passwordPlaceholder")}
                disabled={status === "submitting" || status === "sent"}
              />
              <button
                type="button"
                onClick={() => {
                  setShowPassword(false);
                  setPassword("");
                }}
                className="mt-2 text-sm text-slate-400 hover:text-accent transition underline"
              >
                {t("useMagicLinkInstead")}
              </button>
            </label>
          )}

          <button
            type="submit"
            disabled={status === "submitting" || status === "sent"}
            className="w-full py-3 bg-secondary/80 text-white font-bold uppercase tracking-widest border border-secondary hover:bg-secondary transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "submitting"
              ? t("signingIn")
              : showPassword
              ? t("signInWithPassword")
              : t("sendMagicLink")}
          </button>
        </form>
        {status === "sent" && (
          <p className="mt-6 text-sm text-accent text-center">
            {t("magicLinkSent")}
          </p>
        )}
        {status === "error" && errorMessage && (
          <p className="mt-6 text-sm text-red-400 text-center">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
