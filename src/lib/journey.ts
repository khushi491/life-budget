import { MilestoneKey } from "@prisma/client";

export const JOURNEY: {
  key: MilestoneKey;
  title: string;
  description: string;
  next: string;
}[] = [
  {
    key: "UNDERSTAND_CASH_FLOW",
    title: "Understand cash flow",
    description: "See how money arrives, what must go out, and what is left.",
    next: "Give every essential category a monthly limit.",
  },
  {
    key: "STAY_WITHIN_BUDGET",
    title: "Stay within budget",
    description: "Keep spending inside the plan for a full month.",
    next: "Move leftover money into a one-month emergency fund.",
  },
  {
    key: "ONE_MONTH_EMERGENCY",
    title: "Build one month of emergency savings",
    description: "Cover a month of required expenses without new income.",
    next: "Send extra money to high-interest balances first.",
  },
  {
    key: "ELIMINATE_HIGH_INTEREST_DEBT",
    title: "Eliminate high-interest debt",
    description: "Clear costly revolving balances so savings can stick.",
    next: "Grow the emergency fund toward three to six months.",
  },
  {
    key: "THREE_TO_SIX_MONTH_EMERGENCY",
    title: "Build three to six months of emergency savings",
    description: "Create a buffer for job changes, medical costs, or repairs.",
    next: "Aim regular contributions at your major life goals.",
  },
  {
    key: "SAVE_MAJOR_GOALS",
    title: "Save toward major goals",
    description:
      "Fund the house, education, or other life decisions on purpose.",
    next: "Run the house planner before making an offer.",
  },
  {
    key: "PREPARE_HOME",
    title: "Prepare for home ownership",
    description:
      "Know the full monthly cost, cash to close, and remaining safety net.",
    next: "Keep investing and tracking net worth after the purchase.",
  },
  {
    key: "GROW_NET_WORTH",
    title: "Grow long-term net worth",
    description: "Let assets compound after the household is protected.",
    next: "Review net worth quarterly and rebalance goals.",
  },
];

export function currentJourneyIndex(earned: MilestoneKey[]): number {
  const earnedSet = new Set(earned);
  const idx = JOURNEY.findIndex((step) => !earnedSet.has(step.key));
  return idx === -1 ? JOURNEY.length - 1 : idx;
}
