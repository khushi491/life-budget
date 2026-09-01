import { getActiveHouseholdContext } from "@/lib/session";
import { getDashboardData } from "@/server/queries";
import { Simulator } from "@/components/simulator";

export default async function SimulatorPage() {
  const { household, member } = await getActiveHouseholdContext();
  const dashboard = await getDashboardData({
    householdId: household.id,
    memberId: member.id,
    role: member.role,
    view: "month",
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">What-if simulator</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Move the sliders. Charts update from the same formulas the house
          planner uses. Presets are starting points, not advice.
        </p>
      </header>
      <Simulator
        currency={household.currency}
        income={Number(dashboard.incomeMinor) / 100}
        spending={Number(dashboard.expenseMinor) / 100}
        savings={Number(dashboard.savingsMinor) / 100}
        netWorth={Number(dashboard.netWorthMinor) / 100}
      />
    </div>
  );
}
