"use client";

import { useState } from "react";
import Link from "next/link";
import Tabs from "@/components/Tabs";
import CounterpartTab from "./CounterpartTab";
import ClassStatusTab from "./ClassStatusTab";

export default function StudentDashboardClient({
  isClassRep,
  name,
}: {
  isClassRep: boolean;
  name: string;
}) {
  const [tab, setTab] = useState("counterpart");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-sky-deep">Welcome back</p>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{name}</h1>
        {isClassRep && (
          <Link
            href="/class-rep/dashboard"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-xs font-semibold text-amber-burnt"
          >
            ★ You're the class rep — mark attendance
          </Link>
        )}
      </div>

      <Tabs
        tabs={[
          { key: "counterpart", label: "Counterpart", accent: "bg-sky" },
          { key: "status", label: "Class Status", accent: "bg-amber" },
          { key: "weekly", label: "Weekly Tasking", accent: "bg-sky-deep" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-6 animate-slide-up">
        {tab === "counterpart" && <CounterpartTab />}
        {tab === "status" && <ClassStatusTab />}
        {tab === "weekly" && (
          <div className="rounded-xl2 border border-dashed border-ink/20 bg-white/60 p-10 text-center text-ink/50">
            Weekly Tasking is coming soon.
          </div>
        )}
      </div>
    </main>
  );
}
