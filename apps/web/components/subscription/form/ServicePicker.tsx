"use client";

import {
  CATEGORY_LABELS,
  ServicePreset,
  type SubscriptionCategory,
  describePresetPrice,
} from "@subslash/shared";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { ServiceLogo } from "../ServiceLogo";

/** 서비스 고르기 탭의 순서. 목록에 서비스가 하나도 없는 분류는 탭을 만들지 않는다. */
const PICK_CATEGORY_ORDER: SubscriptionCategory[] = [
  "ott",
  "music",
  "ai",
  "shopping",
  "cloud",
  "other",
];

/**
 * 서비스 고르기의 탭. 분류 탭 말고 '결합 상품'이 따로 있다 — 결합 상품(배민클럽 + 유튜브 프리미엄 등)을
 * OTT·AI 탭에 섞어 두면 단독 구독과 나란히 보여 무엇을 고르는지 헷갈린다.
 */
export type PickTab = SubscriptionCategory | "all" | "bundle";

const isBundle = (service: ServicePreset) => (service.includes?.length ?? 0) > 0;

/** 그 탭에 보일 서비스. 결합 상품은 '결합 상품' 탭에만 있고 분류 탭에는 없다('전체'에는 있다). */
function inTab(service: ServicePreset, tab: PickTab): boolean {
  if (tab === "all") return true;
  if (tab === "bundle") return isBundle(service);
  return !isBundle(service) && service.category === tab;
}

/**
 * 구독 등록의 첫 단계: 목록에서 서비스를 고르거나 직접 입력으로 넘어간다.
 *
 * 검색어와 분류는 폼이 들고 있다 — '다른 서비스'로 돌아왔을 때 보던 분류가 남아 있고, 직접
 * 입력은 검색어를 이름으로 채운다.
 */
export function ServicePicker({
  popularServices,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  onPick,
  onCustom,
}: {
  popularServices: ServicePreset[];
  query: string;
  onQueryChange: (query: string) => void;
  category: PickTab;
  onCategoryChange: (category: PickTab) => void;
  onPick: (service: ServicePreset) => void;
  onCustom: () => void;
}) {
  const keyword = query.trim().toLowerCase();
  // 검색어가 있으면 고른 분류와 상관없이 전체에서 찾는다. 분류를 잘못 고른 채
  // 검색하면 목록에 있는 서비스도 '없다'고 보이기 때문이다.
  const matches = keyword
    ? popularServices.filter(
        (service) =>
          service.nameKo.toLowerCase().includes(keyword) ||
          service.name.toLowerCase().includes(keyword),
      )
    : popularServices.filter((service) => inTab(service, category));
  const countOf = (tab: PickTab) => popularServices.filter((service) => inTab(service, tab)).length;
  const tabs: PickTab[] = [
    "all",
    ...PICK_CATEGORY_ORDER.filter((tab) => countOf(tab) > 0),
    ...(countOf("bundle") > 0 ? (["bundle"] as const) : []),
  ];

  return (
    <div className="space-y-3 text-left">
      <Input
        placeholder="서비스 이름 검색 (예: 넷플릭스)"
        aria-label="서비스 이름 검색"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      {/* 분류로 좁혀 스크롤 없이 찾게 한다. 검색 중에는 어느 탭도 켜져 있지 않다. */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="서비스 분류">
        {tabs.map((tab) => {
          const active = !keyword && category === tab;
          return (
            <button
              key={tab}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onCategoryChange(tab);
                onQueryChange("");
              }}
              className={
                active
                  ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              }
            >
              {tab === "all" ? "전체" : tab === "bundle" ? "결합 상품" : CATEGORY_LABELS[tab]}
              <span className="ml-1 text-[10px] opacity-70">{countOf(tab)}</span>
            </button>
          );
        })}
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
          {matches.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onPick(service)}
              className="flex items-center gap-2 p-2.5 rounded-xl border bg-card hover:bg-muted hover:border-primary/40 text-left transition-colors"
            >
              <ServiceLogo presetId={service.id} name={service.nameKo} size={22} />
              <span className="min-w-0">
                <span className="block text-xs font-bold truncate">{service.nameKo}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {describePresetPrice(service)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl text-center">
          &lsquo;{query.trim()}&rsquo;은(는) 목록에 없어요. 직접 입력하세요.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 font-semibold"
        onClick={onCustom}
      >
        {keyword ? `'${query.trim()}' 직접 입력하기` : "목록에 없는 서비스 직접 입력"}
      </Button>
    </div>
  );
}
