import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

const env = getEnv();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [nextCookies()],
});

export const DEMO_PASSWORD = "DemoPass123!";

export const DEMO_USERS = {
  individual: {
    email: "alex.individual@demo.lifebudget.app",
    name: "Alex Rivera",
  },
  couple: { email: "jordan.couple@demo.lifebudget.app", name: "Jordan Hale" },
  couplePartner: { email: "sam.couple@demo.lifebudget.app", name: "Sam Hale" },
  family: { email: "priya.family@demo.lifebudget.app", name: "Priya Mehta" },
} as const;
