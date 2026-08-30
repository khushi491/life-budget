export type ExchangeQuote = {
  base: string;
  quote: string;
  rate: number;
  asOf: string;
  source: "mock" | "live";
};

export interface ExchangeRateProvider {
  getRate(base: string, quote: string): Promise<ExchangeQuote>;
}

const MOCK_USD_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.2,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
};

export class MockExchangeRateProvider implements ExchangeRateProvider {
  async getRate(base: string, quote: string): Promise<ExchangeQuote> {
    const fromUsd = MOCK_USD_RATES[base];
    const toUsd = MOCK_USD_RATES[quote];
    if (!fromUsd || !toUsd) {
      throw new Error(`No mock rate for ${base}/${quote}.`);
    }
    return {
      base,
      quote,
      rate: toUsd / fromUsd,
      asOf: new Date().toISOString(),
      source: "mock",
    };
  }
}

export const exchangeRateProvider: ExchangeRateProvider =
  new MockExchangeRateProvider();
