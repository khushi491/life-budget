"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { saveBudgetAction } from "@/server/actions";
import { formatMoney } from "@/lib/format";
import { toMinor } from "@/lib/finance";
import type { CurrencyCode } from "@/lib/finance";

const STEPS = [
  "Confirm expected income",
  "Required bills",
  "Essential spending",
  "Lifestyle spending",
  "Savings",
  "Debt payments",
  "Review leftover",
  "Confirm",
];

const GROUPS = [
  ["HOUSING", "DEBT"],
  ["ESSENTIAL"],
  ["LIFESTYLE"],
  ["SAVINGS"],
  ["DEBT"],
] as const;

export function BudgetBuilder({
  currency,
  categories,
  incomeMinor,
  limits,
  year,
  month,
}: {
  currency: CurrencyCode;
  categories: { id: string; name: string; group: string }[];
  incomeMinor: string;
  limits: Record<string, string>;
  year: number;
  month: number;
}) {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(incomeMinor);
  const [values, setValues] = useState<Record<string, string>>(limits);

  const allocated = useMemo(
    () =>
      Object.values(values).reduce(
        (sum, value) => sum + BigInt(value || "0"),
        0n,
      ),
    [values],
  );
  const incomeValue = BigInt(income || "0");
  const remaining = incomeValue - allocated;

  async function confirm() {
    const result = await saveBudgetAction({
      year,
      month,
      incomeMinor: income,
      warningPct: 80,
      rollover: false,
      categories: Object.entries(values)
        .filter(([, value]) => value && value !== "0")
        .map(([categoryId, limitMinor]) => ({ categoryId, limitMinor })),
    });
    if (result.error) toast.error(result.error);
    else toast.success("Budget saved.");
  }

  return (
    <div className="border-border bg-card rounded-3xl border p-6">
      <p className="text-muted-foreground text-sm">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>
      <div className="bg-muted mt-4 h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          {step === 0 ? (
            <div>
              <Label htmlFor="income">Expected take-home this month</Label>
              <Input
                id="income"
                value={String(Number(income) / 100)}
                onChange={(event) =>
                  setIncome(toMinor(event.target.value || "0").toString())
                }
              />
            </div>
          ) : null}
          {step >= 1 && step <= 5
            ? categories
                .filter((category) =>
                  GROUPS[step - 1]?.includes(category.group as never),
                )
                .map((category) => (
                  <div key={category.id}>
                    <Label htmlFor={category.id}>{category.name}</Label>
                    <Input
                      id={category.id}
                      defaultValue={
                        values[category.id]
                          ? String(Number(values[category.id]) / 100)
                          : ""
                      }
                      onBlur={(event) =>
                        setValues((current) => ({
                          ...current,
                          [category.id]: toMinor(
                            event.target.value || "0",
                          ).toString(),
                        }))
                      }
                    />
                  </div>
                ))
            : null}
          {step >= 6 ? (
            <div>
              <p className="text-lg font-medium">
                {remaining >= 0n
                  ? `${formatMoney(remaining, currency)} would remain unallocated.`
                  : `This plan is over income by ${formatMoney(-remaining, currency)}.`}
              </p>
              {remaining < 0n ? (
                <p className="text-destructive mt-2 text-sm">
                  Reduce a category before confirming.
                </p>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">
                  Leftover can stay flexible or move into savings on the next
                  pass.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <aside className="bg-muted rounded-2xl p-4 text-sm">
          <p>Income {formatMoney(incomeValue, currency)}</p>
          <p className="mt-1">Allocated {formatMoney(allocated, currency)}</p>
          <p className="mt-1">Remaining {formatMoney(remaining, currency)}</p>
        </aside>
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <Button
            variant="outline"
            onClick={() => setStep((value) => value - 1)}
          >
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((value) => value + 1)}>
            Continue
          </Button>
        ) : (
          <Button onClick={() => void confirm()}>Confirm this budget</Button>
        )}
      </div>
    </div>
  );
}
