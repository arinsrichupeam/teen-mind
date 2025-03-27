import NextAuth from "next-auth";
import LineProvider from "next-auth/providers/line";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/utils/prisma";

const authOptions = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID as string,
      clientSecret: process.env.LINE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "profile openid email",
          bot_prompt: "aggressive",
        },
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      session = {
        ...session,
        user: {
          id: token.sub as string,
          ...session.user,
        },
      };

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (new URL(url).pathname.startsWith("/liff")) {
        return `${baseUrl}/liff`;
      } else if (new URL(url).pathname.startsWith("/admin")) {
        return `${baseUrl}/admin`;
      } else {
        return baseUrl;
      }
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
});

export { authOptions as GET, authOptions as POST };
