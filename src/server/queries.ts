import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";
import type { CategoryGroup, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canViewTransaction } from "@/lib/permissions";
import { buildInsights, financialHealthScore } from "@/lib/insights";
import { currentJourneyIndex } from "@/lib/journey";
import {
  emergencyFundCoverageMonths,
  savingsRate,
  debtToIncomeRatio,
} from "@/lib/finance";

export type PeriodView = "month" | "quarter" | "year";

export function periodRange(view: PeriodView, ref = new Date()) {
  if (view === "quarter")
    return { start: startOfQuarter(ref), end: endOfQuarter(ref) };
  if (view === "year") return { start: startOfYear(ref), end: endOfYear(ref) };
  return { start: startOfMonth(ref), end: endOfMonth(ref) };
}

function sumByGroup(
  rows: {
    amountMinor: bigint;
    type: string;
    category: { group: CategoryGroup } | null;
  }[],
  groups: CategoryGroup[],
) {
  return rows
    .filter(
      (row) =>
        row.type === "EXPENSE" &&
        row.category &&
        groups.includes(row.category.group),
    )
    .reduce((sum, row) => sum + row.amountMinor, 0n);
}

export async function getDashboardData(input: {
  householdId: string;
  memberId: string;
  role: "OWNER" | "PARTNER" | "ADULT" | "DEPENDENT" | "VIEWER";
  view: PeriodView;
}) {
  const { start, end } = periodRange(input.view);
  const previous = periodRange(
    input.view,
    subMonths(
      start,
      input.view === "year" ? 12 : input.view === "quarter" ? 3 : 1,
    ),
  );

  const household = await prisma.household.findUniqueOrThrow({
    where: { id: input.householdId },
    include: {
      categories: true,
      goals: true,
      assets: true,
      liabilities: true,
      milestones: true,
      recurrenceRules: { where: { active: true }, include: { category: true } },
      members: true,
    },
  });

  const [currentTx, previousTx, recentTx, snapshots] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId: input.householdId, date: { gte: start, lte: end } },
      include: { category: true, paidBy: true },
    }),
    prisma.transaction.findMany({
      where: {
        householdId: input.householdId,
        date: { gte: previous.start, lte: previous.end },
      },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { householdId: input.householdId },
      include: { category: true, paidBy: true },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.netWorthSnapshot.findMany({
      where: { householdId: input.householdId },
      orderBy: { asOf: "asc" },
    }),
  ]);

  const visible = currentTx.filter((tx) =>
    canViewTransaction({
      role: input.role,
      memberId: input.memberId,
      visibility: tx.visibility,
      paidByMemberId: tx.paidByMemberId,
    }),
  );

  const incomeMinor = visible
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + tx.amountMinor, 0n);
  const expenseMinor = visible
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + tx.amountMinor, 0n);
  const requiredMinor = sumByGroup(visible, ["HOUSING", "ESSENTIAL", "DEBT"]);
  const flexibleMinor = sumByGroup(visible, ["LIFESTYLE"]);
  const savingsMinor = sumByGroup(visible, ["SAVINGS"]);
  const remainingMinor = incomeMinor - expenseMinor;
  const previousIncome = previousTx
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + tx.amountMinor, 0n);
  const previousExpense = previousTx
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + tx.amountMinor, 0n);
  const previousSavings = sumByGroup(previousTx, ["SAVINGS"]);

  const flow = [
    {
      key: "housing",
      label: "Housing",
      amountMinor: sumByGroup(visible, ["HOUSING"]),
    },
    {
      key: "essentials",
      label: "Essentials",
      amountMinor: sumByGroup(visible, ["ESSENTIAL"]),
    },
    {
      key: "lifestyle",
      label: "Lifestyle spending",
      amountMinor: flexibleMinor,
    },
    {
      key: "debt",
      label: "Debt payments",
      amountMinor: sumByGroup(visible, ["DEBT"]),
    },
    { key: "savings", label: "Savings", amountMinor: savingsMinor },
    {
      key: "remaining",
      label: "Remaining money",
      amountMinor: remainingMinor > 0n ? remainingMinor : 0n,
    },
  ];

  const spendByCategory = new Map<
    string,
    { name: string; amountMinor: bigint; group: CategoryGroup }
  >();
  for (const tx of visible.filter(
    (row) => row.type === "EXPENSE" && row.category,
  )) {
    const category = tx.category!;
    const current = spendByCategory.get(category.id) ?? {
      name: category.name,
      amountMinor: 0n,
      group: category.group,
    };
    current.amountMinor += tx.amountMinor;
    spendByCategory.set(category.id, current);
  }
  const categorySlices = [...spendByCategory.values()].sort((a, b) =>
    Number(b.amountMinor - a.amountMinor),
  );
  const major = categorySlices.slice(0, 6);
  const other = categorySlices
    .slice(6)
    .reduce((sum, row) => sum + row.amountMinor, 0n);
  if (other > 0n)
    major.push({ name: "Other", amountMinor: other, group: "LIFESTYLE" });

  const now = new Date();
  const trendStart = periodRange("month", subMonths(now, 11)).start;
  const yearTx = await prisma.transaction.findMany({
    where: { householdId: input.householdId, date: { gte: trendStart } },
  });
  const incomeExpenseTrend = [];
  for (let i = 11; i >= 0; i -= 1) {
    const range = periodRange("month", subMonths(now, i));
    const monthTx = yearTx.filter(
      (tx) => tx.date >= range.start && tx.date <= range.end,
    );
    incomeExpenseTrend.push({
      month: range.start.toISOString().slice(0, 7),
      incomeMinor: monthTx
        .filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + tx.amountMinor, 0n),
      expenseMinor: monthTx
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amountMinor, 0n),
    });
  }

  const budget = await prisma.budget.findFirst({
    where: {
      householdId: input.householdId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    },
    include: { categories: { include: { category: true } } },
  });

  const dining = [...spendByCategory.values()].find(
    (row) => row.name === "Dining",
  );
  const diningBudget = budget?.categories.find(
    (row) => row.category.name === "Dining",
  );
  const diningUsedPct =
    dining && diningBudget && diningBudget.limitMinor > 0n
      ? Number(dining.amountMinor) / Number(diningBudget.limitMinor)
      : null;

  const assetsMinor = household.assets.reduce(
    (sum, row) => sum + row.valueMinor,
    0n,
  );
  const liabilitiesMinor = household.liabilities.reduce(
    (sum, row) => sum + row.balanceMinor,
    0n,
  );
  const netWorthMinor = assetsMinor - liabilitiesMinor;
  const monthlyDebt = household.liabilities.reduce(
    (sum, row) => sum + row.minPaymentMinor,
    0n,
  );
  const emergencyGoal = household.goals.find(
    (goal) => goal.type === "EMERGENCY_FUND",
  );
  const emergencyMonths = emergencyFundCoverageMonths(
    emergencyGoal?.currentMinor ?? 0n,
    requiredMinor > 0n ? requiredMinor : 1n,
  ).toNumber();

  const behindGoal = household.goals.find((goal) => {
    if (!goal.targetDate || goal.monthlyContributionMinor === 0n) return false;
    const monthsLeft = Math.max(
      1,
      (goal.targetDate.getFullYear() - now.getFullYear()) * 12 +
        (goal.targetDate.getMonth() - now.getMonth()),
    );
    return (
      goal.currentMinor + goal.monthlyContributionMinor * BigInt(monthsLeft) <
      goal.targetMinor
    );
  });

  const insights = buildInsights({
    currency: household.currency,
    incomeMinor,
    expenseMinor,
    previousExpenseMinor: previousExpense,
    savingsMinor,
    previousSavingsMinor: previousSavings,
    remainingMinor,
    emergencyMonths,
    diningUsedPct,
    housingRatio:
      incomeMinor > 0n
        ? Number(sumByGroup(visible, ["HOUSING"])) / Number(incomeMinor)
        : 0,
    goalBehind: behindGoal ? { name: behindGoal.name, href: "/goals" } : null,
    extraPaymentInterestSavedMinor: null,
  });

  const budgetUsed =
    budget && budget.categories.length
      ? Number(expenseMinor) /
        Number(
          budget.categories.reduce((sum, row) => sum + row.limitMinor, 0n) ||
            1n,
        )
      : expenseMinor > 0n && incomeMinor > 0n
        ? Number(expenseMinor) / Number(incomeMinor)
        : 0;

  const health = financialHealthScore({
    savingsRate: savingsRate(savingsMinor, incomeMinor).toNumber(),
    emergencyMonths,
    budgetUsedPct: budgetUsed,
    dti: debtToIncomeRatio(monthlyDebt, incomeMinor).toNumber(),
    highInterestDebtMinor: household.liabilities
      .filter((row) => Number(row.interestApr) >= 15)
      .reduce((sum, row) => sum + row.balanceMinor, 0n),
  });

  const heatmap = visible
    .filter((tx) => tx.type === "EXPENSE")
    .reduce<Record<string, bigint>>((acc, tx) => {
      const key = tx.date.toISOString().slice(0, 10);
      acc[key] = (acc[key] ?? 0n) + tx.amountMinor;
      return acc;
    }, {});

  return {
    household,
    period: { start, end, view: input.view },
    incomeMinor,
    expenseMinor,
    requiredMinor,
    flexibleMinor,
    savingsMinor,
    remainingMinor,
    previousIncome,
    previousExpense,
    flow,
    categorySlices: major,
    incomeExpenseTrend,
    budget,
    assetsMinor,
    liabilitiesMinor,
    netWorthMinor,
    snapshots,
    recentTx,
    insights: insights.slice(0, 3),
    allInsights: insights,
    health,
    emergencyMonths,
    monthlyDebt,
    heatmap,
    currentJourney: currentJourneyIndex(
      household.milestones.map((row) => row.key),
    ),
  };
}

export async function getTransactionsPage(input: {
  householdId: string;
  memberId: string;
  role: "OWNER" | "PARTNER" | "ADULT" | "DEPENDENT" | "VIEWER";
  q?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  page?: number;
}) {
  const page = input.page ?? 1;
  const take = 20;
  const where: Prisma.TransactionWhereInput = {
    householdId: input.householdId,
    ...(input.type ? { type: input.type } : {}),
    ...(input.q
      ? {
          OR: [
            { merchant: { contains: input.q, mode: "insensitive" } },
            { description: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, paidBy: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);
  const visible = rows.filter((tx) =>
    canViewTransaction({
      role: input.role,
      memberId: input.memberId,
      visibility: tx.visibility,
      paidByMemberId: tx.paidByMemberId,
    }),
  );
  return { rows: visible, total, page, take };
}
