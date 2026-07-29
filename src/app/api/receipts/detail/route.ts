import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { sendReceiptConfirmationEmail } from "@/lib/mailer";

// NOTE: this route used to live at src/app/api/receipts/[id]/route.ts.
// It was moved to a flat "detail" folder that reads the id from a query
// string (?id=...) instead of a dynamic route segment, purely so the
// project folder has no square-bracket path names (GitHub's web
// drag-and-drop uploader chokes on those). Behavior is unchanged.

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const session = await requireRole(["STAFF"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await req.json();
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { student: { include: { user: true } } },
  });
  if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  const updated = await prisma.receipt.update({
    where: { id },
    data: {
      staffComment: body.staffComment ?? receipt.staffComment,
      status: body.confirm ? "CONFIRMED" : receipt.status,
      confirmedAt: body.confirm ? new Date() : receipt.confirmedAt,
      confirmedById: body.confirm ? session.user.id : receipt.confirmedById,
    },
  });

  let emailSent = false;
  let emailError: string | null = null;

  if (body.confirm && body.sendEmail !== false) {
    try {
      await sendReceiptConfirmationEmail({
        to: receipt.student.user.email,
        studentName: receipt.student.fullName,
        periodLabel: receipt.periodLabel,
        staffComment: updated.staffComment,
      });
      emailSent = true;
    } catch (err) {
      console.error("Email send failed:", err);
      emailError = "Receipt confirmed, but the confirmation email could not be sent. Check SMTP settings.";
    }
  }

  return NextResponse.json({ ok: true, receipt: updated, emailSent, emailError });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const session = await requireRole(["STAFF"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  await prisma.receipt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
