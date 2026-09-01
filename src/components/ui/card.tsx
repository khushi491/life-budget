import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-card rounded-[1.75rem] p-6 shadow-none", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-lg font-bold tracking-tight", className)}
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
