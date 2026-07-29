import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "STAFF" | "SOCIAL_WORKER" | "ADMIN";
      batch: "YEAR_2028" | "YEAR_2027" | "YEAR_2026" | null;
      section: "PN1" | "PN2" | null;
      isClassRep: boolean;
      profileId: string | null;
    } & DefaultSession["user"];
  }
}
