"use client";

import { useCallback, useEffect, useState } from "react";
import AttendanceGrid, { GridRecord, GridStudent } from "@/components/AttendanceGrid";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";

type StudentRow = GridStudent & { batch: string };

export default function SocialWorkerClient() {
  const play = useSound();
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [records, setRecords] = useState<GridRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBatch, setNoBatch] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?monthStart=${monthStart.toISOString()}`);
    const data = await res.json();
    if (res.status === 403) {
      setNoBatch(true);
      setLoading(false);
      return;
    }
    setStudents(data.students || []);
    setRecords(data.records || []);
    setLoading(false);
  }, [monthStart]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(payload: any) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save");
    load();
  }

  async function assignRep(studentId: string) {
    setMessage("");
    const res = await fetch("/api/social-worker/assign-class-rep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      play("error");
      return;
    }
    play("success");
    setMessage("Class rep updated.");
    load();
  }

  if (noBatch) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">No batch assigned yet</h1>
        <p className="mt-2 text-ink/60">
          An admin needs to assign you to a batch (1st, 2nd, or 3rd year) before you can view
          attendance or assign a class rep.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-sky-deep">Social worker</p>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Your batch</h1>
      <p className="mt-1 text-sm text-ink/60">
        Assign a class rep and review attendance. You can add your own comment on any day.
      </p>

      <div className="mt-5 rounded-xl2 border border-ink/10 bg-white p-4 shadow-card">
        <h2 className="font-display text-sm font-semibold text-ink">Class representative</h2>
        <p className="mt-1 text-xs text-ink/50">
          Tap a student to make them the class rep for this batch. Only one at a time.
        </p>
        {message && <p className="mt-2 text-xs font-semibold text-sky-deep">{message}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {loading ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : (
            students.map((s) => (
              <button
                key={s.id}
                onClick={() => assignRep(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  s.isClassRep
                    ? "bg-amber text-white"
                    : "bg-ink/5 text-ink/60 hover:bg-sky/10 hover:text-sky-deep"
                }`}
              >
                {s.fullName} {s.isClassRep ? "★" : ""}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
          className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-sky"
        >
          ← Prev month
        </button>
        <p className="min-w-[9rem] text-center text-sm font-semibold text-ink">
          {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
          className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-sky"
        >
          Next month →
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-ink/50">Loading roster…</p>
        ) : (
          <AttendanceGrid
            students={students}
            records={records}
            monthStart={monthStart}
            canSetStatus
            canSetExcuseComment={false}
            canSetSocialWorkerComment
            onSave={handleSave}
          />
        )}
      </div>
    </main>
  );
}
