import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import StaffClient from "./StaffClient";

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STAFF") redirect("/login");

  return (
    <div className="min-h-screen">
      <Navbar />
      <StaffClient />
    </div>
  );
}
