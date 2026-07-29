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

const ROLE_ACCENT: Record<string, string> = {
  STUDENT: "bg-sky/15 text-sky-deep",
  STAFF: "bg-ink/10 text-ink",
  SOCIAL_WORKER: "bg-sky/15 text-sky-deep",
  ADMIN: "bg-amber/15 text-amber-burnt",
};

export default function Navbar() {
  const { data: session } = useSession();
  const play = useSound();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href={session ? HOME_BY_ROLE[session.user.role] : "/"}
          className="flex items-center gap-2.5 font-display text-lg font-bold text-ink"
          onClick={() => play("pop")}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky to-sky-deep text-sm text-white shadow-pop transition-transform hover:scale-105">
            PN
          </span>
          <span className="hidden sm:inline">PN-eccessities</span>
        </Link>

        {session && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">{session.user.name}</p>
              <span
                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${
                  ROLE_ACCENT[session.user.role] || "bg-ink/10 text-ink"
                }`}
              >
                {session.user.role.replace("_", " ").toLowerCase()}
                {session.user.isClassRep ? " · class rep" : ""}
              </span>
            </div>
            <button
              onClick={() => {
                play("click");
                signOut({ callbackUrl: "/login" });
              }}
              className="rounded-xl border border-ink/15 px-3 py-1.5 text-sm font-semibold text-ink/70 transition-colors hover:border-amber-burnt hover:text-amber-burnt"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
