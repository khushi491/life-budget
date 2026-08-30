import { Decimal, FinanceError, roundMinor } from "./money";

export type DebtAccount = {
  id: string;
  name: string;
  balanceMinor: bigint;
  interestApr: Decimal.Value;
  minPaymentMinor: bigint;
};

export function orderSnowball(debts: DebtAccount[]): DebtAccount[] {
  return [...debts].sort((a, b) => {
    if (a.balanceMinor === b.balanceMinor) return a.name.localeCompare(b.name);
    return a.balanceMinor < b.balanceMinor ? -1 : 1;
  });
}

export function orderAvalanche(debts: DebtAccount[]): DebtAccount[] {
  return [...debts].sort((a, b) => {
    const cmp = new Decimal(b.interestApr).cmp(new Decimal(a.interestApr));
    if (cmp !== 0) return cmp;
    return a.balanceMinor < b.balanceMinor ? -1 : 1;
  });
}

export type PayoffPlan = {
  strategy: "snowball" | "avalanche";
  order: string[];
  months: number;
  totalInterestMinor: bigint;
};

export function simulatePayoff(
  debts: DebtAccount[],
  extraMonthlyMinor: bigint,
  strategy: "snowball" | "avalanche",
): PayoffPlan {
  if (extraMonthlyMinor < 0n) {
    throw new FinanceError("Extra payment cannot be negative.");
  }
  const ordered = (
    strategy === "snowball" ? orderSnowball(debts) : orderAvalanche(debts)
  ).map((debt) => ({
    ...debt,
    balance: new Decimal(debt.balanceMinor.toString()),
    apr: new Decimal(debt.interestApr).div(100).div(12),
    min: new Decimal(debt.minPaymentMinor.toString()),
  }));

  let months = 0;
  let totalInterest = new Decimal(0);
  const maxMonths = 600;

  while (ordered.some((debt) => debt.balance.gt(0)) && months < maxMonths) {
    months += 1;
    let extra = new Decimal(extraMonthlyMinor.toString());
    for (const debt of ordered) {
      if (debt.balance.lte(0)) continue;
      const interest = debt.balance.mul(debt.apr);
      totalInterest = totalInterest.plus(interest);
      debt.balance = debt.balance.plus(interest);
      let payment = debt.min;
      if (
        extra.gt(0) &&
        ordered.find((item) => item.balance.gt(0))?.id === debt.id
      ) {
        payment = payment.plus(extra);
        extra = new Decimal(0);
      }
      if (payment.gt(debt.balance)) payment = debt.balance;
      debt.balance = debt.balance.minus(payment);
      if (debt.balance.lt(0)) debt.balance = new Decimal(0);
    }
  }

  return {
    strategy,
    order: ordered.map((debt) => debt.id),
    months,
    totalInterestMinor: roundMinor(totalInterest),
  };
}
