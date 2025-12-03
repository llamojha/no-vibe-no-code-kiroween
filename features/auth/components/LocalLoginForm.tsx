"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/lib/auth/localAuth";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { capture } from "@/features/analytics/posthogClient";
import { useAuth } from "@/features/auth/context/AuthContext";

interface LocalLoginFormProps {
  onSuccess?: () => void;
}

/**
 * LocalLoginForm component for Open Source Mode authentication
 *
 * Provides username/password login when LOCAL_STORAGE_MODE is enabled.
 * Uses simple credential validation against environment variables or defaults (kiro/kiro).
 *
 * @requirements 2.1, 2.2, 2.3
 */
const LocalLoginForm: React.FC<LocalLoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { t } = useLocale();
  const { refreshLocalAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Validate inputs
      if (!username.trim()) {
        setErrorMessage(t("usernameRequired") || "Username is required");
        setStatus("error");
        return;
      }

      if (!password) {
        setErrorMessage(t("passwordRequired") || "Password is required");
        setStatus("error");
        return;
      }

      setStatus("submitting");
      setErrorMessage(null);
      capture("login", { method: "local_auth" });

      // Authenticate using local auth service
      const result = authenticate(username.trim(), password);

      if (!result.success) {
        setErrorMessage(result.error);
        setStatus("error");
        return;
      }

      // Success - refresh auth context and redirect
      capture("login_success", {
        method: "local_auth",
        userId: result.user.id,
      });

      // Refresh AuthContext to pick up the new auth state
      refreshLocalAuth();

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace("/dashboard");
      }
    },
    [username, password, router, onSuccess, t, refreshLocalAuth]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-slate-200 px-4">
      <div className="w-full max-w-md bg-primary/60 border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-4">
          {t("localSignInTitle") || "Local Sign In"}
        </h1>
        <p className="text-sm text-slate-400 text-center mb-2">
          {t("localSignInSubtitle") ||
            "Open Source Mode - No database required"}
        </p>
        <p className="text-xs text-accent text-center mb-8">
          {t("localSignInHint") || "Default credentials: kiro / kiro"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t("usernameLabel") || "Username"}
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full px-4 py-3 bg-black/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 rounded-none"
              placeholder={t("usernamePlaceholder") || "Enter username"}
              autoComplete="username"
              disabled={status === "submitting"}
            />
          </label>
          <label className="block text-sm font-semibold uppercase tracking-wider text-slate-300">
            {t("passwordLabel") || "Password"}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full px-4 py-3 bg-black/60 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-accent text-slate-100 rounded-none"
              placeholder={t("passwordPlaceholder") || "Enter password"}
              autoComplete="current-password"
              disabled={status === "submitting"}
            />
          </label>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3 bg-secondary/80 text-white font-bold uppercase tracking-widest border border-secondary hover:bg-secondary transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "submitting"
              ? t("signingIn") || "Signing in..."
              : t("signInButton") || "Sign In"}
          </button>
        </form>
        {status === "error" && errorMessage && (
          <p className="mt-6 text-sm text-red-400 text-center">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LocalLoginForm;
