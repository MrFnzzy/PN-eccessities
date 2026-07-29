"use client";

import { useCallback, useEffect, useState } from "react";
import AttendanceGrid, { GridRecord, GridStudent } from "@/components/AttendanceGrid";

export default function ClassRepClient() {
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [students, setStudents] = useState<GridStudent[]>([]);
  const [records, setRecords] = useState<GridRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?monthStart=${monthStart.toISOString()}`);
    const data = await res.json();
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-amber-burnt">Class rep</p>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Mark attendance</h1>
      <p className="mt-1 text-sm text-ink/60">
        Tap a square to set present, absent, or excused, and leave a note for your social worker.
      </p>

      <div className="mt-5 flex items-center gap-2">
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
            canSetExcuseComment
            canSetSocialWorkerComment={false}
            onSave={handleSave}
          />
        )}
      </div>
    </main>
  );
}
