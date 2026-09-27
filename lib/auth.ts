import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma, ensureDbReady } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await ensureDbReady();

        const rawIdentifier = credentials.email.trim();
        const cleanIdentifier = rawIdentifier.toLowerCase();
        const rawPassword = credentials.password;
        const cleanPassword = rawPassword.trim();

        // 1. ADMIN AUTHENTICATION (Strictly isolated to Candela Admin)
        const isAdminIdentifier =
          cleanIdentifier === "admin" ||
          cleanIdentifier === "admin@candela.store" ||
          cleanIdentifier === "candela" ||
          cleanIdentifier === "candela admin" ||
          cleanIdentifier === "candela@admin.com";

        const isAdminPassword =
          cleanPassword === "candella@2026" ||
          cleanPassword === "candela@2026" ||
          cleanPassword === "Candela2026" ||
          cleanPassword.toLowerCase() === "candela2026" ||
          cleanPassword.toLowerCase() === "candela2024" ||
          (process.env.ADMIN_PASSWORD && cleanPassword === process.env.ADMIN_PASSWORD);

        if (isAdminIdentifier) {
          if (isAdminPassword) {
            let adminUser = null;
            try {
              adminUser = await prisma.user.findFirst({
                where: {
                  OR: [
                    { role: "ADMIN" },
                    { email: "admin@candela.store" },
                  ],
                },
              });
            } catch {}

            return {
              id: adminUser?.id || "admin-master",
              email: adminUser?.email || "admin@candela.store",
              name: adminUser?.name || "Candela Admin",
              role: "ADMIN",
            };
          } else {
            return null;
          }
        }

        // 2. CLIENT / CUSTOMER AUTHENTICATION (All regular users)
        let user = null;
        try {
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: cleanIdentifier },
                { name: rawIdentifier },
              ],
            },
          });
        } catch (err) {
          console.warn("Prisma user lookup failed:", err);
        }

        if (user && user.password) {
          const isPasswordValid =
            (await bcrypt.compare(rawPassword, user.password)) ||
            (await bcrypt.compare(cleanPassword, user.password));

          if (isPasswordValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name || "Customer",
              role: "USER", // Clients are ALWAYS regular USER
            };
          }
        }

        return null;
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
        token.name = user.name;
        token.email = user.email;
      }
      
      // Keep name and role dynamically synced with DB on token refresh
      if (token?.id || token?.email) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                ...(token.id && token.id !== "admin-master" ? [{ id: token.id as string }] : []),
                ...(token.email ? [{ email: token.email as string }] : []),
              ],
            },
            select: { id: true, role: true, name: true, email: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            if (dbUser.name) token.name = dbUser.name;
            if (dbUser.email) token.email = dbUser.email;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "candela-secret-jwt-key-2026-production",
};
