import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function requireRole(roles: Array<"STUDENT" | "STAFF" | "SOCIAL_WORKER" | "ADMIN">) {
  const session = await requireSession();
  if (!session || !roles.includes(session.user.role)) return null;
  return session;
}
