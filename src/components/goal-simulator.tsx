"use client";

import { useMemo, useState } from "react";
import { monthsToGoal } from "@/lib/finance";
import { formatMonths, formatMoney } from "@/lib/format";
import type { CurrencyCode } from "@/lib/finance";

export function GoalSimulator({
  currency,
  currentMinor,
  targetMinor,
  monthlyMinor,
}: {
  currency: CurrencyCode;
  currentMinor: string;
  targetMinor: string;
  monthlyMinor: string;
}) {
  const [monthly, setMonthly] = useState(Number(monthlyMinor) / 100);
  const estimate = useMemo(
    () =>
      monthsToGoal({
        currentMinor: BigInt(currentMinor),
        targetMinor: BigInt(targetMinor),
        monthlyContributionMinor: BigInt(Math.round(monthly * 100)),
      }),
    [currentMinor, targetMinor, monthly],
  );

  return (
    <div className="bg-muted mt-4 rounded-2xl p-4">
      <label className="text-sm font-medium">
        If you set aside{" "}
        {formatMoney(BigInt(Math.round(monthly * 100)), currency)} each month
      </label>
      <input
        type="range"
        min={0}
        max={Math.max(500, monthly * 3)}
        value={monthly}
        onChange={(event) => setMonthly(Number(event.target.value))}
        className="mt-2 w-full"
      />
      <p className="mt-2 text-sm">
        You would arrive in {formatMonths(estimate.months)}.
      </p>
    </div>
  );
}
