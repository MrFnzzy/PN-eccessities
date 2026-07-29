"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useSound } from "@/lib/useSound";

const HOME_BY_ROLE: Record<string, string> = {
  STUDENT: "/student/dashboard",
  STAFF: "/staff/dashboard",
  SOCIAL_WORKER: "/social-worker/dashboard",
  ADMIN: "/admin/dashboard",
};

export default function Navbar() {
  const { data: session } = useSession();
  const play = useSound();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href={session ? HOME_BY_ROLE[session.user.role] : "/"}
          className="flex items-center gap-2 font-display text-lg font-bold text-ink"
          onClick={() => play("pop")}
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky text-white shadow-pop">
            PN
          </span>
          PN-eccessities
        </Link>

        {session && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{session.user.name}</p>
              <p className="text-xs text-ink/50 leading-tight">
                {session.user.role.replace("_", " ").toLowerCase()}
                {session.user.isClassRep ? " · class rep" : ""}
              </p>
            </div>
            <button
              onClick={() => {
                play("click");
                signOut({ callbackUrl: "/login" });
              }}
              className="rounded-xl border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink/70 hover:border-amber-burnt hover:text-amber-burnt transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
