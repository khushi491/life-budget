"use client";

import { Button } from "@/components/ui/button";

export function ConfirmButton({
  action,
  children,
  message,
  variant = "ghost",
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  message: string;
  variant?: "ghost" | "destructive";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => {
        if (window.confirm(message)) void action();
      }}
    >
      {children}
    </Button>
  );
}
