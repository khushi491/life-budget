import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  analyzeHomePurchase,
  compareRentVsBuy,
  fromMinor,
} from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import { getDashboardData } from "@/server/queries";
import { ChartCard, ComparisonChart } from "@/components/charts";
import { Card, CardHint, CardTitle } from "@/components/ui/card";

export default async function ScenariosPage() {
  const { household, member } = await getActiveHouseholdContext();
  const [scenarios, dashboard, emergency] = await Promise.all([
    prisma.homeScenario.findMany({ where: { householdId: household.id } }),
    getDashboardData({
      householdId: household.id,
      memberId: member.id,
      role: member.role,
      view: "month",
    }),
    prisma.financialGoal.findFirst({
      where: { householdId: household.id, type: "EMERGENCY_FUND" },
    }),
  ]);

  const currentHousing =
    dashboard.flow.find((step) => step.key === "housing")?.amountMinor ?? 0n;
  const savingsBeforeBuy = dashboard.remainingMinor + currentHousing;

  const rows = scenarios.map((scenario) => {
    const analysis = analyzeHomePurchase({
      propertyPriceMinor: scenario.propertyPriceMinor,
      downPaymentMinor: scenario.downPaymentMinor,
      currentSavingsMinor: scenario.currentSavingsMinor,
      annualRatePercent: scenario.annualRatePercent.toString(),
      termMonths: scenario.termMonths,
      propertyTaxAnnualMinor: scenario.propertyTaxAnnualMinor,
      insuranceAnnualMinor: scenario.insuranceAnnualMinor,
      hoaMonthlyMinor: scenario.hoaMonthlyMinor,
      maintenanceMonthlyMinor: scenario.maintenanceMonthlyMinor,
      utilitiesMonthlyMinor: scenario.utilitiesMonthlyMinor,
      closingCostMinor: scenario.closingCostMinor,
      movingCostMinor: scenario.movingCostMinor,
      extraPaymentMinor: scenario.extraPaymentMinor,
      expectedIncomeChangeMinor: scenario.expectedIncomeChangeMinor,
      monthlyIncomeMinor: dashboard.incomeMinor,
      monthlySavingsBeforeMinor: savingsBeforeBuy,
      monthlyDebtMinor: dashboard.monthlyDebt,
      monthlyEssentialsMinor: dashboard.requiredMinor,
      emergencyFundMinor: emergency?.currentMinor ?? 0n,
    });
    const comparison = compareRentVsBuy({
      years: [5, 10, 20, 30],
      monthlyRentMinor: scenario.rentMonthlyMinor,
      propertyPriceMinor: scenario.propertyPriceMinor,
      downPaymentMinor: scenario.downPaymentMinor,
      closingCostMinor: scenario.closingCostMinor,
      movingCostMinor: scenario.movingCostMinor,
      annualRatePercent: scenario.annualRatePercent.toString(),
      termMonths: scenario.termMonths,
      extraPaymentMinor: scenario.extraPaymentMinor,
      propertyTaxAnnualMinor: scenario.propertyTaxAnnualMinor,
      insuranceAnnualMinor: scenario.insuranceAnnualMinor,
      hoaMonthlyMinor: scenario.hoaMonthlyMinor,
      maintenanceMonthlyMinor: scenario.maintenanceMonthlyMinor,
      utilitiesMonthlyMinor: scenario.utilitiesMonthlyMinor,
      monthlySavingsIfRentingMinor: dashboard.savingsMinor,
    });
    return { scenario, analysis, comparison };
  });

  const first = rows[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Scenario comparison</h1>
        <p className="text-muted-foreground mt-2">
          Compare renting, buying now, buying later, and different down
          payments. The chart uses this household’s real savings rate — we will
          not pick the decision for you.
        </p>
      </header>
      {first ? (
        <ChartCard
          title="Renting versus buying net worth"
          explanation="Estimated household net worth if you keep renting versus buying the baseline home, using the same leftover savings."
          summary="Grouped bars of renting versus buying net worth at 5, 10, 20, and 30 years."
        >
          <ComparisonChart
            data={first.comparison.map((row) => ({
              year: `${row.year}y`,
              rent: fromMinor(row.rentNetWorthMinor).toNumber(),
              buy: fromMinor(row.buyNetWorthMinor).toNumber(),
            }))}
          />
        </ChartCard>
      ) : (
        <p>Add a home scenario first.</p>
      )}
      <div className="border-border overflow-x-auto rounded-3xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-3">Scenario</th>
              <th className="px-4 py-3">Up front</th>
              <th className="px-4 py-3">Monthly housing</th>
              <th className="px-4 py-3">Savings left</th>
              <th className="px-4 py-3">Emergency months</th>
              <th className="px-4 py-3">Total interest</th>
              <th className="px-4 py-3">Payoff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ scenario, analysis }) => (
              <tr key={scenario.id} className="border-border border-t">
                <td className="px-4 py-3 font-medium">{scenario.name}</td>
                <td className="px-4 py-3">
                  {formatMoney(analysis.upfrontCashMinor, household.currency)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(
                    analysis.monthlyHousingCostMinor,
                    household.currency,
                  )}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(
                    analysis.monthlySavingsAfterMinor,
                    household.currency,
                  )}
                </td>
                <td className="px-4 py-3">
                  {analysis.emergencyMonthsAfter.toFixed(1)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(analysis.totalInterestMinor, household.currency)}
                </td>
                <td className="px-4 py-3">
                  {Math.round(analysis.payoffMonth / 12)} years
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card>
        <CardTitle>How to read the differences</CardTitle>
        <CardHint>
          A cheaper home or a larger down payment usually restores emergency
          savings. A later purchase needs more time renting but can reduce the
          loan. The numbers are estimates under documented assumptions in the
          README.
        </CardHint>
      </Card>
    </div>
  );
}
