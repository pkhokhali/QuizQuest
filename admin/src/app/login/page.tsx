"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getToken, setSession } from "@/lib/api";
import type { RequestOtpResponse, VerifyResponse } from "@/lib/types";
import { Field, inputClass, PrimaryButton } from "@/components/ui";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api<RequestOtpResponse>("/api/auth/request-otp", {
        method: "POST",
        body: { phone: phone.trim() },
      });
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<VerifyResponse>("/api/auth/verify", {
        method: "POST",
        body: { phone: phone.trim(), code: code.trim() },
      });
      if (res.user.role !== "admin" && res.user.role !== "teacher") {
        setError("This portal is for content admins.");
        return;
      }
      setSession(res.token, res.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
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
          {step === "phone" ? (
            <form onSubmit={requestOtp} className="space-y-5">
              <Field label="Phone number">
                <input
                  className={inputClass}
                  type="tel"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  required
                />
              </Field>
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                  {error}
                </p>
              )}
              <PrimaryButton
                type="submit"
                busy={busy}
                disabled={!phone.trim()}
                className="w-full"
              >
                Send code
              </PrimaryButton>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-5">
              <div className="rounded-xl bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-700">
                Code sent to <span className="font-semibold">{phone}</span>
              </div>
              <Field label="One-time code" hint="Dev OTP is 123456">
                <input
                  className={`${inputClass} text-center text-lg font-semibold tracking-[0.4em]`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  required
                />
              </Field>
              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                  {error}
                </p>
              )}
              <PrimaryButton
                type="submit"
                busy={busy}
                disabled={code.trim().length < 6}
                className="w-full"
              >
                Verify &amp; sign in
              </PrimaryButton>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-center text-sm font-medium text-slate-400 hover:text-indigo-600"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Signed in accounts must have an admin or teacher role.
        </p>
      </div>
    </div>
  );
}
