import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const HOME_BY_ROLE: Record<string, string> = {
  STUDENT: "/student/dashboard",
  STAFF: "/staff/dashboard",
  SOCIAL_WORKER: "/social-worker/dashboard",
  ADMIN: "/admin/dashboard",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(HOME_BY_ROLE[session.user.role] || "/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 inline-block rounded-full bg-sky/10 px-4 py-1.5 text-sm font-semibold text-sky-deep">
        Counterpart receipts · Attendance · Class management
      </span>
      <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
        One place for your <span className="text-sky">receipts</span>,{" "}
        <span className="text-amber">attendance</span>, and class updates.
      </h1>
      <p className="mt-5 max-w-2xl text-ink/60 sm:text-lg">
        Students submit counterpart receipts and track their standing. Staff review and confirm
        them in a click. Social workers and class reps keep attendance for all three batches, all
        in one calendar.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-xl2 bg-sky px-6 py-3 font-semibold text-white shadow-pop transition-transform hover:scale-[1.03]"
        >
          Create student account
        </Link>
        <Link
          href="/login"
          className="rounded-xl2 border border-ink/15 bg-white px-6 py-3 font-semibold text-ink transition-colors hover:border-sky hover:text-sky-deep"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: "Counterpart", desc: "Upload your receipt, get it confirmed by email.", color: "bg-sky" },
          { title: "Class Status", desc: "See attendance on a real calendar grid.", color: "bg-amber" },
          { title: "For staff", desc: "Batch tabs, alphabetical rosters, one-click confirm.", color: "bg-sky-deep" },
        ].map((f) => (
          <div key={f.title} className="rounded-xl2 border border-ink/10 bg-white p-5 text-left shadow-card">
            <span className={`inline-block h-2 w-8 rounded-full ${f.color} mb-3`} />
            <h3 className="font-display font-semibold text-ink">{f.title}</h3>
            <p className="mt-1 text-sm text-ink/60">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
