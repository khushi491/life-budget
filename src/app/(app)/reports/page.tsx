import Link from "next/link";
import { getActiveHouseholdContext } from "@/lib/session";
import { getDashboardData, type PeriodView } from "@/server/queries";
import { formatMoney } from "@/lib/format";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { CashFlow } from "@/components/flow";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view: PeriodView =
    viewParam === "month" || viewParam === "quarter" ? viewParam : "year";
  const { household, member } = await getActiveHouseholdContext();
  const data = await getDashboardData({
    householdId: household.id,
    memberId: member.id,
    role: member.role,
    view,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-muted-foreground mt-2">
          The same numbers used on the dashboard, grouped by period.
        </p>
        <div className="mt-4 flex gap-2">
          {(["month", "quarter", "year"] as const).map((option) => (
            <Link
              key={option}
              href={`/reports?view=${option}`}
              className={`rounded-full px-3 py-1 text-sm ${view === option ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {option}
            </Link>
          ))}
        </div>
      </header>
      <Card>
        <CardTitle>
          {view === "year"
            ? "Year-to-date"
            : view === "quarter"
              ? "This quarter"
              : "This month"}{" "}
          cash flow
        </CardTitle>
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
        <CardTitle>Insights this period</CardTitle>
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
