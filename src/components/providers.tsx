"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
      <PwaRegister />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
