import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import StudentDashboardClient from "./DashboardClient";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  return (
    <div className="min-h-screen">
      <Navbar />
      <StudentDashboardClient isClassRep={session.user.isClassRep} name={session.user.name || ""} />
    </div>
  );
}
