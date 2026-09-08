"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ReportedQuestion } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  EmptyState,
  ErrorBanner,
  Skeleton,
} from "@/components/ui";

export default function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<ReportedQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ reports: ReportedQuestion[] }>("/api/admin/reports");
      setReports(res.reports);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load question reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (id: number) => {
    try {
      await api(`/api/admin/reports/${id}/resolve`, { method: "POST" });
      toast("Report marked as resolved", "success");
      loadReports();
    } catch {
      toast("Failed to update report", "error");
    }
  };

  const filteredReports = reports?.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Reported Questions Moderation
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review community-flagged trivia questions for factual accuracy, typos, or policy compliance.
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["open", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition ${
                filter === f
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadReports} />}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filteredReports && filteredReports.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title={`No ${filter !== "all" ? filter : ""} reports`}
          hint="All reported questions have been reviewed and resolved. Great job keeping QuizQuest safe!"
        />
      ) : filteredReports ? (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-sm">
                    <p className="truncate">{report.questionText || `Question #${report.questionId}`}</p>
                    <span className="text-[11px] text-slate-400">ID #{report.questionId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      {report.reason}
                    </span>
                    {report.details && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{report.details}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <span className="font-semibold">{report.reporterName || `User #${report.reporterUserId}`}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        report.status === "open"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {report.status === "open" ? (
                      <button
                        onClick={() => handleResolve(report.id)}
                        className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">✓ Done</span>
                    )}
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
