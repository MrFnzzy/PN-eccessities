"use client";

import { useState } from "react";
import Link from "next/link";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";

export default function ForgotPasswordPage() {
  const play = useSound();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
    play("notify");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink/60">
        Enter your email and we'll send a reset link, if an account exists.
      </p>

      {sent ? (
        <p className="mt-6 rounded-xl bg-sky/10 px-4 py-3 text-sm text-sky-deep">
          If that email is registered, a reset link is on its way. Check your inbox (and spam
          folder).
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
          />
          <SoundButton type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send reset link"}
          </SoundButton>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-ink/60">
        <Link href="/login" className="font-semibold text-sky-deep">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
