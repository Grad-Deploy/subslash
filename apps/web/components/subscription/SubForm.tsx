"use client";

import React, { useId, useState } from "react";
import {
  CATEGORY_LABELS,
  SubscriptionFormData,
  ServicePreset,
  type BillingCycle,
  type ServicePlan,
  type SubscriptionCategory,
  PAYMENT_METHOD_OPTIONS,
  counterpartPlan,
  describePresetPrice,
  findPresetForSubscription,
  formatAmount,
  getBilledAmount,
  getMyShareAmount,
  getSharingCount,
  parseServiceUrl,
  planCurrency,
  planFormData,
  presetFormData,
  yearlyDiscountOf,
} from "@subslash/shared";
import { useStore } from "../../lib/store";
import { useAuth } from "@hooks/useAuth";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";

const LABEL = "text-xs font-bold text-foreground";

/** 서비스 고르기 탭의 순서. 목록에 서비스가 하나도 없는 분류는 탭을 만들지 않는다. */
const PICK_CATEGORY_ORDER: SubscriptionCategory[] = [
  "ott",
  "music",
  "ai",
  "shopping",
  "cloud",
  "news",
  "fitness",
  "other",
];

const CATEGORY_ICONS: Record<SubscriptionCategory, string> = {
  ott: "📺",
  music: "🎵",
  ai: "🤖",
  shopping: "🛒",
  cloud: "☁️",
  news: "📰",
  fitness: "💪",
  other: "📦",
};

/**
 * 구독 등록·수정 폼.
 *
 * 새로 등록할 때는 두 단계다. 먼저 서비스를 고르고, 그다음 꼭 필요한 칸만
 * 채운다. 예전에는 열 개가 넘는 칸이 한 화면에 한꺼번에 나와서, 처음 온
 * 사람이 무엇부터 적어야 할지 몰랐다. 공유 인원·결제 수단·연동 계정처럼
 * 없어도 등록되는 칸은 '자세히 입력' 아래에 접어 둔다.
 *
 * 수정할 때(`mode="edit"`)는 서비스를 다시 고르지 않고 모든 칸을 펼친다.
 */
export function SubForm({
  onSubmit,
  initialData,
  popularServices,
  submitLabel = "구독 등록하기",
  mode = "create",
}: {
  onSubmit: (data: SubscriptionFormData) => void;
  initialData?: Partial<SubscriptionFormData>;
  popularServices: ServicePreset[];
  submitLabel?: string;
  mode?: "create" | "edit";
}) {
  const isEdit = mode === "edit";
  const { accounts, addAccount } = useStore();
  // 연동 계정(구독에 쓴 이메일·아이디 목록)은 로그인한 사람에게만 묻는다. 로그인 계정과는
  // 다른 것이다 — 연동 계정 기록은 여전히 이 브라우저에만 있다.
  const { account: loginAccount } = useAuth();
  const isLoggedIn = !!loginAccount;
  const fieldId = useId();

  // 프리셋을 누르고 연 경우(이름이 이미 채워짐)에는 고르는 단계를 건너뛴다.
  const [step, setStep] = useState<"pick" | "details">(
    isEdit || initialData?.name ? "details" : "pick",
  );
  // 프리셋은 이름·카테고리·해지 링크를 이미 안다. 목록에 없는 서비스일 때만 묻는다.
  const [isCustom, setIsCustom] = useState(
    () => !popularServices.some((preset) => preset.cancelUrl === initialData?.cancelUrl),
  );
  // 고른 서비스. 요금제 칸을 그리는 데 쓴다. 프리셋을 누르고 열었거나 수정할 때는
  // 이름·주소로 되찾는다.
  const [preset, setPreset] = useState<ServicePreset | undefined>(() =>
    initialData?.name
      ? findPresetForSubscription({ name: initialData.name, cancelUrl: initialData.cancelUrl })
      : undefined,
  );
  const [query, setQuery] = useState("");
  const [pickCategory, setPickCategory] = useState<SubscriptionCategory | "all">("all");
  const [showMore, setShowMore] = useState(isEdit);
  const [serviceUrl, setServiceUrl] = useState(initialData?.cancelUrl ?? "");
  const [serviceUrlError, setServiceUrlError] = useState<string | null>(null);

  const [isCustomAccount, setIsCustomAccount] = useState<boolean>(
    Boolean(!initialData?.linkedAccountId && initialData?.linkedAccountName),
  );
  const [customEmail, setCustomEmail] = useState<string>(
    (!initialData?.linkedAccountId && initialData?.linkedAccountName) || "",
  );

  // 금액과 결제일은 미리 채우지 않는다. 결제일을 1일로 채워 두면 손대지 않은
  // 사람의 D-day가 1일 기준으로 계산돼, 사실처럼 보이는 틀린 날짜가 된다.
  // 카테고리도 'OTT'로 골라 두면 모르는 사이 그렇게 저장되므로 '기타'에서 시작한다.
  // 기본값은 상태에 합쳐 둔다(렌더링 값에만 두면 보이는 것과 제출되는 것이 달라진다).
  const [formData, setFormData] = useState<Partial<SubscriptionFormData>>(() => ({
    name: "",
    currency: "KRW",
    billingCycle: "monthly",
    category: "other",
    paymentMethod: "credit_card",
    ...initialData,
  }));

  const showServiceFields = isEdit || isCustom;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "billingCycle") {
      changeCycle(value as BillingCycle);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      // 비운 숫자 칸은 0이 아니라 '적지 않음'이다. 0원은 무료 구독, 결제 월 0은
      // 없는 달이라는 다른 주장이 된다.
      [name]:
        name === "billingMonth" || name === "amount" || name === "billingDay"
          ? value === ""
            ? undefined
            : Number(value)
          : // 비운 체험 종료일도 '적지 않음'이다. 빈 글자로 두면 "모른다"와 구분되지 않는다.
            name === "trialEndsAt" && value === ""
            ? undefined
            : value,
    }));
  };

  /**
   * 결제 주기를 바꾼다. 요금제를 골라 둔 상태면 같은 요금제의 다른 주기(월↔연)로 옮기고, 목록에
   * 그 주기의 요금이 없으면 요금제와 금액을 비운다. 월 요금이 채워진 채 '매년'으로 바뀌면 한
   * 달치가 1년치로 저장된다 — 연 결제는 할인되기도 해서 월 요금 × 12로 채우지도 않는다.
   */
  const changeCycle = (cycle: BillingCycle) => {
    setFormData((prev) => {
      if ((prev.billingCycle ?? "monthly") === cycle) return prev;
      const next: Partial<SubscriptionFormData> = { ...prev, billingCycle: cycle };
      const plan = preset?.plans?.find((candidate) => candidate.id === prev.planId);
      if (preset && plan) {
        const other = counterpartPlan(preset, plan);
        if (other && (other.billingCycle ?? "monthly") === cycle) {
          return { ...next, ...planFormData(preset, other) };
        }
        return { ...next, planId: undefined, planName: undefined, amount: undefined };
      }
      if (
        cycle === "yearly" &&
        preset?.defaultAmount != null &&
        prev.amount === preset.defaultAmount
      ) {
        return { ...next, amount: undefined };
      }
      return next;
    });
  };

  /**
   * Sharing fields are cleared rather than zeroed when emptied: a stored 0
   * would read as "I pay nothing", which is a different claim from "I did not
   * fill this in".
   */
  const handleSharingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value === "" ? undefined : Number(value) };
      // An even split needs no override, and keeping a stale one would show a
      // share that no longer matches the people on the plan.
      if (name === "sharingCount" && (next.sharingCount ?? 1) <= 1) {
        next.myShareAmount = undefined;
      }
      return next;
    });
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__custom__") {
      setIsCustomAccount(true);
      setFormData((prev) => ({
        ...prev,
        linkedAccountId: undefined,
        linkedAccountName: customEmail.trim() || undefined,
      }));
    } else if (!val) {
      setIsCustomAccount(false);
      setFormData((prev) => ({
        ...prev,
        linkedAccountId: undefined,
        linkedAccountName: undefined,
      }));
    } else {
      setIsCustomAccount(false);
      const acc = accounts.find((a) => a.id === val);
      setFormData((prev) => ({
        ...prev,
        linkedAccountId: val,
        linkedAccountName: acc ? `${acc.name} (${acc.emailOrId})` : undefined,
      }));
    }
  };

  const pickPreset = (service: ServicePreset) => {
    setFormData((prev) => ({ ...prev, ...presetFormData(service) }));
    setPreset(service);
    setIsCustom(false);
    setStep("details");
  };

  const pickPlan = (plan: ServicePlan) => {
    if (!preset) return;
    setFormData((prev) => ({ ...prev, ...planFormData(preset, plan) }));
  };

  const startCustom = () => {
    // 앞서 프리셋을 골랐다 돌아온 경우, 그 서비스의 요금·링크가 남지 않게 비운다.
    setFormData((prev) => ({
      ...prev,
      name: query.trim(),
      amount: undefined,
      cancelUrl: undefined,
      cancelGuide: undefined,
      iconUrl: undefined,
      planId: undefined,
      planName: undefined,
      taxRate: undefined,
      category: "other",
    }));
    setPreset(undefined);
    setServiceUrl("");
    setServiceUrlError(null);
    setIsCustom(true);
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let cancelUrl = formData.cancelUrl;
    if (showServiceFields) {
      const typed = serviceUrl.trim();
      const original = initialData?.cancelUrl ?? "";
      if (typed === original) {
        // 손대지 않은 주소는 정리하지 않는다. 글자가 하나라도 바뀌면 프리셋의
        // 확인된 해지 링크로 알아보지 못하게 된다.
        cancelUrl = original || undefined;
      } else {
        const parsed = parseServiceUrl(typed);
        if (parsed.error) {
          setServiceUrlError(parsed.error);
          setShowMore(true);
          return;
        }
        cancelUrl = parsed.url;
      }
    }

    let finalAccountId = formData.linkedAccountId;
    let finalAccountName = formData.linkedAccountName;

    // 로그아웃 상태에서는 연동 계정 칸이 보이지 않는다. 예전에 적어 둔 이메일이 남아 있어도
    // 보이지 않는 칸으로 연동 계정을 새로 만들지 않고, 적어 둔 값은 그대로 둔다.
    if (isLoggedIn && isCustomAccount && customEmail.trim()) {
      finalAccountName = customEmail.trim();
      const found = accounts.find(
        (a) => a.emailOrId.toLowerCase() === customEmail.trim().toLowerCase(),
      );
      if (found) {
        finalAccountId = found.id;
        finalAccountName = `${found.name} (${found.emailOrId})`;
      } else {
        const localPart = customEmail.split("@")[0] || "직접 입력 계정";
        const provider = customEmail.includes("naver")
          ? "naver"
          : customEmail.includes("gmail")
            ? "google"
            : customEmail.includes("kakao")
              ? "kakao"
              : customEmail.includes("icloud") || customEmail.includes("apple")
                ? "apple"
                : "email";
        const newAcc = addAccount({
          name: localPart,
          emailOrId: customEmail.trim(),
          provider,
        });
        finalAccountId = newAcc.id;
        finalAccountName = `${newAcc.name} (${newAcc.emailOrId})`;
      }
    }

    onSubmit({
      ...formData,
      cancelUrl,
      linkedAccountId: finalAccountId,
      linkedAccountName: finalAccountName,
    } as SubscriptionFormData);
  };

  if (step === "pick") {
    const keyword = query.trim().toLowerCase();
    // 검색어가 있으면 고른 분류와 상관없이 전체에서 찾는다. 분류를 잘못 고른 채
    // 검색하면 목록에 있는 서비스도 '없다'고 보이기 때문이다.
    const matches = keyword
      ? popularServices.filter(
          (service) =>
            service.nameKo.toLowerCase().includes(keyword) ||
            service.name.toLowerCase().includes(keyword),
        )
      : pickCategory === "all"
        ? popularServices
        : popularServices.filter((service) => service.category === pickCategory);
    const countOf = (category: SubscriptionCategory | "all") =>
      category === "all"
        ? popularServices.length
        : popularServices.filter((service) => service.category === category).length;
    const tabs: Array<SubscriptionCategory | "all"> = [
      "all",
      ...PICK_CATEGORY_ORDER.filter((category) => countOf(category) > 0),
    ];

    return (
      <div className="space-y-3 text-left">
        <Input
          placeholder="서비스 이름 검색 (예: 넷플릭스)"
          aria-label="서비스 이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* 분류로 좁혀 스크롤 없이 찾게 한다. 검색 중에는 어느 탭도 켜져 있지 않다. */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="서비스 분류">
          {tabs.map((category) => {
            const active = !keyword && pickCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPickCategory(category);
                  setQuery("");
                }}
                className={
                  active
                    ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                    : "rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                }
              >
                {category === "all"
                  ? "전체"
                  : `${CATEGORY_ICONS[category]} ${CATEGORY_LABELS[category]}`}
                <span className="ml-1 text-[10px] opacity-70">{countOf(category)}</span>
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
                onClick={() => pickPreset(service)}
                className="flex items-center gap-2 p-2.5 rounded-xl border bg-card hover:bg-muted hover:border-primary/40 text-left transition-colors"
              >
                <span className="text-xl shrink-0">{service.iconEmoji}</span>
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
            &lsquo;{query.trim()}&rsquo;은(는) 목록에 없습니다. 아래에서 직접 입력하세요.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-semibold"
          onClick={startCustom}
        >
          ✏️ {keyword ? `'${query.trim()}' 직접 입력하기` : "목록에 없는 서비스 직접 입력"}
        </Button>
      </div>
    );
  }

  const sharing = (formData.sharingCount ?? 1) > 1;
  const plans = preset?.plans ?? [];
  const cycle = formData.billingCycle ?? "monthly";
  // 고른 주기의 요금제가 목록에 없으면(연 결제 요금을 모르는 서비스 등) 요금제를 고르라고 막지
  // 않는다. 그때는 금액을 직접 적는다.
  const plansRequired = !isEdit && plans.some((plan) => (plan.billingCycle ?? "monthly") === cycle);
  const showTax =
    formData.currency === "USD" || Boolean(preset?.taxRate) || Boolean(formData.taxRate);
  const formCurrency = formData.currency || "KRW";
  const billed =
    typeof formData.amount === "number"
      ? getBilledAmount({ amount: formData.amount, taxRate: formData.taxRate })
      : undefined;

  return (
    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
      {!isEdit && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{isCustom ? "✏️" : formData.iconUrl || "📦"}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{isCustom ? "직접 입력" : formData.name}</p>
              <p className="text-[11px] text-muted-foreground break-keep">
                {isCustom
                  ? "목록에 없는 서비스"
                  : plans.length > 0
                    ? "요금제를 고르면 요금이 채워집니다."
                    : typeof preset?.defaultAmount === "number"
                      ? "기본 요금을 채웠습니다. 요금이 다르면 고쳐주세요."
                      : "요금을 직접 적어주세요."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="shrink-0 text-xs font-semibold text-primary hover:underline"
          >
            다른 서비스
          </button>
        </div>
      )}

      {showServiceFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor={`${fieldId}-name`} className={LABEL}>
              서비스 이름
            </label>
            <Input
              id={`${fieldId}-name`}
              name="name"
              placeholder="예: 동네 헬스장"
              value={formData.name || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${fieldId}-category`} className={LABEL}>
              카테고리
            </label>
            <Select
              id={`${fieldId}-category`}
              name="category"
              value={formData.category || "other"}
              onChange={handleChange}
            >
              <option value="ott">OTT / 동영상</option>
              <option value="music">음악 스트리밍</option>
              <option value="shopping">쇼핑 / 멤버십</option>
              <option value="cloud">클라우드 / 저장공간</option>
              <option value="ai">AI 툴 / 생산성</option>
              <option value="fitness">피트니스 / 건강</option>
              <option value="news">뉴스 / 도서</option>
              <option value="other">기타</option>
            </Select>
          </div>
        </div>
      )}

      {/*
        요금제가 여럿인 서비스는 등록할 때 요금제를 반드시 고른다. 하나를 미리 골라 두면
        손대지 않은 사람의 요금이 그 요금제로 저장된다. 고른 요금제는 가격 확인의 기준이 된다.
      */}
      {preset && plans.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className={`${LABEL} mb-1.5`}>요금제</legend>
          <div className="grid grid-cols-2 gap-2">
            {plans.map((plan) => {
              const checked = formData.planId === plan.id;
              const currency = planCurrency(preset, plan);
              const discount = yearlyDiscountOf(preset, plan);
              return (
                <label
                  key={plan.id}
                  className={`relative cursor-pointer rounded-xl border p-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "bg-card hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="planId"
                    value={plan.id}
                    checked={checked}
                    onChange={() => pickPlan(plan)}
                    required={plansRequired}
                    className="sr-only"
                  />
                  <span className="block text-xs font-bold">{plan.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {(plan.billingCycle ?? "monthly") === "yearly" ? "연" : "월"}{" "}
                    {formatAmount(plan.amount, currency)}
                  </span>
                  {discount && (
                    <span className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      월 {formatAmount(plan.amount / 12, currency)}꼴 · 월 결제보다 연{" "}
                      {formatAmount(discount.saved, currency)} 적게 ({discount.percent}%)
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {preset.priceNote && (
            <p className="text-[11px] text-muted-foreground">{preset.priceNote}</p>
          )}
        </fieldset>
      )}
      {!isEdit && preset && plans.length === 0 && preset.priceNote && (
        <p className="text-[11px] text-muted-foreground">{preset.priceNote}</p>
      )}

      {/* Amount & Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {/* 연간 구독에 '월 결제 금액'이라고 물으면 월 환산액을 적게 되고, 앱이 그걸 다시 12로 나눈다. */}
          <label htmlFor={`${fieldId}-amount`} className={LABEL}>
            {formData.taxRate
              ? cycle === "yearly"
                ? "연 요금 (세금 제외)"
                : "월 요금 (세금 제외)"
              : cycle === "yearly"
                ? "연 결제 금액"
                : "월 결제 금액"}
          </label>
          {/* step="any": 없으면 브라우저가 $9.99 같은 소수 금액을 입력 오류로 막는다. */}
          <Input
            id={`${fieldId}-amount`}
            type="number"
            name="amount"
            min="0"
            step="any"
            placeholder="예: 17000"
            value={formData.amount ?? ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fieldId}-currency`} className={LABEL}>
            통화
          </label>
          <Select
            id={`${fieldId}-currency`}
            name="currency"
            value={formData.currency || "KRW"}
            onChange={handleChange}
          >
            <option value="KRW">KRW (₩)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </div>
      </div>

      {/*
        해외 서비스는 요금표 가격에 부가세가 더해져 청구되기도 한다. 금액 칸에는 요금표 가격을 두고
        세금은 따로 고르게 해, 카드에 찍히는 금액과 가격 확인(요금표 가격끼리 비교)이 둘 다 맞게 한다.
      */}
      {showTax && (
        <div className="space-y-1.5">
          <label htmlFor={`${fieldId}-tax`} className={LABEL}>
            세금
          </label>
          <Select
            id={`${fieldId}-tax`}
            name="taxRate"
            value={formData.taxRate ? String(formData.taxRate) : "none"}
            onChange={(e) => {
              const { value } = e.target;
              setFormData((prev) => ({
                ...prev,
                taxRate: value === "none" ? undefined : Number(value),
              }));
            }}
          >
            <option value="none">금액에 포함 · 따로 붙지 않음</option>
            <option value="10">부가세 10% 별도</option>
            {/* 백업 등으로 들어온 다른 세율도 고친 적 없이 사라지지 않게 보여준다. */}
            {formData.taxRate && formData.taxRate !== 10 ? (
              <option value={String(formData.taxRate)}>세금 {formData.taxRate}% 별도</option>
            ) : null}
          </Select>
          <p className="text-[11px] text-muted-foreground break-keep">
            {preset?.taxRate
              ? `한국에서 결제하면 ${preset.nameKo} 요금에 부가세 ${preset.taxRate}%가 더해집니다(결제 화면에서 확인). 그래서 부가세를 넣은 금액으로 채웠습니다. 사업자 결제처럼 부가세가 붙지 않으면 '금액에 포함 · 따로 붙지 않음'으로 바꾸세요.`
              : "해외 서비스는 요금표 가격에 부가세 10%가 더해져 청구되기도 합니다. 카드 명세서 금액과 비교해 고르세요."}
          </p>
          {formData.taxRate && billed !== undefined && typeof formData.amount === "number" ? (
            <p className="text-[11px] font-semibold text-foreground">
              카드에 청구되는 금액: {formatAmount(billed, formCurrency)} (요금{" "}
              {formatAmount(formData.amount, formCurrency)} + 부가세 {formData.taxRate}%)
            </p>
          ) : null}
        </div>
      )}

      {/* Billing Day & Cycle */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${fieldId}-day`} className={LABEL}>
            결제일 (1-31)
          </label>
          <Input
            id={`${fieldId}-day`}
            type="number"
            min="1"
            max="31"
            name="billingDay"
            placeholder="예: 15"
            value={formData.billingDay ?? ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${fieldId}-cycle`} className={LABEL}>
            주기
          </label>
          <Select
            id={`${fieldId}-cycle`}
            name="billingCycle"
            value={formData.billingCycle || "monthly"}
            onChange={handleChange}
          >
            <option value="monthly">매월 결제</option>
            <option value="yearly">매년 결제</option>
          </Select>
        </div>
      </div>

      {/* Yearly plans need the month too, or there is no date to count down to */}
      {formData.billingCycle === "yearly" && (
        <div className="space-y-1.5">
          <label htmlFor={`${fieldId}-month`} className={LABEL}>
            결제 월
          </label>
          <Select
            id={`${fieldId}-month`}
            name="billingMonth"
            value={String(formData.billingMonth ?? "")}
            onChange={handleChange}
          >
            <option value="">선택해주세요</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={String(month)}>
                {month}월
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-muted-foreground">
            연간 결제는 며칠에 빠져나가는지만으로는 날짜를 알 수 없습니다. 결제 월을 넣어야 D-day와
            알림, 캘린더가 실제 결제일을 가리킵니다.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={`${fieldId}-trial`} className={LABEL}>
          무료 체험 종료일 <span className="font-normal text-muted-foreground">(선택)</span>
        </label>
        <Input
          id={`${fieldId}-trial`}
          type="date"
          name="trialEndsAt"
          value={formData.trialEndsAt ?? ""}
          onChange={handleChange}
        />
        <p className="text-[11px] text-muted-foreground break-keep">
          체험 중이라면 유료로 바뀌는 날을 적어주세요. 그날까지는 지출과 결제 캘린더에서 빼고 세고,
          끝나기 전에 알려 드립니다. 모르면 비워 두세요 — 비워 두면 지금부터 결제되는 것으로 봅니다.
        </p>
      </div>

      {cycle === "yearly" && preset && !formData.planId && (
        <p className="text-[11px] text-muted-foreground break-keep">
          {plans.length > 0 ? `${preset.nameKo}의 연 결제 요금은 목록에 없습니다. ` : ""}
          결제한 1년치 금액을 적어주세요. 연 결제는 할인되는 경우가 있어 월 요금 × 12와 다를 수
          있습니다.
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowMore((open) => !open)}
        aria-expanded={showMore}
        className="w-full flex items-center justify-between gap-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <span>
          자세히 입력 (선택) ·{" "}
          {[
            "공유 인원",
            "결제 수단",
            ...(isLoggedIn ? ["계정"] : []),
            ...(showServiceFields ? ["웹사이트", "해지 방법"] : []),
          ].join(", ")}
        </span>
        <span aria-hidden>{showMore ? "▲" : "▼"}</span>
      </button>

      {showMore && (
        <div className="space-y-4">
          {/* Cost Splitting */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor={`${fieldId}-sharing`} className={LABEL}>
                  함께 쓰는 인원
                </label>
                <Select
                  id={`${fieldId}-sharing`}
                  name="sharingCount"
                  value={String(formData.sharingCount ?? 1)}
                  onChange={handleSharingChange}
                >
                  <option value="1">나 혼자 (1명)</option>
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}명이서 나눔
                    </option>
                  ))}
                </Select>
              </div>

              {sharing && (
                <div className="space-y-1.5">
                  <label htmlFor={`${fieldId}-share`} className={LABEL}>
                    내 부담금 <span className="font-normal text-muted-foreground">(선택)</span>
                  </label>
                  <Input
                    id={`${fieldId}-share`}
                    type="number"
                    name="myShareAmount"
                    min="0"
                    step="any"
                    placeholder={String(
                      Math.round(
                        (billed ?? 0) /
                          getSharingCount({
                            amount: formData.amount ?? 0,
                            sharingCount: formData.sharingCount,
                          }),
                      ),
                    )}
                    value={formData.myShareAmount ?? ""}
                    onChange={handleSharingChange}
                  />
                </div>
              )}
            </div>

            {sharing && (
              <p className="text-[11px] text-muted-foreground">
                내가 내는 몫은{" "}
                <strong className="text-foreground">
                  {formatAmount(
                    getMyShareAmount({
                      amount: formData.amount ?? 0,
                      sharingCount: formData.sharingCount,
                      myShareAmount: formData.myShareAmount,
                      taxRate: formData.taxRate,
                    }),
                    formData.currency || "KRW",
                  )}
                </strong>
                로 계산됩니다. 비워두면 인원수로 똑같이 나눕니다. 대시보드의 월 고정지출과 절약
                자산은 이 금액을 기준으로 집계됩니다.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Linked Account Selector — 로그인한 사람에게만 묻는다 */}
            {isLoggedIn && (
              <div className="space-y-1.5">
                <label htmlFor={`${fieldId}-account`} className={LABEL}>
                  사용/로그인 계정
                </label>
                <Select
                  id={`${fieldId}-account`}
                  name="linkedAccountId"
                  value={isCustomAccount ? "__custom__" : formData.linkedAccountId || ""}
                  onChange={handleAccountChange}
                >
                  <option value="">계정 지정 안 함 (직접 관리)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - {acc.emailOrId}
                    </option>
                  ))}
                  <option value="__custom__">✏️ 새 이메일 직접 입력 매핑</option>
                </Select>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label htmlFor={`${fieldId}-payment`} className={LABEL}>
                결제 수단
              </label>
              <Select
                id={`${fieldId}-payment`}
                name="paymentMethod"
                value={formData.paymentMethod || "credit_card"}
                onChange={handleChange}
              >
                {PAYMENT_METHOD_OPTIONS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Custom Email Input with Domain Selector */}
          {isLoggedIn && isCustomAccount && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={LABEL}>매핑할 이메일 계정 (아이디 입력 @ 도메인 선택)</span>
                <span className="text-[10px] text-muted-foreground">
                  도메인을 선택하면 해당 서비스로 자동 연계됩니다
                </span>
              </div>
              <EmailDomainInput
                value={customEmail}
                onChange={(full) => {
                  setCustomEmail(full);
                  setFormData((prev) => ({
                    ...prev,
                    linkedAccountName: full,
                  }));
                }}
                placeholderId="아이디 입력"
                size="default"
              />
            </div>
          )}

          {showServiceFields && (
            <>
              <div className="space-y-1.5">
                <label htmlFor={`${fieldId}-url`} className={LABEL}>
                  서비스 웹사이트 또는 해지 페이지 주소
                </label>
                <Input
                  id={`${fieldId}-url`}
                  name="cancelUrl"
                  inputMode="url"
                  placeholder="예: service.com"
                  value={serviceUrl}
                  onChange={(e) => {
                    setServiceUrl(e.target.value);
                    setServiceUrlError(null);
                  }}
                  aria-invalid={Boolean(serviceUrlError)}
                />
                {serviceUrlError ? (
                  <p className="text-[11px] font-medium text-destructive" role="alert">
                    {serviceUrlError}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    도메인만 적어도 됩니다. 해지 가이드에 이 주소와, 여기서 추정한 계정 관리
                    페이지(/account) 링크가 생깁니다. 추정한 주소라 실제로는 없는 페이지일 수
                    있습니다.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${fieldId}-guide`} className={LABEL}>
                  해지 방법 메모
                </label>
                <textarea
                  id={`${fieldId}-guide`}
                  name="cancelGuide"
                  rows={3}
                  placeholder={"예:\n1. 앱 실행 → 설정\n2. 구독 관리 → 해지"}
                  value={formData.cancelGuide ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cancelGuide: e.target.value || undefined }))
                  }
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground">
                  적어 두면 해지 가이드에 단계별로 보여줍니다. 한 줄에 한 단계씩 적어주세요.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <Button type="submit" className="w-full mt-2 h-11 font-bold">
        {submitLabel}
      </Button>
    </form>
  );
}
