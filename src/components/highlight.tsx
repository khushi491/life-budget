import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  sun: "bg-sun",
  mint: "bg-mint",
  lavender: "bg-lavender",
  blush: "bg-blush",
} as const;

export function Highlight({
  children,
  tone = "sun",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-[0.12em] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
