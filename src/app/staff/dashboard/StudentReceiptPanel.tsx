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
  totalAmount: string | null;
  amountInWords: string | null;
  purpose: string | null;
};

export default function StudentReceiptPanel({
  student,
  onChanged,
}: {
  student: { id: string; fullName: string; user: { email: string } };
  onChanged: () => void;
}) {
  const play = useSound();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ periodLabel: "", submittedAt: "", markConfirmed: false });
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/receipts?studentId=${student.id}`);
    const data = await res.json();
    setReceipts(data.receipts || []);
    setLoading(false);
  }, [student.id]);

  useEffect(() => {
    load();
    setShowAdd(false);
    setNotice("");
  }, [load]);

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.periodLabel || !addForm.submittedAt) return;
    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        periodLabel: addForm.periodLabel,
        submittedAt: addForm.submittedAt,
        status: addForm.markConfirmed ? "CONFIRMED" : "PENDING",
      }),
    });
    if (res.ok) {
      play("success");
      setAddForm({ periodLabel: "", submittedAt: "", markConfirmed: false });
      setShowAdd(false);
      load();
      onChanged();
    } else {
      play("error");
    }
  }

  async function handleConfirm(id: string) {
    setBusyId(id);
    setNotice("");
    const res = await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true, staffComment: comments[id] || undefined, sendEmail: true }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      play("error");
      setNotice(data.error || "Something went wrong.");
      return;
    }
    play("success");
    setNotice(
      data.emailError
        ? data.emailError
        : `Confirmed. Confirmation email sent to ${student.user.email}.`
    );
    load();
    onChanged();
  }

  async function handleDelete(id: string, periodLabel: string) {
    const confirmed = window.confirm(
      `Delete the "${periodLabel}" receipt submitted by ${student.fullName}? This cannot be undone.`
    );
    if (!confirmed) return;
    setBusyId(id);
    setNotice("");
    const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      play("error");
      setNotice("Could not delete this receipt. Please try again.");
      return;
    }
    play("success");
    setNotice("Receipt deleted.");
    load();
    onChanged();
  }

  async function handleDownloadAck(id: string) {
    setBusyId(id);
    setNotice("");
    try {
      const res = await fetch(`/api/receipts/${id}/acknowledgement`);
      if (!res.ok) {
        let errMsg = "Could not generate the acknowledgement receipt.";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          // response wasn't JSON; keep the default message
        }
        throw new Error(errMsg);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : "Acknowledgement_Receipt.docx";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      play("error");
      setNotice(err.message || "Could not generate the acknowledgement receipt.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveComment(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/receipts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffComment: comments[id] || "", sendEmail: false }),
    });
    setBusyId(null);
    if (res.ok) {
      play("success");
      load();
    } else {
      play("error");
    }
  }

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{student.fullName}</h2>
          <p className="text-xs text-ink/50">{student.user.email}</p>
        </div>
        <SoundButton variant="secondary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Cancel" : "+ Add receipt manually"}
        </SoundButton>
      </div>

      {notice && (
        <p className="mt-3 rounded-xl bg-sky/10 px-3 py-2 text-xs text-sky-deep">{notice}</p>
      )}

      {showAdd && (
        <form
          onSubmit={handleAddManual}
          className="mt-4 grid gap-3 rounded-xl border border-dashed border-ink/20 p-4 sm:grid-cols-2"
        >
          <p className="text-xs text-ink/50 sm:col-span-2">
            Use this to backdate a receipt the student already submitted before this system
            existed.
          </p>
          <input
            required
            placeholder="Period label, e.g. Month 1 - May 2026"
            value={addForm.periodLabel}
            onChange={(e) => setAddForm({ ...addForm, periodLabel: e.target.value })}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky sm:col-span-2"
          />
          <input
            required
            type="date"
            value={addForm.submittedAt}
            onChange={(e) => setAddForm({ ...addForm, submittedAt: e.target.value })}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
          />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={addForm.markConfirmed}
              onChange={(e) => setAddForm({ ...addForm, markConfirmed: e.target.checked })}
            />
            Mark as already confirmed
          </label>
          <SoundButton type="submit" className="sm:col-span-2">
            Add receipt
          </SoundButton>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : receipts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/20 p-6 text-center text-sm text-ink/50">
            No receipts submitted yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {receipts.map((r) => (
              <li key={r.id} className="rounded-xl border border-ink/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{r.periodLabel}</p>
                    <p className="text-xs text-ink/50">
                      {new Date(r.submittedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {r.addedManually ? " · manual entry" : " · student submitted"}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                {(r.totalAmount || r.purpose) && (
                  <p className="mt-2 text-xs text-ink/60">
                    {r.totalAmount && <span className="font-semibold">₱{r.totalAmount}</span>}
                    {r.totalAmount && r.purpose && " · "}
                    {r.purpose}
                  </p>
                )}

                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-sky-deep"
                  >
                    View attached file →
                  </a>
                )}

                <textarea
                  value={comments[r.id] ?? r.staffComment ?? ""}
                  onChange={(e) => setComments({ ...comments, [r.id]: e.target.value })}
                  rows={2}
                  placeholder="Add a comment for the student…"
                  className="mt-3 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  <SoundButton
                    variant="ghost"
                    onClick={() => handleSaveComment(r.id)}
                    disabled={busyId === r.id}
                  >
                    Save comment
                  </SoundButton>
                  {r.status === "PENDING" && (
                    <SoundButton onClick={() => handleConfirm(r.id)} disabled={busyId === r.id} sound="success">
                      {busyId === r.id ? "Confirming…" : "Confirm & email student"}
                    </SoundButton>
                  )}
                  <SoundButton
                    variant="secondary"
                    onClick={() => handleDownloadAck(r.id)}
                    disabled={busyId === r.id}
                  >
                    {busyId === r.id ? "Preparing…" : "Download acknowledgement receipt"}
                  </SoundButton>
                  <SoundButton
                    variant="danger"
                    onClick={() => handleDelete(r.id, r.periodLabel)}
                    disabled={busyId === r.id}
                    sound="error"
                  >
                    Delete
                  </SoundButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
