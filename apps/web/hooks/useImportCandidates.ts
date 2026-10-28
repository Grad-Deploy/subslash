"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { parsePaymentSms, sumMonthlyKRW, type DiscoveredSubscription } from "@subslash/shared";
import { discoveredFormData } from "@lib/discovered-form";
import { findDuplicateSubscription } from "@lib/duplicate-subscription";
import { realRecords, useStore } from "@lib/store";
import { useExchangeRate } from "./useExchangeRate";

/**
 * 결제 문자·메일에서 찾은 구독 후보를 고르고 등록하는 상태. 웹의 가운데 창(AutoImportModal)과 앱의 시트
 * (AppAutoImportModal)가 같은 것을 쓴다 — 따로 들고 있을 때 등록 뒤 결제 기록 적기 같은 단계를 한쪽만 고치게
 * 됐다. 화면마다 다른 것은 '기존 구독 지우고 등록'의 처음 값(`replaceByDefault`)뿐이다.
 *
 * 이미 구독 중인 서비스의 후보(`isTracked`)는 체크를 풀어 둔다. 직접 등록은 같은 서비스면 한 번 묻고 Gmail 자동
 * 가져오기는 등록하지 않는데, 여기서는 묻지 않고 하나 더 만들어 월 지출이 두 번 셈해졌다. 가족·다른 계정처럼
 * 일부러 두 번 내는 경우도 있으므로 막지는 않는다 — 다시 체크하면 등록된다. 기존 구독을 지우고 등록할 때는
 * 겹칠 것이 없으므로 보지 않는다.
 */
export function useImportCandidates({
  isOpen,
  onClose,
  initialSmsText,
  initialDiscovered,
  initialResultsNote,
  onRegistered,
  replaceByDefault,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSmsText?: string;
  initialDiscovered?: DiscoveredSubscription[];
  initialResultsNote?: string;
  onRegistered?: () => void;
  replaceByDefault: boolean;
}) {
  const { addBatchSubscriptions, subscriptions } = useStore();
  // 등록하면 체험이 끝나고 실제 기록에 더해지므로, 겹치는지는 화면의 샘플이 아니라 실제 기록과 견준다.
  const realSubscriptions = useStore((state) => realRecords(state).subscriptions);
  const rate = useExchangeRate();
  const [smsText, setSmsText] = useState(initialSmsText ?? "");
  /** 이미 구독 중인 서비스의 후보인지. 기존 구독을 지우고 등록하면 겹칠 것이 없다. */
  const trackedIn = (item: DiscoveredSubscription) =>
    findDuplicateSubscription(realSubscriptions, discoveredFormData(item)) !== undefined;
  /** 새로 찾은 후보 중 이미 구독 중인 것은 체크를 풀어 둔다. */
  const untrack = (found: DiscoveredSubscription[], replacing: boolean) =>
    replacing
      ? found
      : found.map((item) =>
          item.selected && trackedIn(item) ? { ...item, selected: false } : item,
        );
  const [items, setItems] = useState<DiscoveredSubscription[]>(() =>
    untrack(initialDiscovered ?? [], replaceByDefault),
  );
  /** 후보 개수 옆에 붙일 설명(예: "Gmail 메일 40통에서"). */
  const [resultsNote, setResultsNote] = useState<string | null>(initialResultsNote ?? null);
  const [replaceExisting, setReplaceExisting] = useState(replaceByDefault);
  const [, startTransition] = useTransition();
  const sharedTextParsed = useRef(false);

  const parse = (text: string) => {
    setItems(untrack(parsePaymentSms(text), replaceExisting));
    setResultsNote(null);
  };

  /** 붙여 넣은 글을 바꾸고 바로 다시 읽는다. */
  const changeText = (text: string) => {
    setSmsText(text);
    parse(text);
  };

  const clear = () => {
    setSmsText("");
    setItems([]);
    setResultsNote(null);
  };

  const close = () => {
    clear();
    setReplaceExisting(replaceByDefault);
    onClose();
  };

  // 공유하기로 받은 글은 열리자마자 읽는다. 한 번만 읽으므로(sharedTextParsed) parse가 바뀌어도 다시 돌지 않는다.
  useEffect(() => {
    if (!isOpen || !initialSmsText || sharedTextParsed.current) return;
    sharedTextParsed.current = true;
    parse(initialSmsText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSmsText]);

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );

  const selected = items.filter((item) => item.selected);
  // 연간 영수증도 섞여 들어오므로 금액을 그대로 더하면 '/월' 합계가 부풀려진다.
  const monthlyKRW = sumMonthlyKRW(selected, rate);
  /** 지울 구독이 있을 때만 '지우고 등록'이다. */
  const willReplace = replaceExisting && subscriptions.length > 0;
  const isTracked = (item: DiscoveredSubscription) => !willReplace && trackedIn(item);

  const register = () => {
    if (selected.length === 0) return;
    const dataList = selected.map(discoveredFormData);
    startTransition(() => {
      addBatchSubscriptions(dataList, { clearPrevious: willReplace });
      // 결제 메일에서 찾은 후보는 이전 결제 메일들을 방금 등록한 구독에 적는다. 앱이 적는 사실이라
      // 폼 데이터(SubscriptionFormData)로 넘기지 않는다.
      useStore.getState().recordChargeHistory(selected);
      onRegistered?.();
      close();
    });
  };

  return {
    smsText,
    changeText,
    items,
    resultsNote,
    clear,
    close,
    toggle,
    isTracked,
    selected,
    monthlyKRW,
    replaceExisting,
    setReplaceExisting,
    willReplace,
    register,
  };
}
