import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { analyzeHomePurchase, amortize, fromMinor } from "@/lib/finance";
import { formatMoney, formatPercent, housingWord } from "@/lib/format";
import { BAND_COPY } from "@/lib/finance/affordability";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form";
import {
  ChartCard,
  ExpenseDonut,
  MortgageBalanceChart,
} from "@/components/charts";
import { saveHomeScenarioAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { getDashboardData } from "@/server/queries";

export default async function HousePage() {
  const { household, member } = await getActiveHouseholdContext();
  const [scenarios, dashboard, emergency] = await Promise.all([
    prisma.homeScenario.findMany({
      where: { householdId: household.id },
      orderBy: { createdAt: "asc" },
    }),
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
  const paymentWord = housingWord(household.currency);
  const currentHousing =
    dashboard.flow.find((step) => step.key === "housing")?.amountMinor ?? 0n;
  const savingsBeforeBuy = dashboard.remainingMinor + currentHousing;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">House planner</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          These results are educational estimates, not professional financial
          advice. We use your household’s actual income, savings, debts, and
          emergency fund — then translate the {paymentWord} into a
          plain-language risk band.
        </p>
      </header>

      {scenarios.map((scenario) => {
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
        const schedule = amortize({
          principalMinor: analysis.loanAmountMinor,
          annualRatePercent: scenario.annualRatePercent.toString(),
          termMonths: scenario.termMonths,
          extraPaymentMinor: scenario.extraPaymentMinor,
        });
        const yearly = schedule.rows
          .filter((row) => row.month % 12 === 0)
          .slice(0, 15);
        const copy = BAND_COPY[analysis.band];
        const costSlices = [
          {
            name: "Principal & interest",
            value: fromMinor(analysis.monthlyPaymentMinor).toNumber(),
          },
          {
            name: "Tax & insurance",
            value: fromMinor(
              scenario.propertyTaxAnnualMinor / 12n +
                scenario.insuranceAnnualMinor / 12n,
            ).toNumber(),
          },
          {
            name: "HOA / maintenance",
            value: fromMinor(
              scenario.hoaMonthlyMinor + scenario.maintenanceMonthlyMinor,
            ).toNumber(),
          },
          {
            name: "Utilities",
            value: fromMinor(scenario.utilitiesMonthlyMinor).toNumber(),
          },
        ].filter((row) => row.value > 0);
        return (
          <Card key={scenario.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>{scenario.name}</CardTitle>
                <CardHint>
                  {formatMoney(scenario.propertyPriceMinor, household.currency)}{" "}
                  home ·{" "}
                  {formatMoney(scenario.downPaymentMinor, household.currency)}{" "}
                  down
                </CardHint>
              </div>
              <Badge tone={copy.tone}>{copy.label}</Badge>
            </div>
            <p className="mt-4 text-lg leading-8">
              This home is {copy.label.toLowerCase()}. Monthly leftover would
              move from{" "}
              {formatMoney(dashboard.remainingMinor, household.currency)} to{" "}
              {formatMoney(
                analysis.monthlySavingsAfterMinor,
                household.currency,
              )}
              , with about {analysis.emergencyMonthsAfter.toFixed(1)} months of
              emergency savings after closing.
            </p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Monthly {paymentWord}</dt>
                <dd className="font-semibold">
                  {formatMoney(
                    analysis.monthlyPaymentMinor,
                    household.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Full monthly housing</dt>
                <dd className="font-semibold">
                  {formatMoney(
                    analysis.monthlyHousingCostMinor,
                    household.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cash needed up front</dt>
                <dd className="font-semibold">
                  {formatMoney(analysis.upfrontCashMinor, household.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Housing / income</dt>
                <dd className="font-semibold">
                  {formatPercent(analysis.housingRatio.toNumber())}
                </dd>
              </div>
            </dl>
            <ul className="text-muted-foreground mt-4 list-disc space-y-1 pl-5 text-sm">
              {analysis.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="text-sm font-medium">Suggested next moves</p>
              <ul className="mt-1 text-sm">
                {analysis.suggestions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="What the monthly housing cost is made of"
                explanation="Principal and interest plus the often-missed extras: tax, insurance, maintenance, and utilities."
                summary="Breakdown of complete monthly housing cost."
              >
                <ExpenseDonut data={costSlices} />
              </ChartCard>
              <ChartCard
                title="How the loan balance declines"
                explanation="Extra principal, if any, pulls the remaining balance down faster and cuts cumulative interest."
                summary="Loan remaining balance, principal paid, and interest paid over time."
              >
                <MortgageBalanceChart
                  data={yearly.map((row) => ({
                    month: `Y${row.month / 12}`,
                    balance: fromMinor(row.balanceMinor).toNumber(),
                    principal: fromMinor(
                      schedule.rows
                        .slice(0, row.month)
                        .reduce(
                          (sum, item) =>
                            sum + item.principalMinor + item.extraMinor,
                          0n,
                        ),
                    ).toNumber(),
                    interest: fromMinor(
                      schedule.rows
                        .slice(0, row.month)
                        .reduce((sum, item) => sum + item.interestMinor, 0n),
                    ).toNumber(),
                  }))}
                />
              </ChartCard>
            </div>
          </Card>
        );
      })}

      <Card>
        <CardTitle>Add another home to test</CardTitle>
        <form action={saveHomeScenarioAction} className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            ["name", "Scenario name", "text"],
            ["propertyPrice", "Home price", "text"],
            ["downPayment", "Down payment", "text"],
            ["currentSavings", "Cash available", "text"],
            ["annualRatePercent", "Interest rate %", "text"],
            ["termMonths", "Term in months", "number"],
            ["propertyTaxAnnual", "Annual property tax", "text"],
            ["insuranceAnnual", "Annual insurance", "text"],
            ["hoaMonthly", "HOA / society fee", "text"],
            ["maintenanceMonthly", "Repairs monthly", "text"],
            ["utilitiesMonthly", "Utilities monthly", "text"],
            ["closingCost", "Closing costs", "text"],
            ["movingCost", "Moving and furnishing", "text"],
            ["extraPayment", "Extra principal", "text"],
            ["rentMonthly", "Current rent", "text"],
          ].map(([name, label, type]) => (
            <div key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                name={name}
                type={type}
                required={
                  name === "name" ||
                  name === "propertyPrice" ||
                  name === "downPayment" ||
                  name === "annualRatePercent" ||
                  name === "termMonths"
                }
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button type="submit">Calculate affordability</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
