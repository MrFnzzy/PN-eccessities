import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "STAFF" | "SOCIAL_WORKER" | "ADMIN";
      batch: string | null;
      section: "PN1" | "PN2" | null;
      isClassRep: boolean;
      profileId: string | null;
    } & DefaultSession["user"];
  }
}
