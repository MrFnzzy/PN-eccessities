"use client";

import { useMemo, useState } from "react";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";

export type GridStudent = { id: string; fullName: string; isClassRep: boolean };
export type GridRecord = {
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  excuseComment: string | null;
  socialWorkerComment: string | null;
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
  canSetExcuseComment,
  canSetSocialWorkerComment,
  onSave,
}: {
  students: GridStudent[];
  records: GridRecord[];
  monthStart: Date;
  canSetStatus: boolean;
  canSetExcuseComment: boolean;
  canSetSocialWorkerComment: boolean;
  onSave: (payload: {
    studentId: string;
    date: string;
    status?: string;
    excuseComment?: string;
    socialWorkerComment?: string;
  }) => Promise<void>;
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

  const [selected, setSelected] = useState<{ studentId: string; day: number; name: string } | null>(
    null
  );
  const [draftStatus, setDraftStatus] = useState<string>("PRESENT");
  const [draftExcuse, setDraftExcuse] = useState("");
  const [draftSw, setDraftSw] = useState("");
  const [saving, setSaving] = useState(false);

  function openCell(studentId: string, day: number, name: string) {
    const rec = map.get(`${studentId}-${day}`);
    setSelected({ studentId, day, name });
    setDraftStatus(rec?.status || "PRESENT");
    setDraftExcuse(rec?.excuseComment || "");
    setDraftSw(rec?.socialWorkerComment || "");
    play("click");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const date = new Date(Date.UTC(monthStart.getFullYear(), monthStart.getMonth(), selected.day)).toISOString();
    try {
      await onSave({
        studentId: selected.studentId,
        date,
        status: canSetStatus ? draftStatus : undefined,
        excuseComment: canSetExcuseComment ? draftExcuse : undefined,
        socialWorkerComment: canSetSocialWorkerComment ? draftSw : undefined,
      });
      play("success");
      setSelected(null);
    } catch {
      play("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold text-ink/60">
                Student
              </th>
              {days.map((d) => (
                <th key={d} className="px-0.5 py-2 text-center font-medium text-ink/40 w-6">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-ink/5 hover:bg-sky/5">
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
                  return (
                    <td key={d} className="p-0.5">
                      <button
                        onClick={() => openCell(s.id, d, s.fullName)}
                        title={rec?.excuseComment || rec?.socialWorkerComment || ""}
                        className={`h-5 w-5 rounded ${rec ? DOT[rec.status] : "bg-ink/10"} ${
                          isSelected ? "ring-2 ring-offset-1 ring-ink" : ""
                        } hover:opacity-80 transition-opacity`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="border-t border-ink/10 bg-cream p-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">
              {selected.name} · Day {selected.day}
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
                  onClick={() => setDraftStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    draftStatus === s ? `${DOT[s]} text-white` : "bg-ink/5 text-ink/60"
                  }`}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}

          {canSetExcuseComment && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-ink/60">
                Excuse / note (class rep)
              </label>
              <textarea
                value={draftExcuse}
                onChange={(e) => setDraftExcuse(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
                placeholder="e.g. Sick, submitted med cert"
              />
            </div>
          )}

          {canSetSocialWorkerComment && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-ink/60">
                Social worker comment
              </label>
              <textarea
                value={draftSw}
                onChange={(e) => setDraftSw(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
              />
            </div>
          )}

          <SoundButton onClick={handleSave} disabled={saving} className="mt-3">
            {saving ? "Saving…" : "Save"}
          </SoundButton>
        </div>
      )}
    </div>
  );
}
