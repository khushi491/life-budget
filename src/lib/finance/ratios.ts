import { FINANCE_ASSUMPTIONS } from "./assumptions";
import { Decimal, FinanceError, ratio } from "./money";

export function savingsRate(
  savingsMinor: bigint,
  incomeMinor: bigint,
): Decimal {
  if (incomeMinor < 0n || savingsMinor < 0n) {
    throw new FinanceError("Income and savings cannot be negative.");
  }
  return ratio(savingsMinor, incomeMinor);
}

export function debtToIncomeRatio(
  monthlyDebtMinor: bigint,
  monthlyIncomeMinor: bigint,
): Decimal {
  if (monthlyDebtMinor < 0n || monthlyIncomeMinor < 0n) {
    throw new FinanceError("Debt payments and income cannot be negative.");
  }
  return ratio(monthlyDebtMinor, monthlyIncomeMinor);
}

export function housingToIncomeRatio(
  monthlyHousingMinor: bigint,
  monthlyIncomeMinor: bigint,
): Decimal {
  if (monthlyHousingMinor < 0n || monthlyIncomeMinor < 0n) {
    throw new FinanceError("Housing cost and income cannot be negative.");
  }
  return ratio(monthlyHousingMinor, monthlyIncomeMinor);
}

export function emergencyFundCoverageMonths(
  emergencyFundMinor: bigint,
  monthlyEssentialMinor: bigint,
): Decimal {
  if (emergencyFundMinor < 0n || monthlyEssentialMinor < 0n) {
    throw new FinanceError(
      "Emergency fund and essential spending cannot be negative.",
    );
  }
  if (monthlyEssentialMinor === 0n) {
    return emergencyFundMinor > 0n ? new Decimal(99) : new Decimal(0);
  }
  return ratio(emergencyFundMinor, monthlyEssentialMinor);
}

export function remainingAfter(
  incomeMinor: bigint,
  ...outflows: bigint[]
): bigint {
  return outflows.reduce((left, outflow) => left - outflow, incomeMinor);
}

export const RATIO_GUIDES = {
  housingComfortable: FINANCE_ASSUMPTIONS.comfortableHousingRatio,
  housingManageable: FINANCE_ASSUMPTIONS.manageableHousingRatio,
  dtiComfortable: FINANCE_ASSUMPTIONS.comfortableDti,
  dtiHigh: FINANCE_ASSUMPTIONS.highRiskDti,
} as const;
