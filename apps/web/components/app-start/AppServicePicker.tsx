"use client";

import { MoreHorizontal, Mail } from "lucide-react";
import { POPULAR_SERVICES, type ServicePreset } from "@subslash/shared";
import { ServiceLogo } from "@components/subscription/ServiceLogo";

/** 빈 대시보드에 바로 누를 수 있게 올려 둘 서비스. 나머지는 '더 보기'(서비스 고르기)에서 찾는다. */
const QUICK_IDS = ["netflix", "youtube-premium", "coupang-wow", "tving", "spotify"];

const QUICK: ServicePreset[] = QUICK_IDS.flatMap((id) => {
  const preset = POPULAR_SERVICES.find((p) => p.id === id);
  return preset ? [preset] : [];
});

interface AppServicePickerProps {
  onPick: (preset: ServicePreset) => void;
  onMore: () => void;
  onEmail: () => void;
  onCustom: () => void;
  onPaste: () => void;
  /** 샘플로 둘러보기. 웹 첫 화면에서만 준다 — 앱은 환영 화면에서 고른다. */
  onSample?: () => void;
}

/**
 * 구독이 하나도 없을 때의 대시보드(웹·앱). "아직 없습니다" 대신 지금 할 일 하나(쓰고 있는
 * 구독 고르기)를 크게 보여준다.
 */
export function AppServicePicker({
  onPick,
  onMore,
  onEmail,
  onCustom,
  onPaste,
  onSample,
}: AppServicePickerProps) {
  const tile =
    "flex flex-col items-center gap-1.5 rounded-2xl border bg-card px-1 pt-3 pb-2.5 text-[11px] font-semibold transition active:scale-[.97] hover:bg-muted";

  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="text-base font-extrabold tracking-tight">쓰고 있는 구독을 골라보세요</h2>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">
        하나만 골라도 1회당 얼마인지 바로 계산돼요.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {QUICK.map((preset) => (
          <button key={preset.id} type="button" className={tile} onClick={() => onPick(preset)}>
            <ServiceLogo presetId={preset.id} name={preset.nameKo} size={30} />
            <span className="w-full truncate text-center">{shortName(preset)}</span>
          </button>
        ))}
        <button type="button" className={tile} onClick={onMore}>
          <span className="grid size-[30px] place-items-center rounded-md bg-muted text-muted-foreground">
            <MoreHorizontal className="size-4" aria-hidden />
          </span>
          더 보기
        </button>
      </div>

      <button
        type="button"
        onClick={onEmail}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-[13px] font-bold hover:bg-muted"
      >
        <Mail className="size-4" aria-hidden />
        결제 메일에서 한 번에 찾기
      </button>

      <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
        <button type="button" onClick={onCustom} className="underline underline-offset-4">
          목록에 없어요 · 직접 입력
        </button>
        <span className="mx-2" aria-hidden>
          |
        </span>
        <button type="button" onClick={onPaste} className="underline underline-offset-4">
          문자 붙여넣기
        </button>
        {onSample && (
          <>
            <span className="mx-2" aria-hidden>
              |
            </span>
            <button type="button" onClick={onSample} className="underline underline-offset-4">
              샘플로 둘러보기
            </button>
          </>
        )}
      </p>
    </section>
  );
}

/** 타일에는 괄호 속 설명(쿠팡플레이 등)을 빼고, 긴 이름은 앞말만 쓴다. */
function shortName(preset: ServicePreset): string {
  const base = preset.nameKo.replace(/\s*\(.*\)$/, "");
  return preset.id === "youtube-premium" ? "유튜브" : base;
}
