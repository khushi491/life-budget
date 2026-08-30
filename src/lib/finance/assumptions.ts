/**
 * Financial calculation assumptions used across LifeBudget.
 *
 * Rounding
 * - Money is stored as integer minor units (cents / paise / pence).
 * - Intermediate math uses decimal.js at 40 digits of precision.
 * - Payments and balances round to the nearest minor unit with HALF_EVEN
 *   (banker's rounding) unless a lender's last installment absorbs remainder.
 *
 * Loans
 * - The quoted annual percentage rate is converted to a monthly rate as APR / 12.
 *   This is a standard educational simplifying assumption, not a daily-compound
 *   APY conversion.
 * - A 0% loan amortizes in equal principal installments.
 * - Extra principal is applied after the scheduled interest for that month.
 *
 * Ratios
 * - Debt-to-income uses recurring monthly debt payments / take-home income.
 * - Housing-to-income uses the complete monthly housing cost / take-home income.
 * - Emergency-fund coverage uses liquid cash / average monthly essential outgo.
 *
 * Projections
 * - Inflation, rent growth, and property appreciation compound annually.
 * - Investment returns compound monthly using annualRate / 12.
 * - Rent-versus-buy does not model taxes, PMI, or transaction-cost regional
 *   variation unless the caller supplies those amounts.
 *
 * These results are educational estimates, not professional financial advice.
 */
export const FINANCE_ASSUMPTIONS = {
  minorUnitsPerMajor: 100,
  decimalPrecision: 40,
  monthlyRateDivisor: 12,
  comfortableHousingRatio: 0.28,
  manageableHousingRatio: 0.36,
  highRiskHousingRatio: 0.5,
  comfortableDti: 0.36,
  highRiskDti: 0.43,
  comfortableEmergencyMonths: 3,
  highRiskEmergencyMonths: 1,
  comfortableSavingsRate: 0.1,
  defaultInflationPct: 2.5,
  defaultAppreciationPct: 3,
  defaultInvestmentReturnPct: 6,
  defaultSellingCostPct: 6,
} as const;
