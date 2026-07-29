"use client";

import { useSound } from "@/lib/useSound";

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; accent?: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  const play = useSound();
  return (
    <div className="flex flex-wrap gap-2 rounded-xl2 bg-white/70 p-1.5 shadow-card border border-ink/5 w-fit max-w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => {
              play("click");
              onChange(tab.key);
            }}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold font-display transition-all ${
              isActive
                ? `${tab.accent || "bg-sky"} text-white shadow-pop`
                : "text-ink/60 hover:text-ink hover:bg-ink/5"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
