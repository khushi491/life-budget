import type { CurrencyCode } from "@/lib/finance";

export type Insight = {
  id: string;
  title: string;
  what: string;
  why: string;
  nextStep: string;
  href: string;
  severity: "info" | "caution" | "risk";
};

export type InsightFacts = {
  currency: CurrencyCode;
  incomeMinor: bigint;
  expenseMinor: bigint;
  previousExpenseMinor: bigint;
  savingsMinor: bigint;
  previousSavingsMinor: bigint;
  remainingMinor: bigint;
  emergencyMonths: number;
  diningUsedPct: number | null;
  housingRatio: number;
  goalBehind: { name: string; href: string } | null;
  extraPaymentInterestSavedMinor: bigint | null;
};

export function buildInsights(facts: InsightFacts): Insight[] {
  const insights: Insight[] = [];

  if (facts.previousExpenseMinor > 0n) {
    const change =
      Number(facts.expenseMinor - facts.previousExpenseMinor) /
      Number(facts.previousExpenseMinor);
    if (change >= 0.15) {
      insights.push({
        id: "spend-up",
        title: "Spending rose this month",
        what: `Household spending is ${Math.round(change * 100)}% higher than last month.`,
        why: "A sudden jump can quietly erase progress toward savings goals.",
        nextStep:
          "Review the categories that grew and decide what was a one-off.",
        href: "/transactions",
        severity: "caution",
      });
    }
  }

  if (facts.diningUsedPct !== null && facts.diningUsedPct >= 0.8) {
    insights.push({
      id: "dining-budget",
      title: "Dining is close to its limit",
      what: `Dining has used ${Math.round(facts.diningUsedPct * 100)}% of this month's budget.`,
      why: "Lifestyle categories tend to overrun first and are the easiest to adjust.",
      nextStep: "Check remaining dining budget before the next meal out.",
      href: "/budget",
      severity: facts.diningUsedPct >= 1 ? "risk" : "caution",
    });
  }

  if (facts.emergencyMonths < 3) {
    insights.push({
      id: "emergency",
      title: "Emergency savings are below target",
      what: `Your cash buffer covers about ${facts.emergencyMonths.toFixed(1)} months of essentials.`,
      why: "Three to six months of required spending is the usual first safety milestone.",
      nextStep: "Move the next leftover amount into the emergency fund.",
      href: "/goals",
      severity: facts.emergencyMonths < 1 ? "risk" : "caution",
    });
  }

  if (
    facts.previousSavingsMinor > 0n &&
    facts.savingsMinor < facts.previousSavingsMinor
  ) {
    insights.push({
      id: "savings-rate",
      title: "Savings slowed",
      what: "Less money reached savings this month than last month.",
      why: "A lower savings rate delays every later goal, including a home.",
      nextStep: "Look at flexible spending before reducing goal contributions.",
      href: "/dashboard",
      severity: "caution",
    });
  }

  if (facts.goalBehind) {
    insights.push({
      id: "goal-behind",
      title: `${facts.goalBehind.name} is behind schedule`,
      what: "The current monthly contribution will miss the target date.",
      why: "Catching up a little each month is easier than a last-minute lump sum.",
      nextStep: "Open the goal simulator and test a higher contribution.",
      href: facts.goalBehind.href,
      severity: "info",
    });
  }

  if (facts.housingRatio > 0.36) {
    insights.push({
      id: "housing-ratio",
      title: "Housing would consume too much income",
      what: `Housing is ${Math.round(facts.housingRatio * 100)}% of take-home income.`,
      why: "Above 36%, a repair, rate change, or income dip becomes hard to absorb.",
      nextStep:
        "Compare a lower price or larger down payment in the house planner.",
      href: "/house",
      severity: "risk",
    });
  }

  if (
    facts.extraPaymentInterestSavedMinor &&
    facts.extraPaymentInterestSavedMinor > 0n
  ) {
    insights.push({
      id: "extra-payment",
      title: "An extra loan payment could save real interest",
      what: "A modest extra principal payment shortens the loan in the current scenario.",
      why: "Interest saved early is money that can stay in savings instead.",
      nextStep: "Test extra payments in the house planner.",
      href: "/house",
      severity: "info",
    });
  }

  if (facts.remainingMinor < 0n) {
    insights.push({
      id: "overspent",
      title: "This month's money does not yet cover everything",
      what: "Expenses are higher than income for the selected period.",
      why: "A short month is a signal to pause lifestyle spending or use a planned buffer — not a judgment.",
      nextStep: "Open the budget builder and reallocate before the month ends.",
      href: "/budget",
      severity: "risk",
    });
  }

  const order = { risk: 0, caution: 1, info: 2 };
  return insights
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, 8);
}

export function financialHealthScore(input: {
  savingsRate: number;
  emergencyMonths: number;
  budgetUsedPct: number;
  dti: number;
  highInterestDebtMinor: bigint;
}): { score: number; summary: string } {
  const savingsPts = Math.max(0, Math.min(25, input.savingsRate * 100));
  const emergencyPts = Math.max(
    0,
    Math.min(25, (input.emergencyMonths / 6) * 25),
  );
  const budgetPts =
    input.budgetUsedPct <= 1
      ? 20
      : Math.max(0, 20 - (input.budgetUsedPct - 1) * 40);
  const dtiPts = input.dti <= 0.36 ? 15 : input.dti <= 0.43 ? 8 : 2;
  const debtPts = input.highInterestDebtMinor === 0n ? 15 : 6;
  const score = Math.round(
    savingsPts + emergencyPts + budgetPts + dtiPts + debtPts,
  );
  let summary = "A solid foundation — keep the next milestone in sight.";
  if (score < 40)
    summary = "The next few steps will make the picture feel much steadier.";
  else if (score < 70)
    summary =
      "You are mid-journey: cash flow is visible, and the next safety buffer is the priority.";
  return { score: Math.max(0, Math.min(100, score)), summary };
}
