import { FINANCE_ASSUMPTIONS } from "./assumptions";
import { amortize } from "./loan";
import { Decimal, FinanceError, roundMinor } from "./money";
import { compoundGrowth, inflate } from "./projections";

export type RentVsBuyYear = {
  year: number;
  rentCostMinor: bigint;
  buyCostMinor: bigint;
  rentNetWorthMinor: bigint;
  buyNetWorthMinor: bigint;
};

export function compareRentVsBuy(input: {
  years: number[];
  monthlyRentMinor: bigint;
  rentInflationPct?: Decimal.Value;
  propertyPriceMinor: bigint;
  downPaymentMinor: bigint;
  closingCostMinor: bigint;
  movingCostMinor: bigint;
  annualRatePercent: Decimal.Value;
  termMonths: number;
  extraPaymentMinor?: bigint;
  propertyTaxAnnualMinor: bigint;
  insuranceAnnualMinor: bigint;
  hoaMonthlyMinor: bigint;
  maintenanceMonthlyMinor: bigint;
  utilitiesMonthlyMinor: bigint;
  monthlySavingsIfRentingMinor: bigint;
  investmentReturnPct?: Decimal.Value;
  appreciationPct?: Decimal.Value;
  sellingCostPct?: Decimal.Value;
}): RentVsBuyYear[] {
  if (input.monthlyRentMinor < 0n) {
    throw new FinanceError("Rent cannot be negative.");
  }

  const inflation = new Decimal(
    input.rentInflationPct ?? FINANCE_ASSUMPTIONS.defaultInflationPct,
  );
  const invest =
    input.investmentReturnPct ?? FINANCE_ASSUMPTIONS.defaultInvestmentReturnPct;
  const appreciation = new Decimal(
    input.appreciationPct ?? FINANCE_ASSUMPTIONS.defaultAppreciationPct,
  );
  const sellingCost = new Decimal(
    input.sellingCostPct ?? FINANCE_ASSUMPTIONS.defaultSellingCostPct,
  ).div(100);
  const loan = amortize({
    principalMinor: input.propertyPriceMinor - input.downPaymentMinor,
    annualRatePercent: input.annualRatePercent,
    termMonths: input.termMonths,
    extraPaymentMinor: input.extraPaymentMinor,
  });

  const maxYear = Math.max(...input.years, 1);
  const monthlyHousing =
    loan.scheduledPaymentMinor +
    input.hoaMonthlyMinor +
    input.maintenanceMonthlyMinor +
    input.utilitiesMonthlyMinor +
    roundMinor(
      new Decimal(
        (input.propertyTaxAnnualMinor + input.insuranceAnnualMinor).toString(),
      ).div(12),
    );

  const buyUpfront =
    input.downPaymentMinor + input.closingCostMinor + input.movingCostMinor;
  const monthlySavingsIfBuying =
    input.monthlySavingsIfRentingMinor -
    (monthlyHousing - input.monthlyRentMinor);

  const results: RentVsBuyYear[] = [];
  for (const year of input.years) {
    if (year < 0 || year > maxYear) continue;
    let rentCost = 0n;
    for (let y = 0; y < year; y += 1) {
      const rentThisYear = inflate(input.monthlyRentMinor, inflation, y) * 12n;
      rentCost += rentThisYear;
    }

    const months = year * 12;
    const row = loan.rows[Math.min(months, loan.rows.length) - 1];
    const remainingLoan =
      months >= loan.rows.length || !row ? 0n : row.balanceMinor;
    const interestPaid = loan.rows
      .slice(0, Math.min(months, loan.rows.length))
      .reduce((sum, item) => sum + item.interestMinor, 0n);

    const homeValue = inflate(input.propertyPriceMinor, appreciation, year);
    const sellingCosts = roundMinor(
      new Decimal(homeValue.toString()).mul(sellingCost),
    );
    const equity = homeValue - remainingLoan - sellingCosts;
    const buyInvestableMonthly =
      monthlySavingsIfBuying > 0n ? monthlySavingsIfBuying : 0n;
    const buyInvestments = compoundGrowth({
      presentMinor: 0n,
      monthlyContributionMinor: buyInvestableMonthly,
      annualReturnPercent: invest,
      months,
    });
    const rentInvestments = compoundGrowth({
      presentMinor: buyUpfront,
      monthlyContributionMinor: input.monthlySavingsIfRentingMinor,
      annualReturnPercent: invest,
      months,
    });

    const ownershipCarry =
      (monthlyHousing - loan.scheduledPaymentMinor) * BigInt(months) +
      buyUpfront +
      interestPaid;

    results.push({
      year,
      rentCostMinor: rentCost,
      buyCostMinor: ownershipCarry > 0n ? ownershipCarry : 0n,
      rentNetWorthMinor: rentInvestments,
      buyNetWorthMinor: equity + buyInvestments,
    });
  }

  return results;
}
