import { AppShell } from "@/components/app-shell";
import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { syncMilestones } from "@/lib/milestones";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, household } = await getActiveHouseholdContext();
  if (!household.onboardingComplete) {
    redirect("/onboarding");
  }
  await syncMilestones(household.id);
  const categories = await prisma.category.findMany({
    where: { householdId: household.id },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <AppShell
      householdName={household.name}
      userName={session.user.name}
      categories={categories}
    >
      {children}
    </AppShell>
  );
}
