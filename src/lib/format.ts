import { format } from "date-fns";
import { CURRENCY_META, type CurrencyCode, fromMinor } from "@/lib/finance";

export function formatMoney(
  minor: bigint | string,
  currency: CurrencyCode,
  options?: { compact?: boolean },
): string {
  const value = fromMinor(
    typeof minor === "string" ? BigInt(minor) : minor,
  ).toNumber();
  const meta = CURRENCY_META[currency];
  if (options?.compact && Math.abs(value) >= 10_000) {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyExact(
  minor: bigint | string,
  currency: CurrencyCode,
): string {
  const value = fromMinor(
    typeof minor === "string" ? BigInt(minor) : minor,
  ).toNumber();
  return new Intl.NumberFormat(CURRENCY_META[currency].locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatMonths(months: number | null): string {
  if (months === null) return "Not reachable at this pace";
  if (months === 0) return "Already there";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  if (rest === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}y ${rest}m`;
}

export function housingWord(currency: CurrencyCode): string {
  return CURRENCY_META[currency].housingTerm === "emi"
    ? "EMI"
    : "mortgage payment";
}

export function formatDate(value: Date | string): string {
  return format(
    typeof value === "string" ? new Date(value) : value,
    "MMM d, yyyy",
  );
}

export function monthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function narrativeMoney(minor: bigint, currency: CurrencyCode): string {
  return formatMoney(minor, currency);
}
