import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** 플랫 패널. 그림자 없이 배경 대비 + 얇은 테두리 */
export function Panel({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)} {...rest} />;
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {back && <div className="mb-1.5 text-[13px] text-text-3">{back}</div>}
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">{title}</h1>
        {description && <div className="mt-1 text-[13px] text-text-2">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

export function Section({ title, extra, children, className }: { title: ReactNode; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      {Icon && <Icon className="mb-1 size-6 text-text-3" strokeWidth={1.5} />}
      <div className="text-[14px] font-medium">{title}</div>
      {description && <div className="text-[13px] text-text-3">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** 큰 숫자 스탯 (토스증권 스타일) */
export function Stat({ label, value, tone = "default", suffix }: { label: string; value: ReactNode; tone?: "red" | "blue" | "default" | "muted"; suffix?: string }) {
  const color = tone === "red" ? "text-red" : tone === "blue" ? "text-blue" : tone === "muted" ? "text-text-3" : "text-foreground";
  return (
    <div className="px-1">
      <div className="text-[12.5px] text-text-3">{label}</div>
      <div className={cn("num mt-0.5 text-[26px] font-bold leading-tight", color)}>
        {value}
        {suffix && <span className="ml-0.5 text-[14px] font-medium text-text-3">{suffix}</span>}
      </div>
    </div>
  );
}
