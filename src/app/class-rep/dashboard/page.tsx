import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ClassRepClient from "./ClassRepClient";

export default async function ClassRepPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT" || !session.user.isClassRep) {
    redirect("/student/dashboard");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <ClassRepClient />
    </div>
  );
}
