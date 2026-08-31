"use client";

import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy link",
}: {
  value: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void navigator.clipboard.writeText(value)}
    >
      {label}
    </Button>
  );
}
