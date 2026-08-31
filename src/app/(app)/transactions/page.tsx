import Link from "next/link";
import { getActiveHouseholdContext } from "@/lib/session";
import { getTransactionsPage } from "@/server/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/form";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteTransactionAction } from "@/server/actions";
import { TransactionsTools } from "@/components/transactions-tools";

function transactionsHref(input: {
  q?: string;
  type?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.type) params.set("type", input.type);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

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
  const totalPages = Math.max(1, Math.ceil(data.total / data.take));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Money in and out</h1>
        <p className="text-muted-foreground mt-2">
          Search, filter, import a CSV, or add a movement. Demo bank rows can be
          pulled in without a live bank connection.
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Page {data.page} of {totalPages} · {data.total} movements
        </p>
        <div className="flex gap-3 text-sm">
          {data.page > 1 ? (
            <Link
              className="text-primary"
              href={transactionsHref({
                q: params.q,
                type,
                page: data.page - 1,
              })}
            >
              Previous
            </Link>
          ) : null}
          {data.page < totalPages ? (
            <Link
              className="text-primary"
              href={transactionsHref({
                q: params.q,
                type,
                page: data.page + 1,
              })}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
