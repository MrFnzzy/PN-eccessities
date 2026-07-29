import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

type Session = NonNullable<Awaited<ReturnType<typeof requireSession>>>;

/** Resolves which batch the current user is allowed to view/edit attendance for. */
export async function resolveBatchAccess(session: Session) {
  if (session.user.role === "SOCIAL_WORKER") {
    const sw = await prisma.socialWorker.findUnique({ where: { userId: session.user.id } });
    return sw?.batch ?? null;
  }
  if (session.user.role === "STUDENT" && session.user.isClassRep) {
    const student = await prisma.student.findUnique({ where: { id: session.user.profileId! } });
    return student?.batch ?? null;
  }
  if (session.user.role === "ADMIN") return "ANY";
  return null;
}

export const ATTENDANCE_COMMENT_SELECT = {
  id: true,
  authorUserId: true,
  authorName: true,
  authorRole: true,
  body: true,
  createdAt: true,
} as const;
