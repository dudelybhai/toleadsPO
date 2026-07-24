import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const isProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build";

export const auth = betterAuth({
  appName: "Toleads PO Dashboard",
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (isProductionBuild ? "http://localhost:3000" : undefined),
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (isProductionBuild
      ? "build-only-secret-not-used-by-the-running-application"
      : undefined),
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    disableSignUp: process.env.BETTER_AUTH_DISABLE_SIGN_UP !== "false"
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "accountant",
        input: false
      }
    }
  },
  plugins: [nextCookies()]
});

export type AuthSession = typeof auth.$Infer.Session;
