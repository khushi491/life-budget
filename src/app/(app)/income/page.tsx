import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { Card, CardHint, CardTitle } from "@/components/ui/card";

export default async function IncomePage() {
  const { household } = await getActiveHouseholdContext();
  const rows = await prisma.transaction.findMany({
    where: { householdId: household.id, type: "INCOME" },
    include: { paidBy: true, category: true },
    orderBy: { date: "desc" },
    take: 40,
  });
  const total = rows.reduce((sum, row) => sum + row.amountMinor, 0n);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Income</h1>
        <p className="text-muted-foreground mt-2">
          Take-home pay, bonuses, and other money entering the household.
        </p>
      </header>
      <Card>
        <CardTitle>Recent income</CardTitle>
        <CardHint>
          Showing the latest {rows.length} income movements ·{" "}
          {formatMoney(total, household.currency)} listed
        </CardHint>
        <ul className="divide-border mt-4 divide-y">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {row.merchant ?? row.description ?? "Income"}
                </p>
                <p className="text-muted-foreground">
                  {formatDate(row.date)} ·{" "}
                  {row.paidBy?.displayName ?? "Household"}
                </p>
              </div>
              <p className="font-semibold">
                {formatMoney(row.amountMinor, household.currency)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
