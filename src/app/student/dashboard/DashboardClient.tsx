"use client";

import { useState } from "react";
import Tabs from "@/components/Tabs";
import CounterpartTab from "./CounterpartTab";
import ClassStatusTab from "./ClassStatusTab";
import ClassRepClient from "../../class-rep/dashboard/ClassRepClient";

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
      <div className="mb-6 overflow-hidden rounded-xl2 bg-gradient-to-br from-sky to-sky-deep px-6 py-7 text-white shadow-pop sm:px-8">
        <p className="text-sm font-semibold text-white/80">Welcome back</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{name}</h1>
        {isClassRep && (
          <button
            onClick={() => setTab("classmarker")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            ★ You're the class rep — mark attendance
          </button>
        )}
      </div>

      <Tabs
        tabs={[
          { key: "counterpart", label: "Counterpart", accent: "bg-sky" },
          { key: "status", label: "Class Status", accent: "bg-amber" },
          { key: "weekly", label: "Weekly Tasking", accent: "bg-sky-deep" },
          ...(isClassRep
            ? [{ key: "classmarker", label: "★ Class Marker", accent: "bg-amber-burnt" }]
            : []),
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
        {tab === "classmarker" && isClassRep && <ClassRepClient />}
      </div>
    </main>
  );
}
