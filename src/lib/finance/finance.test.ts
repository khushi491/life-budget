import { describe, expect, it } from "vitest";
import {
  FinanceError,
  amortize,
  analyzeHomePurchase,
  compareRentVsBuy,
  compoundGrowth,
  debtToIncomeRatio,
  emergencyFundCoverageMonths,
  housingToIncomeRatio,
  inflate,
  monthsToGoal,
  mortgagePayment,
  orderAvalanche,
  orderSnowball,
  requiredMonthlyContribution,
  savingsRate,
  simulatePayoff,
  toMinor,
  totalInterest,
} from "./index";

describe("mortgagePayment", () => {
  it("matches a standard 30-year 6.5% loan on $400,000", () => {
    const payment = mortgagePayment({
      principalMinor: toMinor(400_000),
      annualRatePercent: 6.5,
      termMonths: 360,
    });
    expect(Number(payment)).toBeGreaterThan(252_800);
    expect(Number(payment)).toBeLessThan(252_900);
  });

  it("splits a zero-interest loan evenly", () => {
    expect(
      mortgagePayment({
        principalMinor: 120_000n,
        annualRatePercent: 0,
        termMonths: 12,
      }),
    ).toBe(10_000n);
  });

  it("returns zero for a zero principal", () => {
    expect(
      mortgagePayment({
        principalMinor: 0n,
        annualRatePercent: 5,
        termMonths: 360,
      }),
    ).toBe(0n);
  });

  it("rejects invalid terms and negative principal", () => {
    expect(() =>
      mortgagePayment({
        principalMinor: 1n,
        annualRatePercent: 5,
        termMonths: 0,
      }),
    ).toThrow(FinanceError);
    expect(() =>
      mortgagePayment({
        principalMinor: -1n,
        annualRatePercent: 5,
        termMonths: 12,
      }),
    ).toThrow(FinanceError);
    expect(() =>
      mortgagePayment({
        principalMinor: 1n,
        annualRatePercent: Infinity,
        termMonths: 12,
      }),
    ).toThrow(FinanceError);
  });

  it("handles large principals without using floating point", () => {
    const payment = mortgagePayment({
      principalMinor: 50_000_000_000n,
      annualRatePercent: 8,
      termMonths: 240,
    });
    expect(payment > 0n).toBe(true);
  });
});

describe("amortize", () => {
  it("pays off a long loan and records interest", () => {
    const result = amortize({
      principalMinor: toMinor(300_000),
      annualRatePercent: 7,
      termMonths: 360,
    });
    expect(result.payoffMonth).toBe(360);
    expect(result.rows.at(-1)?.balanceMinor).toBe(0n);
    expect(result.totalInterestMinor > 0n).toBe(true);
    expect(result.totalPrincipalMinor).toBe(toMinor(300_000));
  });

  it("saves interest and months with extra principal", () => {
    const base = amortize({
      principalMinor: toMinor(300_000),
      annualRatePercent: 7,
      termMonths: 360,
    });
    const extra = amortize({
      principalMinor: toMinor(300_000),
      annualRatePercent: 7,
      termMonths: 360,
      extraPaymentMinor: toMinor(250),
    });
    expect(extra.payoffMonth).toBeLessThan(base.payoffMonth);
    expect(extra.totalInterestMinor).toBeLessThan(base.totalInterestMinor);
  });

  it("rejects negative extra payments", () => {
    expect(() =>
      amortize({
        principalMinor: 1000n,
        annualRatePercent: 4,
        termMonths: 12,
        extraPaymentMinor: -1n,
      }),
    ).toThrow(FinanceError);
  });
});

describe("ratios and goals", () => {
  it("computes savings rate, DTI, housing ratio, and emergency coverage", () => {
    expect(savingsRate(1500n, 10_000n).toNumber()).toBe(0.15);
    expect(debtToIncomeRatio(2000n, 8000n).toNumber()).toBe(0.25);
    expect(housingToIncomeRatio(2400n, 8000n).toNumber()).toBe(0.3);
    expect(emergencyFundCoverageMonths(12_000n, 4000n).toNumber()).toBe(3);
  });

  it("returns null months when a goal cannot be funded", () => {
    expect(
      monthsToGoal({
        currentMinor: 100n,
        targetMinor: 500n,
        monthlyContributionMinor: 0n,
      }).months,
    ).toBeNull();
  });

  it("requires a monthly contribution that reaches the target", () => {
    expect(
      requiredMonthlyContribution({
        currentMinor: 0n,
        targetMinor: 1200n,
        months: 12,
      }),
    ).toBe(100n);
  });
});

describe("projections and rent versus buy", () => {
  it("compounds growth and inflates costs", () => {
    const grown = compoundGrowth({
      presentMinor: toMinor(10_000),
      monthlyContributionMinor: toMinor(200),
      annualReturnPercent: 6,
      months: 12,
    });
    expect(grown > toMinor(10_000) + toMinor(200) * 12n).toBe(true);
    expect(inflate(toMinor(100), 10, 1)).toBe(toMinor(110));
  });

  it("builds rent-versus-buy snapshots for 5, 10, 20, and 30 years", () => {
    const rows = compareRentVsBuy({
      years: [5, 10, 20, 30],
      monthlyRentMinor: toMinor(2200),
      propertyPriceMinor: toMinor(450_000),
      downPaymentMinor: toMinor(90_000),
      closingCostMinor: toMinor(12_000),
      movingCostMinor: toMinor(5_000),
      annualRatePercent: 6.5,
      termMonths: 360,
      propertyTaxAnnualMinor: toMinor(5400),
      insuranceAnnualMinor: toMinor(1800),
      hoaMonthlyMinor: toMinor(150),
      maintenanceMonthlyMinor: toMinor(250),
      utilitiesMonthlyMinor: toMinor(220),
      monthlySavingsIfRentingMinor: toMinor(1800),
    });
    expect(rows).toHaveLength(4);
    expect(rows[0]?.year).toBe(5);
    expect(rows[3]?.buyNetWorthMinor).not.toBe(rows[0]?.buyNetWorthMinor);
  });
});

describe("home affordability", () => {
  it("marks a well-funded purchase as comfortable", () => {
    const result = analyzeHomePurchase({
      propertyPriceMinor: toMinor(280_000),
      downPaymentMinor: toMinor(70_000),
      currentSavingsMinor: toMinor(90_000),
      annualRatePercent: 6,
      termMonths: 360,
      propertyTaxAnnualMinor: toMinor(3000),
      insuranceAnnualMinor: toMinor(1200),
      hoaMonthlyMinor: 0n,
      maintenanceMonthlyMinor: toMinor(150),
      utilitiesMonthlyMinor: toMinor(180),
      closingCostMinor: toMinor(6000),
      movingCostMinor: toMinor(2000),
      extraPaymentMinor: 0n,
      expectedIncomeChangeMinor: 0n,
      monthlyIncomeMinor: toMinor(12_000),
      monthlySavingsBeforeMinor: toMinor(3500),
      monthlyDebtMinor: toMinor(200),
      monthlyEssentialsMinor: toMinor(2500),
      emergencyFundMinor: toMinor(25_000),
    });
    expect(result.band).toBe("COMFORTABLE");
    expect(result.monthlyPaymentMinor > 0n).toBe(true);
  });

  it("marks a purchase as not affordable without cash to close", () => {
    const result = analyzeHomePurchase({
      propertyPriceMinor: toMinor(900_000),
      downPaymentMinor: toMinor(180_000),
      currentSavingsMinor: toMinor(10_000),
      annualRatePercent: 7,
      termMonths: 360,
      propertyTaxAnnualMinor: toMinor(10_000),
      insuranceAnnualMinor: toMinor(3000),
      hoaMonthlyMinor: toMinor(400),
      maintenanceMonthlyMinor: toMinor(400),
      utilitiesMonthlyMinor: toMinor(300),
      closingCostMinor: toMinor(20_000),
      movingCostMinor: toMinor(8000),
      extraPaymentMinor: 0n,
      expectedIncomeChangeMinor: 0n,
      monthlyIncomeMinor: toMinor(4000),
      monthlySavingsBeforeMinor: toMinor(200),
      monthlyDebtMinor: toMinor(800),
      monthlyEssentialsMinor: toMinor(2500),
      emergencyFundMinor: toMinor(2000),
    });
    expect(result.band).toBe("NOT_AFFORDABLE");
  });
});

describe("debt payoff", () => {
  const debts = [
    {
      id: "card",
      name: "Card",
      balanceMinor: 300_000n,
      interestApr: 22,
      minPaymentMinor: 10_000n,
    },
    {
      id: "car",
      name: "Car",
      balanceMinor: 800_000n,
      interestApr: 6,
      minPaymentMinor: 30_000n,
    },
    {
      id: "student",
      name: "Student",
      balanceMinor: 1_200_000n,
      interestApr: 5,
      minPaymentMinor: 20_000n,
    },
  ];

  it("orders snowball by smallest balance and avalanche by highest APR", () => {
    expect(orderSnowball(debts).map((d) => d.id)).toEqual([
      "card",
      "car",
      "student",
    ]);
    expect(orderAvalanche(debts).map((d) => d.id)).toEqual([
      "card",
      "car",
      "student",
    ]);
  });

  it("reduces interest with extra payments", () => {
    const plan = simulatePayoff(debts, 20_000n, "avalanche");
    expect(plan.months).toBeGreaterThan(0);
    expect(plan.totalInterestMinor > 0n).toBe(true);
  });
});

describe("totalInterest", () => {
  it("is zero on a zero-interest loan", () => {
    expect(
      totalInterest({
        principalMinor: 12_000n,
        annualRatePercent: 0,
        termMonths: 12,
      }),
    ).toBe(0n);
  });
});
