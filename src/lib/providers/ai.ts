export type MoneyQuestion = {
  question: string;
  householdSummary: string;
};

export type MoneyAnswer = {
  answer: string;
  provider: "rules" | "ai";
};

export interface AiFinanceProvider {
  answer(input: MoneyQuestion): Promise<MoneyAnswer>;
}

export class RulesAiProvider implements AiFinanceProvider {
  async answer(input: MoneyQuestion): Promise<MoneyAnswer> {
    return {
      provider: "rules",
      answer: `LifeBudget can already answer this from your numbers: ${input.householdSummary}. A natural-language advisor can be connected later through the AI provider interface — no paid service is required for the app to work.`,
    };
  }
}

export const aiFinanceProvider: AiFinanceProvider = new RulesAiProvider();
