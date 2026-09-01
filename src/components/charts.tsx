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
  "#9BE36B",
  "#C4B5FD",
  "#F9A8D4",
  "#FDE047",
  "#93C5FD",
  "#111111",
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
    <section className="bg-card rounded-[1.75rem] p-6">
      <h2 className="text-lg font-bold">{title}</h2>
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
          fill="#9BE36B"
          name="Income"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="expense"
          fill="#C4B5FD"
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
          innerRadius={70}
          outerRadius={90}
          paddingAngle={3}
          stroke="none"
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
          stroke="#111111"
          strokeWidth={3}
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
          fill="#C4B5FD"
          name="Renting net worth"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="buy"
          fill="#9BE36B"
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
          stroke="#111111"
          name="Remaining balance"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="principal"
          stroke="#9BE36B"
          name="Principal paid"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="interest"
          stroke="#F9A8D4"
          name="Interest paid"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
