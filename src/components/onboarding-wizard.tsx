"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { saveOnboardingAction } from "@/server/actions";
import type { OnboardingInput } from "@/lib/schemas";

const STEPS = [
  {
    title: "Welcome",
    why: "LifeBudget answers one question: after this lifestyle, can you safely afford the next big decision?",
  },
  {
    title: "Who is this for?",
    why: "The household type changes whether we track shared money, splitting, or dependents.",
  },
  {
    title: "Currency and place",
    why: "Amounts, dates, and whether we say EMI or mortgage follow this choice.",
  },
  {
    title: "Who is in the household?",
    why: "Names help later when we ask who paid and who a goal belongs to.",
  },
  {
    title: "Monthly take-home income",
    why: "This is the money that actually arrives after tax — the starting point for every plan.",
  },
  {
    title: "Fixed monthly bills",
    why: "Rent, insurance, minimum debt payments, and other must-pays define your required lifestyle.",
  },
  {
    title: "Flexible spending",
    why: "Dining, shopping, and similar costs are the easiest place to make room for a goal.",
  },
  {
    title: "Existing savings",
    why: "Cash you already have decides how quickly an emergency fund or down payment can happen.",
  },
  {
    title: "Current debts",
    why: "High-interest balances compete with savings. We need the total to size the pressure.",
  },
  {
    title: "Emergency-fund target",
    why: "A cash buffer is what makes a house, a baby, or a job change feel survivable.",
  },
  {
    title: "What are you saving for?",
    why: "Goals turn leftover money into a destination instead of a leftover.",
  },
  {
    title: "Home-buying plans",
    why: "If a home is on the horizon, we will keep housing cost in the story from day one.",
  },
  {
    title: "Your starting point",
    why: "This is not a score. It is a readable snapshot you can refine as you go.",
  },
];

const empty: OnboardingInput = {
  mode: "INDIVIDUAL",
  currency: "USD",
  locale: "en-US",
  householdName: "My household",
  members: [{ displayName: "", role: "OWNER", isDependent: false }],
  monthlyIncome: "",
  fixedBills: "",
  flexibleSpending: "",
  existingSavings: "",
  currentDebts: "",
  emergencyTargetMonths: 6,
  goals: ["EMERGENCY_FUND"],
  homeBuying: false,
  propertyPrice: "",
};

export function OnboardingWizard({
  initial,
}: {
  initial?: Partial<OnboardingInput>;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingInput>({ ...empty, ...initial });
  const [error, setError] = useState<string | null>(null);

  async function persist(complete: boolean) {
    setError(null);
    const result = await saveOnboardingAction(data, complete);
    if (result && "error" in result && result.error) setError(result.error);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-3xl font-semibold">{STEPS[step]?.title}</h1>
          <p className="text-muted-foreground mt-2">{STEPS[step]?.why}</p>
          <div className="mt-8 space-y-4">
            {renderStep(step, data, setData)}
          </div>
        </motion.div>
      </AnimatePresence>
      {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}
      <div className="mt-10 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
        ) : (
          <Button onClick={() => void persist(true)}>
            See my starting point
          </Button>
        )}
        <Button variant="ghost" onClick={() => void persist(false)}>
          Save and resume later
        </Button>
      </div>
    </div>
  );
}

function MoneyField({
  id,
  label,
  example,
  value,
  onChange,
}: {
  id: string;
  label: string;
  example: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        placeholder={example}
      />
      <button
        type="button"
        className="text-primary mt-2 text-sm"
        onClick={() => onChange("")}
      >
        I don’t know yet
      </button>
    </div>
  );
}

function renderStep(
  step: number,
  data: OnboardingInput,
  setData: (data: OnboardingInput) => void,
) {
  if (step === 0) {
    return (
      <p className="text-lg leading-8">
        We’ll go one question at a time. Guessing is allowed. You can refine
        everything later.
      </p>
    );
  }
  if (step === 1) {
    return (
      <div className="grid gap-3">
        {(["INDIVIDUAL", "COUPLE", "FAMILY"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setData({ ...data, mode })}
            className={`rounded-3xl border px-4 py-4 text-left ${data.mode === mode ? "border-primary bg-accent" : "border-border"}`}
          >
            <span className="font-semibold capitalize">
              {mode.toLowerCase()}
            </span>
          </button>
        ))}
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="border-input h-11 w-full rounded-2xl border px-3"
            value={data.currency}
            onChange={(event) =>
              setData({
                ...data,
                currency: event.target.value as OnboardingInput["currency"],
                locale: event.target.value === "INR" ? "en-IN" : "en-US",
              })
            }
          >
            <option value="USD">US Dollar</option>
            <option value="INR">Indian Rupee</option>
            <option value="EUR">Euro</option>
            <option value="GBP">British Pound</option>
            <option value="CAD">Canadian Dollar</option>
          </select>
        </div>
        <div>
          <Label htmlFor="householdName">Household name</Label>
          <Input
            id="householdName"
            value={data.householdName}
            onChange={(event) =>
              setData({ ...data, householdName: event.target.value })
            }
          />
        </div>
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="space-y-3">
        {data.members.map((member, index) => (
          <Input
            key={index}
            value={member.displayName}
            placeholder={index === 0 ? "Your name" : "Household member"}
            onChange={(event) => {
              const members = [...data.members];
              members[index] = { ...member, displayName: event.target.value };
              setData({ ...data, members });
            }}
          />
        ))}
        {data.mode !== "INDIVIDUAL" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setData({
                ...data,
                members: [
                  ...data.members,
                  {
                    displayName: "",
                    role: data.mode === "FAMILY" ? "ADULT" : "PARTNER",
                    isDependent: false,
                  },
                ],
              })
            }
          >
            Add another person
          </Button>
        ) : null}
      </div>
    );
  }
  if (step === 4) {
    return (
      <MoneyField
        id="income"
        label="Typical monthly take-home"
        example="8500"
        value={data.monthlyIncome ?? ""}
        onChange={(monthlyIncome) => setData({ ...data, monthlyIncome })}
      />
    );
  }
  if (step === 5) {
    return (
      <MoneyField
        id="bills"
        label="Required bills each month"
        example="3200"
        value={data.fixedBills ?? ""}
        onChange={(fixedBills) => setData({ ...data, fixedBills })}
      />
    );
  }
  if (step === 6) {
    return (
      <MoneyField
        id="flex"
        label="Flexible lifestyle spending"
        example="1800"
        value={data.flexibleSpending ?? ""}
        onChange={(flexibleSpending) => setData({ ...data, flexibleSpending })}
      />
    );
  }
  if (step === 7) {
    return (
      <MoneyField
        id="savings"
        label="Cash and savings you already have"
        example="12000"
        value={data.existingSavings ?? ""}
        onChange={(existingSavings) => setData({ ...data, existingSavings })}
      />
    );
  }
  if (step === 8) {
    return (
      <MoneyField
        id="debts"
        label="Total balances you still owe"
        example="18000"
        value={data.currentDebts ?? ""}
        onChange={(currentDebts) => setData({ ...data, currentDebts })}
      />
    );
  }
  if (step === 9) {
    return (
      <div>
        <Label htmlFor="months">Months of essentials to keep in cash</Label>
        <Input
          id="months"
          type="number"
          min={1}
          max={12}
          value={data.emergencyTargetMonths}
          onChange={(event) =>
            setData({
              ...data,
              emergencyTargetMonths: Number(event.target.value),
            })
          }
        />
        <p className="text-muted-foreground mt-2 text-sm">
          Three to six months is a common first safety target.
        </p>
      </div>
    );
  }
  if (step === 10) {
    const options = [
      "EMERGENCY_FUND",
      "HOUSE_DOWN_PAYMENT",
      "CAR",
      "VACATION",
      "WEDDING",
      "EDUCATION",
      "RETIREMENT",
    ];
    return (
      <div className="grid gap-2">
        {options.map((goal) => {
          const on = data.goals.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              className={`rounded-2xl border px-4 py-3 text-left ${on ? "border-primary bg-accent" : "border-border"}`}
              onClick={() =>
                setData({
                  ...data,
                  goals: on
                    ? data.goals.filter((item) => item !== goal)
                    : [...data.goals, goal],
                })
              }
            >
              {goal.replaceAll("_", " ").toLowerCase()}
            </button>
          );
        })}
      </div>
    );
  }
  if (step === 11) {
    return (
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.homeBuying}
            onChange={(event) =>
              setData({ ...data, homeBuying: event.target.checked })
            }
          />
          We are thinking about buying a home
        </label>
        {data.homeBuying ? (
          <MoneyField
            id="price"
            label="A home price you are curious about"
            example="520000"
            value={data.propertyPrice ?? ""}
            onChange={(propertyPrice) => setData({ ...data, propertyPrice })}
          />
        ) : null}
      </div>
    );
  }
  const income = Number(data.monthlyIncome || 0);
  const bills = Number(data.fixedBills || 0);
  const flex = Number(data.flexibleSpending || 0);
  const leftover = income - bills - flex;
  return (
    <div className="border-border bg-card rounded-3xl border p-6">
      <h2 className="text-xl font-semibold">Your financial starting point</h2>
      <p className="mt-3 leading-7">
        {data.householdName} is set up as a {data.mode.toLowerCase()} household
        in {data.currency}. If a typical month looks like this, about{" "}
        {leftover > 0 ? leftover : 0} would be left after required bills and
        flexible spending — the raw material for savings, debt, and the next
        life decision.
      </p>
      <p className="text-muted-foreground mt-3 text-sm">
        These are educational estimates, not professional financial advice. Next
        you’ll land on the home dashboard, where this sketch becomes a living
        picture as you add real transactions.
      </p>
    </div>
  );
}
