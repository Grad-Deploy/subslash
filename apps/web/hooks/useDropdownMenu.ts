"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 상단 바의 펼치는 메뉴(계정 메뉴·화면 모드). 바깥을 누르거나 Esc를 누르면 닫고(Esc는 여는 버튼으로 포커스를
 * 돌린다), ↑↓로 항목 사이를 오간다. 열리면 `initialFocus` 항목에 포커스를 둔다. 두 메뉴가 같은 효과를 따로
 * 들고 있던 것을 모았다.
 *
 * `items`는 오갈 항목의 선택자다. 화면에 보이지 않는 항목(좁은 화면에서만 보이는 줄 등)은 건너뛴다.
 */
export function useDropdownMenu({
  items,
  initialFocus = items,
}: {
  items: string;
  initialFocus?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const list = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(items) ?? []).filter(
        (el) => el.offsetParent !== null,
      );
      if (list.length === 0) return;
      e.preventDefault();
      const current = list.indexOf(document.activeElement as HTMLElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      list[(current + step + list.length) % list.length]?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>(initialFocus)?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, items, initialFocus]);

  return { open, setOpen, rootRef, triggerRef, menuRef };
}
