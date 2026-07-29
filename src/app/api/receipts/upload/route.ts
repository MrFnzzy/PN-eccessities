import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireSession } from "@/lib/guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPG, WEBP, or PDF receipts are accepted." },
      { status: 400 }
    );
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File is too large (max 10MB)." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `receipts/${session.user.id}/${Date.now()}-${safeName}`;

  const blob = await put(key, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ ok: true, url: blob.url });
}
