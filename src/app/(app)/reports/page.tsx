import { getActiveHouseholdContext } from "@/lib/session";
import { getDashboardData } from "@/server/queries";
import { formatMoney } from "@/lib/format";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { CashFlow } from "@/components/flow";

export default async function ReportsPage() {
  const { household, member } = await getActiveHouseholdContext();
  const data = await getDashboardData({
    householdId: household.id,
    memberId: member.id,
    role: member.role,
    view: "year",
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-muted-foreground mt-2">
          A year-to-date reading of the same numbers used on the dashboard.
        </p>
      </header>
      <Card>
        <CardTitle>Year-to-date cash flow</CardTitle>
        <CardHint>
          Income {formatMoney(data.incomeMinor, household.currency)} · spending{" "}
          {formatMoney(data.expenseMinor, household.currency)}
        </CardHint>
        <div className="mt-6">
          <CashFlow
            income={data.incomeMinor}
            steps={data.flow}
            currency={household.currency}
          />
        </div>
      </Card>
      <Card>
        <CardTitle>Insights this year</CardTitle>
        <ul className="mt-4 space-y-3">
          {data.allInsights.map((insight) => (
            <li key={insight.id}>
              <p className="font-medium">{insight.title}</p>
              <p className="text-muted-foreground text-sm">{insight.why}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
