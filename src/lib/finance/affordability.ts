import { FINANCE_ASSUMPTIONS } from "./assumptions";
import { amortize, mortgagePayment } from "./loan";
import { Decimal, roundMinor } from "./money";
import {
  debtToIncomeRatio,
  emergencyFundCoverageMonths,
  housingToIncomeRatio,
} from "./ratios";

export type AffordabilityBand =
  "COMFORTABLE" | "MANAGEABLE" | "HIGH_RISK" | "NOT_AFFORDABLE";

export type HomeInputs = {
  propertyPriceMinor: bigint;
  downPaymentMinor: bigint;
  currentSavingsMinor: bigint;
  annualRatePercent: Decimal.Value;
  termMonths: number;
  propertyTaxAnnualMinor: bigint;
  insuranceAnnualMinor: bigint;
  hoaMonthlyMinor: bigint;
  maintenanceMonthlyMinor: bigint;
  utilitiesMonthlyMinor: bigint;
  closingCostMinor: bigint;
  movingCostMinor: bigint;
  extraPaymentMinor: bigint;
  expectedIncomeChangeMinor: bigint;
  monthlyIncomeMinor: bigint;
  monthlySavingsBeforeMinor: bigint;
  monthlyDebtMinor: bigint;
  monthlyEssentialsMinor: bigint;
  emergencyFundMinor: bigint;
};

export type HomeAnalysis = {
  loanAmountMinor: bigint;
  monthlyPaymentMinor: bigint;
  monthlyHousingCostMinor: bigint;
  upfrontCashMinor: bigint;
  canCoverUpfront: boolean;
  dti: Decimal;
  housingRatio: Decimal;
  emergencyMonthsAfter: Decimal;
  monthlySavingsAfterMinor: bigint;
  totalInterestMinor: bigint;
  totalOwnershipCostMinor: bigint;
  payoffMonth: number;
  extraPaymentEffect: {
    monthsSaved: number;
    interestSavedMinor: bigint;
  };
  band: AffordabilityBand;
  headline: string;
  reasons: string[];
  suggestions: string[];
};

function classify(input: {
  canCoverUpfront: boolean;
  housingRatio: Decimal;
  dti: Decimal;
  emergencyMonthsAfter: Decimal;
  monthlySavingsAfterMinor: bigint;
  monthlyIncomeMinor: bigint;
}): { band: AffordabilityBand; reasons: string[] } {
  const reasons: string[] = [];
  const housing = input.housingRatio.toNumber();
  const dti = input.dti.toNumber();
  const emergency = input.emergencyMonthsAfter.toNumber();
  const savingsRateAfter =
    input.monthlyIncomeMinor === 0n
      ? 0
      : Number(input.monthlySavingsAfterMinor) /
        Number(input.monthlyIncomeMinor);

  if (!input.canCoverUpfront) {
    reasons.push(
      "You do not currently have enough cash for the down payment, closing, and moving costs.",
    );
  }
  if (input.monthlySavingsAfterMinor < 0n) {
    reasons.push(
      "The full housing payment would leave the household short each month.",
    );
  }
  if (housing > FINANCE_ASSUMPTIONS.highRiskHousingRatio) {
    reasons.push("Housing would consume more than half of take-home income.");
  }
  if (
    !input.canCoverUpfront ||
    input.monthlySavingsAfterMinor < 0n ||
    housing > FINANCE_ASSUMPTIONS.highRiskHousingRatio
  ) {
    return { band: "NOT_AFFORDABLE", reasons };
  }

  if (housing > FINANCE_ASSUMPTIONS.manageableHousingRatio) {
    reasons.push(
      "Housing would be above the 36% of take-home income guideline.",
    );
  }
  if (dti > FINANCE_ASSUMPTIONS.highRiskDti) {
    reasons.push(
      "Total debt payments would be above the 43% debt-to-income guideline.",
    );
  }
  if (emergency < FINANCE_ASSUMPTIONS.highRiskEmergencyMonths) {
    reasons.push(
      "Less than one month of emergency savings would remain after buying.",
    );
  }
  if (
    housing > FINANCE_ASSUMPTIONS.manageableHousingRatio ||
    dti > FINANCE_ASSUMPTIONS.highRiskDti ||
    emergency < FINANCE_ASSUMPTIONS.highRiskEmergencyMonths
  ) {
    return { band: "HIGH_RISK", reasons };
  }

  if (housing > FINANCE_ASSUMPTIONS.comfortableHousingRatio) {
    reasons.push(
      "Housing would be above the 28% comfort guideline, so cash flow would feel tighter.",
    );
  }
  if (emergency < FINANCE_ASSUMPTIONS.comfortableEmergencyMonths) {
    reasons.push(
      "Emergency savings would drop below three months of essentials.",
    );
  }
  if (savingsRateAfter < FINANCE_ASSUMPTIONS.comfortableSavingsRate) {
    reasons.push(
      "Monthly savings after buying would fall below 10% of income.",
    );
  }
  if (
    housing > FINANCE_ASSUMPTIONS.comfortableHousingRatio ||
    emergency < FINANCE_ASSUMPTIONS.comfortableEmergencyMonths ||
    savingsRateAfter < FINANCE_ASSUMPTIONS.comfortableSavingsRate
  ) {
    return { band: "MANAGEABLE", reasons };
  }

  reasons.push(
    "Housing cost, debt load, emergency savings, and leftover savings all stay within comfort guidelines.",
  );
  return { band: "COMFORTABLE", reasons };
}

export function analyzeHomePurchase(input: HomeInputs): HomeAnalysis {
  const loanAmount = input.propertyPriceMinor - input.downPaymentMinor;
  const monthlyPayment = mortgagePayment({
    principalMinor: loanAmount < 0n ? 0n : loanAmount,
    annualRatePercent: input.annualRatePercent,
    termMonths: input.termMonths,
  });
  const monthlyTaxesInsurance = roundMinor(
    new Decimal(
      (input.propertyTaxAnnualMinor + input.insuranceAnnualMinor).toString(),
    ).div(12),
  );
  const monthlyHousing =
    monthlyPayment +
    monthlyTaxesInsurance +
    input.hoaMonthlyMinor +
    input.maintenanceMonthlyMinor +
    input.utilitiesMonthlyMinor;
  const upfront =
    input.downPaymentMinor + input.closingCostMinor + input.movingCostMinor;
  const income = input.monthlyIncomeMinor + input.expectedIncomeChangeMinor;
  const monthlySavingsAfter = input.monthlySavingsBeforeMinor - monthlyHousing;
  const emergencyAfter =
    input.emergencyFundMinor + input.currentSavingsMinor - upfront;
  const emergencyMonthsAfter = emergencyFundCoverageMonths(
    emergencyAfter > 0n ? emergencyAfter : 0n,
    input.monthlyEssentialsMinor + monthlyHousing,
  );
  const dti = debtToIncomeRatio(
    input.monthlyDebtMinor + monthlyPayment,
    income,
  );
  const housingRatio = housingToIncomeRatio(monthlyHousing, income);
  const canCoverUpfront =
    input.currentSavingsMinor + input.emergencyFundMinor >= upfront;

  const baseline = amortize({
    principalMinor: loanAmount < 0n ? 0n : loanAmount,
    annualRatePercent: input.annualRatePercent,
    termMonths: input.termMonths,
  });
  const accelerated = amortize({
    principalMinor: loanAmount < 0n ? 0n : loanAmount,
    annualRatePercent: input.annualRatePercent,
    termMonths: input.termMonths,
    extraPaymentMinor: input.extraPaymentMinor,
  });

  const { band, reasons } = classify({
    canCoverUpfront,
    housingRatio,
    dti,
    emergencyMonthsAfter,
    monthlySavingsAfterMinor: monthlySavingsAfter,
    monthlyIncomeMinor: income,
  });

  const suggestions: string[] = [];
  if (band !== "COMFORTABLE") {
    suggestions.push("Save a larger down payment");
    suggestions.push("Consider a lower-priced property");
    suggestions.push("Reduce another monthly expense");
    suggestions.push("Wait for a higher income");
    suggestions.push("Choose a different loan term");
    if (input.extraPaymentMinor === 0n) {
      suggestions.push(
        "Make additional principal payments if cash flow allows",
      );
    }
  } else if (input.extraPaymentMinor > 0n) {
    suggestions.push(
      "Keep the extra principal habit — it shortens the loan and cuts interest.",
    );
  } else {
    suggestions.push("Keep three to six months of expenses after closing.");
  }

  const headline = headlineFor(
    band,
    input.monthlySavingsBeforeMinor,
    monthlySavingsAfter,
    emergencyMonthsAfter,
  );

  return {
    loanAmountMinor: loanAmount < 0n ? 0n : loanAmount,
    monthlyPaymentMinor: monthlyPayment,
    monthlyHousingCostMinor: monthlyHousing,
    upfrontCashMinor: upfront,
    canCoverUpfront,
    dti,
    housingRatio,
    emergencyMonthsAfter,
    monthlySavingsAfterMinor: monthlySavingsAfter,
    totalInterestMinor: accelerated.totalInterestMinor,
    totalOwnershipCostMinor:
      upfront +
      accelerated.totalPaidMinor +
      (monthlyHousing - monthlyPayment) * BigInt(accelerated.payoffMonth),
    payoffMonth: accelerated.payoffMonth,
    extraPaymentEffect: {
      monthsSaved: Math.max(0, baseline.payoffMonth - accelerated.payoffMonth),
      interestSavedMinor:
        baseline.totalInterestMinor - accelerated.totalInterestMinor,
    },
    band,
    headline,
    reasons,
    suggestions,
  };
}

function headlineFor(
  band: AffordabilityBand,
  savingsBefore: bigint,
  savingsAfter: bigint,
  emergencyMonthsAfter: Decimal,
): string {
  const afterMonths = emergencyMonthsAfter.toFixed(1);
  if (band === "COMFORTABLE") {
    return `This home looks comfortable. Monthly savings would move from the current amount to a still-healthy leftover, with about ${afterMonths} months of emergency savings remaining.`;
  }
  if (band === "MANAGEABLE") {
    return `This home is manageable, but it would reduce monthly leftover money from ${savingsBefore.toString()} minor units to ${savingsAfter.toString()} and leave about ${afterMonths} months of emergency savings.`;
  }
  if (band === "HIGH_RISK") {
    return `This home is high risk with the current numbers. Housing or debt would stretch the budget, and only about ${afterMonths} months of emergency savings would remain.`;
  }
  return "This home is not currently affordable without changing the price, down payment, income, or expenses.";
}

export const BAND_COPY: Record<
  AffordabilityBand,
  { label: string; tone: "good" | "caution" | "risk" }
> = {
  COMFORTABLE: { label: "Comfortable", tone: "good" },
  MANAGEABLE: { label: "Manageable but tight", tone: "caution" },
  HIGH_RISK: { label: "High risk", tone: "risk" },
  NOT_AFFORDABLE: { label: "Not currently affordable", tone: "risk" },
};
