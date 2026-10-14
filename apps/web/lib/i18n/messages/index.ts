import type { Locale } from "../config";
import * as appSmall from "./appSmall";
import * as ask from "./ask";
import * as auth from "./auth";
import * as backup from "./backup";
import * as checkin from "./checkin";
import * as dashboard from "./dashboard";
import * as detail from "./detail";
import * as deviceUsage from "./deviceUsage";
import * as form from "./form";
import * as helpPage from "./helpPage";
import * as importing from "./importing";
import * as landing from "./landing";
import * as usageApp from "./usageApp";
import * as usageMore from "./usageMore";
import * as usageChart from "./usageChart";
import * as measured from "./measured";
import * as reminders from "./reminders";
import * as account from "./account";
import * as accountPages from "./accountPages";
import * as amountHistory from "./amountHistory";
import * as oauth from "./oauth";
import * as overview from "./overview";
import * as pageTitles from "./pageTitles";
import * as pcUsage from "./pcUsage";
import * as privacyPage from "./privacyPage";
import * as receipt from "./receipt";
import * as receiptView from "./receiptView";
import * as reportPage from "./reportPage";
import * as savings from "./savings";
import * as settings from "./settings";
import * as shell from "./shell";
import * as subs from "./subs";
import * as value from "./value";

/**
 * 한 언어의 문구를 영역별로 모은다. 영역을 더하면 여기 한 곳에 넣는다 — 각 영역 파일이 `Widen<typeof ko>`로
 * 언어마다의 모양을 맞추므로 번역이 빠지면 그 파일에서 타입 검사가 잡는다.
 */
function messagesFor<L extends Locale>(locale: L) {
  return {
    shell: shell[locale],
    pageTitles: pageTitles[locale],
    settings: settings[locale],
    backup: backup[locale],
    deviceUsage: deviceUsage[locale],
    auth: auth[locale],
    oauth: oauth[locale],
    dashboard: dashboard[locale],
    value: value[locale],
    overview: overview[locale],
    subs: subs[locale],
    checkin: checkin[locale],
    form: form[locale],
    ...appSmall[locale],
    ...helpPage[locale],
    ...landing[locale],
    ...usageApp[locale],
    ...usageMore[locale],
    ...usageChart[locale],
    ...measured[locale],
    ...reminders[locale],
    ...account[locale],
    ...accountPages[locale],
    ...amountHistory[locale],
    ...importing[locale],
    ...savings[locale],
    ...receiptView[locale],
    ...ask[locale],
    ...reportPage[locale],
    ...detail[locale],
    ...receipt[locale],
    ...pcUsage[locale],
    ...privacyPage[locale],
  };
}

export type Messages = ReturnType<typeof messagesFor<"ko">>;

/** 언어마다의 문구. 언어를 더하면(`LOCALES`) 여기서 빠진 언어가 타입 오류로 드러난다. */
export const messages = {
  ko: messagesFor("ko"),
  en: messagesFor("en"),
  zh: messagesFor("zh"),
  ja: messagesFor("ja"),
  vi: messagesFor("vi"),
  fr: messagesFor("fr"),
  es: messagesFor("es"),
  de: messagesFor("de"),
  pt: messagesFor("pt"),
} satisfies Record<Locale, Messages>;
