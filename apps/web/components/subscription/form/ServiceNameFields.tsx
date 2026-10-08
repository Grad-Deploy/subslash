import React from "react";
import type { SubscriptionFormData } from "@subslash/shared";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { useT } from "@lib/i18n";
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
  const f = useT().form.name;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-name`} className={FIELD_LABEL}>
          {f.label}
        </label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          placeholder={f.placeholder}
          value={formData.name || ""}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-category`} className={FIELD_LABEL}>
          {f.category}
        </label>
        <Select
          id={`${idPrefix}-category`}
          name="category"
          value={formData.category || "other"}
          onChange={onChange}
        >
          <option value="ott">{f.ott}</option>
          <option value="music">{f.music}</option>
          <option value="shopping">{f.shopping}</option>
          <option value="cloud">{f.cloud}</option>
          <option value="ai">{f.ai}</option>
          <option value="other">{f.other}</option>
        </Select>
      </div>
    </div>
  );
}
