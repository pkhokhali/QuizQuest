"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Digest, DigestInput, GradeBand } from "@/lib/types";
import { GRADE_BANDS } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  Field,
  inputClass,
  Modal,
  PrimaryButton,
  SecondaryButton,
  selectClass,
} from "@/components/ui";

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function DigestModal({
  digest,
  onClose,
  onSaved,
}: {
  digest: Digest | null; // null = create new
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<DigestInput>(() =>
    digest
      ? {
          date: digest.date,
          gradeBand: digest.gradeBand,
          headlineEn: digest.headlineEn,
          headlineNe: digest.headlineNe,
          gkFactEn: digest.gkFactEn,
          gkFactNe: digest.gkFactNe,
          nepalFactEn: digest.nepalFactEn,
          nepalFactNe: digest.nepalFactNe,
        }
      : {
          date: todayISO(),
          gradeBand: "6-8",
          headlineEn: "",
          headlineNe: "",
          gkFactEn: "",
          gkFactNe: "",
          nepalFactEn: "",
          nepalFactNe: "",
        }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DigestInput>(key: K, value: DigestInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (digest) {
        await api<{ digest: Digest }>(`/api/admin/digests/${digest.id}`, {
          method: "PUT",
          body: form,
        });
        toast("Digest updated.", "success");
      } else {
        await api<{ digest: Digest }>("/api/admin/digests", {
          method: "POST",
          body: form,
        });
        toast("Digest drafted.", "success");
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save the digest."
      );
    } finally {
      setBusy(false);
    }
  };

  const pair = (
    label: string,
    keyEn: keyof DigestInput,
    keyNe: keyof DigestInput,
    placeholderEn: string,
    placeholderNe: string
  ) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={`${label} (English)`}>
        <textarea
          className={`${inputClass} min-h-[64px] resize-y`}
          value={form[keyEn]}
          onChange={(e) => set(keyEn, e.target.value)}
          placeholder={placeholderEn}
          required
        />
      </Field>
      <Field label={`${label} (Nepali)`}>
        <textarea
          className={`${inputClass} min-h-[64px] resize-y`}
          value={form[keyNe]}
          onChange={(e) => set(keyNe, e.target.value)}
          placeholder={placeholderNe}
        />
      </Field>
    </div>
  );

  return (
    <Modal
      title={digest ? "Edit digest" : "New digest — Today's 3 things"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </Field>
          <Field label="Grade band">
            <select
              className={selectClass}
              value={form.gradeBand}
              onChange={(e) => set("gradeBand", e.target.value as GradeBand)}
            >
              {GRADE_BANDS.map((g) => (
                <option key={g} value={g}>
                  Grades {g}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {pair(
          "1 · Headline",
          "headlineEn",
          "headlineNe",
          "The big thing happening today…",
          "आजको मुख्य समाचार…"
        )}
        {pair(
          "2 · GK fact",
          "gkFactEn",
          "gkFactNe",
          "A fun general-knowledge fact…",
          "रोचक सामान्य ज्ञान…"
        )}
        {pair(
          "3 · Nepal fact",
          "nepalFactEn",
          "nepalFactNe",
          "Something cool about Nepal…",
          "नेपालबारे रोचक कुरा…"
        )}

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" busy={busy}>
            {digest ? "Save changes" : "Save draft"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
