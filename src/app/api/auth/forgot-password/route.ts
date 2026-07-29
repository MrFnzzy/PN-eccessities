import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Always respond with ok:true (even if no account exists) so the form
    // can't be used to check which emails are registered.
    if (user) {
      const token = randomUUID();
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiresAt },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl });
      } catch (mailErr) {
        console.error("Failed to send reset email:", mailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
