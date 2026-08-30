import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { fromMinor } from "@/lib/finance";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to export." },
      { status: 401 },
    );
  }
  const member = await prisma.householdMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  });
  if (!member) {
    return NextResponse.json({ error: "No household." }, { status: 403 });
  }
  const rows = await prisma.transaction.findMany({
    where: { householdId: member.householdId },
    include: { category: true },
    orderBy: { date: "desc" },
  });
  const csv = [
    "date,type,amount,merchant,category",
    ...rows.map((row) =>
      [
        row.date.toISOString().slice(0, 10),
        row.type,
        fromMinor(row.amountMinor).toFixed(2),
        JSON.stringify(row.merchant ?? ""),
        JSON.stringify(row.category?.name ?? ""),
      ].join(","),
    ),
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=lifebudget-transactions.csv",
    },
  });
}
