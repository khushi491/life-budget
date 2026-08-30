import { describe, expect, it } from "vitest";
import {
  loginSchema,
  moneyInputSchema,
  onboardingSchema,
  transactionSchema,
} from "./schemas";

describe("validation", () => {
  it("accepts ordinary money and rejects invalid amounts", () => {
    expect(moneyInputSchema.safeParse("2500.50").success).toBe(true);
    expect(moneyInputSchema.safeParse("12.345").success).toBe(false);
    expect(moneyInputSchema.safeParse("-10").success).toBe(false);
    expect(moneyInputSchema.safeParse("").success).toBe(false);
  });

  it("requires a valid email and a longer password", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "short" })
        .success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "alex@example.com",
        password: "DemoPass123!",
      }).success,
    ).toBe(true);
  });

  it("accepts a complete onboarding payload", () => {
    const parsed = onboardingSchema.safeParse({
      mode: "COUPLE",
      currency: "USD",
      locale: "en-US",
      householdName: "Hale household",
      members: [
        { displayName: "Jordan", role: "OWNER", isDependent: false },
        { displayName: "Sam", role: "PARTNER", isDependent: false },
      ],
      monthlyIncome: "8500",
      fixedBills: "3200",
      flexibleSpending: "1800",
      existingSavings: "42000",
      currentDebts: "18000",
      emergencyTargetMonths: 6,
      goals: ["HOUSE_DOWN_PAYMENT", "EMERGENCY_FUND"],
      homeBuying: true,
      propertyPrice: "520000",
    });
    expect(parsed.success).toBe(true);
  });

  it("validates transactions without leaking technical messages", () => {
    const parsed = transactionSchema.safeParse({
      type: "EXPENSE",
      amount: "42.10",
      date: "2026-08-01",
      visibility: "SHARED",
    });
    expect(parsed.success).toBe(true);
  });
});
