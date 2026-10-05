import React from "react";
import type { SubscriptionFormData } from "@subslash/shared";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { FIELD_LABEL } from "./fieldLabel";

/** 목록에 없는 서비스(직접 입력)와 수정할 때의 서비스 이름·카테고리. 카테고리는 '기타'에서 시작한다. */
export function ServiceNameFields({
  idPrefix,
  formData,
  onChange,
}: {
  idPrefix: string;
  formData: Partial<SubscriptionFormData>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-name`} className={FIELD_LABEL}>
          서비스 이름
        </label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          placeholder="예: 동네 헬스장"
          value={formData.name || ""}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-category`} className={FIELD_LABEL}>
          카테고리
        </label>
        <Select
          id={`${idPrefix}-category`}
          name="category"
          value={formData.category || "other"}
          onChange={onChange}
        >
          <option value="ott">OTT / 동영상</option>
          <option value="music">음악 스트리밍</option>
          <option value="shopping">쇼핑 / 멤버십</option>
          <option value="cloud">클라우드 / 저장공간</option>
          <option value="ai">AI 툴 / 생산성</option>
          <option value="other">기타</option>
        </Select>
      </div>
    </div>
  );
}
