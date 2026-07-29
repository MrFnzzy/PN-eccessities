import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { student: true, staff: true, socialWorker: true, admin: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          batch: user.student?.batch ?? user.socialWorker?.batch ?? null,
          isClassRep: user.student?.isClassRep ?? false,
          profileId:
            user.student?.id ?? user.staff?.id ?? user.socialWorker?.id ?? user.admin?.id ?? null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.role = u.role;
        token.batch = u.batch;
        token.isClassRep = u.isClassRep;
        token.profileId = u.profileId;
        token.id = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).batch = token.batch;
        (session.user as any).isClassRep = token.isClassRep;
        (session.user as any).profileId = token.profileId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
