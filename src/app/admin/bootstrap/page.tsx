"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";

export default function BootstrapAdminPage() {
  const router = useRouter();
  const play = useSound();
  const [form, setForm] = useState({ key: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      play("error");
      return;
    }
    play("success");
    router.push("/login?bootstrapped=1");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Create the first admin</h1>
      <p className="mt-1 text-sm text-ink/60">
        Use this once, right after deploying, with the ADMIN_BOOTSTRAP_KEY from your environment
        variables. After this, create every other account from the admin dashboard.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          required
          placeholder="Bootstrap key"
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
        />
        <input
          required
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 outline-none focus:border-sky"
        />
        {error && (
          <p className="rounded-xl bg-amber-burnt/10 px-3 py-2 text-sm text-amber-burnt">{error}</p>
        )}
        <SoundButton type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create admin account"}
        </SoundButton>
      </form>
    </main>
  );
}
