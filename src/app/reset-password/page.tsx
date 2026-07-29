"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const play = useSound();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      play("error");
      return;
    }
    play("success");
    router.push("/login?reset=1");
  }

  if (!token) {
    return (
      <p className="rounded-xl bg-amber-burnt/10 px-4 py-3 text-sm text-amber-burnt">
        Missing or invalid reset link. Please request a new one from the "Forgot password" page.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink/80">New password</label>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
        />
      </div>
      {error && (
        <p className="rounded-xl bg-amber-burnt/10 px-3 py-2 text-sm text-amber-burnt">{error}</p>
      )}
      <SoundButton type="submit" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Set new password"}
      </SoundButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Choose a new password</h1>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
