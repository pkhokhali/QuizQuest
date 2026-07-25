"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  Country,
  GradeBand,
  Question,
  QuestionInput,
  QuestionStatus,
  Subject,
} from "@/lib/types";
import {
  COUNTRIES,
  GRADE_BANDS,
  QUESTION_STATUSES,
  SUBJECTS,
} from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  Field,
  inputClass,
  Modal,
  PrimaryButton,
  SecondaryButton,
  selectClass,
} from "@/components/ui";

const EMPTY_FORM: QuestionInput = {
  textEn: "",
  textNe: "",
  optionsEn: ["", "", "", ""],
  optionsNe: ["", "", "", ""],
  correctIndex: 0,
  country: "nepal",
  subject: "gk",
  gradeBand: "6-8",
  difficulty: 2,
  topic: "",
  source: "",
  status: "draft",
};

export default function QuestionModal({
  question,
  onClose,
  onSaved,
}: {
  question: Question | null; // null = create new
  onClose: () => void;
  onSaved: (q: Question) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<QuestionInput>(() =>
    question
      ? {
          textEn: question.textEn,
          textNe: question.textNe ?? "",
          optionsEn: [...question.optionsEn],
          optionsNe:
            question.optionsNe?.length === 4
              ? [...question.optionsNe]
              : ["", "", "", ""],
          correctIndex: question.correctIndex,
          country: question.country,
          subject: question.subject,
          gradeBand: question.gradeBand,
          difficulty: question.difficulty,
          topic: question.topic ?? "",
          source: question.source ?? "",
          status: question.status,
        }
      : EMPTY_FORM
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof QuestionInput>(key: K, value: QuestionInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setOption = (lang: "En" | "Ne", index: number, value: string) =>
    setForm((f) => {
      const key = `options${lang}` as const;
      const next = [...f[key]];
      next[index] = value;
      return { ...f, [key]: next };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.textEn.trim()) {
      setError("The English question text is required.");
      return;
    }
    if (form.optionsEn.some((o) => !o.trim())) {
      setError("All four English options are required.");
      return;
    }

    setBusy(true);
    try {
      const body: QuestionInput = {
        ...form,
        textEn: form.textEn.trim(),
        textNe: form.textNe.trim(),
        optionsEn: form.optionsEn.map((o) => o.trim()),
        optionsNe: form.optionsNe.map((o) => o.trim()),
        topic: form.topic.trim(),
        source: form.source.trim(),
      };
      const res = question
        ? await api<{ question: Question }>(
            `/api/admin/questions/${question.id}`,
            { method: "PUT", body }
          )
        : await api<{ question: Question }>("/api/admin/questions", {
            method: "POST",
            body,
          });
      toast(question ? "Question updated." : "Question created.", "success");
      onSaved(res.question);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save the question."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={question ? `Edit question #${question.id}` : "New question"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Question (English)">
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              value={form.textEn}
              onChange={(e) => set("textEn", e.target.value)}
              placeholder="What is the capital of Japan?"
              required
            />
          </Field>
          <Field label="Question (Nepali)" hint="Optional — falls back to English">
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              value={form.textNe}
              onChange={(e) => set("textNe", e.target.value)}
              placeholder="जापानको राजधानी कुन हो?"
            />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Options
            </span>
            <span className="text-xs text-slate-400">
              Pick the radio next to the correct answer
            </span>
          </div>
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center ${
                  form.correctIndex === i
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200"
                }`}
              >
                <label className="flex shrink-0 cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={form.correctIndex === i}
                    onChange={() => set("correctIndex", i)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="w-5 text-sm font-bold text-slate-400">
                    {String.fromCharCode(65 + i)}
                  </span>
                </label>
                <input
                  className={inputClass}
                  value={form.optionsEn[i]}
                  onChange={(e) => setOption("En", i, e.target.value)}
                  placeholder={`Option ${i + 1} (English)`}
                  required
                />
                <input
                  className={inputClass}
                  value={form.optionsNe[i]}
                  onChange={(e) => setOption("Ne", i, e.target.value)}
                  placeholder={`Option ${i + 1} (Nepali, optional)`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Country">
            <select
              className={selectClass}
              value={form.country}
              onChange={(e) => set("country", e.target.value as Country)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select
              className={selectClass}
              value={form.subject}
              onChange={(e) => set("subject", e.target.value as Subject)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade band">
            <select
              className={selectClass}
              value={form.gradeBand}
              onChange={(e) => set("gradeBand", e.target.value as GradeBand)}
            >
              {GRADE_BANDS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty (1–5)">
            <select
              className={selectClass}
              value={form.difficulty}
              onChange={(e) => set("difficulty", Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Topic">
            <input
              className={inputClass}
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder="capitals"
            />
          </Field>
          <Field label="Source">
            <input
              className={inputClass}
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="generator:capitals"
            />
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value as QuestionStatus)}
            >
              {QUESTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

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
            {question ? "Save changes" : "Create question"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
