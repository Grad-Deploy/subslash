"use client";

import { MoreHorizontal, Mail, Smartphone } from "lucide-react";
import { POPULAR_SERVICES, type ServicePreset } from "@subslash/shared";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { shortServiceName } from "@lib/service-name";
import { useT } from "@lib/i18n";

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
  /** 샘플로 둘러보기. 웹 첫 화면에서만 준다 — 앱은 첫 실행 소개의 마지막 장에서 고른다. */
  onSample?: () => void;
  /** 폰 사용 기록에서 찾기. 폰 기록을 읽을 수 있는 안드로이드 앱에서만 준다. */
  onUsage?: () => void;
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
  onUsage,
}: AppServicePickerProps) {
  const p = useT().reminders.picker;
  const tile =
    "flex flex-col items-center gap-1.5 rounded-2xl border bg-card px-1 pt-3 pb-2.5 text-[11px] font-semibold transition active:scale-[.97] hover:bg-muted";

  return (
    <section className="rounded-2xl border bg-card p-4">
      <h2 className="text-base font-extrabold tracking-tight">{p.title}</h2>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">{p.body}</p>

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
          {p.more}
        </button>
      </div>

      <button
        type="button"
        onClick={onEmail}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-[13px] font-bold hover:bg-muted"
      >
        <Mail className="size-4" aria-hidden />
        {p.email}
      </button>
      {onUsage && (
        <button
          type="button"
          onClick={onUsage}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-[13px] font-bold hover:bg-muted"
        >
          <Smartphone className="size-4" aria-hidden />
          {p.usage}
        </button>
      )}

      <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
        <button type="button" onClick={onCustom} className="underline underline-offset-4">
          {p.custom}
        </button>
        <span className="mx-2" aria-hidden>
          |
        </span>
        <button type="button" onClick={onPaste} className="underline underline-offset-4">
          {p.paste}
        </button>
        {onSample && (
          <>
            <span className="mx-2" aria-hidden>
              |
            </span>
            <button type="button" onClick={onSample} className="underline underline-offset-4">
              {p.sample}
            </button>
          </>
        )}
      </p>
    </section>
  );
}

/** 타일에는 괄호 속 설명(쿠팡플레이 등)을 빼고, 긴 이름은 앞말만 쓴다. */
function shortName(preset: ServicePreset): string {
  return preset.id === "youtube-premium" ? "유튜브" : shortServiceName(preset);
}
