"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "@/components/StatusBadge";

type Record_ = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  excuseComment: string | null;
  socialWorkerComment: string | null;
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

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?monthStart=${monthStart.toISOString()}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  }, [monthStart]);

  useEffect(() => {
    load();
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

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-ink">Your attendance</h2>
          <p className="text-xs text-ink/50">
            Marked by your class rep. Green squares are counted automatically as present.
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

      <div className="mt-4 flex gap-2 text-xs">
        <StatusBadge status="PRESENT" /> <span className="text-ink/50">{summary.PRESENT}</span>
        <StatusBadge status="ABSENT" /> <span className="text-ink/50">{summary.ABSENT}</span>
        <StatusBadge status="EXCUSED" /> <span className="text-ink/50">{summary.EXCUSED}</span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading…</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-ink/40">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const rec = byDay[day];
              const color = rec ? DOT_COLOR[rec.status] : DOT_COLOR.NONE;
              return (
                <div
                  key={i}
                  title={rec?.excuseComment || rec?.socialWorkerComment || ""}
                  className="group relative aspect-square rounded-lg border border-ink/5"
                >
                  <div className={`flex h-full w-full flex-col items-center justify-center rounded-lg ${color} ${rec ? "text-white" : "text-ink/40"}`}>
                    <span className="text-xs font-semibold">{day}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
