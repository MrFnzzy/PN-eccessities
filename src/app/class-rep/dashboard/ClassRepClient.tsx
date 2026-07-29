"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AttendanceGrid, { GridRecord, GridStudent } from "@/components/AttendanceGrid";
import MonthCalendar from "@/components/MonthCalendar";
import Tabs from "@/components/Tabs";

export default function ClassRepClient() {
  const { data: session } = useSession();
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [students, setStudents] = useState<GridStudent[]>([]);
  const [records, setRecords] = useState<GridRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "roster">("calendar");

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
    await load();
  }

  async function handleSendComment(studentId: string, date: string, body: string) {
    const res = await fetch("/api/attendance/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date, body }),
    });
    if (!res.ok) throw new Error("Failed to send");
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-amber to-amber-burnt px-6 py-7 text-white shadow-pop sm:px-8">
        <p className="text-sm font-semibold text-white/80">Class rep</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mark attendance</h1>
        <p className="mt-1 max-w-xl text-sm text-white/85">
          Tap a day to set present, absent, or excused, and message your social worker directly
          about anything that needs context.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "calendar", label: "📅 Calendar view", accent: "bg-amber" },
            { key: "roster", label: "📋 Roster grid", accent: "bg-amber" },
          ]}
          active={view}
          onChange={(k) => setView(k as any)}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
            className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-amber"
          >
            ← Prev
          </button>
          <p className="min-w-[9rem] text-center text-sm font-semibold text-ink">
            {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <button
            onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
            className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-amber"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-ink/50">Loading roster…</p>
        ) : view === "calendar" ? (
          <MonthCalendar
            students={students}
            records={records}
            monthStart={monthStart}
            canSetStatus
            canComment
            currentUserId={(session?.user as any)?.id}
            onSetStatus={(studentId, date, status) => handleSave({ studentId, date, status })}
            onSendComment={handleSendComment}
          />
        ) : (
          <AttendanceGrid
            students={students}
            records={records}
            monthStart={monthStart}
            canSetStatus
            canComment
            currentUserId={(session?.user as any)?.id}
            onSave={handleSave}
            onSendComment={handleSendComment}
          />
        )}
      </div>
    </main>
  );
}
