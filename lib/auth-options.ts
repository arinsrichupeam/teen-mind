import { type NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/utils/prisma";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (value == null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    LineProvider({
      clientId: getRequiredEnv("LINE_CLIENT_ID"),
      clientSecret: getRequiredEnv("LINE_CLIENT_SECRET"),
      authorization: {
        params: {
          scope: "profile openid email",
          bot_prompt: "aggressive",
        },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token }) => {
      return token != null ? token : {};
    },
    session: async ({ session, token }) => {
      if (token == null) {
        return session;
      }
      session = {
        ...session,
        user: {
          id: (token.sub as string) ?? "",
          ...session.user,
        },
      };

      return session;
    },
    async redirect({ url, baseUrl }) {
      const urlObj =
        url.startsWith("http://") || url.startsWith("https://")
          ? new URL(url)
          : new URL(url, baseUrl);

      if (urlObj.pathname.startsWith("/liff")) {
        return `${baseUrl}/liff`;
      }
      if (urlObj.pathname.startsWith("/admin")) {
        return `${baseUrl}/admin`;
      }

      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60, // 1 days
    updateAge: 12 * 60 * 60, // 12 hours
  },
  jwt: {
    maxAge: 1 * 24 * 60 * 60, // 1 days
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: "/liff/auth/",
  },
};
