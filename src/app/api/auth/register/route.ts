import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BATCHES } from "@/lib/batches";

// Public route: only students can self-register here. Staff, social worker,
// and admin accounts are created from the admin dashboard (see
// /api/admin/create-account) so that access to student data stays controlled.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const batch = String(body.batch || "");

    if (!fullName || !email || !password || !batch) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!BATCHES.includes(batch as any)) {
      return NextResponse.json({ error: "Invalid batch selection." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: fullName,
        role: "STUDENT",
        student: {
          create: {
            fullName,
            batch: batch as any,
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
