"use client";

import { useMemo, useState } from "react";
import { compoundGrowth, toMinor } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import type { CurrencyCode } from "@/lib/finance";
import { ChartCard, NetWorthChart } from "@/components/charts";
import { fromMinor } from "@/lib/finance";
import { Button } from "@/components/ui/button";

const PRESETS = [
  {
    id: "partner",
    label: "One partner stops working",
    income: 0.55,
    spending: 0.92,
    savings: 0.4,
  },
  { id: "baby", label: "New baby", income: 1, spending: 1.18, savings: 0.7 },
  {
    id: "raise",
    label: "10% salary increase",
    income: 1.1,
    spending: 1,
    savings: 1.2,
  },
  {
    id: "cut",
    label: "15% expense reduction",
    income: 1,
    spending: 0.85,
    savings: 1.25,
  },
  {
    id: "rate",
    label: "Higher mortgage rate",
    income: 1,
    spending: 1.08,
    savings: 0.85,
  },
  {
    id: "down",
    label: "Larger down payment",
    income: 1,
    spending: 1,
    savings: 0.8,
  },
  {
    id: "medical",
    label: "Unexpected medical expense",
    income: 1,
    spending: 1.2,
    savings: 0.5,
  },
];

export function Simulator({
  currency,
  income,
  spending,
  savings,
  netWorth,
}: {
  currency: CurrencyCode;
  income: number;
  spending: number;
  savings: number;
  netWorth: number;
}) {
  const [incomeNow, setIncomeNow] = useState(income);
  const [spendNow, setSpendNow] = useState(spending);
  const [saveNow, setSaveNow] = useState(savings);
  const [inflation, setInflation] = useState(2.5);
  const [returns, setReturns] = useState(6);
  const leftover = incomeNow - spendNow;

  const projection = useMemo(() => {
    const points = [];
    for (let year = 0; year <= 20; year += 1) {
      points.push({
        month: `${year}y`,
        value: fromMinor(
          compoundGrowth({
            presentMinor: toMinor(netWorth),
            monthlyContributionMinor: toMinor(Math.max(0, saveNow)),
            annualReturnPercent: returns,
            months: year * 12,
          }),
        ).toNumber(),
      });
    }
    return points;
  }, [netWorth, saveNow, returns]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="border-border bg-card space-y-4 rounded-3xl border p-5">
        <label className="block text-sm">
          Income {formatMoney(toMinor(incomeNow), currency)}
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={income * 1.5}
            value={incomeNow}
            onChange={(e) => setIncomeNow(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          Spending {formatMoney(toMinor(spendNow), currency)}
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={spending * 1.6}
            value={spendNow}
            onChange={(e) => setSpendNow(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          Savings {formatMoney(toMinor(saveNow), currency)}
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={Math.max(savings * 2, 100)}
            value={saveNow}
            onChange={(e) => setSaveNow(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          Inflation {inflation}%
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={10}
            step={0.1}
            value={inflation}
            onChange={(e) => setInflation(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          Investment return {returns}%
          <input
            className="mt-2 w-full"
            type="range"
            min={0}
            max={12}
            step={0.1}
            value={returns}
            onChange={(e) => setReturns(Number(e.target.value))}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIncomeNow(income * preset.income);
                setSpendNow(spending * preset.spending);
                setSaveNow(savings * preset.savings);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </aside>
      <div className="space-y-4">
        <p className="text-lg">
          Leftover this month would be{" "}
          {formatMoney(toMinor(leftover), currency)} after the adjusted
          spending. Inflation at {inflation}% quietly raises future costs;
          returns at {returns}% grow invested leftover.
        </p>
        <ChartCard
          title="Projected net worth"
          explanation="A simple compounding sketch of today’s net worth plus the monthly savings you set on the left."
          summary="Line chart of projected net worth over 20 years."
        >
          <NetWorthChart data={projection} />
        </ChartCard>
      </div>
    </div>
  );
}
