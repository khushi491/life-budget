import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-border bg-card rounded-3xl border p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardHint({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground mt-1 text-sm leading-6", className)}
      {...props}
    />
  );
}
