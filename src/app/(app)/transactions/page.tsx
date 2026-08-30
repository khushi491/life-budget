import { getActiveHouseholdContext } from "@/lib/session";
import { getTransactionsPage } from "@/server/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteTransactionAction } from "@/server/actions";
import { TransactionsTools } from "@/components/transactions-tools";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { member, household } = await getActiveHouseholdContext();
  const type =
    params.type === "INCOME" ||
    params.type === "EXPENSE" ||
    params.type === "TRANSFER"
      ? params.type
      : undefined;
  const data = await getTransactionsPage({
    householdId: household.id,
    memberId: member.id,
    role: member.role,
    q: params.q,
    type,
    page: Number(params.page ?? 1),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Money in and out</h1>
        <p className="text-muted-foreground mt-2">
          Search, filter, import a CSV, or add a movement. Bank connections can
          be added later through the import provider.
        </p>
      </header>
      <TransactionsTools />
      <div className="border-border overflow-x-auto rounded-3xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">What</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Who paid</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="border-border border-t">
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3">
                  {row.merchant ?? row.description ?? row.type}
                  {row.visibility === "PRIVATE" ? (
                    <Badge className="ml-2" tone="info">
                      Private
                    </Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3">{row.category?.name ?? "—"}</td>
                <td className="px-4 py-3">{row.paidBy?.displayName ?? "—"}</td>
                <td className="px-4 py-3 font-medium">
                  {row.type === "INCOME"
                    ? "+"
                    : row.type === "EXPENSE"
                      ? "−"
                      : ""}
                  {formatMoney(row.amountMinor, household.currency)}
                </td>
                <td className="px-4 py-3">
                  <ConfirmButton
                    message="Delete this movement? This cannot be undone."
                    action={deleteTransactionAction.bind(null, row.id)}
                  >
                    Delete
                  </ConfirmButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-sm">
        Page {data.page} · {data.total} movements
      </p>
    </div>
  );
}
