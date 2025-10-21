import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare } from "argon2";
import { db } from "@/lib/db";

export default {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database",
  },
  trustHost: true,
  providers: [
    GitHub,
    Google,
    Credentials({
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.hash) {
          return null;
        }

        const isValid = await compare(credentials.password, user.hash);
        return isValid ? user : null;
      },
    }),
  ],
} satisfies NextAuthConfig;
