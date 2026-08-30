"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth, DEMO_PASSWORD, DEMO_USERS } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDemoModeEnabled } from "@/lib/env";
import { toMinor } from "@/lib/finance";
import { SYSTEM_CATEGORIES } from "@/lib/categories";
import { canEditFinances } from "@/lib/permissions";
import {
  goalSchema,
  homeScenarioSchema,
  loginSchema,
  onboardingSchema,
  signupSchema,
  transactionSchema,
} from "@/lib/schemas";
import { getActiveHouseholdContext, getSession } from "@/lib/session";
import { analyzeHomePurchase } from "@/lib/finance";

function parseMoney(value: string | undefined, fallback = 0n): bigint {
  if (!value) return fallback;
  return toMinor(value);
}

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check your details.")}`);
  }
  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch {
    redirect(`/login?error=${encodeURIComponent("We could not sign you in with those details.")}`);
  }
  redirect("/dashboard");
}

export async function signUpAction(formData: FormData): Promise<void> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check your details.")}`);
  }
  try {
    await auth.api.signUpEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch {
    redirect(`/signup?error=${encodeURIComponent("We could not create that account. Try a different email.")}`);
  }
  redirect("/onboarding");
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function demoLoginAction(profile: "individual" | "couple" | "family"): Promise<void> {
  if (!isDemoModeEnabled()) {
    redirect(`/?error=${encodeURIComponent("Demo mode is turned off.")}`);
  }
  const demo = DEMO_USERS[profile];
  try {
    await auth.api.signInEmail({
      body: { email: demo.email, password: DEMO_PASSWORD },
      headers: await headers(),
    });
  } catch {
    redirect(`/?error=${encodeURIComponent("Demo data is not seeded yet. Run npm run db:seed.")}`);
  }
  redirect("/dashboard");
}

export async function demoLoginIndividual(): Promise<void> {
  await demoLoginAction("individual");
}

export async function demoLoginCouple(): Promise<void> {
  await demoLoginAction("couple");
}

export async function demoLoginFamily(): Promise<void> {
  await demoLoginAction("family");
}

export async function saveOnboardingAction(input: unknown, complete: boolean) {
  const session = await getSession();
  if (!session) redirect("/login");
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check this step.",
    };
  }
  const data = parsed.data;
  const existing = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  });

  await prisma.$transaction(async (tx) => {
    const household = existing
      ? await tx.household.update({
          where: { id: existing.householdId },
          data: {
            name: data.householdName,
            mode: data.mode,
            currency: data.currency,
            locale: data.locale,
            onboardingDraft: data,
            onboardingComplete: complete,
            onboardingStep: complete ? 13 : 12,
          },
        })
      : await tx.household.create({
          data: {
            name: data.householdName,
            mode: data.mode,
            currency: data.currency,
            locale: data.locale,
            onboardingDraft: data,
            onboardingComplete: complete,
            onboardingStep: complete ? 13 : 1,
            members: {
              create: data.members.map((member, index) => ({
                displayName: member.displayName,
                role: index === 0 ? "OWNER" : member.role,
                isDependent: member.isDependent,
                userId: index === 0 ? session.user.id : undefined,
              })),
            },
          },
        });

    if (!existing) {
      await tx.category.createMany({
        data: SYSTEM_CATEGORIES.map((category, index) => ({
          householdId: household.id,
          name: category.name,
          group: category.group,
          icon: category.icon,
          color: category.color,
          sortOrder: index,
        })),
      });
      await tx.financialAccount.create({
        data: {
          householdId: household.id,
          name: "Everyday checking",
          type: "checking",
          currency: data.currency,
          isShared: true,
        },
      });
    }

    if (complete) {
      const months = data.emergencyTargetMonths;
      const essentials = parseMoney(data.fixedBills);
      await tx.household.update({
        where: { id: household.id },
        data: { emergencyFundTargetMinor: essentials * BigInt(months) },
      });
    }
  });

  if (complete) redirect("/dashboard");
  return { ok: true };
}

export async function createTransactionAction(formData: FormData) {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    return {
      error: "You can view this household, but you cannot add transactions.",
    };
  }
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    merchant: formData.get("merchant") || undefined,
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    accountId: formData.get("accountId") || undefined,
    transferAccountId: formData.get("transferAccountId") || undefined,
    visibility: formData.get("visibility") || "SHARED",
    paidByMemberId: formData.get("paidByMemberId") || undefined,
    tags: formData.get("tags") || undefined,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the transaction.",
    };
  }
  await prisma.transaction.create({
    data: {
      householdId: context.household.id,
      type: parsed.data.type,
      amountMinor: toMinor(parsed.data.amount),
      currency: context.household.currency,
      date: new Date(parsed.data.date),
      merchant: parsed.data.merchant,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      accountId: parsed.data.accountId,
      transferAccountId: parsed.data.transferAccountId,
      visibility: parsed.data.visibility,
      paidByMemberId: parsed.data.paidByMemberId || context.member.id,
      tags: parsed.data.tags
        ? parsed.data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    },
  });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/income");
  return { ok: true };
}

export async function deleteTransactionAction(id: string) {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    return { error: "You cannot delete transactions." };
  }
  await prisma.transaction.deleteMany({
    where: { id, householdId: context.household.id },
  });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveBudgetAction(input: {
  year: number;
  month: number;
  incomeMinor: string;
  warningPct: number;
  rollover: boolean;
  categories: { categoryId: string; limitMinor: string }[];
}) {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    return { error: "You cannot edit the budget." };
  }
  const income = BigInt(input.incomeMinor);
  const allocated = input.categories.reduce(
    (sum, row) => sum + BigInt(row.limitMinor),
    0n,
  );
  if (allocated > income) {
    return {
      error:
        "Allocated expenses are higher than expected income. Reduce a category before confirming.",
    };
  }
  await prisma.$transaction(async (tx) => {
    const budget = await tx.budget.upsert({
      where: {
        householdId_year_month: {
          householdId: context.household.id,
          year: input.year,
          month: input.month,
        },
      },
      update: {
        incomeMinor: income,
        warningPct: input.warningPct,
        rollover: input.rollover,
        confirmed: true,
      },
      create: {
        householdId: context.household.id,
        year: input.year,
        month: input.month,
        incomeMinor: income,
        warningPct: input.warningPct,
        rollover: input.rollover,
        confirmed: true,
      },
    });
    await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
    if (input.categories.length) {
      await tx.budgetCategory.createMany({
        data: input.categories.map((row) => ({
          budgetId: budget.id,
          categoryId: row.categoryId,
          limitMinor: BigInt(row.limitMinor),
          rollover: input.rollover,
        })),
      });
    }
  });
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveGoalAction(formData: FormData) {
  const context = await getActiveHouseholdContext();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") ?? "",
    monthlyContribution: formData.get("monthlyContribution") ?? "",
    targetDate: formData.get("targetDate") || undefined,
    priority: formData.get("priority") || "MEDIUM",
  });
  if (!parsed.success) {
    redirect(`/goals?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check the goal.")}`);
  }
  await prisma.financialGoal.create({
    data: {
      householdId: context.household.id,
      name: parsed.data.name,
      type: parsed.data.type,
      targetMinor: toMinor(parsed.data.targetAmount),
      currentMinor: parseMoney(parsed.data.currentAmount),
      monthlyContributionMinor: parseMoney(parsed.data.monthlyContribution),
      targetDate: parsed.data.targetDate
        ? new Date(parsed.data.targetDate)
        : undefined,
      priority: parsed.data.priority,
    },
  });
  revalidatePath("/goals");
}

export async function saveHomeScenarioAction(formData: FormData) {
  const context = await getActiveHouseholdContext();
  const parsed = homeScenarioSchema.safeParse({
    name: formData.get("name"),
    propertyPrice: formData.get("propertyPrice"),
    downPayment: formData.get("downPayment"),
    currentSavings: formData.get("currentSavings") ?? "",
    annualRatePercent: formData.get("annualRatePercent"),
    termMonths: formData.get("termMonths"),
    propertyTaxAnnual: formData.get("propertyTaxAnnual") ?? "",
    insuranceAnnual: formData.get("insuranceAnnual") ?? "",
    hoaMonthly: formData.get("hoaMonthly") ?? "",
    maintenanceMonthly: formData.get("maintenanceMonthly") ?? "",
    utilitiesMonthly: formData.get("utilitiesMonthly") ?? "",
    closingCost: formData.get("closingCost") ?? "",
    movingCost: formData.get("movingCost") ?? "",
    extraPayment: formData.get("extraPayment") ?? "",
    expectedIncomeChange: formData.get("expectedIncomeChange") ?? "",
    rentMonthly: formData.get("rentMonthly") ?? "",
  });
  if (!parsed.success) {
    redirect(`/house?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please check the home details.")}`);
  }
  const dashboardIncome = await prisma.transaction.aggregate({
    where: {
      householdId: context.household.id,
      type: "INCOME",
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: { amountMinor: true },
  });
  const analysis = analyzeHomePurchase({
    propertyPriceMinor: toMinor(parsed.data.propertyPrice),
    downPaymentMinor: toMinor(parsed.data.downPayment),
    currentSavingsMinor: parseMoney(parsed.data.currentSavings),
    annualRatePercent: parsed.data.annualRatePercent,
    termMonths: parsed.data.termMonths,
    propertyTaxAnnualMinor: parseMoney(parsed.data.propertyTaxAnnual),
    insuranceAnnualMinor: parseMoney(parsed.data.insuranceAnnual),
    hoaMonthlyMinor: parseMoney(parsed.data.hoaMonthly),
    maintenanceMonthlyMinor: parseMoney(parsed.data.maintenanceMonthly),
    utilitiesMonthlyMinor: parseMoney(parsed.data.utilitiesMonthly),
    closingCostMinor: parseMoney(parsed.data.closingCost),
    movingCostMinor: parseMoney(parsed.data.movingCost),
    extraPaymentMinor: parseMoney(parsed.data.extraPayment),
    expectedIncomeChangeMinor: parsed.data.expectedIncomeChange
      ? toMinor(parsed.data.expectedIncomeChange)
      : 0n,
    monthlyIncomeMinor: dashboardIncome._sum.amountMinor ?? 0n,
    monthlySavingsBeforeMinor: 0n,
    monthlyDebtMinor: 0n,
    monthlyEssentialsMinor: 0n,
    emergencyFundMinor: 0n,
  });
  await prisma.homeScenario.create({
    data: {
      householdId: context.household.id,
      name: parsed.data.name,
      propertyPriceMinor: toMinor(parsed.data.propertyPrice),
      downPaymentMinor: toMinor(parsed.data.downPayment),
      currentSavingsMinor: parseMoney(parsed.data.currentSavings),
      annualRatePercent: new Prisma.Decimal(parsed.data.annualRatePercent),
      termMonths: parsed.data.termMonths,
      propertyTaxAnnualMinor: parseMoney(parsed.data.propertyTaxAnnual),
      insuranceAnnualMinor: parseMoney(parsed.data.insuranceAnnual),
      hoaMonthlyMinor: parseMoney(parsed.data.hoaMonthly),
      maintenanceMonthlyMinor: parseMoney(parsed.data.maintenanceMonthly),
      utilitiesMonthlyMinor: parseMoney(parsed.data.utilitiesMonthly),
      closingCostMinor: parseMoney(parsed.data.closingCost),
      movingCostMinor: parseMoney(parsed.data.movingCost),
      extraPaymentMinor: parseMoney(parsed.data.extraPayment),
      expectedIncomeChangeMinor: parseMoney(parsed.data.expectedIncomeChange),
      rentMonthlyMinor: parseMoney(parsed.data.rentMonthly),
      band: analysis.band,
    },
  });
  revalidatePath("/house");
  revalidatePath("/scenarios");
}

export async function updateHouseholdModeAction(
  mode: "INDIVIDUAL" | "COUPLE" | "FAMILY",
): Promise<void> {
  const context = await getActiveHouseholdContext();
  await prisma.household.update({
    where: { id: context.household.id },
    data: { mode },
  });
  revalidatePath("/household");
  revalidatePath("/settings");
}

export async function setHouseholdIndividual(): Promise<void> {
  await updateHouseholdModeAction("INDIVIDUAL");
}

export async function setHouseholdCouple(): Promise<void> {
  await updateHouseholdModeAction("COUPLE");
}

export async function setHouseholdFamily(): Promise<void> {
  await updateHouseholdModeAction("FAMILY");
}

export async function deleteAccountAction() {
  const session = await getSession();
  if (!session) redirect("/login");
  await prisma.$transaction(async (tx) => {
    const memberships = await tx.householdMember.findMany({
      where: { userId: session.user.id, role: "OWNER" },
    });
    for (const membership of memberships) {
      const otherOwners = await tx.householdMember.count({
        where: {
          householdId: membership.householdId,
          role: "OWNER",
          userId: { not: session.user.id },
        },
      });
      if (otherOwners === 0) {
        await tx.household.delete({ where: { id: membership.householdId } });
      }
    }
    await tx.user.delete({ where: { id: session.user.id } });
  });
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function importCsvAction(
  rows: {
    date: string;
    amount: string;
    merchant: string;
    type: "INCOME" | "EXPENSE";
  }[],
): Promise<{ ok: true; count: number } | { error: string }> {
  const context = await getActiveHouseholdContext();
  await prisma.$transaction(
    rows.map((row) =>
      prisma.transaction.create({
        data: {
          householdId: context.household.id,
          type: row.type,
          amountMinor: toMinor(row.amount.replace(/[^0-9.]/g, "")),
          currency: context.household.currency,
          date: new Date(row.date),
          merchant: row.merchant,
          importBatchId: `csv-${Date.now()}`,
        },
      }),
    ),
  );
  revalidatePath("/transactions");
  return { ok: true, count: rows.length };
}
