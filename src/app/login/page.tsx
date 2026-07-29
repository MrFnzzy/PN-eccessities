"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const play = useSound();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      play("error");
      return;
    }
    play("success");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/60">Sign in to your Campus Companion account.</p>

      {params.get("registered") && (
        <p className="mt-4 rounded-xl bg-sky/10 px-3 py-2 text-sm text-sky-deep">
          Account created! You can sign in now.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink/80">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-semibold text-ink/80">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-sky-deep">
              Forgot password?
            </Link>
          </div>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-amber-burnt/10 px-3 py-2 text-sm text-amber-burnt">{error}</p>
        )}

        <SoundButton type="submit" disabled={loading} sound="success" className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </SoundButton>
      </form>

      <p className="mt-5 text-center text-sm text-ink/60">
        New student?{" "}
        <Link href="/register" className="font-semibold text-sky-deep">
          Create an account
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
