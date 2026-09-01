import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-input bg-card placeholder:text-muted-foreground h-12 w-full rounded-full border px-5 text-sm outline-none",
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
        "border-input bg-card placeholder:text-muted-foreground min-h-28 w-full rounded-3xl border px-5 py-3 text-sm outline-none",
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
    good: "bg-mint text-foreground",
    caution: "bg-sun text-foreground",
    risk: "bg-blush text-foreground",
    info: "bg-lavender text-foreground",
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
