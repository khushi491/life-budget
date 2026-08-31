export function authActionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code =
    error &&
    typeof error === "object" &&
    "body" in error &&
    error.body &&
    typeof error.body === "object" &&
    "code" in error.body &&
    typeof (error.body as { code?: unknown }).code === "string"
      ? (error.body as { code: string }).code
      : undefined;

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
    default:
      return fallback;
  }
}
