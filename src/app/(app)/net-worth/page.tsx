import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { ChartCard, ExpenseDonut, NetWorthChart } from "@/components/charts";
import { fromMinor } from "@/lib/finance";
import { Card, CardTitle } from "@/components/ui/card";

export default async function NetWorthPage() {
  const { household } = await getActiveHouseholdContext();
  const [assets, liabilities, snapshots] = await Promise.all([
    prisma.asset.findMany({ where: { householdId: household.id } }),
    prisma.liability.findMany({ where: { householdId: household.id } }),
    prisma.netWorthSnapshot.findMany({
      where: { householdId: household.id },
      orderBy: { asOf: "asc" },
    }),
  ]);
  const assetsMinor = assets.reduce((sum, row) => sum + row.valueMinor, 0n);
  const liabilitiesMinor = liabilities.reduce(
    (sum, row) => sum + row.balanceMinor,
    0n,
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Net worth</h1>
        <p className="mt-2 text-2xl font-semibold">
          {formatMoney(assetsMinor - liabilitiesMinor, household.currency)}
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Net worth over the last year"
          explanation="Snapshots combine accounts, investments, and debts. The line should match the table below."
          summary="Line chart of household net worth history."
        >
          <NetWorthChart
            data={snapshots.map((row) => ({
              month: row.asOf.toISOString().slice(0, 7),
              value: fromMinor(row.netWorthMinor).toNumber(),
            }))}
          />
        </ChartCard>
        <ChartCard
          title="Assets versus liabilities"
          explanation="What you own compared with what you owe, grouped by type."
          summary="Donut of assets and liabilities."
        >
          <ExpenseDonut
            data={[
              { name: "Assets", value: fromMinor(assetsMinor).toNumber() },
              {
                name: "Liabilities",
                value: fromMinor(liabilitiesMinor).toNumber(),
              },
            ]}
          />
        </ChartCard>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Assets</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {assets.map((row) => (
              <li key={row.id} className="flex justify-between">
                <span>{row.name}</span>
                <span>{formatMoney(row.valueMinor, household.currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Liabilities</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {liabilities.map((row) => (
              <li key={row.id} className="flex justify-between">
                <span>{row.name}</span>
                <span>{formatMoney(row.balanceMinor, household.currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
