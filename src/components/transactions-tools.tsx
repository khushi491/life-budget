"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { importCsvAction } from "@/server/actions";
import { toast } from "sonner";

export function TransactionsTools() {
  const router = useRouter();
  const [preview, setPreview] = useState<
    {
      date: string;
      amount: string;
      merchant: string;
      type: "INCOME" | "EXPENSE";
    }[]
  >([]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <form className="flex flex-wrap gap-3" action="/transactions">
        <Input
          name="q"
          placeholder="Search merchant or note"
          className="w-56"
        />
        <select
          name="type"
          className="border-input h-11 rounded-2xl border px-3"
        >
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Spending</option>
          <option value="TRANSFER">Transfers</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      <label className="text-sm">
        Import CSV
        <input
          type="file"
          accept=".csv"
          className="ml-2 text-sm"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            const header = lines[0]?.toLowerCase() ?? "";
            const rows = lines
              .slice(header.includes("date") ? 1 : 0)
              .map((line) => {
                const [date, amount, merchant] = line
                  .split(",")
                  .map((part) => part.trim());
                const numeric = Number(amount);
                return {
                  date: date || new Date().toISOString().slice(0, 10),
                  amount: Math.abs(numeric).toString(),
                  merchant: merchant || "Imported",
                  type:
                    numeric < 0 ? ("EXPENSE" as const) : ("INCOME" as const),
                };
              });
            setPreview(rows.slice(0, 8));
            const result = await importCsvAction(rows);
            if ("error" in result) toast.error(result.error);
            else {
              toast.success(`Imported ${result.count} rows`);
              router.refresh();
            }
          }}
        />
      </label>
      <a className="text-primary text-sm" href="/api/export/transactions">
        Export CSV
      </a>
      {preview.length ? (
        <p className="text-muted-foreground w-full text-xs">
          Previewed first rows: {preview.map((row) => row.merchant).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
