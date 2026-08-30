"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

export function Explain({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="underline decoration-dotted underline-offset-4"
          >
            {term}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-foreground text-background z-50 max-w-xs rounded-2xl px-3 py-2 text-xs leading-5">
            {children}
            <Tooltip.Arrow className="fill-foreground" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
