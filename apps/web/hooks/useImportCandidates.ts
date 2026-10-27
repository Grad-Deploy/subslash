"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { parsePaymentSms, sumMonthlyKRW, type DiscoveredSubscription } from "@subslash/shared";
import { discoveredFormData } from "@lib/discovered-form";
import { useStore } from "@lib/store";
import { useExchangeRate } from "./useExchangeRate";

/**
 * 결제 문자·메일에서 찾은 구독 후보를 고르고 등록하는 상태. 웹의 가운데 창(AutoImportModal)과 앱의 시트
 * (AppAutoImportModal)가 같은 것을 쓴다 — 따로 들고 있을 때 등록 뒤 결제 기록 적기 같은 단계를 한쪽만 고치게
 * 됐다. 화면마다 다른 것은 '기존 구독 지우고 등록'의 처음 값(`replaceByDefault`)뿐이다.
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
  const rate = useExchangeRate();
  const [smsText, setSmsText] = useState(initialSmsText ?? "");
  const [items, setItems] = useState<DiscoveredSubscription[]>(initialDiscovered ?? []);
  /** 후보 개수 옆에 붙일 설명(예: "Gmail 메일 40통에서"). */
  const [resultsNote, setResultsNote] = useState<string | null>(initialResultsNote ?? null);
  const [replaceExisting, setReplaceExisting] = useState(replaceByDefault);
  const [, startTransition] = useTransition();
  const sharedTextParsed = useRef(false);

  const parse = (text: string) => {
    setItems(parsePaymentSms(text));
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

  // 공유하기로 받은 글은 열리자마자 읽는다.
  useEffect(() => {
    if (!isOpen || !initialSmsText || sharedTextParsed.current) return;
    sharedTextParsed.current = true;
    parse(initialSmsText);
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
    selected,
    monthlyKRW,
    replaceExisting,
    setReplaceExisting,
    willReplace,
    register,
  };
}
