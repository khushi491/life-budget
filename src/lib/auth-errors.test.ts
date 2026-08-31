import { describe, expect, it } from "vitest";
import { authActionErrorMessage } from "./auth-errors";

describe("authActionErrorMessage", () => {
  it("maps a duplicate-email Better Auth error", () => {
    expect(
      authActionErrorMessage(
        {
          body: {
            code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
            message: "User already exists. Use another email.",
          },
        },
        "fallback",
      ),
    ).toBe("That email is already in use. Sign in, or try a different one.");
  });

  it("falls back when the error has no Better Auth code", () => {
    expect(authActionErrorMessage(new Error("boom"), "Please try again.")).toBe(
      "Please try again.",
    );
  });
});
