import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { ChartCard, ExpenseDonut, NetWorthChart } from "@/components/charts";
import { fromMinor } from "@/lib/finance";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";
import {
  deleteAssetAction,
  deleteLiabilityAction,
  saveAssetAction,
} from "@/server/finance-actions";

const ASSET_TYPES = [
  ["CASH", "Cash"],
  ["BANK", "Bank"],
  ["INVESTMENT", "Investment"],
  ["RETIREMENT", "Retirement"],
  ["PROPERTY", "Property"],
  ["VEHICLE", "Vehicle"],
  ["OTHER", "Other"],
] as const;

export default async function NetWorthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
        <h1 className="text-3xl font-bold">Net worth</h1>
        <p className="mt-2 text-2xl font-semibold">
          {formatMoney(assetsMinor - liabilitiesMinor, household.currency)}
        </p>
        {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
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
          <ul className="mt-4 space-y-4 text-sm">
            {assets.map((row) => (
              <li key={row.id}>
                <form
                  action={saveAssetAction}
                  className="grid gap-2 md:grid-cols-[1fr_8rem_8rem_auto]"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <Input name="name" defaultValue={row.name} required />
                  <select
                    name="type"
                    defaultValue={row.type}
                    className="h-12 rounded-full border px-5"
                  >
                    {ASSET_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Input
                    name="value"
                    defaultValue={fromMinor(row.valueMinor).toFixed(2)}
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                    <ConfirmButton
                      message="Delete this asset?"
                      action={deleteAssetAction.bind(null, row.id)}
                    >
                      Delete
                    </ConfirmButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
          <form action={saveAssetAction} className="mt-6 grid gap-3">
            <Label htmlFor="asset-name">Add an asset</Label>
            <Input id="asset-name" name="name" placeholder="Name" required />
            <select
              name="type"
              className="h-12 rounded-full border px-5"
              defaultValue="CASH"
            >
              {ASSET_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Input name="value" placeholder="Value" required />
            <Button type="submit">Add asset</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Liabilities</CardTitle>
          <ul className="mt-4 space-y-3 text-sm">
            {liabilities.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span>
                  {row.name}
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatMoney(row.balanceMinor, household.currency)}
                  </span>
                </span>
                <ConfirmButton
                  message="Delete this debt from net worth?"
                  action={deleteLiabilityAction.bind(null, row.id)}
                >
                  Delete
                </ConfirmButton>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 text-sm">
            Add or edit balances on the Debts page.
          </p>
        </Card>
      </div>
    </div>
  );
}
