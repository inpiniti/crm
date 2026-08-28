"use client";

import { useActionState, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/app/actions/result";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/** 서버 액션 폼. 성공 → 토스트/onSuccess, 실패 → 에러 토스트 + 인라인 표시. Ctrl+Enter 제출. */
export function ActionForm({
  action,
  children,
  successMessage,
  onSuccess,
  resetOnSuccess,
  className,
}: {
  action: Action;
  children: ReactNode;
  successMessage?: string;
  onSuccess?: (result: Extract<ActionResult, { ok: true }>) => void;
  resetOnSuccess?: boolean;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<ActionResult | null>(null);

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      if (successMessage) toast.success(successMessage);
      if (resetOnSuccess) formRef.current?.reset();
      if (state.redirect) router.push(state.redirect);
      onSuccess?.(state);
    } else {
      toast.error(state.error);
    }
  }, [state, successMessage, onSuccess, resetOnSuccess, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
      }}
    >
      {state && !state.ok && <div className="mb-3 rounded-lg bg-red-weak px-3 py-2 text-[13px] text-red">{state.error}</div>}
      {children}
    </form>
  );
}

/** 폼 pending 상태를 반영하는 제출 버튼 */
export function SubmitButton({ children, className, ...rest }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={cn(className)} {...rest}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/** 확인 다이얼로그 후 실행하는 액션 (삭제 등) */
export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel = "삭제하기",
  successMessage,
  children,
  variant = "ghost",
  size = "sm",
  className,
}: {
  action: () => Promise<ActionResult>;
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const r = await action();
                setBusy(false);
                if (r.ok) {
                  setOpen(false);
                  if (successMessage) toast.success(successMessage);
                  if (r.redirect) router.push(r.redirect);
                  else router.refresh();
                } else toast.error(r.error);
              }}
            >
              {busy && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
