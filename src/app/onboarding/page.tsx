import { OnboardingWizard } from "@/components/onboarding-wizard";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await requireSession();
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    include: { household: true },
  });
  const draft =
    (member?.household.onboardingDraft as Record<string, unknown> | null) ??
    undefined;
  return <OnboardingWizard initial={draft} userName={session.user.name} />;
}
