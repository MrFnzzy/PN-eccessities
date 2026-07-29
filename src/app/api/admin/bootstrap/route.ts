import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Visit /admin/bootstrap once, right after deploying, to create the very
// first admin account. Requires ADMIN_BOOTSTRAP_KEY from your .env so a
// stranger can't create an admin account on your live site. After you have
// one admin, use the in-app "Create staff account" screen for everyone else.
export async function POST(req: Request) {
  try {
    const { key, fullName, email, password } = await req.json();

    if (!process.env.ADMIN_BOOTSTRAP_KEY || key !== process.env.ADMIN_BOOTSTRAP_KEY) {
      return NextResponse.json({ error: "Invalid bootstrap key." }, { status: 403 });
    }

    const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin account already exists. Ask them to create your account instead." },
        { status: 409 }
      );
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!fullName || !normalizedEmail || !password || String(password).length < 8) {
      return NextResponse.json({ error: "All fields are required (password 8+ chars)." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: fullName,
        role: "ADMIN",
        admin: { create: { name: fullName } },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
