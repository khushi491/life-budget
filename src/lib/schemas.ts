import { z } from "zod";

export const currencySchema = z.enum(["USD", "INR", "EUR", "GBP", "CAD"]);
export const householdModeSchema = z.enum(["INDIVIDUAL", "COUPLE", "FAMILY"]);

export const moneyInputSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount, or choose I don't know.")
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a number like 2500 or 2500.50");

export const optionalMoneySchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+(?:\.\d{1,2})?$/.test(value),
    "Enter a number like 2500 or 2500.50",
  );

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(10, "Use at least 10 characters."),
});

export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Enter the name you would like to use."),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: moneyInputSchema,
  date: z.string().min(1, "Choose a date."),
  merchant: z.string().trim().max(120).optional(),
  description: z.string().trim().max(240).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  transferAccountId: z.string().optional(),
  visibility: z.enum(["SHARED", "PRIVATE"]).default("SHARED"),
  paidByMemberId: z.string().optional(),
  tags: z.string().optional(),
});

export const budgetCategorySchema = z.object({
  categoryId: z.string(),
  limitMinor: z.string().regex(/^\d+$/),
});

export const goalSchema = z.object({
  name: z.string().trim().min(2, "Give this goal a name."),
  type: z.enum([
    "EMERGENCY_FUND",
    "HOUSE_DOWN_PAYMENT",
    "CAR",
    "VACATION",
    "WEDDING",
    "EDUCATION",
    "RETIREMENT",
    "CUSTOM",
  ]),
  targetAmount: moneyInputSchema,
  currentAmount: optionalMoneySchema,
  monthlyContribution: optionalMoneySchema,
  targetDate: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
});

export const homeScenarioSchema = z.object({
  name: z.string().trim().min(2),
  propertyPrice: moneyInputSchema,
  downPayment: moneyInputSchema,
  currentSavings: optionalMoneySchema,
  annualRatePercent: z
    .string()
    .regex(/^\d+(?:\.\d{1,4})?$/, "Enter an interest rate."),
  termMonths: z.coerce.number().int().min(12).max(480),
  propertyTaxAnnual: optionalMoneySchema,
  insuranceAnnual: optionalMoneySchema,
  hoaMonthly: optionalMoneySchema,
  maintenanceMonthly: optionalMoneySchema,
  utilitiesMonthly: optionalMoneySchema,
  closingCost: optionalMoneySchema,
  movingCost: optionalMoneySchema,
  extraPayment: optionalMoneySchema,
  expectedIncomeChange: optionalMoneySchema,
  rentMonthly: optionalMoneySchema,
});

export const onboardingSchema = z.object({
  mode: householdModeSchema,
  currency: currencySchema,
  locale: z.string().min(2),
  householdName: z.string().trim().min(2),
  members: z
    .array(
      z.object({
        displayName: z.string().trim().min(1),
        role: z.enum(["OWNER", "PARTNER", "ADULT", "DEPENDENT", "VIEWER"]),
        isDependent: z.boolean(),
      }),
    )
    .min(1),
  monthlyIncome: optionalMoneySchema,
  incomeUnknown: z.boolean().optional(),
  fixedBills: optionalMoneySchema,
  billsUnknown: z.boolean().optional(),
  flexibleSpending: optionalMoneySchema,
  flexibleUnknown: z.boolean().optional(),
  existingSavings: optionalMoneySchema,
  savingsUnknown: z.boolean().optional(),
  currentDebts: optionalMoneySchema,
  debtsUnknown: z.boolean().optional(),
  emergencyTargetMonths: z.coerce.number().min(1).max(12),
  goals: z.array(z.string()),
  homeBuying: z.boolean(),
  propertyPrice: optionalMoneySchema,
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type HomeScenarioInput = z.infer<typeof homeScenarioSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
