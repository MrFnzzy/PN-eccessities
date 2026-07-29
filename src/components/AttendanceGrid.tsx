"use client";

import { useMemo, useState } from "react";
import { useSound } from "@/lib/useSound";
import CommentThread, { ThreadComment } from "@/components/CommentThread";

export type GridStudent = { id: string; fullName: string; isClassRep: boolean };
export type GridRecord = {
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  excuseComment: string | null;
  socialWorkerComment: string | null;
  reviewedBySW?: boolean;
  comments?: ThreadComment[];
};

const DOT: Record<string, string> = {
  PRESENT: "bg-sky",
  ABSENT: "bg-amber-burnt",
  EXCUSED: "bg-amber",
};

export default function AttendanceGrid({
  students,
  records,
  monthStart,
  canSetStatus,
  canComment,
  showNotifications = false,
  currentUserId,
  onSave,
  onSendComment,
  onMarkReviewed,
}: {
  students: GridStudent[];
  records: GridRecord[];
  monthStart: Date;
  canSetStatus: boolean;
  canComment: boolean;
  showNotifications?: boolean;
  currentUserId?: string;
  onSave: (payload: { studentId: string; date: string; status?: string }) => Promise<void>;
  onSendComment: (studentId: string, date: string, body: string) => Promise<void>;
  onMarkReviewed?: (studentId: string, date: string) => Promise<void>;
}) {
  const play = useSound();
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const map = useMemo(() => {
    const m = new Map<string, GridRecord>();
    records.forEach((r) => {
      const d = new Date(r.date);
      m.set(`${r.studentId}-${d.getUTCDate()}`, r);
    });
    return m;
  }, [records]);

  const [selected, setSelected] = useState<{ studentId: string; day: number; name: string } | null>(null);
  const [draftStatus, setDraftStatus] = useState<string>("PRESENT");
  const [saving, setSaving] = useState(false);

  function dateKey(day: number) {
    return new Date(Date.UTC(monthStart.getFullYear(), monthStart.getMonth(), day)).toISOString();
  }

  function openCell(studentId: string, day: number, name: string) {
    const rec = map.get(`${studentId}-${day}`);
    setSelected({ studentId, day, name });
    setDraftStatus(rec?.status || "PRESENT");
    play("click");
    if (showNotifications && onMarkReviewed && rec && !rec.reviewedBySW && (rec.status === "ABSENT" || rec.status === "EXCUSED")) {
      onMarkReviewed(studentId, dateKey(day));
    }
  }

  async function handleStatusChange(status: string) {
    if (!selected) return;
    setDraftStatus(status);
    setSaving(true);
    try {
      await onSave({ studentId: selected.studentId, date: dateKey(selected.day), status });
      play("success");
    } catch {
      play("error");
    } finally {
      setSaving(false);
    }
  }

  const selectedRecord = selected ? map.get(`${selected.studentId}-${selected.day}`) : undefined;

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-semibold text-ink/60">
                Student
              </th>
              {days.map((d) => (
                <th key={d} className="w-6 px-0.5 py-2.5 text-center font-medium text-ink/40">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-ink/5 transition-colors hover:bg-sky/5">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-ink whitespace-nowrap">
                  {s.fullName}
                  {s.isClassRep && (
                    <span className="ml-1.5 rounded-full bg-amber/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-burnt">
                      rep
                    </span>
                  )}
                </td>
                {days.map((d) => {
                  const rec = map.get(`${s.id}-${d}`);
                  const isSelected = selected?.studentId === s.id && selected?.day === d;
                  const flagged = rec && (rec.status === "ABSENT" || rec.status === "EXCUSED");
                  const unread = showNotifications && flagged && !rec?.reviewedBySW;
                  const hasComments = (rec?.comments?.length || 0) > 0;
                  return (
                    <td key={d} className="p-0.5">
                      <button
                        onClick={() => openCell(s.id, d, s.fullName)}
                        title={s.fullName}
                        className={`relative h-6 w-6 rounded-md transition-all ${
                          rec ? DOT[rec.status] : "bg-ink/10"
                        } ${isSelected ? "ring-2 ring-offset-1 ring-ink" : ""} hover:scale-110 hover:opacity-90`}
                      >
                        {unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-amber-burnt ring-2 ring-white" />
                        )}
                        {!unread && hasComments && (
                          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-ink/40 ring-2 ring-white" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="animate-slide-up border-t border-ink/10 bg-cream p-4">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-ink">
              {selected.name} · {monthStart.toLocaleDateString(undefined, { month: "short" })} {selected.day}
            </p>
            <button onClick={() => setSelected(null)} className="text-sm text-ink/40 hover:text-ink">
              ✕
            </button>
          </div>

          {canSetStatus && (
            <div className="mt-3 flex gap-2">
              {["PRESENT", "ABSENT", "EXCUSED"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={saving}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    draftStatus === s ? `${DOT[s]} text-white` : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-ink/60">Notes</label>
            <CommentThread
              comments={(selectedRecord?.comments as ThreadComment[]) || []}
              currentUserId={currentUserId}
              canReply={canComment}
              emptyLabel="No notes yet — leave one below."
              onSend={(body) => onSendComment(selected.studentId, dateKey(selected.day), body)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
