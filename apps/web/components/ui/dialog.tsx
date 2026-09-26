"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@lib/utils";
import { useIsClient } from "@hooks/useIsClient";
import { X } from "lucide-react";
import { lockBodyScroll } from "@lib/scroll-lock";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{ onOpenChange?: (open: boolean) => void }>({});

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  // 창은 <body> 바로 아래에 그린다(포털). 창을 여는 자리가 어디냐에 따라 창이 화면을 덮는 방식이
  // 달라지면 안 된다. 넓은 화면의 '내 구독' 옆 칸(aside)은 position:sticky라 쌓임 맥락을 만들고,
  // 그 안에서 그려진 fixed 창은 z-50이어도 aside 안에서만 위인 것이라, 상단 바(sticky z-40)가 창을
  // 덮어 버렸다 — 상단 바만 어두워지지 않고, 창 위쪽이 그 바 뒤로 잘려 보였다(크롬에서 특히).
  // 포털로 body에 붙이면 옆 칸의 쌓임 맥락·overflow를 벗어나 늘 화면 전체를 기준으로 그린다.
  // 포털 대상(document.body)은 서버에 없으므로, 브라우저에서 그릴 때만 붙인다.
  const isClient = useIsClient();

  // Close on Escape and lock background scrolling while the dialog is open.
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const unlockScroll = lockBodyScroll();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [open, onOpenChange]);

  if (!open || !isClient) return null;

  return createPortal(
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => onOpenChange?.(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>,
    document.body,
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
const DialogContent = ({
  className,
  children,
  hideClose = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** 닫기(X) 버튼을 두지 않는다. 취소 버튼이 따로 있는 확인 창(앱)에서 쓴다. 바깥·Esc로는 그대로 닫힌다. */
  hideClose?: boolean;
}) => {
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
      {!hideClose && (
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 z-20 rounded-sm bg-background/80 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
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
