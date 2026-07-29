"use client";

import { useEffect, useState, useCallback } from "react";
import SoundButton from "@/components/SoundButton";
import StatusBadge from "@/components/StatusBadge";
import { useSound } from "@/lib/useSound";

type Receipt = {
  id: string;
  fileUrl: string | null;
  periodLabel: string;
  submittedAt: string;
  status: "PENDING" | "CONFIRMED";
  staffComment: string | null;
  addedManually: boolean;
};

export default function CounterpartTab() {
  const play = useSound();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/receipts");
    const data = await res.json();
    setReceipts(data.receipts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Please attach your receipt image or PDF.");
      play("error");
      return;
    }
    const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB, safely under Vercel's 4.5MB body limit
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage(
        "That file is too large (max 4MB). Try compressing the image or exporting a smaller PNG/JPG."
      );
      play("error");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/receipts/upload", { method: "POST", body: form });
      let uploadData: any = {};
      try {
        uploadData = await uploadRes.json();
      } catch {
        throw new Error(
          uploadRes.status === 413
            ? "That file is too large for the server to accept (max ~4MB)."
            : "Upload failed unexpectedly. Please try a smaller file or try again."
        );
      }
      if (!uploadRes.ok) throw new Error(uploadData.error);

      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadData.url,
          periodLabel: periodLabel || undefined,
        }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(
          "Your file uploaded, but saving the receipt failed unexpectedly. Please try submitting again."
        );
      }
      if (!res.ok) throw new Error(data.error);

      play("success");
      setFile(null);
      setPeriodLabel("");
      setMessage("Receipt submitted! Staff will review and confirm it.");
      load();
    } catch (err: any) {
      play("error");
      setMessage(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[340px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="h-fit rounded-xl2 border border-ink/10 bg-white p-5 shadow-card"
      >
        <h2 className="font-display font-semibold text-ink">Submit a receipt</h2>
        <p className="mt-1 text-xs text-ink/50">
          Your name is taken automatically from your account.
        </p>

        <label className="mt-4 block text-sm font-semibold text-ink/80">Period / month</label>
        <input
          value={periodLabel}
          onChange={(e) => setPeriodLabel(e.target.value)}
          placeholder="e.g. Month 3 - September 2026"
          className="mt-1 w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-sm outline-none focus:border-sky"
        />

        <label className="mt-4 block text-sm font-semibold text-ink/80">Receipt file</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-1 w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-sky/10 file:px-3 file:py-2 file:text-sky-deep file:font-semibold"
        />

        {message && (
          <p className="mt-3 rounded-xl bg-sky/10 px-3 py-2 text-xs text-sky-deep">{message}</p>
        )}

        <SoundButton type="submit" disabled={submitting} className="mt-4 w-full">
          {submitting ? "Submitting…" : "Submit receipt"}
        </SoundButton>
      </form>

      <div>
        <h2 className="font-display font-semibold text-ink mb-3">Your submissions</h2>
        {loading ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : receipts.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-ink/20 bg-white/60 p-8 text-center text-sm text-ink/50">
            No receipts yet. Submit your first one to get started.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {receipts.map((r) => (
              <li
                key={r.id}
                className="rounded-xl2 border border-ink/10 bg-white p-4 shadow-card animate-pop-in"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{r.periodLabel}</p>
                    <p className="text-xs text-ink/50">
                      {new Date(r.submittedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {r.addedManually ? " · added by staff" : ""}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.staffComment && (
                  <p className="mt-2 rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink/70">
                    <span className="font-semibold">Staff comment: </span>
                    {r.staffComment}
                  </p>
                )}
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-sky-deep"
                  >
                    View file →
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
