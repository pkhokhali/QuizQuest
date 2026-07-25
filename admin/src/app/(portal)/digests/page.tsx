"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Digest } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
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
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </div>
        <p className="text-sm text-slate-700">{en}</p>
        {ne && <p className="text-sm text-slate-400">{ne}</p>}
      </div>
    </div>
  );
}

export default function DigestsPage() {
  const { toast } = useToast();
  const [digests, setDigests] = useState<Digest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Digest | null>(null);
  const [approving, setApproving] = useState<Digest | null>(null);
  const [approveBusy, setApproveBusy] = useState(false);
  const [deleting, setDeleting] = useState<Digest | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ digests: Digest[] }>("/api/admin/digests");
        if (!cancelled) {
          setDigests(res.digests);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Digests
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            &ldquo;Today&apos;s 3 things&rdquo; — a headline, a GK fact and a
            Nepal fact for each grade band.
          </p>
        </div>
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

      {error && <ErrorBanner message={error} onRetry={reload} />}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : digests && digests.length === 0 ? (
        <EmptyState
          icon="📰"
          title="No digests yet"
          hint="Draft today's 3 things so students have something fresh to read with their quiz."
          action={
            <PrimaryButton
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              Draft the first digest
            </PrimaryButton>
          }
        />
      ) : digests ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {digests.map((d) => {
            const isDraft = d.status === "draft";
            return (
              <div
                key={d.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {d.date}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                      Grades {d.gradeBand}
                    </span>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <div className="space-y-3">
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

                <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-50 pt-3">
                  {isDraft ? (
                    <>
                      <button
                        onClick={() => setDeleting(d)}
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setEditing(d);
                          setEditorOpen(true);
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setApproving(d)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Approve &amp; Publish
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="mr-auto text-xs text-slate-400">
                        Published — read-only
                      </span>
                      <button
                        onClick={() => setDeleting(d)}
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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

      {approving && (
        <ConfirmDialog
          title="Publish this digest?"
          message={`Students will see this — has it been fact-checked? Once published, the ${approving.date} digest for grades ${approving.gradeBand} goes live and can no longer be edited.`}
          confirmLabel="Yes, publish it"
          tone="primary"
          busy={approveBusy}
          onConfirm={confirmApprove}
          onCancel={() => setApproving(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete digest?"
          message={`The ${deleting.date} digest for grades ${deleting.gradeBand} will be removed. This can't be undone.`}
          confirmLabel="Delete"
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
