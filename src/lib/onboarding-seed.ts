import { Prisma, type GoalType } from "@prisma/client";
import { addMonths, startOfMonth } from "date-fns";
import { toMinor } from "@/lib/finance";
import type { OnboardingInput } from "@/lib/schemas";

type Tx = Prisma.TransactionClient;

function money(value: string | undefined): bigint {
  if (!value) return 0n;
  return toMinor(value);
}

function categoryId(
  categories: { id: string; name: string }[],
  name: string,
) {
  return categories.find((row) => row.name === name)?.id;
}

const GOAL_COPY: Record<string, { name: string; type: GoalType }> = {
  EMERGENCY_FUND: { name: "Emergency fund", type: "EMERGENCY_FUND" },
  HOUSE_DOWN_PAYMENT: {
    name: "House down payment",
    type: "HOUSE_DOWN_PAYMENT",
  },
  CAR: { name: "Car fund", type: "CAR" },
  VACATION: { name: "Vacation", type: "VACATION" },
  WEDDING: { name: "Wedding", type: "WEDDING" },
  EDUCATION: { name: "Education", type: "EDUCATION" },
  RETIREMENT: { name: "Retirement", type: "RETIREMENT" },
};

export async function materializeOnboarding(
  tx: Tx,
  input: {
    householdId: string;
    memberId: string;
    accountId: string;
    currency: OnboardingInput["currency"];
    data: OnboardingInput;
    categories: { id: string; name: string }[];
  },
) {
  const { householdId, memberId, accountId, currency, data, categories } =
    input;
  const income = money(data.monthlyIncome);
  const bills = money(data.fixedBills);
  const flex = money(data.flexibleSpending);
  const savings = money(data.existingSavings);
  const debts = money(data.currentDebts);
  const leftover = income > bills + flex ? income - bills - flex : 0n;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const paycheckId = categoryId(categories, "Paycheck");
  const rentId = categoryId(categories, "Rent");
  const diningId = categoryId(categories, "Dining");
  const emergencyCatId = categoryId(categories, "Emergency fund");

  if (income > 0n) {
    await tx.transaction.create({
      data: {
        householdId,
        type: "INCOME",
        amountMinor: income,
        currency,
        date: monthStart,
        merchant: "Typical take-home",
        description: "From onboarding",
        categoryId: paycheckId,
        accountId,
        paidByMemberId: memberId,
      },
    });
  }

  if (bills > 0n) {
    await tx.transaction.create({
      data: {
        householdId,
        type: "EXPENSE",
        amountMinor: bills,
        currency,
        date: monthStart,
        merchant: "Required bills",
        description: "From onboarding",
        categoryId: rentId,
        accountId,
        paidByMemberId: memberId,
      },
    });
    await tx.recurrenceRule.create({
      data: {
        householdId,
        name: "Required monthly bills",
        type: "EXPENSE",
        amountMinor: bills,
        currency,
        frequency: "MONTHLY",
        nextRunOn: addMonths(monthStart, 1),
        merchant: "Required bills",
        categoryId: rentId,
        accountId,
        paidByMemberId: memberId,
      },
    });
  }

  if (flex > 0n) {
    await tx.transaction.create({
      data: {
        householdId,
        type: "EXPENSE",
        amountMinor: flex,
        currency,
        date: monthStart,
        merchant: "Flexible spending",
        description: "From onboarding",
        categoryId: diningId,
        accountId,
        paidByMemberId: memberId,
      },
    });
  }

  if (savings > 0n) {
    await tx.asset.create({
      data: {
        householdId,
        name: "Cash and savings",
        type: "CASH",
        valueMinor: savings,
        currency,
      },
    });
    await tx.financialAccount.update({
      where: { id: accountId },
      data: { balanceMinor: savings },
    });
  }

  if (debts > 0n) {
    const minPayment =
      debts / 36n > 2500n ? debts / 36n : debts > 0n ? 2500n : 0n;
    await tx.liability.create({
      data: {
        householdId,
        name: "Current debts",
        type: "OTHER",
        balanceMinor: debts,
        interestApr: new Prisma.Decimal("15"),
        minPaymentMinor: minPayment,
        currency,
        notes: "Added from onboarding. Split or edit this on the Debts page.",
      },
    });
  }

  const selected = new Set(data.goals);
  if (!selected.has("EMERGENCY_FUND")) selected.add("EMERGENCY_FUND");
  const goalCount = Math.max(1, selected.size);
  const share = leftover / BigInt(goalCount);
  const emergencyTarget =
    bills > 0n
      ? bills * BigInt(data.emergencyTargetMonths)
      : income > 0n
        ? (income * BigInt(data.emergencyTargetMonths)) / 2n
        : 0n;

  for (const key of selected) {
    const copy = GOAL_COPY[key];
    if (!copy) continue;
    const isEmergency = copy.type === "EMERGENCY_FUND";
    const housePrice = money(data.propertyPrice);
    const target = isEmergency
      ? emergencyTarget || income
      : copy.type === "HOUSE_DOWN_PAYMENT" && housePrice > 0n
        ? housePrice / 5n
        : leftover > 0n
          ? leftover * 12n
          : income > 0n
            ? income * 3n
            : 100000n;
    await tx.financialGoal.create({
      data: {
        householdId,
        name: copy.name,
        type: copy.type,
        targetMinor: target,
        currentMinor: isEmergency ? savings : 0n,
        monthlyContributionMinor: share,
        priority: isEmergency ? "HIGH" : "MEDIUM",
      },
    });
  }

  if (data.homeBuying) {
    const price = money(data.propertyPrice);
    if (price > 0n) {
      await tx.homeScenario.create({
        data: {
          householdId,
          name: "Onboarding home sketch",
          propertyPriceMinor: price,
          downPaymentMinor: price / 5n,
          currentSavingsMinor: savings,
          annualRatePercent: new Prisma.Decimal("6.5"),
          termMonths: 360,
          rentMonthlyMinor: bills,
        },
      });
    }
  }

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const budget = await tx.budget.upsert({
    where: {
      householdId_year_month: {
        householdId,
        year: nowYear,
        month: nowMonth,
      },
    },
    update: { incomeMinor: income, confirmed: true },
    create: {
      householdId,
      year: nowYear,
      month: nowMonth,
      incomeMinor: income,
      confirmed: true,
    },
  });
  await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
  const limits: { categoryId: string; limitMinor: bigint }[] = [];
  if (rentId && bills > 0n)
    limits.push({ categoryId: rentId, limitMinor: bills });
  if (diningId && flex > 0n)
    limits.push({ categoryId: diningId, limitMinor: flex });
  if (emergencyCatId && leftover > 0n)
    limits.push({ categoryId: emergencyCatId, limitMinor: leftover });
  if (limits.length) {
    await tx.budgetCategory.createMany({
      data: limits.map((row) => ({
        budgetId: budget.id,
        categoryId: row.categoryId,
        limitMinor: row.limitMinor,
      })),
    });
  }

  const assetsMinor = savings;
  const liabilitiesMinor = debts;
  await tx.netWorthSnapshot.create({
    data: {
      householdId,
      asOf: now,
      assetsMinor,
      liabilitiesMinor,
      netWorthMinor: assetsMinor - liabilitiesMinor,
    },
  });

  await tx.household.update({
    where: { id: householdId },
    data: { emergencyFundTargetMinor: emergencyTarget },
  });
}
