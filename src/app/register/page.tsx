"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";
import { BATCHES, BATCH_LABEL, BatchKey } from "@/lib/batches";

export default function RegisterPage() {
  const router = useRouter();
  const play = useSound();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batch, setBatch] = useState<BatchKey | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!batch) {
      setError("Please select your year level.");
      play("error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, batch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        play("error");
        return;
      }
      play("success");
      router.push("/login?registered=1");
    } catch {
      setError("Network error. Try again.");
      play("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Create your student account</h1>
      <p className="mt-1 text-sm text-ink/60">Registration is only for students.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/80">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
            placeholder="Juan Dela Cruz"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/80">Year level</label>
          <div className="grid grid-cols-1 gap-2">
            {BATCHES.map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => {
                  play("click");
                  setBatch(b);
                }}
                className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                  batch === b
                    ? "border-sky bg-sky/10 text-sky-deep"
                    : "border-ink/15 text-ink/70 hover:border-sky"
                }`}
              >
                {BATCH_LABEL[b]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/80">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
            placeholder="you@school.edu"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/80">Password</label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-amber-burnt/10 px-3 py-2 text-sm text-amber-burnt">{error}</p>
        )}

        <SoundButton type="submit" disabled={loading} sound="success" className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </SoundButton>
      </form>

      <p className="mt-5 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-sky-deep">
          Sign in
        </Link>
      </p>
    </main>
  );
}
