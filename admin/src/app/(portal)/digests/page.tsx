"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Digest, GradeBand, SchedulerStatus } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import DigestModal from "./DigestModal";

function FactRow({
  icon,
  label,
  en,
  ne,
}: {
  icon: string;
  label: string;
  en: string;
  ne: string;
}) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="mt-0.5 text-lg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          {label}
        </div>
        <p className="text-sm font-medium text-slate-200">{en}</p>
        {ne && <p className="text-xs text-slate-400 mt-0.5">{ne}</p>}
      </div>
    </div>
  );
}

export default function DigestsPage() {
  const { toast } = useToast();
  const [digests, setDigests] = useState<Digest[] | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBand, setSelectedBand] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Digest | null>(null);
  const [approving, setApproving] = useState<Digest | null>(null);
  const [approveBusy, setApproveBusy] = useState(false);
  const [deleting, setDeleting] = useState<Digest | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Push Modals
  const [pushingSingle, setPushingSingle] = useState<Digest | null>(null);
  const [pushSingleBusy, setPushSingleBusy] = useState(false);
  const [pushingToday, setPushingToday] = useState(false);
  const [pushTodayBusy, setPushTodayBusy] = useState(false);
  const [autoGenBusy, setAutoGenBusy] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [digestsRes, statusRes] = await Promise.all([
          api<{ digests: Digest[] }>("/api/admin/digests"),
          api<SchedulerStatus>("/api/admin/digests/status").catch(() => null),
        ]);
        if (!cancelled) {
          setDigests(digestsRes.digests);
          if (statusRes) setSchedulerStatus(statusRes);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Couldn't load digests."
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

  const confirmApprove = async () => {
    if (!approving) return;
    setApproveBusy(true);
    try {
      await api<{ digest: Digest }>(
        `/api/admin/digests/${approving.id}/approve`,
        { method: "POST" }
      );
      toast("Digest published — students will see it now.", "success");
      setApproving(null);
      reload();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Couldn't publish the digest.",
        "error"
      );
    } finally {
      setApproveBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api<{ ok: boolean }>(`/api/admin/digests/${deleting.id}`, {
        method: "DELETE",
      });
      toast("Digest deleted.", "success");
      setDeleting(null);
      reload();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Couldn't delete the digest.",
        "error"
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const confirmPushSingle = async () => {
    if (!pushingSingle) return;
    setPushSingleBusy(true);
    try {
      const res = await api<{ ok: boolean; result: { success: number; failed: number } }>(
        `/api/admin/digests/${pushingSingle.id}/push`,
        { method: "POST" }
      );
      toast(
        `Push notification sent! Successfully delivered to ${res.result?.success || 0} devices.`,
        "success"
      );
      setPushingSingle(null);
      reload();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to send push notification.",
        "error"
      );
    } finally {
      setPushSingleBusy(false);
    }
  };

  const handlePushToday = async () => {
    setPushTodayBusy(true);
    try {
      const res = await api<{ ok: boolean; message: string; recipientsCount: number }>(
        "/api/admin/digests/push-today",
        { method: "POST" }
      );
      toast(res.message || "Daily push notification dispatched!", "success");
      setPushingToday(false);
      reload();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to push today's digest.",
        "error"
      );
    } finally {
      setPushTodayBusy(false);
    }
  };

  const handleAutoGenerate = async () => {
    setAutoGenBusy(true);
    try {
      const res = await api<{ ok: boolean; createdCount: number }>(
        "/api/admin/digests/auto-generate",
        { method: "POST" }
      );
      toast(`Generated ${res.createdCount} fresh digests for today.`, "success");
      reload();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Failed to auto-generate digests.",
        "error"
      );
    } finally {
      setAutoGenBusy(false);
    }
  };

  // Filtered digests
  const filteredDigests = (digests || []).filter((d) => {
    if (selectedBand !== "all" && d.gradeBand !== selectedBand) return false;
    if (selectedStatus !== "all" && d.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Daily Digests
              <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                Today&apos;s 3 Things
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Curate and broadcast the headline, general knowledge, and Nepal heritage facts delivered to students every morning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setPushingToday(true)}
              disabled={pushTodayBusy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 transition"
            >
              <span>🚀</span>
              Push Today&apos;s Alert
            </button>

            <button
              onClick={handleAutoGenerate}
              disabled={autoGenBusy}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700/60 hover:text-white transition"
            >
              <span>🪄</span>
              {autoGenBusy ? "Generating..." : "Auto-Draft Today"}
            </button>

            <PrimaryButton
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New Digest
            </PrimaryButton>
          </div>
        </div>

        {/* 7:00 AM Scheduler HUD Widget */}
        {schedulerStatus && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-slate-800/80 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-lg">
                ⏰
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Auto-Push Scheduled
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  Daily at 07:00 AM ({schedulerStatus.timezone})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-lg">
                📱
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registered Devices
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {schedulerStatus.registeredTokens} active device tokens ({schedulerStatus.uniqueUsersWithPush} students)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-lg">
                📰
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Today&apos;s Status
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {schedulerStatus.todayDigestsCount > 0
                    ? `✓ ${schedulerStatus.todayDigestsCount} digest(s) ready for ${schedulerStatus.currentDate}`
                    : `⚠️ No digest drafted for ${schedulerStatus.currentDate}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Grade Band Filter */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          {[
            { id: "all", label: "All Grades" },
            { id: "1-5", label: "Grades 1-5" },
            { id: "6-8", label: "Grades 6-8" },
            { id: "9-10", label: "Grades 9-10" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedBand(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                selectedBand === tab.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          {[
            { id: "all", label: "All Status" },
            { id: "published", label: "Published" },
            { id: "draft", label: "Drafts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                selectedStatus === tab.id
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* Digest Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 glass-card" />
          ))}
        </div>
      ) : filteredDigests.length === 0 ? (
        <EmptyState
          icon="📰"
          title="No digests found"
          hint="No digests match your current filters. Draft today's 3 things or auto-generate with 1 click."
          action={
            <div className="flex gap-2">
              <button
                onClick={handleAutoGenerate}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Auto-Generate Now
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Draft Manually
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredDigests.map((d) => {
            const isDraft = d.status === "draft";
            const isPushed = Boolean(d.pushedAt);

            return (
              <div
                key={d.id}
                className="glass-card flex flex-col justify-between p-6 gap-5"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-white">
                        📅 {d.date}
                      </span>
                      <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
                        Grades {d.gradeBand}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPushed ? (
                        <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                          Pushed ✓
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                          Not pushed
                        </span>
                      )}
                      <StatusBadge status={d.status} />
                    </div>
                  </div>

                  {/* Fact List */}
                  <div className="mt-4 space-y-3.5">
                    <FactRow
                      icon="📣"
                      label="Headline"
                      en={d.headlineEn}
                      ne={d.headlineNe}
                    />
                    <FactRow
                      icon="💡"
                      label="GK fact"
                      en={d.gkFactEn}
                      ne={d.gkFactNe}
                    />
                    <FactRow
                      icon="🏔️"
                      label="Nepal fact"
                      en={d.nepalFactEn}
                      ne={d.nepalFactNe}
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3.5 mt-2">
                  <div className="text-xs text-slate-400">
                    {d.pushedAt ? (
                      <span>Last pushed: {new Date(d.pushedAt).toLocaleTimeString()} ({d.lastPushedBy || "auto"})</span>
                    ) : (
                      <span>Ready for dispatch</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Push button */}
                    <button
                      onClick={() => setPushingSingle(d)}
                      className="rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-1.5"
                    >
                      <span>🚀</span>
                      Push
                    </button>

                    {isDraft ? (
                      <>
                        <button
                          onClick={() => setDeleting(d)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => {
                            setEditing(d);
                            setEditorOpen(true);
                          }}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setApproving(d)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/30"
                        >
                          Approve &amp; Publish
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleting(d)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Digest Modal */}
      {editorOpen && (
        <DigestModal
          digest={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            reload();
          }}
        />
      )}

      {/* Single Digest Push Confirmation Modal with Mockup Preview */}
      {pushingSingle && (
        <ConfirmDialog
          title="Send Push Notification for this Digest?"
          message={`This will immediately dispatch a high-priority push notification to all students in Grades ${pushingSingle.gradeBand}. Headline: "${pushingSingle.headlineEn}"`}
          confirmLabel={pushSingleBusy ? "Sending..." : "🚀 Push to Devices Now"}
          tone="primary"
          busy={pushSingleBusy}
          onConfirm={confirmPushSingle}
          onCancel={() => setPushingSingle(null)}
        />
      )}

      {/* Broadcast Today's Daily Push Modal */}
      {pushingToday && (
        <ConfirmDialog
          title="Broadcast Today's Daily Quest & Digest?"
          message="This will immediately push notifications to ALL registered devices for today's daily quest and 3 things. If any grade band is missing, it will auto-generate and publish automatically."
          confirmLabel={pushTodayBusy ? "Broadcasting..." : "🚀 Broadcast to All Devices"}
          tone="primary"
          busy={pushTodayBusy}
          onConfirm={handlePushToday}
          onCancel={() => setPushingToday(false)}
        />
      )}

      {/* Approve Modal */}
      {approving && (
        <ConfirmDialog
          title="Publish this digest?"
          message={`Students will see this in their daily home digest. Once published, the ${approving.date} digest for grades ${approving.gradeBand} goes live.`}
          confirmLabel="Yes, publish it"
          tone="primary"
          busy={approveBusy}
          onConfirm={confirmApprove}
          onCancel={() => setApproving(null)}
        />
      )}

      {/* Delete Modal */}
      {deleting && (
        <ConfirmDialog
          title="Delete digest?"
          message={`The ${deleting.date} digest for grades ${deleting.gradeBand} will be removed. This cannot be undone.`}
          confirmLabel="Delete"
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
