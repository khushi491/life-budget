import { formatMoney, formatMoneyExact } from "@/lib/format";
import type { CurrencyCode } from "@/lib/finance";

export function Money({
  minor,
  currency,
  exact = false,
  className,
}: {
  minor: bigint | string;
  currency: CurrencyCode;
  exact?: boolean;
  className?: string;
}) {
  const value = exact
    ? formatMoneyExact(minor, currency)
    : formatMoney(minor, currency);
  return <span className={className}>{value}</span>;
}
