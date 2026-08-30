import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { orderAvalanche, orderSnowball, simulatePayoff } from "@/lib/finance";
import { Card, CardHint, CardTitle } from "@/components/ui/card";

export default async function DebtsPage() {
  const { household } = await getActiveHouseholdContext();
  const debts = await prisma.liability.findMany({
    where: { householdId: household.id },
  });
  const mapped = debts.map((row) => ({
    id: row.id,
    name: row.name,
    balanceMinor: row.balanceMinor,
    interestApr: row.interestApr.toString(),
    minPaymentMinor: row.minPaymentMinor,
  }));
  const extra =
    debts.reduce((sum, row) => sum + row.minPaymentMinor, 0n) / 5n || 1n;
  const snowball = simulatePayoff(mapped, extra, "snowball");
  const avalanche = simulatePayoff(mapped, extra, "avalanche");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Debts</h1>
        <p className="text-muted-foreground mt-2">
          Snowball pays the smallest balance first for momentum. Avalanche pays
          the highest interest first to save money.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Snowball order</CardTitle>
          <CardHint>
            About {snowball.months} months with a{" "}
            {formatMoney(extra, household.currency)} extra payment. Interest{" "}
            {formatMoney(snowball.totalInterestMinor, household.currency)}.
          </CardHint>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            {orderSnowball(mapped).map((row) => (
              <li key={row.id}>
                {row.name} · {formatMoney(row.balanceMinor, household.currency)}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle>Avalanche order</CardTitle>
          <CardHint>
            About {avalanche.months} months with the same extra. Interest{" "}
            {formatMoney(avalanche.totalInterestMinor, household.currency)}.
          </CardHint>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            {orderAvalanche(mapped).map((row) => (
              <li key={row.id}>
                {row.name} · {String(row.interestApr)}% APR
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <Card>
        <CardTitle>Balances</CardTitle>
        <ul className="mt-4 space-y-2 text-sm">
          {debts.map((row) => (
            <li key={row.id} className="flex justify-between">
              <span>
                {row.name}
                <span className="text-muted-foreground">
                  {" "}
                  · min {formatMoney(row.minPaymentMinor, household.currency)}
                </span>
              </span>
              <span className="font-medium">
                {formatMoney(row.balanceMinor, household.currency)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
