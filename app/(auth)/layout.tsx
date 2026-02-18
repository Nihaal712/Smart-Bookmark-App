import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Server Component by default (no "use client")
  return <>{children}</>;
}

