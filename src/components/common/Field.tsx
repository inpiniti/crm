import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12.5px] font-medium text-text-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-text-3">{hint}</span>}
    </label>
  );
}

export function FormRow({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={cn("grid gap-3", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>{children}</div>;
}
