import Link from "next/link";
import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { JOURNEY, currentJourneyIndex } from "@/lib/journey";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form";

export default async function JourneyPage() {
  const { household } = await getActiveHouseholdContext();
  const earned = await prisma.financialMilestone.findMany({
    where: { householdId: household.id },
  });
  const index = currentJourneyIndex(earned.map((row) => row.key));
  const earnedKeys = new Set(earned.map((row) => row.key));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Your financial journey</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Milestones mark safety and optionality — not a race. There are no
          streaks or leaderboards.
        </p>
      </header>
      <ol className="space-y-4">
        {JOURNEY.map((step, stepIndex) => {
          const done = earnedKeys.has(step.key);
          const current = stepIndex === index;
          return (
            <li key={step.key}>
              <Card className={current ? "border-primary" : ""}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Milestone {stepIndex + 1}
                    </p>
                    <CardTitle>{step.title}</CardTitle>
                    <CardHint>{step.description}</CardHint>
                    {current ? (
                      <p className="mt-3 text-sm font-medium">
                        Next: {step.next}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone={done ? "good" : current ? "info" : "default"}>
                    {done ? "Reached" : current ? "Current" : "Later"}
                  </Badge>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      <p className="text-sm">
        Ready for housing math?{" "}
        <Link className="text-primary" href="/house">
          Open the house planner
        </Link>
      </p>
    </div>
  );
}
