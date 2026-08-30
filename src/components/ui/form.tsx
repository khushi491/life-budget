import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground h-11 w-full rounded-2xl border px-4 text-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground min-h-28 w-full rounded-2xl border px-4 py-3 text-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium", className)}
      {...props}
    />
  );
}

export { Modal, ModalContent, ModalTrigger } from "./modal";

export function Badge({
  className,
  tone = "default",
  ...props
}: ComponentProps<"span"> & {
  tone?: "default" | "good" | "caution" | "risk" | "info";
}) {
  const tones = {
    default: "bg-muted text-foreground",
    good: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    caution:
      "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
    risk: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100",
    info: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
