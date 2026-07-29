const STYLES: Record<string, string> = {
  PENDING: "bg-amber/15 text-amber-burnt ring-1 ring-amber/25",
  CONFIRMED: "bg-sky/15 text-sky-deep ring-1 ring-sky/25",
  PRESENT: "bg-sky/15 text-sky-deep ring-1 ring-sky/25",
  ABSENT: "bg-amber-burnt/15 text-amber-burnt ring-1 ring-amber-burnt/25",
  EXCUSED: "bg-amber/20 text-amber-burnt ring-1 ring-amber/30",
};

const LABEL: Record<string, string> = {
  PENDING: "Pending review",
  CONFIRMED: "Confirmed",
  PRESENT: "Present",
  ABSENT: "Absent",
  EXCUSED: "Excused",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || "bg-ink/10 text-ink ring-1 ring-ink/10"}`}
    >
      <span className="badge-dot bg-current" />
      {LABEL[status] || status}
    </span>
  );
}
