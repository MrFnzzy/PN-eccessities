import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function POST(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  try {
    const { fullName, email, password, role } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!fullName || !normalizedEmail || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!["STAFF", "SOCIAL_WORKER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const data: any = {
      email: normalizedEmail,
      passwordHash,
      name: fullName,
      role,
    };
    if (role === "STAFF") data.staff = { create: { name: fullName } };
    if (role === "SOCIAL_WORKER") data.socialWorker = { create: { name: fullName } };
    if (role === "ADMIN") data.admin = { create: { name: fullName } };

    await prisma.user.create({ data });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
