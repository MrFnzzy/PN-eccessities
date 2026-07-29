"use client";

import { useMemo, useState } from "react";
import { useSound } from "@/lib/useSound";
import StatusBadge from "@/components/StatusBadge";
import CommentThread, { ThreadComment } from "@/components/CommentThread";
import type { GridRecord, GridStudent } from "@/components/AttendanceGrid";

const DOT: Record<string, string> = {
  PRESENT: "bg-sky",
  ABSENT: "bg-amber-burnt",
  EXCUSED: "bg-amber",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}

/**
 * A square-grid "directory" of every student in the class. Tap a student's card
 * to expand it into their full month of attendance plus the notes/taggings left
 * on each day — without leaving the roster.
 */
export default function StudentRosterCards({
  students,
  records,
  monthStart,
  canSetStatus,
  canComment,
  currentUserId,
  onSave,
  onSendComment,
}: {
  students: GridStudent[];
  records: (GridRecord & { comments?: ThreadComment[] })[];
  monthStart: Date;
  canSetStatus: boolean;
  canComment: boolean;
  currentUserId?: string;
  onSave: (payload: { studentId: string; date: string; status?: string }) => Promise<void>;
  onSendComment: (studentId: string, date: string, body: string) => Promise<void>;
}) {
  const play = useSound();
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = new Date();

  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const byStudent = useMemo(() => {
    const m = new Map<string, Map<number, GridRecord & { comments?: ThreadComment[] }>>();
    records.forEach((r) => {
      if (!m.has(r.studentId)) m.set(r.studentId, new Map());
      m.get(r.studentId)!.set(new Date(r.date).getUTCDate(), r);
    });
    return m;
  }, [records]);

  function summaryFor(studentId: string) {
    const days = byStudent.get(studentId);
    const out = { PRESENT: 0, ABSENT: 0, EXCUSED: 0 };
    days?.forEach((r) => out[r.status]++);
    return out;
  }

  function openStudent(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
    setSelectedDay(null);
    play("click");
  }

  const dateKey = (day: number) =>
    new Date(Date.UTC(monthStart.getFullYear(), monthStart.getMonth(), day)).toISOString();

  const openStudentRecord = openId ? students.find((s) => s.id === openId) : undefined;
  const openDayRecord = openId && selectedDay ? byStudent.get(openId)?.get(selectedDay) : undefined;

  async function handleStatusChange(status: string) {
    if (!openId || !selectedDay) return;
    setSaving(true);
    try {
      await onSave({ studentId: openId, date: dateKey(selectedDay), status });
      play("success");
    } catch {
      play("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-4 shadow-card sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {students.map((s) => {
          const sum = summaryFor(s.id);
          const isOpen = openId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => openStudent(s.id)}
              className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl2 border p-3 text-center transition-all ${
                isOpen
                  ? "border-sky bg-sky/10 ring-2 ring-sky"
                  : "border-ink/10 bg-cream/40 hover:border-sky hover:bg-sky/5"
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sky/15 text-sm font-bold text-sky-deep">
                {initials(s.fullName)}
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-ink">{s.fullName}</span>
              {s.isClassRep && (
                <span className="rounded-full bg-amber/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-burnt">
                  rep
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[9px] font-semibold text-ink/40">
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky" /> {sum.PRESENT}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-burnt" /> {sum.ABSENT}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" /> {sum.EXCUSED}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {openStudentRecord && (
        <div className="mt-5 animate-slide-up rounded-xl border border-ink/10 bg-cream/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-ink">
              {openStudentRecord.fullName} · {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
            <button onClick={() => setOpenId(null)} className="text-sm text-ink/40 hover:text-ink">
              ✕
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-ink/40">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const rec = byStudent.get(openStudentRecord.id)?.get(day);
              const hasComments = (rec?.comments?.length || 0) > 0;
              const isToday =
                today.getFullYear() === monthStart.getFullYear() &&
                today.getMonth() === monthStart.getMonth() &&
                today.getDate() === day;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDay(day);
                    play("click");
                  }}
                  className={`relative aspect-square rounded-lg border transition-transform hover:scale-105 ${
                    isSelected ? "border-ink ring-2 ring-ink" : isToday ? "border-amber" : "border-ink/5"
                  }`}
                >
                  <div
                    className={`flex h-full w-full flex-col items-center justify-center rounded-lg ${
                      rec ? DOT[rec.status] : "bg-ink/10"
                    } ${rec ? "text-white" : "text-ink/40"}`}
                  >
                    <span className="text-xs font-semibold">{day}</span>
                  </div>
                  {hasComments && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ink/50 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-4 animate-slide-up rounded-xl border border-ink/10 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink/60">
                  {monthStart.toLocaleDateString(undefined, { month: "short" })} {selectedDay} ·{" "}
                  <StatusBadge status={openDayRecord?.status || "PRESENT"} />
                </p>
              </div>

              {canSetStatus && (
                <div className="mt-2.5 flex gap-1.5">
                  {["PRESENT", "ABSENT", "EXCUSED"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleStatusChange(opt)}
                      disabled={saving}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                        (openDayRecord?.status || "PRESENT") === opt
                          ? `${DOT[opt]} text-white`
                          : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                      }`}
                    >
                      {opt.charAt(0) + opt.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <CommentThread
                  comments={(openDayRecord?.comments as ThreadComment[]) || []}
                  currentUserId={currentUserId}
                  canReply={canComment}
                  compact
                  emptyLabel="No taggings for this day yet."
                  onSend={(body) => onSendComment(openStudentRecord.id, dateKey(selectedDay), body)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
