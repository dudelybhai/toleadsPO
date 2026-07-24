import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { prisma } from "@/lib/prisma";

function requiredEnvironment(name: "BETTER_AUTH_URL" | "BETTER_AUTH_SECRET") {
  const value = process.env[name]?.trim();
  if (!value || value.includes("replace-with")) {
    throw new Error(`${name} is missing or still uses a placeholder value.`);
  }
  if (name === "BETTER_AUTH_SECRET" && value.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }
  return value;
}

export const auth = betterAuth({
  appName: "Toleads PO Dashboard",
  baseURL: requiredEnvironment("BETTER_AUTH_URL"),
  secret: requiredEnvironment("BETTER_AUTH_SECRET"),
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
  plugins: [
    ...(process.env.BETTER_AUTH_API_KEY
      ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })]
      : []),
    nextCookies()
  ]
});

export type AuthSession = typeof auth.$Infer.Session;
