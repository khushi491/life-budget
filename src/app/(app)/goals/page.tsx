import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatMoney, formatMonths } from "@/lib/format";
import { monthsToGoal, requiredMonthlyContribution } from "@/lib/finance";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { GoalSimulator } from "@/components/goal-simulator";
import { saveGoalAction } from "@/server/actions";
import { archiveGoalAction } from "@/server/finance-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { household } = await getActiveHouseholdContext();
  const goals = await prisma.financialGoal.findMany({
    where: { householdId: household.id, archived: false },
    orderBy: { priority: "asc" },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="text-muted-foreground mt-2">
          Each goal has a target, a pace, and a date. Adjust the contribution to
          see a new finish line immediately.
        </p>
        {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        {goals.map((goal) => {
          const estimate = monthsToGoal({
            currentMinor: goal.currentMinor,
            targetMinor: goal.targetMinor,
            monthlyContributionMinor: goal.monthlyContributionMinor,
          });
          const needed = goal.targetDate
            ? requiredMonthlyContribution({
                currentMinor: goal.currentMinor,
                targetMinor: goal.targetMinor,
                months: Math.max(
                  1,
                  (goal.targetDate.getFullYear() - new Date().getFullYear()) *
                    12 +
                    (goal.targetDate.getMonth() - new Date().getMonth()),
                ),
              })
            : goal.monthlyContributionMinor;
          const pct =
            goal.targetMinor === 0n
              ? 0
              : Math.min(
                  100,
                  Number((goal.currentMinor * 100n) / goal.targetMinor),
                );
          return (
            <Card key={goal.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{goal.name}</CardTitle>
                  <CardHint>
                    {formatMoney(goal.currentMinor, household.currency)} of{" "}
                    {formatMoney(goal.targetMinor, household.currency)}
                  </CardHint>
                </div>
                <ConfirmButton
                  message="Remove this goal from the active list?"
                  action={archiveGoalAction.bind(null, goal.id)}
                >
                  Remove
                </ConfirmButton>
              </div>
              <div className="bg-muted mt-4 h-3 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                At the current pace: {formatMonths(estimate.months)}.
                Recommended monthly: {formatMoney(needed, household.currency)}.
              </p>
              <GoalSimulator
                goalId={goal.id}
                currency={household.currency}
                currentMinor={goal.currentMinor.toString()}
                targetMinor={goal.targetMinor.toString()}
                monthlyMinor={goal.monthlyContributionMinor.toString()}
              />
            </Card>
          );
        })}
      </div>
      <Card>
        <CardTitle>Add a goal</CardTitle>
        <form action={saveGoalAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              className="h-12 w-full rounded-full border px-5"
            >
              <option value="EMERGENCY_FUND">Emergency fund</option>
              <option value="HOUSE_DOWN_PAYMENT">House down payment</option>
              <option value="CAR">Car</option>
              <option value="VACATION">Vacation</option>
              <option value="WEDDING">Wedding</option>
              <option value="EDUCATION">Education</option>
              <option value="RETIREMENT">Retirement</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <Label htmlFor="targetAmount">Target</Label>
            <Input id="targetAmount" name="targetAmount" required />
          </div>
          <div>
            <Label htmlFor="currentAmount">Already saved</Label>
            <Input id="currentAmount" name="currentAmount" />
          </div>
          <div>
            <Label htmlFor="monthlyContribution">Monthly contribution</Label>
            <Input id="monthlyContribution" name="monthlyContribution" />
          </div>
          <div>
            <Label htmlFor="targetDate">Target date</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save goal</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
