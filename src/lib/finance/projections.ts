import { FINANCE_ASSUMPTIONS } from "./assumptions";
import {
  Decimal,
  FinanceError,
  assertFiniteDecimal,
  roundMinor,
} from "./money";

export function compoundGrowth(input: {
  presentMinor: bigint;
  monthlyContributionMinor: bigint;
  annualReturnPercent: Decimal.Value;
  months: number;
}): bigint {
  if (input.presentMinor < 0n || input.monthlyContributionMinor < 0n) {
    throw new FinanceError(
      "Present value and contributions cannot be negative.",
    );
  }
  if (input.months < 0 || !Number.isInteger(input.months)) {
    throw new FinanceError("Months must be a whole number of 0 or more.");
  }
  if (input.months === 0) return input.presentMinor;

  const r = assertFiniteDecimal(input.annualReturnPercent, "Return rate")
    .div(100)
    .div(12);
  let value = new Decimal(input.presentMinor.toString());
  const pmt = new Decimal(input.monthlyContributionMinor.toString());
  for (let i = 0; i < input.months; i += 1) {
    value = value.mul(r.plus(1)).plus(pmt);
  }
  return roundMinor(value);
}

export function inflate(
  amountMinor: bigint,
  annualInflationPercent: Decimal.Value,
  years: number,
): bigint {
  if (amountMinor < 0n) {
    throw new FinanceError("Amount cannot be negative.");
  }
  if (years < 0) {
    throw new FinanceError("Years cannot be negative.");
  }
  const rate = assertFiniteDecimal(annualInflationPercent, "Inflation").div(
    100,
  );
  return roundMinor(
    new Decimal(amountMinor.toString()).mul(rate.plus(1).pow(years)),
  );
}

export function netWorthProjection(input: {
  startingNetWorthMinor: bigint;
  monthlySavingsMinor: bigint;
  annualReturnPercent: Decimal.Value;
  years: number;
}): { year: number; netWorthMinor: bigint }[] {
  const points: { year: number; netWorthMinor: bigint }[] = [
    { year: 0, netWorthMinor: input.startingNetWorthMinor },
  ];
  for (let year = 1; year <= input.years; year += 1) {
    points.push({
      year,
      netWorthMinor: compoundGrowth({
        presentMinor: input.startingNetWorthMinor,
        monthlyContributionMinor: input.monthlySavingsMinor,
        annualReturnPercent: input.annualReturnPercent,
        months: year * 12,
      }),
    });
  }
  return points;
}

export const DEFAULT_PROJECTION_RATES = {
  inflationPct: FINANCE_ASSUMPTIONS.defaultInflationPct,
  appreciationPct: FINANCE_ASSUMPTIONS.defaultAppreciationPct,
  investmentReturnPct: FINANCE_ASSUMPTIONS.defaultInvestmentReturnPct,
} as const;
