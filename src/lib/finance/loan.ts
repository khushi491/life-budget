import { FINANCE_ASSUMPTIONS } from "./assumptions";
import {
  Decimal,
  FinanceError,
  assertFiniteDecimal,
  roundMinor,
} from "./money";

export function monthlyRateFromAnnualPercent(
  annualPercent: Decimal.Value,
): Decimal {
  const annual = assertFiniteDecimal(annualPercent, "Interest rate");
  if (annual.lt(0)) {
    throw new FinanceError("Interest rate cannot be negative.");
  }
  return annual.div(100).div(FINANCE_ASSUMPTIONS.monthlyRateDivisor);
}

export function mortgagePayment(input: {
  principalMinor: bigint;
  annualRatePercent: Decimal.Value;
  termMonths: number;
}): bigint {
  const { principalMinor, annualRatePercent, termMonths } = input;
  if (termMonths <= 0 || !Number.isInteger(termMonths)) {
    throw new FinanceError(
      "Loan term must be a whole number of months greater than zero.",
    );
  }
  if (principalMinor < 0n) {
    throw new FinanceError("Principal cannot be negative.");
  }
  if (principalMinor === 0n) return 0n;

  const principal = new Decimal(principalMinor.toString());
  const monthlyRate = monthlyRateFromAnnualPercent(annualRatePercent);
  if (monthlyRate.isZero()) {
    return roundMinor(principal.div(termMonths));
  }

  const factor = monthlyRate.plus(1).pow(termMonths);
  const payment = principal.mul(monthlyRate).mul(factor).div(factor.minus(1));
  return roundMinor(payment);
}

export type AmortizationRow = {
  month: number;
  paymentMinor: bigint;
  interestMinor: bigint;
  principalMinor: bigint;
  extraMinor: bigint;
  balanceMinor: bigint;
};

export type AmortizationResult = {
  rows: AmortizationRow[];
  scheduledPaymentMinor: bigint;
  totalInterestMinor: bigint;
  totalPrincipalMinor: bigint;
  totalPaidMinor: bigint;
  payoffMonth: number;
};

export function amortize(input: {
  principalMinor: bigint;
  annualRatePercent: Decimal.Value;
  termMonths: number;
  extraPaymentMinor?: bigint;
}): AmortizationResult {
  const extra = input.extraPaymentMinor ?? 0n;
  if (extra < 0n) {
    throw new FinanceError("Extra payment cannot be negative.");
  }

  const scheduled = mortgagePayment(input);
  const monthlyRate = monthlyRateFromAnnualPercent(input.annualRatePercent);
  const rows: AmortizationRow[] = [];
  let balance = input.principalMinor;
  let totalInterest = 0n;
  let totalPrincipal = 0n;
  let month = 0;
  const maxMonths = Math.max(input.termMonths * 2, input.termMonths);

  while (balance > 0n && month < maxMonths) {
    month += 1;
    const interest = roundMinor(
      new Decimal(balance.toString()).mul(monthlyRate),
    );
    let principalPortion = scheduled - interest;
    if (principalPortion < 0n) {
      throw new FinanceError(
        "Scheduled payment does not cover monthly interest. Increase the payment or lower the rate.",
      );
    }

    let extraThisMonth = extra;
    let payment = scheduled + extraThisMonth;
    if (principalPortion + extraThisMonth + interest > balance + interest) {
      principalPortion = balance;
      extraThisMonth = 0n;
      payment = principalPortion + interest;
    } else if (principalPortion + extraThisMonth > balance) {
      extraThisMonth = balance - principalPortion;
      if (extraThisMonth < 0n) {
        principalPortion = balance;
        extraThisMonth = 0n;
      }
      payment = principalPortion + extraThisMonth + interest;
    }

    const appliedPrincipal = principalPortion + extraThisMonth;
    balance -= appliedPrincipal;
    if (balance < 0n) balance = 0n;
    totalInterest += interest;
    totalPrincipal += appliedPrincipal;

    rows.push({
      month,
      paymentMinor: payment,
      interestMinor: interest,
      principalMinor: principalPortion,
      extraMinor: extraThisMonth,
      balanceMinor: balance,
    });
  }

  return {
    rows,
    scheduledPaymentMinor: scheduled,
    totalInterestMinor: totalInterest,
    totalPrincipalMinor: totalPrincipal,
    totalPaidMinor: totalInterest + totalPrincipal,
    payoffMonth: month,
  };
}

export function totalInterest(input: {
  principalMinor: bigint;
  annualRatePercent: Decimal.Value;
  termMonths: number;
  extraPaymentMinor?: bigint;
}): bigint {
  return amortize(input).totalInterestMinor;
}
