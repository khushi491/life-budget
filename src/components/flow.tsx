import { formatMoney } from "@/lib/format";
import type { CurrencyCode } from "@/lib/finance";

export function CashFlow({
  income,
  steps,
  currency,
}: {
  income: bigint;
  steps: { key: string; label: string; amountMinor: bigint }[];
  currency: CurrencyCode;
}) {
  const max = steps.reduce(
    (sum, step) => (step.amountMinor > sum ? step.amountMinor : sum),
    income,
  );
  return (
    <div
      className="space-y-3"
      role="img"
      aria-label="How this month's income is allocated"
    >
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Income
        </p>
        <div
          className="bg-primary mt-1 h-4 rounded-full"
          style={{ width: "100%" }}
        />
        <p className="mt-1 text-sm font-medium">
          {formatMoney(income, currency)}
        </p>
      </div>
      {steps.map((step) => {
        const width =
          max === 0n ? 0 : Math.max(6, Number((step.amountMinor * 100n) / max));
        return (
          <div key={step.key}>
            <div className="flex items-center justify-between text-sm">
              <span>{step.label}</span>
              <span className="font-medium">
                {formatMoney(step.amountMinor, currency)}
              </span>
            </div>
            <div className="bg-muted mt-1 h-3 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-emerald-700/80 dark:bg-emerald-400/80"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BudgetBars({
  rows,
  currency,
}: {
  rows: { name: string; spent: bigint; limit: bigint }[];
  currency: CurrencyCode;
}) {
  if (!rows.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No category limits yet. Build this month&apos;s budget to see progress.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const pct =
          row.limit === 0n
            ? 0
            : Math.min(100, Number((row.spent * 100n) / row.limit));
        const remaining = row.limit - row.spent;
        const over = remaining < 0n;
        return (
          <div key={row.name}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{row.name}</span>
              <span>
                {formatMoney(row.spent, currency)} of{" "}
                {formatMoney(row.limit, currency)}
              </span>
            </div>
            <div className="bg-muted mt-1 h-3 overflow-hidden rounded-full">
              <div
                className={
                  over
                    ? "h-full bg-red-600"
                    : pct >= 80
                      ? "h-full bg-amber-500"
                      : "h-full bg-emerald-700"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {over ? "Over by " : "Remaining "}
              {formatMoney(over ? -remaining : remaining, currency)} · {pct}%
              used
            </p>
          </div>
        );
      })}
    </div>
  );
}
