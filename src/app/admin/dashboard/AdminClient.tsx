"use client";

import { useCallback, useEffect, useState } from "react";
import SoundButton from "@/components/SoundButton";
import { useSound } from "@/lib/useSound";
import { useSession } from "next-auth/react";
import BatchYearSettings from "@/components/BatchYearSettings";
import type { ActiveBatch, BatchKey } from "@/lib/batches";

type SW = { id: string; name: string; batch: BatchKey | null; user: { id: string; email: string } };
type Staff = { id: string; name: string; user: { id: string; email: string } };

export default function AdminClient() {
  const play = useSound();
  const { data: sessionData } = useSession();
  const myUserId = (sessionData?.user as any)?.id as string | undefined;
  const [socialWorkers, setSocialWorkers] = useState<SW[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [admins, setAdmins] = useState<Staff[]>([]);
  const [batches, setBatches] = useState<ActiveBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "STAFF" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/assign-social-worker");
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("The server sent back something unexpected. Please try again.");
      }
      if (!res.ok) throw new Error(data?.error || "Couldn't load accounts.");
      setSocialWorkers(data.socialWorkers || []);
      setStaff(data.staff || []);
      setAdmins(data.admins || []);

      const batchRes = await fetch("/api/batch-settings");
      const batchData = await batchRes.json();
      if (batchRes.ok) setBatches(batchData.batches || []);
    } catch (err: any) {
      setLoadError(err?.message || "Couldn't load accounts. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage("");
    const res = await fetch("/api/admin/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      play("error");
      setMessage(data.error);
      return;
    }
    play("success");
    setMessage(`${form.role.replace("_", " ").toLowerCase()} account created.`);
    setForm({ fullName: "", email: "", password: "", role: "STAFF" });
    load();
  }

  async function assignBatch(socialWorkerId: string, batch: BatchKey) {
    const res = await fetch("/api/admin/assign-social-worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socialWorkerId, batch }),
    });
    if (res.ok) {
      play("success");
      load();
    } else {
      play("error");
    }
  }

  async function removeAccount(userId: string, name: string) {
    const confirmed = window.confirm(
      `Remove ${name}'s account? This can't be undone — they'll be signed out and lose access immediately.`
    );
    if (!confirmed) return;

    setRemovingId(userId);
    setMessage("");
    const res = await fetch("/api/admin/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setRemovingId(null);
    if (!res.ok) {
      play("error");
      setMessage(data.error);
      return;
    }
    play("success");
    setMessage(`${name}'s account was removed.`);
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-sky-deep">Admin</p>
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Staff & social workers</h1>

      <div className="mt-4">
        <BatchYearSettings />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form onSubmit={handleCreate} className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
          <h2 className="font-display font-semibold text-ink">Create an account</h2>
          <div className="mt-4 flex flex-col gap-3">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
            >
              <option value="STAFF">Staff (receipts)</option>
              <option value="SOCIAL_WORKER">Social worker</option>
              <option value="ADMIN">Admin</option>
            </select>
            <input
              required
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="Temporary password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-sky"
            />
            {message && <p className="text-xs font-semibold text-sky-deep">{message}</p>}
            <SoundButton type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create account"}
            </SoundButton>
          </div>
        </form>

        <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
          <h2 className="font-display font-semibold text-ink">Assign social workers to batches</h2>
          <p className="mt-1 text-xs text-ink/50">Each batch can have one assigned social worker.</p>
          <div className="mt-4 flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-ink/50">Loading…</p>
            ) : loadError ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-amber-burnt">{loadError}</p>
                <button
                  onClick={load}
                  className="mt-2 rounded-lg bg-amber-burnt px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Try again
                </button>
              </div>
            ) : socialWorkers.length === 0 ? (
              <p className="text-sm text-ink/50">No social worker accounts yet.</p>
            ) : (
              socialWorkers.map((sw) => (
                <div key={sw.id} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{sw.name}</p>
                      <p className="text-xs text-ink/50">{sw.user.email}</p>
                    </div>
                    {sw.user.id !== myUserId && (
                      <button
                        onClick={() => removeAccount(sw.user.id, sw.name)}
                        disabled={removingId === sw.user.id}
                        className="shrink-0 text-[11px] font-semibold text-amber-burnt hover:underline disabled:opacity-50"
                      >
                        {removingId === sw.user.id ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {batches.map((b) => (
                      <button
                        key={b.key}
                        onClick={() => assignBatch(sw.id, b.key)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          sw.batch === b.key
                            ? "bg-sky text-white"
                            : "bg-ink/5 text-ink/60 hover:bg-sky/10 hover:text-sky-deep"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-ink">Staff accounts</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-ink/70">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span>
                  {s.name} <span className="text-ink/40">· {s.user.email}</span>
                </span>
                {s.user.id !== myUserId && (
                  <button
                    onClick={() => removeAccount(s.user.id, s.name)}
                    disabled={removingId === s.user.id}
                    className="shrink-0 text-[11px] font-semibold text-amber-burnt hover:underline disabled:opacity-50"
                  >
                    {removingId === s.user.id ? "Removing…" : "Remove"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-ink">Admin accounts</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-ink/70">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>
                  {a.name} <span className="text-ink/40">· {a.user.email}</span>
                </span>
                {a.user.id !== myUserId && (
                  <button
                    onClick={() => removeAccount(a.user.id, a.name)}
                    disabled={removingId === a.user.id}
                    className="shrink-0 text-[11px] font-semibold text-amber-burnt hover:underline disabled:opacity-50"
                  >
                    {removingId === a.user.id ? "Removing…" : "Remove"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
