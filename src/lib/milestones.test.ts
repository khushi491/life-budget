import { describe, expect, it } from "vitest";
import { milestoneKeysFromFacts, type MilestoneFacts } from "./milestones";

const base: MilestoneFacts = {
  onboardingComplete: false,
  hasIncome: false,
  hasExpense: false,
  budgetConfirmed: false,
  overBudget: false,
  emergencyMonths: 0,
  highInterestDebtMinor: 0n,
  hasNonEmergencyGoalProgress: false,
  hasHomeScenario: false,
  netWorthMinor: 0n,
};

describe("milestoneKeysFromFacts", () => {
  it("awards cash flow after onboarding or income plus spending", () => {
    expect(
      milestoneKeysFromFacts({ ...base, onboardingComplete: true }),
    ).toContain("UNDERSTAND_CASH_FLOW");
    expect(
      milestoneKeysFromFacts({ ...base, hasIncome: true, hasExpense: true }),
    ).toContain("UNDERSTAND_CASH_FLOW");
    expect(milestoneKeysFromFacts(base)).not.toContain("UNDERSTAND_CASH_FLOW");
  });

  it("awards budget only when confirmed and not over", () => {
    expect(
      milestoneKeysFromFacts({
        ...base,
        budgetConfirmed: true,
        overBudget: false,
      }),
    ).toContain("STAY_WITHIN_BUDGET");
    expect(
      milestoneKeysFromFacts({
        ...base,
        budgetConfirmed: true,
        overBudget: true,
      }),
    ).not.toContain("STAY_WITHIN_BUDGET");
  });

  it("awards later safety milestones from emergency months, debt, and net worth", () => {
    const keys = milestoneKeysFromFacts({
      ...base,
      onboardingComplete: true,
      budgetConfirmed: true,
      emergencyMonths: 3,
      highInterestDebtMinor: 0n,
      hasNonEmergencyGoalProgress: true,
      hasHomeScenario: true,
      netWorthMinor: 10_000_00n,
    });
    expect(keys).toEqual([
      "UNDERSTAND_CASH_FLOW",
      "STAY_WITHIN_BUDGET",
      "ONE_MONTH_EMERGENCY",
      "ELIMINATE_HIGH_INTEREST_DEBT",
      "THREE_TO_SIX_MONTH_EMERGENCY",
      "SAVE_MAJOR_GOALS",
      "PREPARE_HOME",
      "GROW_NET_WORTH",
    ]);
  });
});
