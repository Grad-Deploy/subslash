"use client";

import React, { useId, useState } from "react";
import {
  SubscriptionFormData,
  ServicePreset,
  PAYMENT_METHOD_OPTIONS,
  formatAmount,
  getMyShareAmount,
  getSharingCount,
  parseServiceUrl,
} from "@subslash/shared";
import { useStore } from "../../lib/store";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";

const LABEL = "text-xs font-bold text-foreground";

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
  const fieldId = useId();

  // 프리셋을 누르고 연 경우(이름이 이미 채워짐)에는 고르는 단계를 건너뛴다.
  const [step, setStep] = useState<"pick" | "details">(
    isEdit || initialData?.name ? "details" : "pick",
  );
  // 프리셋은 이름·카테고리·해지 링크를 이미 안다. 목록에 없는 서비스일 때만 묻는다.
  const [isCustom, setIsCustom] = useState(
    () => !popularServices.some((preset) => preset.cancelUrl === initialData?.cancelUrl),
  );
  const [query, setQuery] = useState("");
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
    setFormData((prev) => ({
      ...prev,
      // 비운 숫자 칸은 0이 아니라 '적지 않음'이다. 0원은 무료 구독, 결제 월 0은
      // 없는 달이라는 다른 주장이 된다.
      [name]:
        name === "billingMonth" || name === "amount" || name === "billingDay"
          ? value === ""
            ? undefined
            : Number(value)
          : value,
    }));
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
    setFormData((prev) => ({
      ...prev,
      name: service.nameKo || service.name,
      amount: service.defaultAmount,
      currency: service.currency,
      cancelUrl: service.cancelUrl,
      cancelGuide: service.cancelGuide,
      category: service.category,
      iconUrl: service.iconEmoji,
    }));
    setIsCustom(false);
    setStep("details");
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
      category: "other",
    }));
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

    if (isCustomAccount && customEmail.trim()) {
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
    const matches = keyword
      ? popularServices.filter(
          (service) =>
            service.nameKo.toLowerCase().includes(keyword) ||
            service.name.toLowerCase().includes(keyword),
        )
      : popularServices;

    return (
      <div className="space-y-3 text-left">
        <Input
          placeholder="서비스 이름 검색 (예: 넷플릭스)"
          aria-label="서비스 이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {matches.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
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
                    월 {formatAmount(service.defaultAmount, service.currency)}
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

  return (
    <form className="space-y-4 text-left" onSubmit={handleSubmit}>
      {!isEdit && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{isCustom ? "✏️" : formData.iconUrl || "📦"}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{isCustom ? "직접 입력" : formData.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {isCustom
                  ? "목록에 없는 서비스"
                  : "기본 요금을 채웠습니다. 요금제가 다르면 고쳐주세요."}
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

      {/* Amount & Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {/* 연간 구독에 '월 결제 금액'이라고 물으면 월 환산액을 적게 되고, 앱이 그걸 다시 12로 나눈다. */}
          <label htmlFor={`${fieldId}-amount`} className={LABEL}>
            {formData.billingCycle === "yearly" ? "연 결제 금액" : "월 결제 금액"}
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

      <button
        type="button"
        onClick={() => setShowMore((open) => !open)}
        aria-expanded={showMore}
        className="w-full flex items-center justify-between gap-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <span>
          자세히 입력 (선택) ·{" "}
          {showServiceFields
            ? "공유 인원, 결제 수단, 계정, 웹사이트, 해지 방법"
            : "공유 인원, 결제 수단, 계정"}
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
                        (formData.amount ?? 0) /
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
            {/* Linked Account Selector */}
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
          {isCustomAccount && (
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
