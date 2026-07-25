"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Question, QuestionListResponse } from "@/lib/types";
import {
  COUNTRIES,
  GRADE_BANDS,
  QUESTION_STATUSES,
  SUBJECTS,
} from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  ConfirmDialog,
  CountryBadge,
  DifficultyDots,
  EmptyState,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  Skeleton,
  StatusBadge,
  SubjectBadge,
  selectClass,
} from "@/components/ui";
import QuestionModal from "./QuestionModal";
import ImportModal from "./ImportModal";

interface Filters {
  country: string;
  subject: string;
  gradeBand: string;
  difficulty: string;
  status: string;
  search: string;
}

const EMPTY_FILTERS: Filters = {
  country: "",
  subject: "",
  gradeBand: "",
  difficulty: "",
  status: "",
  search: "",
};

const PAGE_SIZE = 50;

export default function QuestionsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QuestionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce the search box into the applied filters.
  useEffect(() => {
    if (filters.search === searchInput) return;
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
      setLoading(true);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, filters.search]);

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setLoading(true);
  };

  const goToPage = (p: number) => {
    setPage(p);
    setLoading(true);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    let cancelled = false;
    (async () => {
      try {
        const res = await api<QuestionListResponse>(
          `/api/admin/questions?${params.toString()}`
        );
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Couldn't load questions."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, page, refreshKey]);

  const refresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api<{ ok: boolean }>(`/api/admin/questions/${deleting.id}`, {
        method: "DELETE",
      });
      toast(`Question #${deleting.id} deleted.`, "success");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "Couldn't delete the question.",
        "error"
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasFilters =
    Object.values(filters).some(Boolean) || searchInput.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Questions
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            The question bank behind daily quizzes and battles.
          </p>
        </div>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => setImportOpen(true)}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Import CSV
          </SecondaryButton>
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
            New Question
          </PrimaryButton>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input
            className="col-span-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 md:col-span-3 xl:col-span-1"
            placeholder="Search questions…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className={selectClass}
            value={filters.country}
            onChange={(e) => setFilter("country", e.target.value)}
          >
            <option value="">All countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filters.subject}
            onChange={(e) => setFilter("subject", e.target.value)}
          >
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filters.gradeBand}
            onChange={(e) => setFilter("gradeBand", e.target.value)}
          >
            <option value="">All grades</option>
            {GRADE_BANDS.map((g) => (
              <option key={g} value={g}>
                Grades {g}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filters.difficulty}
            onChange={(e) => setFilter("difficulty", e.target.value)}
          >
            <option value="">Any difficulty</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                Difficulty {d}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">Any status</option>
            {QUESTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={retry} />}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : data && data.questions.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={hasFilters ? "Nothing matches those filters" : "No questions yet"}
          hint={
            hasFilters
              ? "Try widening the filters or clearing the search."
              : "Add your first question or import a batch from CSV to get started."
          }
          action={
            hasFilters ? (
              <SecondaryButton
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setSearchInput("");
                  setPage(1);
                  setLoading(true);
                }}
              >
                Clear filters
              </SecondaryButton>
            ) : (
              <PrimaryButton
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
              >
                Add a question
              </PrimaryButton>
            )
          }
        />
      ) : data ? (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Grades</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.questions.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {q.id}
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <div className="truncate font-medium text-slate-700">
                          {q.textEn}
                        </div>
                        {q.textNe && (
                          <div className="truncate text-xs text-slate-400">
                            {q.textNe}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SubjectBadge subject={q.subject} />
                      </td>
                      <td className="px-4 py-3">
                        <CountryBadge country={q.country} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{q.gradeBand}</td>
                      <td className="px-4 py-3">
                        <DifficultyDots level={q.difficulty} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditing(q);
                              setEditorOpen(true);
                            }}
                            title="Edit"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleting(q)}
                            title="Delete"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-slate-400">
              {data.total.toLocaleString()} question
              {data.total === 1 ? "" : "s"} · page {data.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <SecondaryButton
                disabled={page <= 1}
                onClick={() => goToPage(Math.max(1, page - 1))}
              >
                Previous
              </SecondaryButton>
              <SecondaryButton
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </SecondaryButton>
            </div>
          </div>
        </>
      ) : null}

      {editorOpen && (
        <QuestionModal
          question={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            refresh();
          }}
        />
      )}

      {importOpen && (
        <ImportModal onClose={() => setImportOpen(false)} onImported={refresh} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete question?"
          message={`"${deleting.textEn}" will be removed from the question bank. This can't be undone.`}
          confirmLabel="Delete"
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
