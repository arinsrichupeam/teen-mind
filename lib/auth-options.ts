import type { JWT, JWTDecodeParams } from "next-auth/jwt";

import { type NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  encode as defaultJwtEncode,
  decode as defaultJwtDecode,
} from "next-auth/jwt";

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
      // NextAuth/JWT ต้องได้ object เสมอ ห้ามส่ง null หรือ undefined
      if (token != null && typeof token === "object") {
        return token;
      }

      return {};
    },
    session: async ({ session, token }) => {
      if (token == null || typeof token !== "object") {
        return session ?? { user: {}, expires: "" };
      }
      session = {
        ...session,
        user: {
          id: (token.sub as string) ?? "",
          ...session?.user,
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
    // ป้องกัน jose รับ payload เป็น null (ERR_INVALID_ARG_TYPE)
    encode: async (params) => {
      const token =
        params.token != null && typeof params.token === "object"
          ? params.token
          : {};

      return defaultJwtEncode({ ...params, token });
    },
    // ป้องกัน token ไม่ถูกต้อง (HTML/เสีย) ส่งเข้า jose แล้วได้ payload null -> ERR_INVALID_ARG_TYPE
    decode: async (params: JWTDecodeParams): Promise<JWT | null> => {
      const { token } = params;

      if (typeof token !== "string" || token.trim() === "") return null;
      if (token.trimStart().startsWith("<")) return null;
      try {
        const decoded = await defaultJwtDecode(params);

        if (decoded != null && typeof decoded === "object") return decoded;

        return null;
      } catch {
        return null;
      }
    },
  },
  pages: {
    signIn: "/liff/auth/",
  },
};
