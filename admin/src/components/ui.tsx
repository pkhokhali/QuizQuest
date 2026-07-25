"use client";

import { useEffect, type ReactNode } from "react";

/* ---------- Spinner ---------- */

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
  );
}

/* ---------- Error banner ---------- */

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon = "🌱",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="text-base font-semibold text-slate-700">{title}</div>
      {hint && <p className="max-w-sm text-sm text-slate-400">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------- Badges ---------- */

const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-sky-100 text-sky-700",
  science: "bg-emerald-100 text-emerald-700",
  social: "bg-amber-100 text-amber-700",
  english: "bg-violet-100 text-violet-700",
  nepali: "bg-rose-100 text-rose-700",
  gk: "bg-indigo-100 text-indigo-700",
  current: "bg-cyan-100 text-cyan-700",
};

export function SubjectBadge({ subject }: { subject: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        SUBJECT_COLORS[subject] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {subject}
    </span>
  );
}

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

export function CountryBadge({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
      <span aria-hidden>{COUNTRY_FLAGS[country] ?? "🏳️"}</span>
      {country}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "approved" || status === "published"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

/* ---------- Difficulty dots ---------- */

export function DifficultyDots({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`Difficulty ${level} of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= level ? "bg-indigo-500" : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`my-auto w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Confirm dialog ---------- */

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={busy}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${
            tone === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {busy && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Form field helpers ---------- */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export const selectClass = inputClass + " appearance-none";

export function PrimaryButton({
  children,
  busy = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 ${
        props.className ?? ""
      }`}
    >
      {busy && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
        props.className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
