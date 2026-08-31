import { MilestoneKey } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { emergencyFundCoverageMonths } from "@/lib/finance";
import { JOURNEY } from "@/lib/journey";

export type MilestoneFacts = {
  onboardingComplete: boolean;
  hasIncome: boolean;
  hasExpense: boolean;
  budgetConfirmed: boolean;
  overBudget: boolean;
  emergencyMonths: number;
  highInterestDebtMinor: bigint;
  hasNonEmergencyGoalProgress: boolean;
  hasHomeScenario: boolean;
  netWorthMinor: bigint;
};

export function milestoneKeysFromFacts(facts: MilestoneFacts): MilestoneKey[] {
  const earned: MilestoneKey[] = [];
  if (facts.onboardingComplete || (facts.hasIncome && facts.hasExpense)) {
    earned.push("UNDERSTAND_CASH_FLOW");
  }
  if (facts.budgetConfirmed && !facts.overBudget) {
    earned.push("STAY_WITHIN_BUDGET");
  }
  if (facts.emergencyMonths >= 1) {
    earned.push("ONE_MONTH_EMERGENCY");
  }
  if (facts.highInterestDebtMinor === 0n) {
    earned.push("ELIMINATE_HIGH_INTEREST_DEBT");
  }
  if (facts.emergencyMonths >= 3) {
    earned.push("THREE_TO_SIX_MONTH_EMERGENCY");
  }
  if (facts.hasNonEmergencyGoalProgress) {
    earned.push("SAVE_MAJOR_GOALS");
  }
  if (facts.hasHomeScenario) {
    earned.push("PREPARE_HOME");
  }
  if (
    facts.netWorthMinor > 0n &&
    facts.emergencyMonths >= 3 &&
    facts.highInterestDebtMinor === 0n
  ) {
    earned.push("GROW_NET_WORTH");
  }
  return JOURNEY.map((step) => step.key).filter((key) => earned.includes(key));
}

export async function evaluateMilestoneFacts(
  householdId: string,
): Promise<MilestoneFacts> {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const household = await prisma.household.findUniqueOrThrow({
    where: { id: householdId },
    include: {
      goals: true,
      assets: true,
      liabilities: true,
      homeScenarios: { select: { id: true } },
    },
  });
  const [transactions, budget] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId, date: { gte: start, lte: end } },
      include: { category: true },
    }),
    prisma.budget.findFirst({
      where: {
        householdId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
      include: { categories: { include: { category: true } } },
    }),
  ]);

  const hasIncome = transactions.some((row) => row.type === "INCOME");
  const hasExpense = transactions.some((row) => row.type === "EXPENSE");
  const requiredMinor = transactions
    .filter(
      (row) =>
        row.type === "EXPENSE" &&
        row.category &&
        (row.category.group === "HOUSING" ||
          row.category.group === "ESSENTIAL" ||
          row.category.group === "DEBT"),
    )
    .reduce((sum, row) => sum + row.amountMinor, 0n);
  const emergencyGoal = household.goals.find(
    (goal) => goal.type === "EMERGENCY_FUND",
  );
  const spendByCategory = new Map<string, bigint>();
  for (const row of transactions) {
    if (row.type !== "EXPENSE" || !row.categoryId) continue;
    spendByCategory.set(
      row.categoryId,
      (spendByCategory.get(row.categoryId) ?? 0n) + row.amountMinor,
    );
  }
  const overBudget = Boolean(
    budget?.categories.some((row) => {
      const spent = spendByCategory.get(row.categoryId) ?? 0n;
      return row.limitMinor > 0n && spent > row.limitMinor;
    }),
  );

  const assetsMinor = household.assets.reduce(
    (sum, row) => sum + row.valueMinor,
    0n,
  );
  const liabilitiesMinor = household.liabilities.reduce(
    (sum, row) => sum + row.balanceMinor,
    0n,
  );

  return {
    onboardingComplete: household.onboardingComplete,
    hasIncome,
    hasExpense,
    budgetConfirmed: Boolean(budget?.confirmed),
    overBudget,
    emergencyMonths: emergencyFundCoverageMonths(
      emergencyGoal?.currentMinor ?? 0n,
      requiredMinor > 0n ? requiredMinor : 1n,
    ).toNumber(),
    highInterestDebtMinor: household.liabilities
      .filter((row) => Number(row.interestApr) >= 15 && row.balanceMinor > 0n)
      .reduce((sum, row) => sum + row.balanceMinor, 0n),
    hasNonEmergencyGoalProgress: household.goals.some(
      (goal) =>
        goal.type !== "EMERGENCY_FUND" &&
        !goal.archived &&
        (goal.currentMinor > 0n || goal.monthlyContributionMinor > 0n),
    ),
    hasHomeScenario: household.homeScenarios.length > 0,
    netWorthMinor: assetsMinor - liabilitiesMinor,
  };
}

export async function syncMilestones(householdId: string) {
  const keys = milestoneKeysFromFacts(
    await evaluateMilestoneFacts(householdId),
  );
  if (keys.length === 0) return;
  await prisma.financialMilestone.createMany({
    data: keys.map((key) => ({ householdId, key })),
    skipDuplicates: true,
  });
}
