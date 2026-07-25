"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { GradeBand, MixConfig } from "@/lib/types";
import { GRADE_BANDS } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { ErrorBanner, PrimaryButton, Skeleton } from "@/components/ui";

const DEFAULT_MIX: Omit<MixConfig, "gradeBand"> = {
  homePct: 60,
  extraPct: 25,
  globalPct: 15,
};

const SLIDERS: {
  key: keyof Omit<MixConfig, "gradeBand">;
  label: string;
  hint: string;
  accent: string;
}[] = [
  {
    key: "homePct",
    label: "Home country",
    hint: "Questions about the student's own country (Nepal for most)",
    accent: "accent-indigo-600",
  },
  {
    key: "extraPct",
    label: "Extra countries",
    hint: "The 1–2 extra countries each student picked to explore",
    accent: "accent-violet-600",
  },
  {
    key: "globalPct",
    label: "Global",
    hint: "World knowledge that isn't tied to one country",
    accent: "accent-emerald-600",
  },
];

function BandCard({
  gradeBand,
  initial,
  onSaved,
}: {
  gradeBand: GradeBand;
  initial: Omit<MixConfig, "gradeBand">;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const sum = values.homePct + values.extraPct + values.globalPct;
  const valid = sum === 100;

  const set = (key: keyof typeof values, value: number) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api<{ config: MixConfig }>("/api/admin/mix-config", {
        method: "PUT",
        body: { gradeBand, ...values },
      });
      toast(`Mix saved for grades ${gradeBand}.`, "success");
      setDirty(false);
      onSaved();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Couldn't save the mix.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">
          Grades {gradeBand}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
            valid
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          Total: {sum}%
        </span>
      </div>

      <div className="space-y-4">
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span
                className="text-xs font-semibold text-slate-600"
                title={s.hint}
              >
                {s.label}
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={values[s.key]}
                onChange={(e) =>
                  set(
                    s.key,
                    Math.max(0, Math.min(100, Number(e.target.value) || 0))
                  )
                }
                className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm tabular-nums focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={values[s.key]}
              onChange={(e) => set(s.key, Number(e.target.value))}
              className={`w-full ${s.accent}`}
            />
          </div>
        ))}
      </div>

      {!valid && (
        <p className="mt-3 text-xs font-medium text-rose-600">
          The three shares must add up to exactly 100%.
        </p>
      )}

      <PrimaryButton
        onClick={save}
        busy={busy}
        disabled={!valid || !dirty}
        className="mt-4 w-full"
      >
        {dirty ? "Save mix" : "Saved"}
      </PrimaryButton>
    </div>
  );
}

export default function MixPage() {
  const [configs, setConfigs] = useState<MixConfig[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ configs: MixConfig[] }>(
          "/api/admin/mix-config"
        );
        if (!cancelled) {
          setConfigs(res.configs);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load the mix config."
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
          Content Mix
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Control where daily-quiz questions come from, per grade band.
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5 text-sm text-indigo-900">
        <span aria-hidden className="text-lg">💡</span>
        <p>
          Every daily quiz is assembled from three buckets:{" "}
          <span className="font-semibold">home country</span> questions about
          the student&apos;s own country,{" "}
          <span className="font-semibold">extra countries</span> they chose to
          explore, and <span className="font-semibold">global</span> knowledge.
          The percentages below decide that split for each grade band — they
          must add up to 100. The default is 60 / 25 / 15.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : configs ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {GRADE_BANDS.map((band) => {
            const existing = configs.find((c) => c.gradeBand === band);
            return (
              <BandCard
                key={`${band}-${existing ? "loaded" : "default"}`}
                gradeBand={band}
                initial={
                  existing
                    ? {
                        homePct: existing.homePct,
                        extraPct: existing.extraPct,
                        globalPct: existing.globalPct,
                      }
                    : DEFAULT_MIX
                }
                onSaved={() => {}}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
