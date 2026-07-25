"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Analytics } from "@/lib/types";
import { ErrorBanner, Skeleton } from "@/components/ui";

const COUNTRY_FLAGS: Record<string, string> = {
  nepal: "🇳🇵",
  india: "🇮🇳",
  usa: "🇺🇸",
  japan: "🇯🇵",
  uk: "🇬🇧",
  china: "🇨🇳",
  australia: "🇦🇺",
  global: "🌍",
};

function StatCard({
  label,
  value,
  icon,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: "indigo" | "violet" | "emerald" | "amber";
}) {
  const accents = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accents[accent]}`}
      >
        <span aria-hidden>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold tracking-tight text-slate-800">
          {value}
        </div>
        <div className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </div>
      </div>
    </div>
  );
}

function BarChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; prefix?: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No data yet — check back once students start playing.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-24 shrink-0 truncate text-xs font-medium capitalize text-slate-500">
                {d.prefix && <span aria-hidden className="mr-1">{d.prefix}</span>}
                {d.label}
              </div>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
              </div>
              <div className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600">
                {d.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<Analytics>("/api/admin/analytics");
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Couldn't load analytics."
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

  const retry = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          A quick pulse on how QuizQuest is doing today.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[84px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students & users" value={data.totals.users.toLocaleString()} icon="🧑‍🎓" />
            <StatCard label="Questions in bank" value={data.totals.questions.toLocaleString()} icon="❓" accent="violet" />
            <StatCard label="Schools" value={data.totals.schools.toLocaleString()} icon="🏫" accent="emerald" />
            <StatCard label="Avg streak" value={data.avgStreak} icon="🔥" accent="amber" />
            <StatCard label="Daily active users" value={data.dau.toLocaleString()} icon="📅" />
            <StatCard label="Weekly active users" value={data.wau.toLocaleString()} icon="🗓️" accent="violet" />
            <StatCard label="Quizzes today" value={data.quizzesToday.toLocaleString()} icon="📝" accent="emerald" />
            <StatCard label="Battles today" value={data.battlesToday.toLocaleString()} icon="⚔️" accent="amber" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BarChart
              title="Subject popularity (answers)"
              data={data.subjectPopularity.map((s) => ({
                label: s.subject,
                value: s.answers,
              }))}
            />
            <BarChart
              title="Students by country"
              data={data.countryDistribution.map((c) => ({
                label: c.country,
                prefix: COUNTRY_FLAGS[c.country],
                value: c.students,
              }))}
            />
            <BarChart
              title="Students by grade"
              data={data.gradeDistribution.map((g) => ({
                label: `Grade ${g.grade}`,
                value: g.students,
              }))}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
