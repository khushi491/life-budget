import {
  Decimal,
  FinanceError,
  assertFiniteDecimal,
  roundMinor,
} from "./money";

export function monthsToGoal(input: {
  currentMinor: bigint;
  targetMinor: bigint;
  monthlyContributionMinor: bigint;
  annualReturnPercent?: Decimal.Value;
}): { months: number | null; estimatedDate: Date | null } {
  const { currentMinor, targetMinor, monthlyContributionMinor } = input;
  if (currentMinor < 0n || targetMinor < 0n || monthlyContributionMinor < 0n) {
    throw new FinanceError("Goal amounts cannot be negative.");
  }
  if (currentMinor >= targetMinor) {
    return { months: 0, estimatedDate: new Date() };
  }
  if (monthlyContributionMinor === 0n && !input.annualReturnPercent) {
    return { months: null, estimatedDate: null };
  }

  let balance = new Decimal(currentMinor.toString());
  const target = new Decimal(targetMinor.toString());
  const contribution = new Decimal(monthlyContributionMinor.toString());
  const monthlyReturn = input.annualReturnPercent
    ? assertFiniteDecimal(input.annualReturnPercent, "Return rate")
        .div(100)
        .div(12)
    : new Decimal(0);

  for (let month = 1; month <= 1200; month += 1) {
    balance = balance.mul(monthlyReturn.plus(1)).plus(contribution);
    if (balance.gte(target)) {
      const estimatedDate = new Date();
      estimatedDate.setMonth(estimatedDate.getMonth() + month);
      return { months: month, estimatedDate };
    }
  }
  return { months: null, estimatedDate: null };
}

export function requiredMonthlyContribution(input: {
  currentMinor: bigint;
  targetMinor: bigint;
  months: number;
  annualReturnPercent?: Decimal.Value;
}): bigint {
  const { currentMinor, targetMinor, months } = input;
  if (months <= 0) {
    throw new FinanceError("Time remaining must be greater than zero.");
  }
  if (currentMinor >= targetMinor) return 0n;

  const remaining = new Decimal((targetMinor - currentMinor).toString());
  if (!input.annualReturnPercent) {
    return roundMinor(remaining.div(months));
  }

  const r = assertFiniteDecimal(input.annualReturnPercent, "Return rate")
    .div(100)
    .div(12);
  if (r.isZero()) {
    return roundMinor(remaining.div(months));
  }

  const growth = r.plus(1).pow(months);
  const futureCurrent = new Decimal(currentMinor.toString()).mul(growth);
  const needed = new Decimal(targetMinor.toString()).minus(futureCurrent);
  if (needed.lte(0)) return 0n;
  const payment = needed.mul(r).div(growth.minus(1));
  return roundMinor(payment);
}

export function recommendedContribution(input: {
  currentMinor: bigint;
  targetMinor: bigint;
  targetDate: Date;
  annualReturnPercent?: Decimal.Value;
  now?: Date;
}): { monthlyMinor: bigint; months: number } {
  const now = input.now ?? new Date();
  const months = Math.max(
    1,
    (input.targetDate.getFullYear() - now.getFullYear()) * 12 +
      (input.targetDate.getMonth() - now.getMonth()),
  );
  return {
    months,
    monthlyMinor: requiredMonthlyContribution({
      currentMinor: input.currentMinor,
      targetMinor: input.targetMinor,
      months,
      annualReturnPercent: input.annualReturnPercent,
    }),
  };
}
