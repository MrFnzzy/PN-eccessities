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

/**
 * A class rep only ever manages their own class (PN1 or PN2) within their batch —
 * never the whole batch. Social workers/admins oversee the whole batch and may
 * choose either section (or both) via the `section` query param.
 */
export function classRepSection(session: Session) {
  if (session.user.role === "STUDENT" && session.user.isClassRep) {
    return session.user.section ?? null;
  }
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
