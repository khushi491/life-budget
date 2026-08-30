"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#0f766e",
  "#1d4ed8",
  "#b45309",
  "#7c3aed",
  "#be123c",
  "#475569",
];

export function ChartCard({
  title,
  explanation,
  summary,
  children,
  empty,
}: {
  title: string;
  explanation: string;
  summary: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="border-border bg-card rounded-3xl border p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        {explanation}
      </p>
      <p className="sr-only">{summary}</p>
      <div className="mt-4 h-72">
        {empty ? (
          <p className="text-muted-foreground flex h-full items-center text-sm">
            Nothing to chart yet. Add a few transactions and this picture will
            appear.
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function IncomeExpenseChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="income"
          fill="#0f766e"
          name="Income"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="expense"
          fill="#b45309"
          name="Spending"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function NetWorthChart({
  data,
}: {
  data: { month: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0f766e"
          strokeWidth={2}
          dot={false}
          name="Net worth"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComparisonChart({
  data,
}: {
  data: { year: string; rent: number; buy: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="rent"
          fill="#1d4ed8"
          name="Renting net worth"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="buy"
          fill="#0f766e"
          name="Buying net worth"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MortgageBalanceChart({
  data,
}: {
  data: {
    month: string;
    balance: number;
    principal: number;
    interest: number;
  }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#1d4ed8"
          name="Remaining balance"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="principal"
          stroke="#0f766e"
          name="Principal paid"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="interest"
          stroke="#b45309"
          name="Interest paid"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
