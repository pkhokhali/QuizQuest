"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ImportResult } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  inputClass,
  Modal,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui";

const CSV_HEADER =
  "textEn,textNe,option1En,option2En,option3En,option4En,option1Ne,option2Ne,option3Ne,option4Ne,correctIndex,country,subject,gradeBand,difficulty,topic,source";

export default function ImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const { toast } = useToast();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ""));
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await api<ImportResult>("/api/admin/questions/import", {
        method: "POST",
        body: { csv },
      });
      setResult(res);
      if (res.imported > 0) {
        toast(`Imported ${res.imported} question(s).`, "success");
        onImported();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Import questions from CSV" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Expected header
          </p>
          <code className="block break-all font-mono text-[11px] leading-relaxed text-slate-600">
            {CSV_HEADER}
          </code>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={onFile}
            className="hidden"
          />
          <SecondaryButton type="button" onClick={() => fileRef.current?.click()}>
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
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Choose a .csv file
          </SecondaryButton>
          <span className="text-xs text-slate-400">
            …or paste the raw CSV below
          </span>
        </div>

        <textarea
          className={`${inputClass} min-h-[180px] resize-y font-mono text-xs`}
          placeholder={`${CSV_HEADER}\nWhat is 2+2?,,4,3,5,6,,,,,0,global,math,1-3,1,arithmetic,manual`}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-semibold text-emerald-700">
                ✓ {result.imported} imported
              </span>
              <span className="font-semibold text-amber-700">
                ⤳ {result.skipped} skipped
              </span>
              <span className="font-semibold text-rose-700">
                ✕ {result.errors.length} error(s)
              </span>
            </div>
            {result.errors.length > 0 && (
              <ul className="max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-xs text-rose-600">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <SecondaryButton type="button" onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={submit}
            busy={busy}
            disabled={!csv.trim()}
          >
            Import
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
