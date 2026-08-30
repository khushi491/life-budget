import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthorizationError } from "@/lib/permissions";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getActiveHouseholdContext() {
  const session = await requireSession();
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { household: true },
    orderBy: { createdAt: "asc" },
  });
  if (!member) {
    redirect("/onboarding");
  }
  return { session, member, household: member.household };
}

export async function requireHousehold(householdId: string) {
  const context = await getActiveHouseholdContext();
  if (context.household.id !== householdId) {
    throw new AuthorizationError();
  }
  return context;
}
