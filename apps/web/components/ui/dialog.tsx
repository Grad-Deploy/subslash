"use client";

import * as React from "react";
import { cn } from "@lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{ onOpenChange?: (open: boolean) => void }>({});

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  // Close on Escape and lock background scrolling while the dialog is open.
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => onOpenChange?.(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>
  );
};

/**
 * The dialog panel itself. Sizing classes passed via `className`
 * (e.g. `sm:max-w-md`, `max-w-2xl`) override the defaults through `cn`.
 *
 * 높이는 `dvh`로 잰다. iOS Safari에서 `vh`는 주소창을 감춘 **가장 큰** 화면 높이라, `90vh`짜리
 * 창은 실제로 보이는 높이보다 커진다 — 창의 위아래가 화면 밖으로 잘리고 오른쪽 위 닫기 버튼이
 * 아예 보이지 않았다.
 *
 * 스크롤은 안쪽 칸이 맡는다. 창 자체가 스크롤하면 그 안에 절대 배치한 닫기 버튼이 내용과 함께
 * 밀려 올라가, 긴 폼(구독 정보 수정)에서는 조금만 내려도 닫을 방법이 사라졌다.
 */
const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { onOpenChange } = React.useContext(DialogContext);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative z-50 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background shadow-lg animate-in fade-in zoom-in-95",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => onOpenChange?.(false)}
        className="absolute right-4 top-4 z-20 rounded-sm bg-background/80 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6">
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 pr-8 text-center sm:text-left", className)}
    {...props}
  />
);

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
    {...props}
  />
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
