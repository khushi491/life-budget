import { config } from "dotenv";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import {
  Category,
  CurrencyCode,
  GoalType,
  HouseholdMode,
  LiabilityType,
  MemberRole,
  MilestoneKey,
  Prisma,
} from "@prisma/client";
import { SYSTEM_CATEGORIES } from "../src/lib/categories";
import { toMinor } from "../src/lib/finance";

config();

function rng(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function jitter(random: () => number, base: number, spread: number) {
  return Math.round(base * (1 - spread + random() * spread * 2));
}

async function ensureUser(email: string, name: string, password: string) {
  const { prisma } = await import("../src/lib/db");
  const { auth } = await import("../src/lib/auth");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  await auth.api.signUpEmail({ body: { email, name, password } });
  return prisma.user.findUniqueOrThrow({ where: { email } });
}

type SeedHousehold = {
  demoKey: string;
  name: string;
  mode: HouseholdMode;
  currency: CurrencyCode;
  locale: string;
  members: {
    email?: string;
    displayName: string;
    role: MemberRole;
    isDependent?: boolean;
  }[];
  income: { member: string; amount: number; label: string }[];
  rent: number;
  utilities: number;
  groceries: number;
  dining: number;
  transit: number;
  childcare?: number;
  medical?: number;
  education?: number;
  savings: number;
  emergency: { current: number; target: number };
  goals: {
    name: string;
    type: GoalType;
    target: number;
    current: number;
    monthly: number;
    monthsAhead: number;
  }[];
  assets: {
    name: string;
    type:
      | "CASH"
      | "BANK"
      | "INVESTMENT"
      | "RETIREMENT"
      | "PROPERTY"
      | "VEHICLE"
      | "OTHER";
    value: number;
  }[];
  liabilities: {
    name: string;
    type: LiabilityType;
    balance: number;
    apr: number;
    min: number;
  }[];
  bills: { name: string; amount: number; category: string }[];
  house: {
    name: string;
    price: number;
    down: number;
    savings: number;
    rate: number;
    tax: number;
    insurance: number;
    hoa: number;
    maintenance: number;
    utilities: number;
    closing: number;
    moving: number;
    extra: number;
    rent: number;
  }[];
  budget: Record<string, number>;
  milestones: MilestoneKey[];
};

const DEMO_PASSWORD = "DemoPass123!";

const households: SeedHousehold[] = [
  {
    demoKey: "individual",
    name: "Alex's budget",
    mode: "INDIVIDUAL",
    currency: "USD",
    locale: "en-US",
    members: [
      {
        email: "alex.individual@demo.lifebudget.app",
        displayName: "Alex Rivera",
        role: "OWNER",
      },
    ],
    income: [{ member: "Alex Rivera", amount: 5400, label: "Paycheck" }],
    rent: 1650,
    utilities: 140,
    groceries: 380,
    dining: 220,
    transit: 90,
    savings: 600,
    emergency: { current: 4200, target: 7200 },
    goals: [
      {
        name: "Emergency fund",
        type: "EMERGENCY_FUND",
        target: 7200,
        current: 4200,
        monthly: 350,
        monthsAhead: 10,
      },
      {
        name: "Used car",
        type: "CAR",
        target: 12000,
        current: 2800,
        monthly: 250,
        monthsAhead: 18,
      },
      {
        name: "Portugal trip",
        type: "VACATION",
        target: 3200,
        current: 900,
        monthly: 150,
        monthsAhead: 14,
      },
    ],
    assets: [
      { name: "Checking", type: "BANK", value: 3100 },
      { name: "High-yield savings", type: "CASH", value: 4200 },
      { name: "Brokerage", type: "INVESTMENT", value: 6800 },
    ],
    liabilities: [
      {
        name: "Student loan",
        type: "STUDENT_LOAN",
        balance: 16400,
        apr: 5.2,
        min: 180,
      },
    ],
    bills: [
      { name: "Rent", amount: 1650, category: "Rent" },
      { name: "Internet + phone", amount: 95, category: "Utilities" },
      { name: "Student loan", amount: 180, category: "Student loans" },
    ],
    house: [
      {
        name: "Studio near work",
        price: 310000,
        down: 62000,
        savings: 7300,
        rate: 6.4,
        tax: 2800,
        insurance: 1100,
        hoa: 180,
        maintenance: 120,
        utilities: 130,
        closing: 7000,
        moving: 2500,
        extra: 0,
        rent: 1650,
      },
    ],
    budget: {
      Rent: 1650,
      Utilities: 140,
      Groceries: 400,
      Dining: 240,
      Transit: 100,
      "Student loans": 180,
      "Emergency fund": 350,
      Personal: 120,
    },
    milestones: ["UNDERSTAND_CASH_FLOW", "STAY_WITHIN_BUDGET"],
  },
  {
    demoKey: "couple",
    name: "Hale household",
    mode: "COUPLE",
    currency: "USD",
    locale: "en-US",
    members: [
      {
        email: "jordan.couple@demo.lifebudget.app",
        displayName: "Jordan Hale",
        role: "OWNER",
      },
      {
        email: "sam.couple@demo.lifebudget.app",
        displayName: "Sam Hale",
        role: "PARTNER",
      },
    ],
    income: [
      { member: "Jordan Hale", amount: 5200, label: "Paycheck" },
      { member: "Sam Hale", amount: 3300, label: "Paycheck" },
    ],
    rent: 2400,
    utilities: 210,
    groceries: 620,
    dining: 410,
    transit: 180,
    savings: 1200,
    emergency: { current: 8400, target: 18000 },
    goals: [
      {
        name: "Emergency fund",
        type: "EMERGENCY_FUND",
        target: 18000,
        current: 8400,
        monthly: 500,
        monthsAhead: 20,
      },
      {
        name: "House down payment",
        type: "HOUSE_DOWN_PAYMENT",
        target: 90000,
        current: 32000,
        monthly: 700,
        monthsAhead: 36,
      },
      {
        name: "Wedding remainder",
        type: "WEDDING",
        target: 8000,
        current: 4500,
        monthly: 250,
        monthsAhead: 8,
      },
    ],
    assets: [
      { name: "Joint checking", type: "BANK", value: 6200 },
      { name: "High-yield savings", type: "CASH", value: 8400 },
      { name: "Down-payment account", type: "BANK", value: 32000 },
      { name: "Brokerage", type: "INVESTMENT", value: 18400 },
      { name: "Jordan 401(k)", type: "RETIREMENT", value: 41000 },
      { name: "Sam IRA", type: "RETIREMENT", value: 12600 },
    ],
    liabilities: [
      {
        name: "Jordan student loan",
        type: "STUDENT_LOAN",
        balance: 21000,
        apr: 4.8,
        min: 220,
      },
      { name: "Car loan", type: "CAR_LOAN", balance: 9800, apr: 6.1, min: 285 },
      {
        name: "Travel card",
        type: "CREDIT_CARD",
        balance: 2400,
        apr: 21.9,
        min: 75,
      },
    ],
    bills: [
      { name: "Rent", amount: 2400, category: "Rent" },
      { name: "Electric + gas", amount: 140, category: "Utilities" },
      { name: "Internet", amount: 70, category: "Utilities" },
      { name: "Car loan", amount: 285, category: "Car loan" },
      { name: "Student loan", amount: 220, category: "Student loans" },
    ],
    house: [
      {
        name: "Buy now — Oak Street two-bed",
        price: 520000,
        down: 104000,
        savings: 40400,
        rate: 6.5,
        tax: 6200,
        insurance: 1800,
        hoa: 0,
        maintenance: 280,
        utilities: 240,
        closing: 14000,
        moving: 6000,
        extra: 0,
        rent: 2400,
      },
      {
        name: "Smaller condo",
        price: 430000,
        down: 86000,
        savings: 40400,
        rate: 6.5,
        tax: 4800,
        insurance: 1500,
        hoa: 220,
        maintenance: 180,
        utilities: 210,
        closing: 11000,
        moving: 4500,
        extra: 150,
        rent: 2400,
      },
      {
        name: "Buy later with a larger down payment",
        price: 520000,
        down: 156000,
        savings: 40400,
        rate: 6.25,
        tax: 6200,
        insurance: 1800,
        hoa: 0,
        maintenance: 280,
        utilities: 240,
        closing: 14000,
        moving: 6000,
        extra: 0,
        rent: 2400,
      },
    ],
    budget: {
      Rent: 2400,
      Utilities: 220,
      Groceries: 650,
      Dining: 420,
      Transit: 200,
      "Car loan": 285,
      "Student loans": 220,
      "Credit cards": 75,
      "Emergency fund": 500,
      "House down payment": 700,
      Entertainment: 180,
    },
    milestones: [
      "UNDERSTAND_CASH_FLOW",
      "STAY_WITHIN_BUDGET",
      "ONE_MONTH_EMERGENCY",
    ],
  },
  {
    demoKey: "family",
    name: "Mehta family",
    mode: "FAMILY",
    currency: "INR",
    locale: "en-IN",
    members: [
      {
        email: "priya.family@demo.lifebudget.app",
        displayName: "Priya Mehta",
        role: "OWNER",
      },
      { displayName: "Arjun Mehta", role: "PARTNER" },
      { displayName: "Aanya", role: "DEPENDENT", isDependent: true },
      { displayName: "Vihaan", role: "DEPENDENT", isDependent: true },
    ],
    income: [
      { member: "Priya Mehta", amount: 110000, label: "Paycheck" },
      { member: "Arjun Mehta", amount: 70000, label: "Paycheck" },
    ],
    rent: 35000,
    utilities: 4500,
    groceries: 18000,
    dining: 7000,
    transit: 6000,
    childcare: 14000,
    medical: 3500,
    education: 8000,
    savings: 22000,
    emergency: { current: 180000, target: 540000 },
    goals: [
      {
        name: "Emergency fund",
        type: "EMERGENCY_FUND",
        target: 540000,
        current: 180000,
        monthly: 15000,
        monthsAhead: 24,
      },
      {
        name: "Apartment down payment",
        type: "HOUSE_DOWN_PAYMENT",
        target: 2400000,
        current: 620000,
        monthly: 18000,
        monthsAhead: 48,
      },
      {
        name: "Aanya education",
        type: "EDUCATION",
        target: 800000,
        current: 90000,
        monthly: 6000,
        monthsAhead: 60,
      },
    ],
    assets: [
      { name: "Salary account", type: "BANK", value: 92000 },
      { name: "Sweep savings", type: "CASH", value: 180000 },
      { name: "Down-payment FD", type: "BANK", value: 620000 },
      { name: "Mutual funds", type: "INVESTMENT", value: 410000 },
      { name: "EPF", type: "RETIREMENT", value: 560000 },
    ],
    liabilities: [
      {
        name: "Car loan",
        type: "CAR_LOAN",
        balance: 280000,
        apr: 9.1,
        min: 9800,
      },
      {
        name: "Credit card",
        type: "CREDIT_CARD",
        balance: 24000,
        apr: 36,
        min: 2500,
      },
    ],
    bills: [
      { name: "Rent", amount: 35000, category: "Rent" },
      { name: "Electricity + gas", amount: 3200, category: "Utilities" },
      { name: "School fees", amount: 8000, category: "Education" },
      { name: "Daycare", amount: 14000, category: "Childcare" },
      { name: "Car EMI", amount: 9800, category: "Car loan" },
    ],
    house: [
      {
        name: "Whitefield 3BHK",
        price: 12000000,
        down: 2400000,
        savings: 800000,
        rate: 8.4,
        tax: 0,
        insurance: 18000,
        hoa: 6500,
        maintenance: 4000,
        utilities: 5000,
        closing: 180000,
        moving: 80000,
        extra: 5000,
        rent: 35000,
      },
      {
        name: "Smaller 2BHK nearby",
        price: 8500000,
        down: 1700000,
        savings: 800000,
        rate: 8.4,
        tax: 0,
        insurance: 14000,
        hoa: 4500,
        maintenance: 3000,
        utilities: 4200,
        closing: 120000,
        moving: 60000,
        extra: 0,
        rent: 35000,
      },
    ],
    budget: {
      Rent: 35000,
      Utilities: 4500,
      Groceries: 19000,
      Dining: 7500,
      Transit: 6500,
      Childcare: 14000,
      Education: 8000,
      Medical: 4000,
      "Car loan": 9800,
      "Emergency fund": 15000,
      "House down payment": 18000,
    },
    milestones: [
      "UNDERSTAND_CASH_FLOW",
      "STAY_WITHIN_BUDGET",
      "ONE_MONTH_EMERGENCY",
    ],
  },
];

async function seedHousehold(spec: SeedHousehold) {
  const { prisma } = await import("../src/lib/db");
  await prisma.household.deleteMany({ where: { demoKey: spec.demoKey } });

  const users = [];
  for (const member of spec.members) {
    if (member.email) {
      users.push({
        ...member,
        user: await ensureUser(member.email, member.displayName, DEMO_PASSWORD),
      });
    } else {
      users.push({ ...member, user: null });
    }
  }

  const household = await prisma.household.create({
    data: {
      name: spec.name,
      mode: spec.mode,
      currency: spec.currency,
      locale: spec.locale,
      demoKey: spec.demoKey,
      onboardingComplete: true,
      onboardingStep: 13,
      emergencyFundTargetMinor: toMinor(spec.emergency.target),
      splitMethod: spec.mode === "INDIVIDUAL" ? "EQUAL" : "INCOME_PERCENT",
    },
  });

  const memberRows = [];
  for (const member of users) {
    memberRows.push(
      await prisma.householdMember.create({
        data: {
          householdId: household.id,
          userId: member.user?.id,
          displayName: member.displayName,
          role: member.role,
          isDependent: Boolean(member.isDependent),
        },
      }),
    );
  }

  const categoryRows: Category[] = [];
  for (const [index, category] of SYSTEM_CATEGORIES.entries()) {
    categoryRows.push(
      await prisma.category.create({
        data: {
          householdId: household.id,
          name: category.name,
          group: category.group,
          icon: category.icon,
          color: category.color,
          sortOrder: index,
        },
      }),
    );
  }
  const cat = (name: string) => categoryRows.find((row) => row.name === name)!;

  const checking = await prisma.financialAccount.create({
    data: {
      householdId: household.id,
      name: spec.mode === "INDIVIDUAL" ? "Checking" : "Joint checking",
      type: "checking",
      currency: spec.currency,
      isShared: true,
      balanceMinor: toMinor(spec.assets[0]?.value ?? 0),
    },
  });

  const owner = memberRows[0]!;
  const now = new Date();
  const random = rng(spec.demoKey.length * 97 + spec.income[0]!.amount);

  const txData: Prisma.TransactionCreateManyInput[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const month = startOfMonth(subMonths(now, i));
    for (const paycheck of spec.income) {
      const payer =
        memberRows.find((row) => row.displayName === paycheck.member) ?? owner;
      txData.push({
        householdId: household.id,
        type: "INCOME",
        amountMinor: toMinor(paycheck.amount),
        currency: spec.currency,
        date: new Date(month.getFullYear(), month.getMonth(), 1),
        merchant: `${paycheck.member.split(" ")[0]}'s employer`,
        description: paycheck.label,
        categoryId: cat("Paycheck").id,
        accountId: checking.id,
        paidByMemberId: payer.id,
      });
    }
    const monthExpenses: {
      amount: number;
      category: string;
      merchant: string;
      day: number;
      payer?: string;
    }[] = [
      { amount: spec.rent, category: "Rent", merchant: "Landlord", day: 1 },
      {
        amount: jitter(random, spec.utilities, 0.08),
        category: "Utilities",
        merchant: "City utilities",
        day: 6,
      },
      {
        amount: jitter(random, spec.groceries, 0.12),
        category: "Groceries",
        merchant: "Market",
        day: 4,
      },
      {
        amount: jitter(random, spec.groceries * 0.45, 0.15),
        category: "Groceries",
        merchant: "Weekly grocer",
        day: 18,
      },
      {
        amount: jitter(random, spec.dining, 0.2),
        category: "Dining",
        merchant: "Neighborhood kitchen",
        day: 9,
      },
      {
        amount: jitter(random, spec.dining * 0.4, 0.25),
        category: "Dining",
        merchant: "Friday dinner",
        day: 22,
      },
      {
        amount: jitter(random, spec.transit, 0.1),
        category: "Transit",
        merchant: "Transit card",
        day: 3,
      },
      {
        amount: jitter(random, spec.savings * 0.4, 0.05),
        category: "Emergency fund",
        merchant: "Transfer to savings",
        day: 2,
      },
      {
        amount: jitter(random, spec.savings * 0.6, 0.05),
        category: "House down payment",
        merchant: "Down-payment account",
        day: 2,
      },
    ];
    if (spec.childcare)
      monthExpenses.push({
        amount: spec.childcare,
        category: "Childcare",
        merchant: "Little Oak daycare",
        day: 5,
      });
    if (spec.education)
      monthExpenses.push({
        amount: spec.education,
        category: "Education",
        merchant: "School fees",
        day: 7,
      });
    if (spec.medical)
      monthExpenses.push({
        amount: jitter(random, spec.medical, 0.3),
        category: "Medical",
        merchant: "Clinic",
        day: 14,
      });
    for (const bill of spec.liabilities) {
      const categoryName =
        bill.type === "STUDENT_LOAN"
          ? "Student loans"
          : bill.type === "CAR_LOAN"
            ? "Car loan"
            : "Credit cards";
      monthExpenses.push({
        amount: bill.min,
        category: categoryName,
        merchant: bill.name,
        day: 8,
      });
    }
    if (i === 0) {
      monthExpenses.push({
        amount: jitter(random, spec.dining * 0.8, 0.1),
        category: "Dining",
        merchant: "Birthday dinner",
        day: 16,
      });
    }
    for (const expense of monthExpenses) {
      const category = cat(expense.category);
      txData.push({
        householdId: household.id,
        type: "EXPENSE",
        amountMinor: toMinor(expense.amount),
        currency: spec.currency,
        date: new Date(month.getFullYear(), month.getMonth(), expense.day),
        merchant: expense.merchant,
        categoryId: category.id,
        accountId: checking.id,
        paidByMemberId: owner.id,
        visibility: "SHARED",
      });
    }
  }

  await prisma.transaction.createMany({ data: txData });

  const budget = await prisma.budget.create({
    data: {
      householdId: household.id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      incomeMinor: toMinor(
        spec.income.reduce((sum, row) => sum + row.amount, 0),
      ),
      warningPct: 80,
      confirmed: true,
    },
  });
  await prisma.budgetCategory.createMany({
    data: Object.entries(spec.budget).map(([name, limit]) => ({
      budgetId: budget.id,
      categoryId: cat(name).id,
      limitMinor: toMinor(limit),
    })),
  });

  for (const goal of spec.goals) {
    const created = await prisma.financialGoal.create({
      data: {
        householdId: household.id,
        name: goal.name,
        type: goal.type,
        targetMinor: toMinor(goal.target),
        currentMinor: toMinor(goal.current),
        monthlyContributionMinor: toMinor(goal.monthly),
        targetDate: addMonths(now, goal.monthsAhead),
        priority:
          goal.type === "EMERGENCY_FUND" || goal.type === "HOUSE_DOWN_PAYMENT"
            ? "HIGH"
            : "MEDIUM",
      },
    });
    await prisma.goalContribution.create({
      data: {
        goalId: created.id,
        memberId: owner.id,
        amountMinor: toMinor(goal.monthly),
        date: now,
        note: "Typical monthly contribution",
      },
    });
  }

  for (const asset of spec.assets) {
    await prisma.asset.create({
      data: {
        householdId: household.id,
        name: asset.name,
        type: asset.type,
        valueMinor: toMinor(asset.value),
        currency: spec.currency,
      },
    });
  }
  for (const liability of spec.liabilities) {
    await prisma.liability.create({
      data: {
        householdId: household.id,
        name: liability.name,
        type: liability.type,
        balanceMinor: toMinor(liability.balance),
        interestApr: new Prisma.Decimal(liability.apr),
        minPaymentMinor: toMinor(liability.min),
        currency: spec.currency,
      },
    });
  }

  for (let i = 11; i >= 0; i -= 1) {
    const asOf = startOfMonth(subMonths(now, i));
    const growth = 1 + (11 - i) * 0.012;
    const assetsMinor = toMinor(
      Math.round(
        spec.assets.reduce((sum, row) => sum + row.value, 0) * (growth - 0.08),
      ),
    );
    const liabilitiesMinor = toMinor(
      Math.round(
        spec.liabilities.reduce((sum, row) => sum + row.balance, 0) *
          (1.04 - (11 - i) * 0.003),
      ),
    );
    await prisma.netWorthSnapshot.create({
      data: {
        householdId: household.id,
        asOf,
        assetsMinor,
        liabilitiesMinor,
        netWorthMinor: assetsMinor - liabilitiesMinor,
      },
    });
  }

  for (const bill of spec.bills) {
    await prisma.recurrenceRule.create({
      data: {
        householdId: household.id,
        name: bill.name,
        type: "EXPENSE",
        amountMinor: toMinor(bill.amount),
        currency: spec.currency,
        frequency: "MONTHLY",
        nextRunOn: addMonths(startOfMonth(now), 1),
        merchant: bill.name,
        categoryId: cat(bill.category).id,
        accountId: checking.id,
        paidByMemberId: owner.id,
      },
    });
  }

  for (const [index, scenario] of spec.house.entries()) {
    await prisma.homeScenario.create({
      data: {
        householdId: household.id,
        name: scenario.name,
        isBaseline: index === 0,
        propertyPriceMinor: toMinor(scenario.price),
        downPaymentMinor: toMinor(scenario.down),
        currentSavingsMinor: toMinor(scenario.savings),
        annualRatePercent: new Prisma.Decimal(scenario.rate),
        termMonths: 360,
        propertyTaxAnnualMinor: toMinor(scenario.tax),
        insuranceAnnualMinor: toMinor(scenario.insurance),
        hoaMonthlyMinor: toMinor(scenario.hoa),
        maintenanceMonthlyMinor: toMinor(scenario.maintenance),
        utilitiesMonthlyMinor: toMinor(scenario.utilities),
        closingCostMinor: toMinor(scenario.closing),
        movingCostMinor: toMinor(scenario.moving),
        extraPaymentMinor: toMinor(scenario.extra),
        rentMonthlyMinor: toMinor(scenario.rent),
      },
    });
  }

  await prisma.financialMilestone.createMany({
    data: spec.milestones.map((key) => ({ householdId: household.id, key })),
  });

  if (users[0]?.user) {
    await prisma.userPreference.upsert({
      where: { userId: users[0].user.id },
      update: { locale: spec.locale },
      create: {
        userId: users[0].user.id,
        locale: spec.locale,
        housingTerm: spec.currency === "INR" ? "emi" : "mortgage",
      },
    });
  }

  return household.name;
}

async function main() {
  const { prisma } = await import("../src/lib/db");
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@demo.lifebudget.app" } },
  });
  for (const spec of households) {
    const name = await seedHousehold(spec);
    console.log(`Seeded ${name}`);
  }
}

main()
  .then(async () => {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
    process.exit(1);
  });
