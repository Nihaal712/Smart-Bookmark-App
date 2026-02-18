import type { ReactNode } from "react";

import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Server Component by default (no "use client")
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="bottom-right" duration={3500} />
      </body>
    </html>
  );
}

