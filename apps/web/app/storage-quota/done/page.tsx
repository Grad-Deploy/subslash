import React from "react";
import { StorageQuotaDone } from "@components/subscription/StorageQuotaDone";

export const metadata = {
  title: "용량 측정 · SubSlash",
};

/**
 * 웹에서 연 'Google 계정 용량 측정' 웹 앱이 돌아오는 화면(새 탭). 측정값은 주소의 `#` 뒤로만 받아 서버로
 * 가지 않고, 이 기기의 체크인 창으로 넘긴다(lib/storage-quota).
 */
export default function StorageQuotaDonePage() {
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <StorageQuotaDone />
    </div>
  );
}
