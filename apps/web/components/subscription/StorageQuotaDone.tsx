"use client";

import React, { useEffect, useState } from "react";
import { useT } from "@lib/i18n";
import { STORAGE_QUOTA_RESULT_KEY, parseStorageQuotaResult } from "@lib/storage-quota";

type Status = "reading" | "sent" | "invalid";

/**
 * 측정값을 이 기기의 체크인 창(다른 탭)으로 넘기고 이 탭을 닫아 본다. 값은 주소의 `#` 뒤에만 있고, 넘긴 뒤
 * 주소에서 지운다 — 탭 기록에 남지 않게.
 */
export function StorageQuotaDone() {
  const s = useT().checkin.storage;
  const [status, setStatus] = useState<Status>("reading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const result = parseStorageQuotaResult(params);
    window.history.replaceState(null, "", window.location.pathname);
    let next: Status = "invalid";
    if (result) {
      try {
        // 같은 값을 다시 써도 이벤트가 나게 받은 시각을 함께 둔다.
        window.localStorage.setItem(
          STORAGE_QUOTA_RESULT_KEY,
          JSON.stringify({ ...result, at: Date.now() }),
        );
        next = "sent";
        // 스크립트가 연 탭이면 닫힌다. 닫히지 않으면 안내가 남는다.
        window.close();
      } catch {
        next = "invalid";
      }
    }
    // 주소의 값을 읽는 것은 화면을 그린 뒤에만 할 수 있다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(next);
  }, []);

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-6 text-center" role="status">
      {status === "reading" ? (
        <p className="text-sm text-muted-foreground">{s.doneReading}</p>
      ) : status === "sent" ? (
        <>
          <p className="text-lg font-black">{s.doneFilled}</p>
          <p className="text-sm text-muted-foreground">{s.doneFilledHint}</p>
        </>
      ) : (
        <>
          <p className="text-lg font-black">{s.doneFailed}</p>
          <p className="text-sm text-muted-foreground">{s.doneFailedHint}</p>
        </>
      )}
    </div>
  );
}
