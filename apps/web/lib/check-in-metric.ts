import { metricForSubscription, type Subscription, type ValueMetric } from "@subslash/shared";
import { IS_APP_BUILD } from "./platform";

/** 지금 이 화면(앱·웹)에서 체크인할 때 묻는 지표. 폰 기록만 쓰는 코드는 앱 전용이라 `"app"`을 바로 넘긴다. */
export function currentMetricFor(
  sub: Pick<Subscription, "name" | "cancelUrl" | "category" | "currency">,
): ValueMetric {
  return metricForSubscription(sub, IS_APP_BUILD ? "app" : "web");
}
