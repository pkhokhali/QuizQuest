"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MemoryPack, MemoryPair, Subject } from "@/lib/types";
import { SUBJECTS } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  EmptyState,
  ErrorBanner,
  inputClass,
  PrimaryButton,
  Skeleton,
} from "@/components/ui";

export default function MemoryPacksPage() {
  const { toast } = useToast();
  const [packs, setPacks] = useState<MemoryPack[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Pack Form state
  const [showCreate, setShowCreate] = useState(false);
  const [titleEn, setTitleEn] = useState("");
  const [titleNe, setTitleNe] = useState("");
  const [subject, setSubject] = useState<Subject>("gk");
  const [difficulty, setDifficulty] = useState(1);
  const [timeLimitSec, setTimeLimitSec] = useState(60);
  const [pairs, setPairs] = useState<Array<{ q: string; a: string; emoji?: string }>>([
    { q: "Mt. Everest", a: "8,848.86 m", emoji: "🏔️" },
    { q: "Kathmandu", a: "Capital City", emoji: "🏛️" },
    { q: "Rhododendron", a: "National Flower", emoji: "🌸" },
    { q: "Danfe", a: "National Bird", emoji: "🦚" },
    { q: "Yeti", a: "Mythical Creature", emoji: "❄️" },
    { q: "Lumbini", a: "Buddha Birthplace", emoji: "🪷" },
  ]);
  const [saving, setSaving] = useState(false);

  const loadPacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ packs: MemoryPack[] }>("/api/admin/memory/packs");
      setPacks(res.packs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load memory packs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacks();
  }, []);

  const handlePairChange = (index: number, field: "q" | "a" | "emoji", val: string) => {
    setPairs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addPairRow = () => {
    if (pairs.length >= 8) {
      toast("Max 8 pairs per memory pack (16 cards)", "info");
      return;
    }
    setPairs((prev) => [...prev, { q: "", a: "", emoji: "✨" }]);
  };

  const removePairRow = (index: number) => {
    if (pairs.length <= 3) {
      toast("A memory pack needs at least 3 pairs", "info");
      return;
    }
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) {
      toast("Please enter a pack title", "error");
      return;
    }
    const validPairs = pairs.filter((p) => p.q.trim() && p.a.trim());
    if (validPairs.length < 3) {
      toast("Provide at least 3 non-empty pairs", "error");
      return;
    }

    setSaving(true);
    try {
      await api("/api/admin/memory/packs", {
        method: "POST",
        body: {
          titleEn: titleEn.trim(),
          titleNe: titleNe.trim() || undefined,
          subject,
          difficulty: Number(difficulty),
          timeLimitSec: Number(timeLimitSec),
          pairs: validPairs.map((p, idx) => ({ id: idx + 1, ...p })),
        },
      });
      toast("Memory pack created successfully!", "success");
      setShowCreate(false);
      setTitleEn("");
      setTitleNe("");
      loadPacks();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to create memory pack", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePack = async (packId: number, title: string) => {
    if (!confirm(`Delete memory pack "${title}"?`)) return;
    try {
      await api(`/api/admin/memory/packs/${packId}`, { method: "DELETE" });
      toast("Pack deleted", "success");
      loadPacks();
    } catch {
      toast("Could not delete pack", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Memory Block Quiz CMS
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage interactive 3D memory flip decks. Students flip and match facts against the clock.
          </p>
        </div>
        <PrimaryButton onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Close Form" : "+ Create Memory Pack"}
        </PrimaryButton>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreatePack}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5"
        >
          <h2 className="text-lg font-bold text-slate-800">New Memory Block Pack</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Pack Title (English) *
              </label>
              <input
                className={inputClass}
                placeholder="e.g. Solar System Wonders"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Pack Title (Nepali)
              </label>
              <input
                className={inputClass}
                placeholder="उदा. सौर्यमण्डलका रहस्य"
                value={titleNe}
                onChange={(e) => setTitleNe(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
              <select
                className={inputClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Difficulty Level (1-3)
              </label>
              <input
                type="number"
                min={1}
                max={3}
                className={inputClass}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Time Limit (Seconds)
              </label>
              <input
                type="number"
                min={20}
                max={180}
                className={inputClass}
                value={timeLimitSec}
                onChange={(e) => setTimeLimitSec(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Pairs Editor */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Knowledge Match Pairs ({pairs.length}/8)
              </label>
              <button
                type="button"
                onClick={addPairRow}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add Pair
              </button>
            </div>

            <div className="space-y-2">
              {pairs.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-bold"
                    placeholder="Emoji"
                    value={p.emoji || ""}
                    onChange={(e) => handlePairChange(idx, "emoji", e.target.value)}
                  />
                  <input
                    className={`flex-1 ${inputClass}`}
                    placeholder="Side A (e.g. Question / Term)"
                    value={p.q}
                    onChange={(e) => handlePairChange(idx, "q", e.target.value)}
                    required
                  />
                  <span className="text-slate-400 font-bold">⇄</span>
                  <input
                    className={`flex-1 ${inputClass}`}
                    placeholder="Side B (e.g. Answer / Definition)"
                    value={p.a}
                    onChange={(e) => handlePairChange(idx, "a", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removePairRow(idx)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" busy={saving}>
              Save Memory Pack
            </PrimaryButton>
          </div>
        </form>
      )}

      {error && <ErrorBanner message={error} onRetry={loadPacks} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : packs && packs.length === 0 ? (
        <EmptyState
          icon="🃏"
          title="No memory packs yet"
          hint="Create a memory pack with match pairs to enable the Memory Block game mode for students."
        />
      ) : packs ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:border-slate-200 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold uppercase text-indigo-700 border border-indigo-100">
                      {pack.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ⏱ {pack.timeLimitSec}s
                    </span>
                    <span className="text-xs font-semibold text-amber-500">
                      {"★".repeat(pack.difficulty)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-2">{pack.titleEn}</h3>
                  {pack.titleNe && (
                    <p className="text-xs text-slate-400 font-medium">{pack.titleNe}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePack(pack.id, pack.titleEn)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                >
                  Delete
                </button>
              </div>

              {/* Pairs Chip Preview */}
              <div className="space-y-1.5 pt-2 border-t border-slate-50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {pack.pairs?.length ?? 0} Match Pairs ({(pack.pairs?.length ?? 0) * 2} Cards)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pack.pairs?.map((p: MemoryPair, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 border border-slate-100"
                    >
                      {p.emoji && <span>{p.emoji}</span>}
                      <span className="font-semibold">{p.q}</span>
                      <span className="text-slate-400">=</span>
                      <span>{p.a}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
