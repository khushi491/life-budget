import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { fromMinor, orderAvalanche, orderSnowball, simulatePayoff, toMinor } from "@/lib/finance";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";
import {
  deleteLiabilityAction,
  saveLiabilityAction,
} from "@/server/finance-actions";

const LIABILITY_TYPES = [
  ["CREDIT_CARD", "Credit card"],
  ["STUDENT_LOAN", "Student loan"],
  ["CAR_LOAN", "Car loan"],
  ["MORTGAGE", "Mortgage"],
  ["PERSONAL_LOAN", "Personal loan"],
  ["OTHER", "Other"],
] as const;

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ extra?: string; error?: string }>;
}) {
  const params = await searchParams;
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
  const minTotal = debts.reduce((sum, row) => sum + row.minPaymentMinor, 0n);
  const defaultExtra = minTotal > 0n ? minTotal / 5n : 0n;
  let extra = defaultExtra;
  if (params.extra && /^\d+(?:\.\d{1,2})?$/.test(params.extra)) {
    extra = toMinor(params.extra);
  }
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
        {params.error ? (
          <p className="text-destructive mt-3 text-sm">{params.error}</p>
        ) : null}
      </header>
      <Card>
        <CardTitle>Extra payment</CardTitle>
        <CardHint>
          Recalculate both payoff plans with money you can send beyond the
          minimums.
        </CardHint>
        <form className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="extra">Extra each month</Label>
            <Input
              id="extra"
              name="extra"
              defaultValue={fromMinor(extra).toFixed(2)}
            />
          </div>
          <Button type="submit" variant="outline">
            Recalculate
          </Button>
        </form>
      </Card>
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
      <div className="space-y-4">
        {debts.map((row) => (
          <Card key={row.id}>
            <form
              action={saveLiabilityAction}
              className="grid gap-4 md:grid-cols-2"
            >
              <input type="hidden" name="id" value={row.id} />
              <div>
                <Label htmlFor={`name-${row.id}`}>Name</Label>
                <Input
                  id={`name-${row.id}`}
                  name="name"
                  defaultValue={row.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`type-${row.id}`}>Type</Label>
                <select
                  id={`type-${row.id}`}
                  name="type"
                  defaultValue={row.type}
                  className="h-11 w-full rounded-2xl border px-3"
                >
                  {LIABILITY_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor={`balance-${row.id}`}>Balance</Label>
                <Input
                  id={`balance-${row.id}`}
                  name="balance"
                  defaultValue={fromMinor(row.balanceMinor).toFixed(2)}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`apr-${row.id}`}>Interest rate</Label>
                <Input
                  id={`apr-${row.id}`}
                  name="interestApr"
                  defaultValue={row.interestApr.toString()}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`min-${row.id}`}>Minimum payment</Label>
                <Input
                  id={`min-${row.id}`}
                  name="minPayment"
                  defaultValue={fromMinor(row.minPaymentMinor).toFixed(2)}
                  required
                />
              </div>
              <div className="flex items-end gap-3">
                <Button type="submit">Save changes</Button>
                <ConfirmButton
                  message="Delete this debt?"
                  action={deleteLiabilityAction.bind(null, row.id)}
                >
                  Delete
                </ConfirmButton>
              </div>
            </form>
          </Card>
        ))}
      </div>
      <Card>
        <CardTitle>Add a debt</CardTitle>
        <form
          action={saveLiabilityAction}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              className="h-11 w-full rounded-2xl border px-3"
              defaultValue="CREDIT_CARD"
            >
              {LIABILITY_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="balance">Balance</Label>
            <Input id="balance" name="balance" required />
          </div>
          <div>
            <Label htmlFor="interestApr">Interest rate</Label>
            <Input
              id="interestApr"
              name="interestApr"
              defaultValue="15"
              required
            />
          </div>
          <div>
            <Label htmlFor="minPayment">Minimum payment</Label>
            <Input id="minPayment" name="minPayment" required />
          </div>
          <div className="flex items-end">
            <Button type="submit">Add debt</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
