import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

// Admin-only: remove a staff, social worker, or admin account. Deleting the
// User row cascades to their Staff/SocialWorker/Admin profile automatically
// (see prisma schema onDelete: Cascade). Students are managed separately and
// are intentionally NOT deletable here, to avoid accidentally wiping receipt
// or attendance history.
export async function DELETE(req: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You can't remove your own account while logged in as it." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (target.role === "STUDENT") {
    return NextResponse.json(
      { error: "Student accounts can't be removed from here." },
      { status: 400 }
    );
  }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Can't remove the last remaining admin account." },
        { status: 400 }
      );
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
