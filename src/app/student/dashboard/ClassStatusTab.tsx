"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "@/components/StatusBadge";
import CommentThread, { ThreadComment } from "@/components/CommentThread";

type Record_ = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  excuseComment: string | null;
  socialWorkerComment: string | null;
  comments?: ThreadComment[];
};

const DOT_COLOR: Record<string, string> = {
  PRESENT: "bg-sky",
  ABSENT: "bg-amber-burnt",
  EXCUSED: "bg-amber",
  NONE: "bg-ink/10",
};

export default function ClassStatusTab() {
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [records, setRecords] = useState<Record_[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?monthStart=${monthStart.toISOString()}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  }, [monthStart]);

  useEffect(() => {
    load();
    setSelectedDay(null);
  }, [load]);

  const byDay: Record<number, Record_> = {};
  records.forEach((r) => {
    byDay[new Date(r.date).getUTCDate()] = r;
  });

  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const firstWeekday = monthStart.getDay();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const summary = { PRESENT: 0, ABSENT: 0, EXCUSED: 0 };
  records.forEach((r) => summary[r.status]++);

  const today = new Date();
  const selectedRecord = selectedDay ? byDay[selectedDay] : undefined;

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-ink">Your attendance</h2>
          <p className="text-xs text-ink/50">
            Marked by your class rep. Tap a day to see any notes about it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))
            }
            className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-sky"
          >
            ←
          </button>
          <p className="min-w-[9rem] text-center text-sm font-semibold text-ink">
            {monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <button
            onClick={() =>
              setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))
            }
            className="rounded-lg border border-ink/15 px-2.5 py-1 text-sm hover:border-sky"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <StatusBadge status="PRESENT" /> <span className="text-ink/50">{summary.PRESENT}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <StatusBadge status="ABSENT" /> <span className="text-ink/50">{summary.ABSENT}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <StatusBadge status="EXCUSED" /> <span className="text-ink/50">{summary.EXCUSED}</span>
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading…</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink/40">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const rec = byDay[day];
              const color = rec ? DOT_COLOR[rec.status] : DOT_COLOR.NONE;
              const isToday =
                today.getFullYear() === monthStart.getFullYear() &&
                today.getMonth() === monthStart.getMonth() &&
                today.getDate() === day;
              const hasNote = (rec?.comments?.length || 0) > 0;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`group relative aspect-square rounded-lg border transition-transform hover:scale-105 ${
                    isSelected ? "border-ink ring-2 ring-ink" : isToday ? "border-amber" : "border-ink/5"
                  }`}
                >
                  <div
                    className={`flex h-full w-full flex-col items-center justify-center rounded-lg ${color} ${
                      rec ? "text-white" : "text-ink/40"
                    }`}
                  >
                    <span className="text-xs font-semibold">{day}</span>
                  </div>
                  {hasNote && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-ink/50 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-4 animate-slide-up rounded-xl border border-ink/10 bg-cream/60 p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">
                  {monthStart.toLocaleDateString(undefined, { month: "long" })} {selectedDay} ·{" "}
                  <StatusBadge status={selectedRecord?.status || "PRESENT"} />
                </p>
                <button onClick={() => setSelectedDay(null)} className="text-sm text-ink/40 hover:text-ink">
                  ✕
                </button>
              </div>
              <div className="mt-3">
                <CommentThread
                  comments={(selectedRecord?.comments as ThreadComment[]) || []}
                  canReply={false}
                  emptyLabel="No notes were left for this day."
                  onSend={async () => {}}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
