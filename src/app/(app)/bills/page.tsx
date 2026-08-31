import { format } from "date-fns";
import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { fromMinor } from "@/lib/finance";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";
import {
  deactivateBillAction,
  saveBillAction,
} from "@/server/finance-actions";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { household } = await getActiveHouseholdContext();
  const [bills, categories] = await Promise.all([
    prisma.recurrenceRule.findMany({
      where: { householdId: household.id, active: true },
      include: { category: true },
      orderBy: { nextRunOn: "asc" },
    }),
    prisma.category.findMany({
      where: { householdId: household.id },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Recurring bills</h1>
        <p className="text-muted-foreground mt-2">
          These are the must-pays we expect to see again next cycle.
        </p>
        {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
      </header>
      <Card>
        <CardTitle>Coming up</CardTitle>
        <CardHint>
          Amounts come from your recurrence rules, not from a hardcoded
          calendar.
        </CardHint>
        <ul className="divide-border mt-4 divide-y">
          {bills.map((bill) => (
            <li key={bill.id} className="py-4">
              <form
                action={saveBillAction}
                className="grid gap-3 md:grid-cols-2 lg:grid-cols-6"
              >
                <input type="hidden" name="id" value={bill.id} />
                <div className="lg:col-span-2">
                  <Label htmlFor={`bill-name-${bill.id}`}>Name</Label>
                  <Input
                    id={`bill-name-${bill.id}`}
                    name="name"
                    defaultValue={bill.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`bill-amount-${bill.id}`}>Amount</Label>
                  <Input
                    id={`bill-amount-${bill.id}`}
                    name="amount"
                    defaultValue={fromMinor(bill.amountMinor).toFixed(2)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`bill-freq-${bill.id}`}>Frequency</Label>
                  <select
                    id={`bill-freq-${bill.id}`}
                    name="frequency"
                    defaultValue={bill.frequency}
                    className="h-11 w-full rounded-2xl border px-3"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Every two weeks</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor={`bill-next-${bill.id}`}>Next date</Label>
                  <Input
                    id={`bill-next-${bill.id}`}
                    name="nextRunOn"
                    type="date"
                    defaultValue={format(bill.nextRunOn, "yyyy-MM-dd")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`bill-cat-${bill.id}`}>Category</Label>
                  <select
                    id={`bill-cat-${bill.id}`}
                    name="categoryId"
                    defaultValue={bill.categoryId ?? ""}
                    className="h-11 w-full rounded-2xl border px-3"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 lg:col-span-6">
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                  <ConfirmButton
                    message="Stop tracking this bill?"
                    action={deactivateBillAction.bind(null, bill.id)}
                  >
                    Deactivate
                  </ConfirmButton>
                </div>
              </form>
              <p className="text-muted-foreground mt-2 text-sm">
                {formatMoney(bill.amountMinor, household.currency)} · next{" "}
                {formatDate(bill.nextRunOn)} · {bill.category?.name ?? "No category"}
              </p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Add a bill</CardTitle>
        <form action={saveBillAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" required />
          </div>
          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              name="frequency"
              className="h-11 w-full rounded-2xl border px-3"
              defaultValue="MONTHLY"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Every two weeks</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <Label htmlFor="nextRunOn">Next date</Label>
            <Input id="nextRunOn" name="nextRunOn" type="date" required />
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              className="h-11 w-full rounded-2xl border px-3"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit">Add bill</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
