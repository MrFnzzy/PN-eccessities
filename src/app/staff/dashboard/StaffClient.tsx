"use client";

import { useCallback, useEffect, useState } from "react";
import Tabs from "@/components/Tabs";
import { BATCHES, BATCH_SHORT, BatchKey } from "@/lib/batches";
import StudentReceiptPanel from "./StudentReceiptPanel";

type StudentRow = {
  id: string;
  fullName: string;
  user: { email: string };
  receipts: { id: string; status: string }[];
};

export default function StaffClient() {
  const [batch, setBatch] = useState<BatchKey>(BATCHES[0]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    const res = await fetch(`/api/students?batch=${batch}`);
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }, [batch]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = students.filter((s) =>
    s.fullName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-sky-deep">Staff</p>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Counterpart receipts</h1>

      <div className="mt-5">
        <Tabs
          tabs={BATCHES.map((b) => ({ key: b, label: BATCH_SHORT[b], accent: "bg-sky" }))}
          active={batch}
          onChange={(k) => setBatch(k as BatchKey)}
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="rounded-xl2 border border-ink/10 bg-white shadow-card">
          <div className="border-b border-ink/10 p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name…"
              className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm outline-none focus:border-sky"
            />
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-ink/50">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">No students found.</p>
            ) : (
              filtered.map((s) => {
                const pending = s.receipts.filter((r) => r.status === "PENDING").length;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelected(s)}
                      className={`flex w-full items-center justify-between gap-2 border-b border-ink/5 px-4 py-2.5 text-left text-sm transition-colors ${
                        selected?.id === s.id ? "bg-sky/10 text-sky-deep font-semibold" : "hover:bg-ink/5"
                      }`}
                    >
                      <span>{s.fullName}</span>
                      {pending > 0 && (
                        <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-amber-burnt">
                          {pending}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div>
          {selected ? (
            <StudentReceiptPanel
              student={selected}
              onChanged={load}
            />
          ) : (
            <div className="grid h-full min-h-[300px] place-items-center rounded-xl2 border border-dashed border-ink/20 bg-white/60 text-center text-ink/50">
              Select a student to view their receipt history.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
