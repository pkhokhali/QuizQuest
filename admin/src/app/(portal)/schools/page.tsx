"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { School } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  EmptyState,
  ErrorBanner,
  inputClass,
  PrimaryButton,
  Skeleton,
} from "@/components/ui";

function JoinCodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context); nothing else to do.
    }
  };

  return (
    <button
      onClick={copy}
      title="Copy join code"
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition ${
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      }`}
    >
      {code}
      {copied ? (
        <span className="text-[10px] font-sans font-bold uppercase">
          Copied!
        </span>
      ) : (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
          />
        </svg>
      )}
    </button>
  );
}

export default function SchoolsPage() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ schools: School[] }>("/api/admin/schools");
        if (!cancelled) {
          setSchools(res.schools);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Couldn't load schools."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const reload = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  const addSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await api<{ school: School }>("/api/admin/schools", {
        method: "POST",
        body: { name: name.trim() },
      });
      toast(
        `${res.school.name} added — join code ${res.school.joinCode}.`,
        "success"
      );
      setName("");
      reload();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Couldn't add the school.",
        "error"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Schools
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Students join their school with the code — that powers class and
          school leaderboards.
        </p>
      </div>

      <form
        onSubmit={addSchool}
        className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row"
      >
        <input
          className={inputClass}
          placeholder="School name, e.g. Shree Janata Secondary School"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <PrimaryButton
          type="submit"
          busy={adding}
          disabled={!name.trim()}
          className="shrink-0"
        >
          Add School
        </PrimaryButton>
      </form>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : schools && schools.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="No schools yet"
          hint="Add the first school above — a join code is generated automatically for students to enter."
        />
      ) : schools ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Join code</th>
                <th className="px-4 py-3 text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {s.name}
                  </td>
                  <td className="px-4 py-3">
                    <JoinCodeChip code={s.joinCode} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {s.studentCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
