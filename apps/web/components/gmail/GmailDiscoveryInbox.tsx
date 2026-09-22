"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { realRecords, useStore } from "@lib/store";
import { isGmailAutoImportOpen } from "@lib/privacy";
import {
  acknowledgeGmailDiscoveries,
  discoveryToCandidate,
  discoveryToFormData,
  fetchGmailDiscoveries,
  planDiscoveries,
  type GmailDiscovery,
} from "@lib/gmail-auto-client";
import { AutoImportModal } from "../import/AutoImportModal";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";

/**
 * Gmail 자동 가져오기로 찾아 둔 구독을 받는 곳. 모든 화면 위에 붙는다.
 *
 * 로그인한 브라우저가 열릴 때 서버의 후보를 한 번 받는다. 알려진 서비스의 최근 결제는 확인 없이
 * 등록하고 무엇을 등록했는지와 되돌리기를 보여준다. 확실하지 않은 후보는 사용자가 고를 때까지
 * 서버에 남겨 둔다. 샘플 체험 중에는 받지 않는다 — 등록하면 체험이 끝나 버린다.
 */
export function GmailDiscoveryInbox() {
  const { account } = useAuth();
  const demo = useStore((state) => state.demo);
  const addBatchSubscriptions = useStore((state) => state.addBatchSubscriptions);
  const deleteSubscription = useStore((state) => state.deleteSubscription);
  const markChargedAfterKill = useStore((state) => state.markChargedAfterKill);
  const markObservedAmount = useStore((state) => state.markObservedAmount);

  const [registered, setRegistered] = useState<{ ids: string[]; names: string[] } | null>(null);
  const [review, setReview] = useState<GmailDiscovery[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // 계정마다 한 번만 받는다. 개발 모드의 StrictMode가 effect를 두 번 돌려도 두 번 등록하지 않는다.
  const handledAccount = useRef<string | null>(null);

  useEffect(() => {
    if (!isGmailAutoImportOpen()) return;
    if (!account || demo || handledAccount.current === account.id) return;
    handledAccount.current = account.id;

    void (async () => {
      let discoveries: GmailDiscovery[];
      try {
        discoveries = await fetchGmailDiscoveries();
      } catch {
        // 받지 못하면 다음에 열 때 다시 받는다. 후보는 서버에 그대로 있다.
        return;
      }
      if (discoveries.length === 0) return;

      const subscriptions = realRecords(useStore.getState()).subscriptions;
      const plan = planDiscoveries(discoveries, subscriptions);

      if (plan.register.length > 0) {
        const created = addBatchSubscriptions(plan.register.map(discoveryToFormData));
        setRegistered({
          ids: created.map((sub) => sub.id),
          names: created.map((sub) => sub.name),
        });
      }
      // 해지했는데 결제 메일이 온 것은 그 구독에 적어 둔다. 행동 큐가 가장 위에 올린다.
      for (const { subscriptionId, discovery } of plan.chargedAfterKill) {
        markChargedAfterKill(subscriptionId, discovery.receiptDate, discovery.amount);
      }
      // 구독 중인데 영수증 금액이 다른 것도 적어 둔다. 요금이 바뀐 것일 수도, 등록이 틀린 것일
      // 수도 있어 어느 쪽인지 말하지 않고 두 숫자만 나란히 보여준다.
      for (const { subscriptionId, discovery } of plan.amountChanged) {
        markObservedAmount(subscriptionId, discovery.receiptDate, discovery.amount);
      }
      setReview(plan.review);

      // 등록했거나 이미 구독 중인 후보는 지운다. 지우지 못해도 다음에 받을 때 '이미 구독 중'으로
      // 걸러지므로 두 번 등록되지 않는다.
      await acknowledgeGmailDiscoveries(
        [...plan.register, ...plan.alreadyTracked].map((item) => item.id),
      ).catch(() => undefined);
    })();
  }, [account, demo, addBatchSubscriptions, markChargedAfterKill, markObservedAmount]);

  const acknowledgeReview = () => {
    const ids = review.map((item) => item.id);
    setReview([]);
    setConfirmDiscard(false);
    void acknowledgeGmailDiscoveries(ids).catch(() => undefined);
  };

  const undo = () => {
    if (!registered) return;
    for (const id of registered.ids) deleteSubscription(id);
    setRegistered(null);
  };

  if (!registered && review.length === 0) return null;

  const subscriptions = realRecords(useStore.getState()).subscriptions;

  return (
    <div
      role="status"
      className="border-b border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-100"
    >
      <div className="container mx-auto max-w-6xl space-y-2 px-4 py-2.5 text-xs">
        {registered && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="leading-relaxed break-keep">
              {" "}
              <strong>
                Gmail 결제 메일에서 구독 {registered.names.length}건을 등록했습니다:
              </strong>{" "}
              {registered.names.join(", ")}. 금액은 메일에서 읽은 값이니 한 번 확인해 주세요.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" className="bg-background" onClick={undo}>
                되돌리기
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRegistered(null)}>
                닫기
              </Button>
            </div>
          </div>
        )}

        {review.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="leading-relaxed break-keep">
                <strong>Gmail 결제 메일에서 확인이 필요한 구독 {review.length}건</strong>을
                찾았습니다.
              </p>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background"
                  onClick={() => setReviewOpen(true)}
                >
                  확인하기
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDiscard(true)}>
                  버리기
                </Button>
              </div>
            </div>
            {confirmDiscard && (
              <InlineConfirm
                message={`찾은 후보 ${review.length}건을 등록하지 않고 버릴까요? 다음 검사에서 새 결제 메일이 오면 다시 찾습니다.`}
                confirmText="버리기"
                onCancel={() => setConfirmDiscard(false)}
                onConfirm={acknowledgeReview}
              />
            )}
          </div>
        )}
      </div>

      {reviewOpen && (
        <AutoImportModal
          isOpen
          onClose={() => setReviewOpen(false)}
          initialDiscovered={review.map((item) => discoveryToCandidate(item, subscriptions))}
          initialResultsNote="Gmail 자동 검사에서"
          onRegistered={acknowledgeReview}
        />
      )}
    </div>
  );
}
