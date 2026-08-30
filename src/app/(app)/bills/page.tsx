import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { Card, CardHint, CardTitle } from "@/components/ui/card";

export default async function BillsPage() {
  const { household } = await getActiveHouseholdContext();
  const bills = await prisma.recurrenceRule.findMany({
    where: { householdId: household.id, active: true },
    include: { category: true },
    orderBy: { nextRunOn: "asc" },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Recurring bills</h1>
        <p className="text-muted-foreground mt-2">
          These are the must-pays we expect to see again next cycle.
        </p>
      </header>
      <Card>
        <CardTitle>Coming up</CardTitle>
        <CardHint>
          Amounts come from your recurrence rules, not from a hardcoded
          calendar.
        </CardHint>
        <ul className="divide-border mt-4 divide-y">
          {bills.map((bill) => (
            <li
              key={bill.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <p className="font-medium">{bill.name}</p>
                <p className="text-muted-foreground">
                  {bill.frequency.toLowerCase()} · next{" "}
                  {formatDate(bill.nextRunOn)} · {bill.category?.name}
                </p>
              </div>
              <p>{formatMoney(bill.amountMinor, household.currency)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
