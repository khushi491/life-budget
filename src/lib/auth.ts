import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

const env = getEnv();

function trustedAppOrigins(appUrl: string) {
  const origins = new Set([appUrl]);
  try {
    const parsed = new URL(appUrl);
    const port = parsed.port ? `:${parsed.port}` : "";
    if (parsed.hostname === "localhost") {
      origins.add(`${parsed.protocol}//127.0.0.1${port}`);
    } else if (parsed.hostname === "127.0.0.1") {
      origins.add(`${parsed.protocol}//localhost${port}`);
    }
  } catch {
    // Keep the configured URL even if it is not parseable.
  }
  return [...origins];
}

function isPrivateDevOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
  },
  trustedOrigins: async (request) => {
    const origins = trustedAppOrigins(env.NEXT_PUBLIC_APP_URL);
    const headerOrigin = request?.headers.get("origin");
    if (headerOrigin && isPrivateDevOrigin(headerOrigin)) {
      origins.push(headerOrigin);
    }
    return [...new Set(origins)];
  },
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
