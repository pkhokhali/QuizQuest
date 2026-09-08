"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getToken, setSession } from "@/lib/api";
import type { VerifyResponse } from "@/lib/types";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let res: VerifyResponse;
      try {
        // 1. Direct Backend Auth
        res = await api<VerifyResponse>("/api/auth/email", {
          method: "POST",
          body: { email: email.trim(), password },
        });
      } catch (directErr) {
        // 2. Fallback to Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await userCredential.user.getIdToken();
        res = await api<VerifyResponse>("/api/auth/verify-firebase", {
          method: "POST",
          body: { token: idToken },
        });
      }
      
      if (res.user.role !== "admin" && res.user.role !== "teacher") {
        setError("This portal is for content admins.");
        return;
      }
      
      setSession(res.token, res.user);
      router.replace("/dashboard");
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Invalid email or password.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-lg shadow-indigo-200">
            Q
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Quiz<span className="text-indigo-600">Quest</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Content &amp; admin portal
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <form onSubmit={login} className="space-y-5">
            <Field label="Email Address">
              <input
                className={inputClass}
                type="email"
                placeholder="admin@quizquest.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </Field>
            
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setEmail("admin@quizquest.com");
                setPassword("password123");
                setError(null);
              }}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              🔑 Fill Admin Credentials (admin@quizquest.com)
            </button>
            
            <PrimaryButton
              type="submit"
              busy={busy}
              disabled={!email.trim() || !password.trim()}
              className="w-full"
            >
              Sign In
            </PrimaryButton>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Signed in accounts must have an admin or teacher role.
        </p>
      </div>
    </div>
  );
}
