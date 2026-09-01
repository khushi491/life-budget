import Link from "next/link";
import { getActiveHouseholdContext } from "@/lib/session";
import { getDashboardData } from "@/server/queries";
import { formatMoney, formatPercent, monthLabel } from "@/lib/format";
import { CashFlow } from "@/components/flow";
import {
  ChartCard,
  ExpenseDonut,
  IncomeExpenseChart,
} from "@/components/charts";
import { Badge } from "@/components/ui/form";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { fromMinor } from "@/lib/finance";
import { ProgressRing } from "@/components/progress-ring";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view =
    viewParam === "quarter" || viewParam === "year" ? viewParam : "month";
  const { member, household } = await getActiveHouseholdContext();
  const data = await getDashboardData({
    householdId: household.id,
    memberId: member.id,
    role: member.role,
    view,
  });
  const currency = household.currency;
  const now = new Date();
  const spentPct = Math.min(
    100,
    Number((data.expenseMinor * 100n) / (data.incomeMinor || 1n)),
  );

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] bg-zinc-950 px-6 py-7 text-white">
        <p className="text-sm font-medium text-white/70">
          Hello, {member.displayName}
        </p>
        <p className="mt-4 text-sm text-white/70">Current leftover</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">
          {formatMoney(data.remainingMinor, currency)}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
          You earned {formatMoney(data.incomeMinor, currency)}{" "}
          {view === "month" ? "this month" : `this ${view}`}. After{" "}
          {formatMoney(data.expenseMinor - data.savingsMinor, currency)} in
          expenses and {formatMoney(data.savingsMinor, currency)} in savings.
        </p>
        <div className="mt-5 flex gap-2">
          {(["month", "quarter", "year"] as const).map((option) => (
            <Link
              key={option}
              href={`/dashboard?view=${option}`}
              className={`rounded-full px-4 py-1.5 text-sm ${view === option ? "bg-white text-zinc-950" : "bg-white/15 text-white"}`}
            >
              {option}
            </Link>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-mint flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              {formatMoney(data.expenseMinor, currency)}
            </p>
            <p className="mt-1 text-sm font-medium">Spent</p>
          </div>
          <ProgressRing percent={spentPct} />
        </Card>
        <Card className="bg-lavender flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              {formatMoney(data.incomeMinor, currency)}
            </p>
            <p className="mt-1 text-sm font-medium">Earned</p>
          </div>
          <ProgressRing percent={100} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Health", `${data.health.score}`, data.health.summary],
          [
            "Net worth",
            formatMoney(data.netWorthMinor, currency),
            monthLabel(now.getFullYear(), now.getMonth() + 1),
          ],
        ].map(([label, value, hint]) => (
          <Card key={label}>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              {hint}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle>How money moved</CardTitle>
          <CardHint>
            Income flows into required costs, lifestyle, savings, and leftover
            money.
          </CardHint>
          <div className="mt-6">
            <CashFlow
              income={data.incomeMinor}
              steps={data.flow}
              currency={currency}
            />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>What needs my attention?</CardTitle>
          <CardHint>At most three next steps, ordered by urgency.</CardHint>
          <ul className="mt-4 space-y-3">
            {data.insights.length === 0 ? (
              <li className="text-muted-foreground text-sm">
                Nothing urgent. Keep the current plan going.
              </li>
            ) : (
              data.insights.map((insight) => (
                <li key={insight.id} className="bg-muted rounded-full px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        insight.severity === "risk"
                          ? "risk"
                          : insight.severity === "caution"
                            ? "caution"
                            : "info"
                      }
                    >
                      {insight.severity === "risk"
                        ? "Risk"
                        : insight.severity === "caution"
                          ? "Watch"
                          : "Tip"}
                    </Badge>
                    <p className="font-medium">{insight.title}</p>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {insight.what}
                  </p>
                  <Link
                    href={insight.href}
                    className="mt-2 inline-block text-sm font-medium"
                  >
                    {insight.nextStep}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Where spending went"
          explanation="Larger categories are shown first. Tiny ones are grouped as Other so the picture stays readable."
          summary="Donut chart of spending by category for the selected period."
          empty={data.categorySlices.length === 0}
        >
          <ExpenseDonut
            data={data.categorySlices.map((row) => ({
              name: row.name,
              value: fromMinor(row.amountMinor).toNumber(),
            }))}
          />
        </ChartCard>
        <ChartCard
          title="Income versus spending"
          explanation="The last twelve months help you see whether a tight month is a pattern or a one-off."
          summary="Grouped bars comparing monthly income and expenses over the previous 12 months."
        >
          <IncomeExpenseChart
            data={data.incomeExpenseTrend.map((row) => ({
              month: row.month.slice(5),
              income: fromMinor(row.incomeMinor).toNumber(),
              expense: fromMinor(row.expenseMinor).toNumber(),
            }))}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Safety and progress</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              Savings rate{" "}
              {formatPercent(
                Number(data.incomeMinor ? data.savingsMinor : 0n) /
                  Number(data.incomeMinor || 1n),
              )}
            </li>
            <li>
              Emergency fund covers {data.emergencyMonths.toFixed(1)} months
            </li>
            <li>
              Goal progress{" "}
              {data.household.goals[0]
                ? `${formatMoney(data.household.goals[0].currentMinor, currency)} of ${formatMoney(data.household.goals[0].targetMinor, currency)}`
                : "No goals yet"}
            </li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Upcoming bills</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {data.household.recurrenceRules.slice(0, 5).map((bill) => (
              <li
                key={bill.id}
                className="bg-muted flex justify-between rounded-full px-4 py-2"
              >
                <span>{bill.name}</span>
                <span>{formatMoney(bill.amountMinor, currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Recent movements</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentTx.slice(0, 5).map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between gap-3 rounded-full px-1 py-1"
              >
                <span className="truncate">
                  {tx.merchant ?? tx.category?.name ?? tx.type}
                </span>
                <span className="font-medium">
                  {formatMoney(tx.amountMinor, currency)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
