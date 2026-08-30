export { FINANCE_ASSUMPTIONS } from "./assumptions";
export {
  Decimal,
  FinanceError,
  CURRENCY_META,
  type CurrencyCode,
  toMinor,
  fromMinor,
  roundMinor,
  addMinor,
  ratio,
  pct,
} from "./money";
export {
  mortgagePayment,
  amortize,
  totalInterest,
  type AmortizationResult,
} from "./loan";
export {
  savingsRate,
  debtToIncomeRatio,
  housingToIncomeRatio,
  emergencyFundCoverageMonths,
  remainingAfter,
} from "./ratios";
export {
  monthsToGoal,
  requiredMonthlyContribution,
  recommendedContribution,
} from "./goals";
export { compoundGrowth, inflate, netWorthProjection } from "./projections";
export { compareRentVsBuy } from "./rent-vs-buy";
export {
  analyzeHomePurchase,
  BAND_COPY,
  type AffordabilityBand,
  type HomeAnalysis,
} from "./affordability";
export { orderSnowball, orderAvalanche, simulatePayoff } from "./debt";
