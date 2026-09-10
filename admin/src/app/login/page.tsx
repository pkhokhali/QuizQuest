"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getToken, setSession } from "@/lib/api";
import type { VerifyResponse } from "@/lib/types";
import { Field, PrimaryButton } from "@/components/ui";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

function formatAuthError(err: any): string {
  const msg = String(err?.message || "");
  const code = String(err?.code || "");

  if (code.includes("invalid-credential") || code.includes("wrong-password") || msg.includes("invalid-credential")) {
    return "Invalid email or password. Please verify your credentials and try again.";
  }
  if (code.includes("user-not-found") || msg.includes("user-not-found")) {
    return "No admin account found with this email.";
  }
  if (code.includes("too-many-requests") || msg.includes("too-many-requests")) {
    return "Too many failed attempts. Please wait a moment and try again.";
  }
  if (code.includes("network-request-failed") || msg.includes("network")) {
    return "Network error. Unable to reach authentication server.";
  }
  return msg.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/, "$1") || "Invalid email or password.";
}

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
      } catch (directErr: any) {
        // If the backend actively rejected with 400 (e.g. wrong password, invalid email),
        // show that message directly. Do NOT fall back to Firebase and trigger auth/invalid-credential!
        if (directErr instanceof ApiError && directErr.status === 400) {
          setError(directErr.message);
          return;
        }

        // 2. Fallback to Firebase only for network/server outages
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const idToken = await userCredential.user.getIdToken();
          res = await api<VerifyResponse>("/api/auth/verify-firebase", {
            method: "POST",
            body: { token: idToken },
          });
        } catch (fbErr: any) {
          throw fbErr;
        }
      }
      
      if (res.user.role !== "admin" && res.user.role !== "teacher") {
        setError("Access restricted: This portal is for content admins and teachers.");
        return;
      }
      
      setSession(res.token, res.user);
      router.replace("/dashboard");
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1120] px-4 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-500 text-2xl font-black text-white shadow-xl shadow-indigo-500/25 ring-1 ring-white/20">
            Q
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Quiz<span className="text-indigo-400">Quest</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Content &amp; Curriculum Admin Portal
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={login} className="space-y-5">
            <Field label="Email Address">
              <input
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                type="email"
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </Field>
            
            <Field label="Password">
              <input
                className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-start gap-2.5">
                <span className="text-rose-400 text-base">⚠️</span>
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            <PrimaryButton
              type="submit"
              busy={busy}
              disabled={!email.trim() || !password.trim()}
              className="w-full py-2.5 shadow-lg shadow-indigo-600/30"
            >
              Sign In to Portal
            </PrimaryButton>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Signed in accounts must have an <span className="text-slate-400 font-medium">admin</span> or <span className="text-slate-400 font-medium">teacher</span> role.
        </p>
      </div>
    </div>
  );
}
