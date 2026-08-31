import { OnboardingWizard } from "@/components/onboarding-wizard";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await requireSession();
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { household: true },
  });
  if (member?.household.onboardingComplete) {
    redirect("/dashboard");
  }
  const draft =
    (member?.household.onboardingDraft as Record<string, unknown> | null) ??
    undefined;
  const storedStep = member?.household.onboardingStep ?? 0;
  const initialStep = Math.min(12, Math.max(0, storedStep));
  return (
    <OnboardingWizard
      initial={draft}
      initialStep={initialStep}
      userName={session.user.name}
    />
  );
}
