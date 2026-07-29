const STYLES: Record<string, string> = {
  PENDING: "bg-amber/15 text-amber-burnt",
  CONFIRMED: "bg-sky/15 text-sky-deep",
  PRESENT: "bg-sky/15 text-sky-deep",
  ABSENT: "bg-amber-burnt/15 text-amber-burnt",
  EXCUSED: "bg-amber/20 text-amber-burnt",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || "bg-ink/10 text-ink"}`}
    >
      <span className="badge-dot bg-current" />
      {LABEL[status] || status}
    </span>
  );
}
