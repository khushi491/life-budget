import { getActiveHouseholdContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { BudgetBuilder } from "@/components/budget-builder";
import { BudgetBars } from "@/components/flow";
import { Card, CardHint, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/server/queries";

export default async function BudgetPage() {
  const { household, member } = await getActiveHouseholdContext();
  const now = new Date();
  const [categories, budget, dashboard] = await Promise.all([
    prisma.category.findMany({
      where: {
        householdId: household.id,
        group: { in: ["HOUSING", "ESSENTIAL", "LIFESTYLE", "DEBT", "SAVINGS"] },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.budget.findFirst({
      where: {
        householdId: household.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
      include: { categories: true },
    }),
    getDashboardData({
      householdId: household.id,
      memberId: member.id,
      role: member.role,
      view: "month",
    }),
  ]);

  const spent = new Map<string, bigint>();
  for (const slice of dashboard.categorySlices) {
    const match = categories.find((row) => row.name === slice.name);
    if (match) spent.set(match.id, slice.amountMinor);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Budget builder</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Allocate every dollar (or rupee) in order: income, required bills,
          essentials, lifestyle, savings, then debt. If the plan exceeds income,
          we’ll ask you to trim before confirming.
        </p>
      </header>
      <BudgetBuilder
        currency={household.currency}
        categories={categories.map((row) => ({
          id: row.id,
          name: row.name,
          group: row.group,
        }))}
        incomeMinor={
          budget?.incomeMinor.toString() ?? dashboard.incomeMinor.toString()
        }
        limits={Object.fromEntries(
          (budget?.categories ?? []).map((row) => [
            row.categoryId,
            row.limitMinor.toString(),
          ]),
        )}
        year={now.getFullYear()}
        month={now.getMonth() + 1}
      />
      <Card>
        <CardTitle>Planned versus actual</CardTitle>
        <CardHint>
          Bars compare this month’s spending with the limits you confirmed.
        </CardHint>
        <div className="mt-4">
          <BudgetBars
            currency={household.currency}
            rows={(budget?.categories ?? []).map((row) => ({
              name:
                categories.find((category) => category.id === row.categoryId)
                  ?.name ?? "Category",
              spent: spent.get(row.categoryId) ?? 0n,
              limit: row.limitMinor,
            }))}
          />
        </div>
      </Card>
    </div>
  );
}
