"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import AttendanceGrid, { GridRecord, GridStudent } from "@/components/AttendanceGrid";
import MonthCalendar from "@/components/MonthCalendar";
import Tabs from "@/components/Tabs";
import { useSound } from "@/lib/useSound";
import { SECTIONS, SECTION_LABEL, SectionKey } from "@/lib/batches";

type StudentRow = GridStudent & { batch: string; section?: SectionKey };

export default function SocialWorkerClient() {
  const { data: session } = useSession();
  const play = useSound();
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [section, setSection] = useState<SectionKey>("PN1");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [records, setRecords] = useState<GridRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noBatch, setNoBatch] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"calendar" | "roster">("calendar");
  const [repQuery, setRepQuery] = useState("");
  const [repBusyId, setRepBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/attendance?monthStart=${monthStart.toISOString()}&section=${section}`
      );
      if (res.status === 403) {
        setNoBatch(true);
        return;
      }
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("The server sent back something unexpected. Please try again.");
      }
      if (!res.ok) throw new Error(data?.error || "Couldn't load this class's attendance.");
      setStudents(data.students || []);
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err?.message || "Couldn't load this class's attendance. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [monthStart, section]);

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

  async function handleMarkReviewed(studentId: string, date: string) {
    await fetch("/api/attendance/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date }),
    });
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId && r.date.slice(0, 10) === date.slice(0, 10) ? { ...r, reviewedBySW: true } : r))
    );
  }

  async function assignRep(studentId: string) {
    setMessage("");
    setRepBusyId(studentId);
    const res = await fetch("/api/social-worker/assign-class-rep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    const data = await res.json();
    setRepBusyId(null);
    if (!res.ok) {
      setMessage(data.error);
      play("error");
      return;
    }
    play("success");
    setMessage(`${data.student ? "" : ""}Class rep updated.`);
    load();
  }

  async function removeRep(studentId: string) {
    setMessage("");
    setRepBusyId(studentId);
    const res = await fetch("/api/social-worker/assign-class-rep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, action: "remove" }),
    });
    const data = await res.json();
    setRepBusyId(null);
    if (!res.ok) {
      setMessage(data.error);
      play("error");
      return;
    }
    play("click");
    setMessage("Class rep removed.");
    load();
  }

  const currentRep = students.find((s) => s.isClassRep);
  const filteredStudents = useMemo(
    () => students.filter((s) => s.fullName.toLowerCase().includes(repQuery.trim().toLowerCase())),
    [students, repQuery]
  );

  const alertCount = useMemo(
    () =>
      records.filter((r) => (r.status === "ABSENT" || r.status === "EXCUSED") && !r.reviewedBySW).length,
    [records]
  );

  if (noBatch) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-amber/15 text-3xl">🗂️</div>
        <h1 className="font-display text-2xl font-bold text-ink">No batch assigned yet</h1>
        <p className="mt-2 text-ink/60">
          An admin needs to assign you to a batch (1st, 2nd, or 3rd year) before you can view
          attendance or manage a class rep.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-sky to-sky-deep px-6 py-7 text-white shadow-pop sm:px-8">
        <p className="text-sm font-semibold text-white/80">Social worker</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Your batch</h1>
        <p className="mt-1 max-w-xl text-sm text-white/85">
          Your batch has two classes, PN1 and PN2, each with its own class rep. Switch between
          them below to manage each class's rep and review its attendance.
        </p>
        {alertCount > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
            {alertCount} unread {alertCount === 1 ? "alert" : "alerts"} this month
          </div>
        )}
      </div>

      <div className="mt-5">
        <Tabs
          tabs={SECTIONS.map((s) => ({ key: s, label: SECTION_LABEL[s], accent: "bg-sky" }))}
          active={section}
          onChange={(k) => setSection(k as SectionKey)}
        />
      </div>

      <div className="mt-5 rounded-xl2 border border-ink/10 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink">
              {SECTION_LABEL[section]} class representative
            </h2>
            <p className="mt-0.5 text-xs text-ink/50">
              {currentRep ? (
                <>
                  <span className="font-semibold text-amber-burnt">{currentRep.fullName}</span> is currently
                  the class rep for {SECTION_LABEL[section]}.
                </>
              ) : (
                `No class rep assigned yet for ${SECTION_LABEL[section]} — pick one below.`
              )}
            </p>
          </div>
          <input
            value={repQuery}
            onChange={(e) => setRepQuery(e.target.value)}
            placeholder="Search students…"
            className="w-48 rounded-lg border border-ink/15 px-3 py-1.5 text-sm outline-none focus:border-sky"
          />
        </div>
        {message && <p className="mt-2 text-xs font-semibold text-sky-deep">{message}</p>}

        <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-ink/50">Loading…</p>
          ) : error ? (
            <div className="w-full text-center">
              <p className="text-sm font-semibold text-amber-burnt">{error}</p>
              <button
                onClick={load}
                className="mt-2 rounded-lg bg-amber-burnt px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Try again
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-ink/40">No students match "{repQuery}" in {SECTION_LABEL[section]}.</p>
          ) : (
            filteredStudents.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-1.5 text-xs font-semibold transition-colors ${
                  s.isClassRep ? "bg-amber text-white" : "bg-ink/5 text-ink/60"
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-white/25 text-[9px]">
                    {s.fullName.charAt(0)}
                  </span>
                  {s.fullName}
                  {s.isClassRep ? " ★" : ""}
                </span>
                {s.isClassRep ? (
                  <button
                    onClick={() => removeRep(s.id)}
                    disabled={repBusyId === s.id}
                    className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-[11px] hover:bg-amber-burnt disabled:opacity-40"
                    title="Remove as class rep"
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    onClick={() => assignRep(s.id)}
                    disabled={repBusyId === s.id}
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-sky-deep hover:bg-sky/10 disabled:opacity-40"
                  >
                    Make rep
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: "calendar", label: "📅 Calendar view" },
            { key: "roster", label: "📋 Roster grid" },
          ]}
          active={view}
          onChange={(k) => setView(k as any)}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
            className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-sky"
          >
            ← Prev
          </button>
          <p className="min-w-[9rem] text-center text-sm font-semibold text-ink">
            {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <button
            onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
            className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-sky"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-ink/50">Loading roster…</p>
        ) : error ? (
          <div className="rounded-xl2 border border-amber-burnt/20 bg-amber-burnt/5 p-6 text-center">
            <p className="text-sm font-semibold text-amber-burnt">{error}</p>
            <button
              onClick={load}
              className="mt-3 rounded-lg bg-amber-burnt px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Try again
            </button>
          </div>
        ) : view === "calendar" ? (
          <MonthCalendar
            students={students}
            records={records}
            monthStart={monthStart}
            canSetStatus
            canComment
            showNotifications
            currentUserId={(session?.user as any)?.id}
            onSetStatus={(studentId, date, status) => handleSave({ studentId, date, status })}
            onSendComment={handleSendComment}
            onMarkReviewed={handleMarkReviewed}
          />
        ) : (
          <AttendanceGrid
            students={students}
            records={records}
            monthStart={monthStart}
            canSetStatus
            canComment
            showNotifications
            currentUserId={(session?.user as any)?.id}
            onSave={handleSave}
            onSendComment={handleSendComment}
            onMarkReviewed={handleMarkReviewed}
          />
        )}
      </div>
    </main>
  );
}
