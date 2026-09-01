import { cookies } from "next/headers";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies/utils";
import { auth } from "@/lib/auth";
import { getEnv } from "@/lib/env";

class AuthRequestError extends Error {
  body: { code?: string; message?: string };

  constructor(body: { code?: string; message?: string }, status: number) {
    super(body.message ?? `Auth request failed (${status})`);
    this.name = "AuthRequestError";
    this.body = body;
  }
}

function sameSiteValue(
  value: unknown,
): "lax" | "strict" | "none" | undefined {
  if (value === "lax" || value === "strict" || value === "none") return value;
  return undefined;
}

async function applyAuthCookies(response: Response) {
  const store = await cookies();
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  const headerList =
    setCookies.length > 0
      ? setCookies
      : [response.headers.get("set-cookie")].filter(
          (value): value is string => Boolean(value),
        );

  for (const header of headerList) {
    for (const [name, attributes] of parseSetCookieHeader(header)) {
      if (!name) continue;
      const options = toCookieOptions(attributes);
      try {
        store.set(name, attributes.value, {
          path: options.path ?? "/",
          ...(typeof options.maxAge === "number" && Number.isFinite(options.maxAge)
            ? { maxAge: options.maxAge }
            : {}),
          ...(options.expires instanceof Date &&
          !Number.isNaN(options.expires.getTime())
            ? { expires: options.expires }
            : {}),
          ...(options.httpOnly !== undefined ? { httpOnly: options.httpOnly } : {}),
          ...(options.secure !== undefined ? { secure: options.secure } : {}),
          ...(sameSiteValue(options.sameSite)
            ? { sameSite: sameSiteValue(options.sameSite) }
            : {}),
        });
      } catch (error) {
        console.error(`Failed to set auth cookie ${name}`, error);
      }
    }
  }
}

async function callAuthApi(
  path: "/sign-up/email" | "/sign-in/email",
  body: Record<string, unknown>,
) {
  const env = getEnv();
  const response = await auth.handler(
    new Request(`${env.BETTER_AUTH_URL}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: env.BETTER_AUTH_URL,
      },
      body: JSON.stringify(body),
    }),
  );

  const payload = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new AuthRequestError(
      {
        code: payload.code,
        message: payload.message,
      },
      response.status,
    );
  }

  await applyAuthCookies(response);
}

export async function signUpWithEmail(body: {
  name: string;
  email: string;
  password: string;
}) {
  return callAuthApi("/sign-up/email", body);
}

export async function signInWithEmail(body: { email: string; password: string }) {
  return callAuthApi("/sign-in/email", body);
}
