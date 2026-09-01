function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function authErrorCode(error: unknown): string | undefined {
  const record = asRecord(error);
  const body = asRecord(record?.body);
  const cause = asRecord(record?.cause);
  return (
    asString(body?.code) ??
    asString(record?.code) ??
    asString(cause?.code)
  );
}

export function authActionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code = authErrorCode(error);
  const record = asRecord(error);
  const body = asRecord(record?.body);
  const message =
    asString(body?.message) ?? asString(record?.message) ?? "";

  switch (code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "That email is already in use. Sign in, or try a different one.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 10 characters for your password.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
      return "We could not sign you in with those details.";
    case "FAILED_TO_CREATE_USER":
    case "FAILED_TO_CREATE_SESSION":
      return "We could not finish creating that account. Please try again in a moment.";
    case "VALIDATION_ERROR":
      return "Please check your name, email, and password.";
    case "P2002":
      return "That email is already in use. Sign in, or try a different one.";
    default:
      break;
  }

  if (/already exists/i.test(message)) {
    return "That email is already in use. Sign in, or try a different one.";
  }

  return fallback;
}
