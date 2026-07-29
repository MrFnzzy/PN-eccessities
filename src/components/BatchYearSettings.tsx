"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";
import type { ActiveBatch } from "@/lib/batches";

type Summary = {
  batches: ActiveBatch[];
  setAt: string;
  setByName: string | null;
  nextRolloverAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BatchYearSettings() {
  const { data: session } = useSession();
  const play = useSound();
  const role = (session?.user as any)?.role as string | undefined;
  const isClassRep = role === "STUDENT" && (session?.user as any)?.isClassRep;
  const canEdit = role === "ADMIN" || isClassRep;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [firstYearInput, setFirstYearInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/batch-settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't load the batch-year settings.");
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || "Couldn't load the batch-year settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    const firstYear = parseInt(firstYearInput, 10);
    if (!Number.isInteger(firstYear)) {
      setError("Enter a valid year, e.g. 2028.");
      play("error");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/batch-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't update the batch years.");
      setSummary(data);
      setEditing(false);
      play("success");
    } catch (err: any) {
      setError(err?.message || "Couldn't update the batch years.");
      play("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card text-sm text-ink/50">Loading batch years…</div>;
  }
  if (!summary) {
    return (
      <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card text-sm text-amber-burnt">
        {error || "Couldn't load the batch-year settings."}
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">Batch years</h3>
          <p className="mt-0.5 text-xs text-ink/50">
            Rolls forward on its own every 12 months. Next automatic update: {formatDate(summary.nextRolloverAt)}.
          </p>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => {
              setFirstYearInput(String(summary.batches[0]?.year ?? ""));
              setEditing(true);
            }}
            className="shrink-0 text-xs font-semibold text-sky-deep hover:underline"
          >
            Correct it
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {summary.batches.map((b) => (
          <span
            key={b.key}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${b.accent.bg} ${b.accent.text}`}
          >
            {b.label}
          </span>
        ))}
      </div>

      {summary.setByName && (
        <p className="mt-2 text-[11px] text-ink/40">Last set by {summary.setByName} on {formatDate(summary.setAt)}.</p>
      )}

      {editing && (
        <div className="mt-4 rounded-lg border border-ink/10 bg-ink/[0.02] p-3">
          <label className="mb-1 block text-xs font-semibold text-ink/70">
            Which batch year is First Year right now?
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              value={firstYearInput}
              onChange={(e) => setFirstYearInput(e.target.value)}
              className="w-28 rounded-lg border border-ink/15 px-2.5 py-1.5 text-sm outline-none focus:border-sky"
              placeholder="2028"
            />
            <SoundButton
              onClick={handleSave}
              disabled={saving}
              sound="success"
              className="px-3 py-1.5 text-xs"
            >
              {saving ? "Saving…" : "Save"}
            </SoundButton>
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-semibold text-ink/50 hover:underline"
            >
              Cancel
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink/40">
            Second and Third Year will follow automatically (one and two years behind), and the 12-month countdown restarts from today.
          </p>
        </div>
      )}

      {error && !editing && <p className="mt-2 text-xs text-amber-burnt">{error}</p>}
    </div>
  );
}
