import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SocialWorkerClient from "./SocialWorkerClient";

export default async function SocialWorkerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SOCIAL_WORKER") redirect("/login");

  return (
    <div className="min-h-screen">
      <Navbar />
      <SocialWorkerClient />
    </div>
  );
}
