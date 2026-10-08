import * as auth from "./auth";
import * as backup from "./backup";
import * as checkin from "./checkin";
import * as dashboard from "./dashboard";
import * as detail from "./detail";
import * as deviceUsage from "./deviceUsage";
import * as form from "./form";
import * as oauth from "./oauth";
import * as overview from "./overview";
import * as receipt from "./receipt";
import * as settings from "./settings";
import * as shell from "./shell";
import * as subs from "./subs";
import * as value from "./value";

/**
 * 영역별 문구를 언어마다 모은다. 영역을 더하면 여기 두 줄에 함께 넣는다 — 영어 쪽이 빠지면 타입 검사가 잡는다.
 */
export const messages = {
  ko: {
    shell: shell.ko,
    settings: settings.ko,
    backup: backup.ko,
    deviceUsage: deviceUsage.ko,
    auth: auth.ko,
    oauth: oauth.ko,
    dashboard: dashboard.ko,
    value: value.ko,
    overview: overview.ko,
    subs: subs.ko,
    checkin: checkin.ko,
    form: form.ko,
    ...detail.ko,
    ...receipt.ko,
  },
  en: {
    shell: shell.en,
    settings: settings.en,
    backup: backup.en,
    deviceUsage: deviceUsage.en,
    auth: auth.en,
    oauth: oauth.en,
    dashboard: dashboard.en,
    value: value.en,
    overview: overview.en,
    subs: subs.en,
    checkin: checkin.en,
    form: form.en,
    ...detail.en,
    ...receipt.en,
  },
} satisfies Record<string, unknown>;

export type Messages = (typeof messages)["ko"];
