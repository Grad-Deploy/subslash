import { type Subscription, formatKRW, getMyMonthlyAmountKRW } from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { ServiceLogo } from "../../subscription/ServiceLogo";
import styles from "./AppValueReceipt.module.css";

/** 앱 확인 창에 넣는 구독 한 줄: 로고 · 이름 ······ ₩ 금액 /월. 금액을 문장에 섞지 않고 따로 보여준다. */
export function AppSubRow({ subscription }: { subscription: Subscription }) {
  const rate = useExchangeRate();
  const monthly = getMyMonthlyAmountKRW(subscription, rate);
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-secondary/40 px-3 py-3">
      <ServiceLogo
        name={subscription.name}
        cancelUrl={subscription.cancelUrl}
        fallbackEmoji={subscription.iconUrl}
        fallbackColor={subscription.iconColor}
        size={36}
      />
      <p className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm font-bold">
        <span className="min-w-0 truncate">{subscription.name}</span>
        <span className={styles.leader} aria-hidden />
        <span className="shrink-0 font-mono text-base font-black tabular-nums">
          {formatKRW(monthly).replace(/^₩\s*/, "₩ ")}
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">/월</span>
      </p>
    </div>
  );
}
