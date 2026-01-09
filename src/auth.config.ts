import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { PrismaRateLimiter } from "@/lib/rate-limit";
import { hashLoginCode } from "@/lib/login-code";

const loginLimiter = new PrismaRateLimiter(5 * 60 * 1000, 5);

const providers = [
  Credentials({
    name: "Código de acesso",
    credentials: {
      loginCode: { label: "Código", type: "text" },
    },
    authorize: async (credentials) => {
      const loginCode = typeof credentials?.loginCode === "string" ? credentials.loginCode : "";
      const normalizedCode = loginCode.trim().toUpperCase();

      if (!normalizedCode) {
        return null;
      }

      const rateKey = `login:${normalizedCode}`;
      const hit = await loginLimiter.hit(rateKey);
      if (!hit.allowed) {
        throw new Error("Muitas tentativas de login. Tente novamente em alguns minutos.");
      }

      const codeHash = hashLoginCode(normalizedCode);
      const user = await db.user.findUnique({
        where: { loginCodeHash: codeHash },
        select: {
          id: true,
          name: true,
          username: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name ?? user.username,
        username: user.username,
      };
    },
  }),
] satisfies NextAuthConfig["providers"];

export default {
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers,
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.username = (user as { username?: string }).username;
        token.name = user.name ?? (user as { username?: string }).username;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (token.username) {
          session.user.username = token.username as string;
        }
        if (token.name) {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
