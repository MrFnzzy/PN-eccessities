"use client";

import { useMemo, useState } from "react";
import { useSound } from "@/lib/useSound";
import StatusBadge from "@/components/StatusBadge";
import CommentThread, { ThreadComment } from "@/components/CommentThread";
import type { GridRecord, GridStudent } from "@/components/AttendanceGrid";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DOT: Record<string, string> = {
  PRESENT: "bg-sky",
  ABSENT: "bg-amber-burnt",
  EXCUSED: "bg-amber",
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function MonthCalendar({
  students,
  records,
  monthStart,
  canSetStatus,
  canComment,
  showNotifications = false,
  currentUserId,
  onSetStatus,
  onSendComment,
  onMarkReviewed,
}: {
  students: GridStudent[];
  records: (GridRecord & { comments?: ThreadComment[]; reviewedBySW?: boolean })[];
  monthStart: Date;
  canSetStatus: boolean;
  canComment: boolean;
  showNotifications?: boolean;
  currentUserId?: string;
  onSetStatus: (studentId: string, date: string, status: string) => Promise<void>;
  onSendComment: (studentId: string, date: string, body: string) => Promise<void>;
  onMarkReviewed?: (studentId: string, date: string) => Promise<void>;
}) {
  const play = useSound();
  const today = new Date();
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).getDay();

  const byDay = useMemo(() => {
    const m = new Map<number, Map<string, GridRecord & { comments?: ThreadComment[]; reviewedBySW?: boolean }>>();
    records.forEach((r) => {
      const d = new Date(r.date).getUTCDate();
      if (!m.has(d)) m.set(d, new Map());
      m.get(d)!.set(r.studentId, r);
    });
    return m;
  }, [records]);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alerts = useMemo(() => {
    const out: { studentId: string; name: string; day: number; status: string }[] = [];
    students.forEach((s) => {
      for (let d = 1; d <= daysInMonth; d++) {
        const rec = byDay.get(d)?.get(s.id);
        if (rec && (rec.status === "ABSENT" || rec.status === "EXCUSED") && !rec.reviewedBySW) {
          out.push({ studentId: s.id, name: s.fullName, day: d, status: rec.status });
        }
      }
    });
    return out.sort((a, b) => a.day - b.day);
  }, [students, byDay, daysInMonth]);

  function openDay(day: number) {
    setSelectedDay(day);
    setExpandedStudent(null);
    play("click");
  }

  const dateKey = (day: number) => new Date(Date.UTC(monthStart.getFullYear(), monthStart.getMonth(), day)).toISOString();

  async function markReviewed(studentId: string, day: number) {
    if (!onMarkReviewed) return;
    await onMarkReviewed(studentId, dateKey(day));
  }

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-4 shadow-card sm:p-5">
      {showNotifications && (
        <div className="mb-4 overflow-hidden rounded-xl border border-amber/30 bg-amber/5">
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white ${
                  alerts.length ? "bg-amber-burnt" : "bg-ink/20"
                }`}
              >
                {alerts.length}
              </span>
              <span className="font-display text-sm font-semibold text-ink">
                {alerts.length ? "This month's alerts" : "No unread alerts this month"}
              </span>
            </span>
            <span className={`text-ink/40 transition-transform ${alertsOpen ? "rotate-180" : ""}`}>⌄</span>
          </button>
          {alertsOpen && (
            <div className="max-h-56 overflow-y-auto border-t border-amber/20 px-2 pb-2">
              {alerts.length === 0 ? (
                <p className="px-2 py-3 text-xs text-ink/50">Every absence and excuse has been reviewed. 🎉</p>
              ) : (
                alerts.map((a) => (
                  <button
                    key={`${a.studentId}-${a.day}`}
                    onClick={() => openDay(a.day)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${DOT[a.status]}`} />
                      <span className="font-medium text-ink">{a.name}</span>
                    </span>
                    <span className="text-xs text-ink/50">
                      {monthStart.toLocaleDateString(undefined, { month: "short" })} {a.day} ·{" "}
                      {a.status === "ABSENT" ? "Absent" : "Excused"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink/40">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dayRecords = byDay.get(day);
          const flagged = Array.from(dayRecords?.values() || []).filter(
            (r) => r.status === "ABSENT" || r.status === "EXCUSED"
          );
          const unread = flagged.filter((r) => !r.reviewedBySW).length;
          const isToday = isSameDay(new Date(monthStart.getFullYear(), monthStart.getMonth(), day), today);
          const isSelected = selectedDay === day;

          return (
            <button
              key={i}
              onClick={() => openDay(day)}
              className={`group relative min-h-[86px] rounded-xl border p-1.5 text-left transition-all sm:min-h-[104px] ${
                isSelected
                  ? "border-sky bg-sky/10 ring-2 ring-sky"
                  : isToday
                  ? "border-amber/50 bg-amber/5 hover:border-sky"
                  : "border-ink/10 bg-cream/40 hover:border-sky hover:bg-sky/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isToday ? "text-amber-burnt" : "text-ink/60"}`}>{day}</span>
                {unread > 0 && (
                  <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-amber-burnt px-1 text-[9px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {flagged.slice(0, 3).map((r) => {
                  const s = students.find((st) => st.id === r.studentId);
                  return (
                    <span
                      key={r.studentId}
                      className={`truncate rounded px-1 py-0.5 text-[10px] font-medium text-white ${DOT[r.status]}`}
                      title={s?.fullName}
                    >
                      {s?.fullName?.split(" ")[0] || "Student"}
                    </span>
                  );
                })}
                {flagged.length > 3 && (
                  <span className="px-1 text-[10px] font-semibold text-ink/40">+{flagged.length - 3} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-4 animate-slide-up rounded-xl border border-ink/10 bg-cream/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-ink">
              {monthStart.toLocaleDateString(undefined, { month: "long" })} {selectedDay},{" "}
              {monthStart.getFullYear()}
            </p>
            <button onClick={() => setSelectedDay(null)} className="text-sm text-ink/40 hover:text-ink">
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {students.map((s) => {
              const rec = byDay.get(selectedDay)?.get(s.id);
              const status = rec?.status || "PRESENT";
              const comments: ThreadComment[] = (rec?.comments as ThreadComment[]) || [];
              const isOpen = expandedStudent === s.id;
              const needsReview = rec && (status === "ABSENT" || status === "EXCUSED") && !rec.reviewedBySW;

              return (
                <div key={s.id} className="rounded-lg border border-ink/10 bg-white p-2.5">
                  <button
                    onClick={() => {
                      setExpandedStudent(isOpen ? null : s.id);
                      if (!isOpen && needsReview) markReviewed(s.id, selectedDay);
                      play("click");
                    }}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-ink">{s.fullName}</span>
                      {s.isClassRep && (
                        <span className="rounded-full bg-amber/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-burnt">
                          rep
                        </span>
                      )}
                      {needsReview && <span className="h-2 w-2 rounded-full bg-amber-burnt" />}
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      {comments.length > 0 && (
                        <span className="text-[10px] font-semibold text-ink/40">💬 {comments.length}</span>
                      )}
                      <span className={`text-ink/30 transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 border-t border-ink/10 pt-3">
                      {canSetStatus && (
                        <div className="mb-3 flex gap-1.5">
                          {["PRESENT", "ABSENT", "EXCUSED"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => onSetStatus(s.id, dateKey(selectedDay), opt)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                status === opt ? `${DOT[opt]} text-white` : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                              }`}
                            >
                              {opt.charAt(0) + opt.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                      )}
                      <CommentThread
                        comments={comments}
                        currentUserId={currentUserId}
                        canReply={canComment}
                        compact
                        emptyLabel="No messages for this day yet."
                        onSend={(body) => onSendComment(s.id, dateKey(selectedDay), body)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
