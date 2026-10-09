"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Laptop } from "lucide-react";
import { metricForSubscription, type CheckInResponse, type Subscription } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useServiceNames, useT } from "@lib/i18n";
import { matchPcUsageSubscription, parsePcUsageHash, type PcUsageServiceId } from "@lib/pc-usage";
import { CheckInModal } from "../../components/subscription/CheckInModal";
import { ServiceLogo } from "../../components/subscription/ServiceLogo";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";

/**
 * PC의 AI 코딩 도구 사용을 체크인으로 받는다(`npx subslash-usage`가 만든 링크, lib/pc-usage).
 *
 * 링크의 숫자는 `#` 뒤에만 있어 서버로 가지 않는다. 숫자를 체크인 창에 채워 보여 주기만 하고, 저장은
 * 사용자가 확인을 눌러야 된다 — PC에서 쓴 날만 셌으므로 웹·폰에서 쓴 날을 더할 수 있어야 한다.
 */
export default function PcUsagePage() {
  const mounted = useIsClient();
  const t = useT().pcUsage;
  const subscriptions = useStore((state) => state.subscriptions);
  const parsed = useMemo(
    () => (mounted ? parsePcUsageHash(window.location.hash) : null),
    [mounted],
  );

  if (!parsed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!parsed.ok) {
    const stale = parsed.reason === "stale";
    return (
      <Notice
        title={stale ? t.staleTitle : t.invalidTitle}
        body={stale ? t.staleBody : t.invalidBody}
      />
    );
  }

  const { link } = parsed;
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8">
      <header className="space-y-1.5">
        <h1 className="text-xl font-black tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.description(link.windowDays, link.until)}
        </p>
      </header>
      <ul className="space-y-2">
        {link.entries.map((entry) => (
          <PcUsageRow
            key={entry.serviceId}
            serviceId={entry.serviceId}
            days={entry.days}
            subscriptions={subscriptions}
          />
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.pcOnly}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.privacy}</p>
    </div>
  );
}

function PcUsageRow({
  serviceId,
  days,
  subscriptions,
}: {
  serviceId: PcUsageServiceId;
  days: number;
  subscriptions: readonly Subscription[];
}) {
  const t = useT().pcUsage;
  const names = useServiceNames();
  const checkIn = useStore((state) => state.checkIn);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CheckInResponse | undefined>();
  const [done, setDone] = useState(false);

  const match = matchPcUsageSubscription(serviceId, subscriptions);
  const subscription = match.kind === "match" ? match.subscription : null;
  // 이 화면이 채우는 숫자는 '쓴 날'이다. 다른 기준으로 재는 구독에 넣으면 사용자가 답하지 않은 숫자가 된다.
  const sameMetric = subscription ? metricForSubscription(subscription) === "days" : false;

  const problem =
    match.kind === "none"
      ? t.none
      : match.kind === "ambiguous"
        ? t.ambiguous(match.count)
        : !sameMetric
          ? t.otherMetric
          : null;

  return (
    <li className="space-y-2 rounded-2xl border p-3">
      <div className="flex items-center gap-3">
        <ServiceLogo presetId={serviceId} name={names.id(serviceId)} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {subscription ? names.sub(subscription) : names.id(serviceId)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.tool[serviceId]} · {t.days(days)}
          </p>
        </div>
        {subscription && sameMetric && (
          <Button size="sm" variant={done ? "outline" : "default"} onClick={() => setOpen(true)}>
            {done ? t.done : t.checkIn}
          </Button>
        )}
      </div>
      {problem && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {problem}{" "}
          <Link href="/subs" className="font-semibold text-foreground underline">
            {t.toSubs}
          </Link>
        </p>
      )}
      {subscription && sameMetric && (
        <CheckInModal
          subscription={subscription}
          isOpen={open}
          initialCount={days}
          result={result}
          onSubmit={(count) => {
            setResult(checkIn(subscription.id, count));
            setDone(true);
          }}
          onClose={() => {
            setOpen(false);
            setResult(undefined);
          }}
        />
      )}
    </li>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  const t = useT().pcUsage;
  const router = useRouter();
  return (
    <div className="space-y-4 py-20 text-center">
      <Laptop className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-black tracking-tight">{title}</h1>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Button variant="outline" onClick={() => router.push("/subs")}>
        {t.toSubs}
      </Button>
    </div>
  );
}
