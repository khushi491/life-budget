"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toMinor } from "@/lib/finance";
import { syncMilestones } from "@/lib/milestones";
import { canEditFinances, canManageHousehold } from "@/lib/permissions";
import { bankImportProvider } from "@/lib/providers/bank";
import {
  assetSchema,
  billSchema,
  goalSchema,
  inviteSchema,
  liabilitySchema,
  memberNameSchema,
} from "@/lib/schemas";
import { getActiveHouseholdContext, getSession } from "@/lib/session";

function parseMoney(value: string | undefined, fallback = 0n): bigint {
  if (!value) return fallback;
  return toMinor(value);
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function recordNetWorthSnapshot(householdId: string) {
  const [assets, liabilities] = await Promise.all([
    prisma.asset.findMany({ where: { householdId } }),
    prisma.liability.findMany({ where: { householdId } }),
  ]);
  const assetsMinor = assets.reduce((sum, row) => sum + row.valueMinor, 0n);
  const liabilitiesMinor = liabilities.reduce(
    (sum, row) => sum + row.balanceMinor,
    0n,
  );
  await prisma.netWorthSnapshot.create({
    data: {
      householdId,
      asOf: new Date(),
      assetsMinor,
      liabilitiesMinor,
      netWorthMinor: assetsMinor - liabilitiesMinor,
    },
  });
}

async function afterFinanceChange(householdId: string, ...paths: string[]) {
  for (const path of paths) revalidatePath(path);
  await syncMilestones(householdId);
}

export async function updateGoalPaceAction(formData: FormData): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/goals", "You cannot edit goals.");
  }
  const id = String(formData.get("id") ?? "");
  const monthly = String(formData.get("monthlyContribution") ?? "");
  const parsed = goalSchema
    .pick({ monthlyContribution: true })
    .safeParse({ monthlyContribution: monthly });
  if (!parsed.success || !id) {
    fail("/goals", parsed.error?.issues[0]?.message ?? "Please check the pace.");
  }
  await prisma.financialGoal.updateMany({
    where: { id, householdId: context.household.id },
    data: {
      monthlyContributionMinor: parseMoney(parsed.data.monthlyContribution),
    },
  });
  await afterFinanceChange(context.household.id, "/goals", "/journey");
}

export async function archiveGoalAction(id: string): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/goals", "You cannot edit goals.");
  }
  await prisma.financialGoal.updateMany({
    where: { id, householdId: context.household.id },
    data: { archived: true },
  });
  await afterFinanceChange(context.household.id, "/goals", "/journey");
}

export async function saveLiabilityAction(formData: FormData): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/debts", "You cannot edit debts.");
  }
  const parsed = liabilitySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    interestApr: formData.get("interestApr"),
    minPayment: formData.get("minPayment"),
  });
  if (!parsed.success) {
    fail(
      "/debts",
      parsed.error.issues[0]?.message ?? "Please check this debt.",
    );
  }
  const data = {
    name: parsed.data.name,
    type: parsed.data.type,
    balanceMinor: toMinor(parsed.data.balance),
    interestApr: new Prisma.Decimal(parsed.data.interestApr),
    minPaymentMinor: toMinor(parsed.data.minPayment),
    currency: context.household.currency,
    asOf: new Date(),
  };
  if (parsed.data.id) {
    await prisma.liability.updateMany({
      where: { id: parsed.data.id, householdId: context.household.id },
      data,
    });
  } else {
    await prisma.liability.create({
      data: { ...data, householdId: context.household.id },
    });
  }
  await recordNetWorthSnapshot(context.household.id);
  await afterFinanceChange(
    context.household.id,
    "/debts",
    "/net-worth",
    "/dashboard",
    "/journey",
  );
}

export async function deleteLiabilityAction(id: string): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/debts", "You cannot edit debts.");
  }
  await prisma.liability.deleteMany({
    where: { id, householdId: context.household.id },
  });
  await recordNetWorthSnapshot(context.household.id);
  await afterFinanceChange(
    context.household.id,
    "/debts",
    "/net-worth",
    "/dashboard",
    "/journey",
  );
}

export async function saveAssetAction(formData: FormData): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/net-worth", "You cannot edit assets.");
  }
  const parsed = assetSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    fail(
      "/net-worth",
      parsed.error.issues[0]?.message ?? "Please check this asset.",
    );
  }
  const data = {
    name: parsed.data.name,
    type: parsed.data.type,
    valueMinor: toMinor(parsed.data.value),
    currency: context.household.currency,
    asOf: new Date(),
  };
  if (parsed.data.id) {
    await prisma.asset.updateMany({
      where: { id: parsed.data.id, householdId: context.household.id },
      data,
    });
  } else {
    await prisma.asset.create({
      data: { ...data, householdId: context.household.id },
    });
  }
  await recordNetWorthSnapshot(context.household.id);
  await afterFinanceChange(
    context.household.id,
    "/net-worth",
    "/dashboard",
    "/journey",
  );
}

export async function deleteAssetAction(id: string): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/net-worth", "You cannot edit assets.");
  }
  await prisma.asset.deleteMany({
    where: { id, householdId: context.household.id },
  });
  await recordNetWorthSnapshot(context.household.id);
  await afterFinanceChange(
    context.household.id,
    "/net-worth",
    "/dashboard",
    "/journey",
  );
}

export async function saveBillAction(formData: FormData): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/bills", "You cannot edit bills.");
  }
  const parsed = billSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
    categoryId: formData.get("categoryId") || undefined,
    nextRunOn: formData.get("nextRunOn"),
  });
  if (!parsed.success) {
    fail("/bills", parsed.error.issues[0]?.message ?? "Please check this bill.");
  }
  const account = await prisma.financialAccount.findFirst({
    where: { householdId: context.household.id },
  });
  const data = {
    name: parsed.data.name,
    type: "EXPENSE" as const,
    amountMinor: toMinor(parsed.data.amount),
    currency: context.household.currency,
    frequency: parsed.data.frequency,
    nextRunOn: parseDateInput(parsed.data.nextRunOn),
    merchant: parsed.data.name,
    categoryId: parsed.data.categoryId,
    accountId: account?.id,
    paidByMemberId: context.member.id,
    active: true,
  };
  if (parsed.data.id) {
    await prisma.recurrenceRule.updateMany({
      where: { id: parsed.data.id, householdId: context.household.id },
      data,
    });
  } else {
    await prisma.recurrenceRule.create({
      data: { ...data, householdId: context.household.id },
    });
  }
  await afterFinanceChange(context.household.id, "/bills", "/dashboard");
}

export async function deactivateBillAction(id: string): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/bills", "You cannot edit bills.");
  }
  await prisma.recurrenceRule.updateMany({
    where: { id, householdId: context.household.id },
    data: { active: false },
  });
  await afterFinanceChange(context.household.id, "/bills", "/dashboard");
}

export async function addHouseholdMemberAction(
  formData: FormData,
): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canManageHousehold(context.member.role)) {
    fail("/household", "You cannot add people to this household.");
  }
  const parsed = memberNameSchema.safeParse({
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    isDependent: formData.get("isDependent") === "on",
  });
  if (!parsed.success) {
    fail(
      "/household",
      parsed.error.issues[0]?.message ?? "Please check this person.",
    );
  }
  await prisma.householdMember.create({
    data: {
      householdId: context.household.id,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      isDependent: parsed.data.isDependent ?? parsed.data.role === "DEPENDENT",
    },
  });
  revalidatePath("/household");
}

export async function createInvitationAction(formData: FormData): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canManageHousehold(context.member.role)) {
    fail("/household", "You cannot invite people to this household.");
  }
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    fail(
      "/household",
      parsed.error.issues[0]?.message ?? "Please check the invite.",
    );
  }
  const email = parsed.data.email.trim().toLowerCase();
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const existing = await prisma.invitation.findFirst({
    where: {
      householdId: context.household.id,
      email,
      status: "PENDING",
    },
  });
  if (existing) {
    await prisma.invitation.update({
      where: { id: existing.id },
      data: { token, expiresAt, role: parsed.data.role },
    });
  } else {
    await prisma.invitation.create({
      data: {
        householdId: context.household.id,
        email,
        role: parsed.data.role,
        token,
        expiresAt,
        invitedById: context.session.user.id,
      },
    });
  }
  revalidatePath("/household");
}

export async function revokeInvitationAction(id: string): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canManageHousehold(context.member.role)) {
    fail("/household", "You cannot manage invitations.");
  }
  await prisma.invitation.updateMany({
    where: { id, householdId: context.household.id, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  revalidatePath("/household");
}

export async function acceptInvitationAction(token: string): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect(
      `/login?error=${encodeURIComponent("Sign in with the invited email to join this household.")}`,
    );
  }
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });
  if (!invitation || invitation.status !== "PENDING") {
    redirect(
      `/invite/${token}?error=${encodeURIComponent("This invite is no longer valid.")}`,
    );
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    redirect(
      `/invite/${token}?error=${encodeURIComponent("This invite has expired.")}`,
    );
  }
  if (session.user.email.trim().toLowerCase() !== invitation.email.toLowerCase()) {
    redirect(
      `/invite/${token}?error=${encodeURIComponent("Sign in with the email this invite was sent to.")}`,
    );
  }

  const already = await prisma.householdMember.findFirst({
    where: {
      householdId: invitation.householdId,
      userId: session.user.id,
      status: "ACTIVE",
    },
  });
  if (already) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    redirect("/dashboard");
  }

  const other = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      household: {
        include: {
          _count: { select: { members: true, transactions: true } },
        },
      },
    },
  });

  if (
    other &&
    other.household.onboardingComplete &&
    other.householdId !== invitation.householdId
  ) {
    redirect(
      `/invite/${token}?error=${encodeURIComponent("You already belong to another household.")}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    if (
      other &&
      !other.household.onboardingComplete &&
      other.household._count.members === 1 &&
      other.householdId !== invitation.householdId
    ) {
      await tx.household.delete({ where: { id: other.householdId } });
    }
    await tx.householdMember.create({
      data: {
        householdId: invitation.householdId,
        userId: session.user.id,
        displayName: session.user.name,
        role: invitation.role,
        status: "ACTIVE",
        isDependent: invitation.role === "DEPENDENT",
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
  });
  redirect("/dashboard");
}

export async function importBankDemoAction(): Promise<void> {
  const context = await getActiveHouseholdContext();
  if (!canEditFinances(context.member.role)) {
    fail("/transactions", "You cannot import transactions.");
  }
  const account = await prisma.financialAccount.findFirst({
    where: { householdId: context.household.id },
  });
  const categories = await prisma.category.findMany({
    where: { householdId: context.household.id },
    select: { id: true, name: true },
  });
  const paycheckId = categories.find((row) => row.name === "Paycheck")?.id;
  const groceryId = categories.find((row) => row.name === "Groceries")?.id;
  const rows = await bankImportProvider.importRecent("demo-checking");
  for (const row of rows) {
    const exists = await prisma.transaction.findFirst({
      where: {
        householdId: context.household.id,
        importBatchId: row.externalId,
      },
    });
    if (exists) continue;
    const expense = row.amountMinor < 0n;
    await prisma.transaction.create({
      data: {
        householdId: context.household.id,
        type: expense ? "EXPENSE" : "INCOME",
        amountMinor: expense ? -row.amountMinor : row.amountMinor,
        currency: context.household.currency,
        date: new Date(row.date),
        merchant: row.merchant,
        description: row.description,
        categoryId: expense ? groceryId : paycheckId,
        accountId: account?.id,
        paidByMemberId: context.member.id,
        importBatchId: row.externalId,
      },
    });
  }
  await afterFinanceChange(
    context.household.id,
    "/transactions",
    "/dashboard",
    "/income",
  );
}
