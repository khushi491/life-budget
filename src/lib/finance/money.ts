import Decimal from "decimal.js";
import { FINANCE_ASSUMPTIONS } from "./assumptions";

Decimal.set({
  precision: FINANCE_ASSUMPTIONS.decimalPrecision,
  rounding: Decimal.ROUND_HALF_EVEN,
});

export { Decimal };

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "CAD";

export const CURRENCY_META: Record<
  CurrencyCode,
  {
    symbol: string;
    locale: string;
    housingTerm: "mortgage" | "emi";
    name: string;
  }
> = {
  USD: {
    symbol: "$",
    locale: "en-US",
    housingTerm: "mortgage",
    name: "US Dollar",
  },
  INR: {
    symbol: "₹",
    locale: "en-IN",
    housingTerm: "emi",
    name: "Indian Rupee",
  },
  EUR: { symbol: "€", locale: "de-DE", housingTerm: "mortgage", name: "Euro" },
  GBP: {
    symbol: "£",
    locale: "en-GB",
    housingTerm: "mortgage",
    name: "British Pound",
  },
  CAD: {
    symbol: "C$",
    locale: "en-CA",
    housingTerm: "mortgage",
    name: "Canadian Dollar",
  },
};

export class FinanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceError";
  }
}

export function assertFiniteDecimal(
  value: Decimal.Value,
  label: string,
): Decimal {
  const decimal = new Decimal(value);
  if (!decimal.isFinite()) {
    throw new FinanceError(`${label} must be a finite number.`);
  }
  return decimal;
}

export function toMinor(major: Decimal.Value): bigint {
  const decimal = assertFiniteDecimal(major, "Amount");
  const rounded = decimal
    .mul(FINANCE_ASSUMPTIONS.minorUnitsPerMajor)
    .toDecimalPlaces(0);
  return BigInt(rounded.toFixed(0));
}

export function fromMinor(minor: bigint): Decimal {
  return new Decimal(minor.toString()).div(
    FINANCE_ASSUMPTIONS.minorUnitsPerMajor,
  );
}

export function roundMinor(value: Decimal): bigint {
  if (!value.isFinite()) {
    throw new FinanceError("Cannot round a non-finite amount.");
  }
  return BigInt(value.toDecimalPlaces(0).toFixed(0));
}

export function addMinor(...values: bigint[]): bigint {
  return values.reduce((sum, value) => sum + value, 0n);
}

export function ratio(numerator: bigint, denominator: bigint): Decimal {
  if (denominator === 0n) return new Decimal(0);
  return new Decimal(numerator.toString()).div(denominator.toString());
}

export function pct(numerator: bigint, denominator: bigint): Decimal {
  return ratio(numerator, denominator).mul(100);
}
