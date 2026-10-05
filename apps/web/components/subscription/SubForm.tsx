"use client";

import React, { useId, useState } from "react";
import {
  SubscriptionFormData,
  ServicePreset,
  type BillingCycle,
  type ServicePlan,
  counterpartPlan,
  findPresetForSubscription,
  parseServiceUrl,
  planFormData,
  presetFormData,
} from "@subslash/shared";
import { Button } from "../ui/button";
import { IS_APP_BUILD } from "@lib/platform";
import { ServicePicker, type PickTab } from "./form/ServicePicker";
import { CustomIconPicker } from "./form/CustomIconPicker";
import { PlanPicker } from "./form/PlanPicker";
import { BundleNotes } from "./form/BundleNotes";
import { TaxField } from "./form/TaxField";
import { SharingFields } from "./form/SharingFields";
import { ServiceLinkFields } from "./form/ServiceLinkFields";
import { SelectedServiceBar } from "./form/SelectedServiceBar";
import { AmountFields } from "./form/AmountFields";
import { BillingFields } from "./form/BillingFields";
import { AccountPaymentFields } from "./form/AccountPaymentFields";
import { ServiceNameFields } from "./form/ServiceNameFields";

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
  openCustom = false,
}: {
  onSubmit: (data: SubscriptionFormData) => void;
  initialData?: Partial<SubscriptionFormData>;
  popularServices: ServicePreset[];
  submitLabel?: string;
  mode?: "create" | "edit";
  /**
   * 서비스 고르기 단계를 건너뛰고 '직접 입력'으로 연다. 앱의 빈 대시보드에서 "목록에 없어요"를
   * 누른 경우다. 기본값(false)이면 지금처럼 고르는 단계부터 연다.
   */
  openCustom?: boolean;
}) {
  const isEdit = mode === "edit";
  const fieldId = useId();

  // 프리셋을 누르고 연 경우(이름이 이미 채워짐)에는 고르는 단계를 건너뛴다.
  const [step, setStep] = useState<"pick" | "details">(
    isEdit || initialData?.name || openCustom ? "details" : "pick",
  );
  // 프리셋은 이름·카테고리·해지 링크를 이미 안다. 목록에 없는 서비스일 때만 묻는다.
  const [isCustom, setIsCustom] = useState(
    () =>
      openCustom || !popularServices.some((preset) => preset.cancelUrl === initialData?.cancelUrl),
  );
  // 고른 서비스. 요금제 칸을 그리는 데 쓴다. 프리셋을 누르고 열었거나 수정할 때는
  // 이름·주소로 되찾는다.
  const [preset, setPreset] = useState<ServicePreset | undefined>(() =>
    initialData?.name
      ? findPresetForSubscription({ name: initialData.name, cancelUrl: initialData.cancelUrl })
      : undefined,
  );
  const [query, setQuery] = useState("");
  const [pickCategory, setPickCategory] = useState<PickTab>("all");
  const [showMore, setShowMore] = useState(isEdit);
  const [serviceUrl, setServiceUrl] = useState(initialData?.cancelUrl ?? "");
  const [serviceUrlError, setServiceUrlError] = useState<string | null>(null);

  // 가입한 계정(이메일·아이디). 해지할 때 '이 계정으로 로그인해야 해지 버튼이 보여요'로 쓴다. 예전에는
  // 계정 목록을 따로 관리하는 화면에서 골랐는데, 칸 하나로 같은 일을 한다.
  const [signInAccount, setSignInAccount] = useState(initialData?.linkedAccountName ?? "");

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
   * 결제한 날을 골라 결제일을 채운다('오늘 결제했어요'·'어제'). 사용자가 고른 날이라 지어낸 값이 아니다.
   * 연간 결제는 그날의 달도 결제 월로 채운다 — 결제 월이 없으면 D-day·알림이 없다.
   */
  const pickPaidOn = (date: Date) => {
    setFormData((prev) => ({
      ...prev,
      billingDay: date.getDate(),
      ...(prev.billingCycle === "yearly" ? { billingMonth: date.getMonth() + 1 } : {}),
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

  const pickPreset = (service: ServicePreset) => {
    setFormData((prev) => ({ ...prev, ...presetFormData(service), iconColor: undefined }));
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
      iconColor: undefined,
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

    // 손대지 않았으면 예전에 고른 계정(연결된 id까지) 그대로 둔다. 고쳤으면 적은 글자만 남긴다.
    const typedAccount = signInAccount.trim();
    const accountUnchanged = typedAccount === (initialData?.linkedAccountName ?? "").trim();

    onSubmit({
      ...formData,
      cancelUrl,
      linkedAccountId: accountUnchanged ? initialData?.linkedAccountId : undefined,
      linkedAccountName: typedAccount || undefined,
    } as SubscriptionFormData);
  };

  if (step === "pick") {
    return (
      <ServicePicker
        popularServices={popularServices}
        query={query}
        onQueryChange={setQuery}
        category={pickCategory}
        onCategoryChange={setPickCategory}
        onPick={pickPreset}
        onCustom={startCustom}
      />
    );
  }

  const plans = preset?.plans ?? [];
  const cycle = formData.billingCycle ?? "monthly";
  // 고른 주기의 요금제가 목록에 없으면(연 결제 요금을 모르는 서비스 등) 요금제를 고르라고 막지
  // 않는다. 그때는 금액을 직접 적는다. 목록이 요금을 다 담지 못한 서비스(plansIncomplete)도 같다.
  const plansRequired =
    !isEdit &&
    !preset?.plansIncomplete &&
    plans.some((plan) => (plan.billingCycle ?? "monthly") === cycle);
  const showTax =
    formData.currency === "USD" || Boolean(preset?.taxRate) || Boolean(formData.taxRate);

  return (
    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
      {!isEdit && (
        <SelectedServiceBar
          isCustom={isCustom}
          preset={preset}
          formData={formData}
          onChangeService={() => setStep("pick")}
        />
      )}

      {showServiceFields && (
        <ServiceNameFields idPrefix={fieldId} formData={formData} onChange={handleChange} />
      )}

      {/* 웹은 지금 모양 그대로 두고, 앱에서 직접 등록할 때만 아이콘과 색을 고르게 한다. */}
      {IS_APP_BUILD && isCustom && (
        <CustomIconPicker
          name={formData.name}
          iconUrl={formData.iconUrl}
          iconColor={formData.iconColor}
          onChange={(change) => setFormData((prev) => ({ ...prev, ...change }))}
        />
      )}

      {preset && plans.length > 0 && (
        <PlanPicker
          preset={preset}
          plans={plans}
          selectedPlanId={formData.planId}
          required={plansRequired}
          onPick={pickPlan}
        />
      )}
      {!isEdit && preset && plans.length === 0 && preset.priceNote && (
        <p className="text-[11px] text-muted-foreground">{preset.priceNote}</p>
      )}
      {!isEdit && preset && <BundleNotes preset={preset} />}

      <AmountFields idPrefix={fieldId} formData={formData} onChange={handleChange} />

      {showTax && (
        <TaxField
          id={`${fieldId}-tax`}
          preset={preset}
          amount={formData.amount}
          taxRate={formData.taxRate}
          currency={formData.currency || "KRW"}
          onChange={(taxRate) => setFormData((prev) => ({ ...prev, taxRate }))}
        />
      )}

      <BillingFields
        idPrefix={fieldId}
        formData={formData}
        preset={preset}
        onChange={handleChange}
        onPaidOn={pickPaidOn}
      />

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
            "가입한 계정",
            ...(showServiceFields ? ["웹사이트", "해지 방법"] : []),
          ].join(", ")}
        </span>
        <span aria-hidden>{showMore ? "▲" : "▼"}</span>
      </button>

      {showMore && (
        <div className="space-y-4">
          <SharingFields idPrefix={fieldId} formData={formData} onChange={handleSharingChange} />

          <AccountPaymentFields
            idPrefix={fieldId}
            account={signInAccount}
            onAccountChange={setSignInAccount}
            paymentMethod={formData.paymentMethod}
            onChange={handleChange}
          />

          {showServiceFields && (
            <ServiceLinkFields
              idPrefix={fieldId}
              url={serviceUrl}
              error={serviceUrlError}
              onUrlChange={(url) => {
                setServiceUrl(url);
                setServiceUrlError(null);
              }}
              cancelGuide={formData.cancelGuide}
              onCancelGuideChange={(cancelGuide) =>
                setFormData((prev) => ({ ...prev, cancelGuide }))
              }
            />
          )}
        </div>
      )}

      <Button type="submit" className="w-full mt-2 h-11 font-bold">
        {submitLabel}
      </Button>
    </form>
  );
}
