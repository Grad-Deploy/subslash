import * as backup from "./backup";
import * as deviceUsage from "./deviceUsage";
import * as settings from "./settings";
import * as shell from "./shell";

/**
 * 영역별 문구를 언어마다 모은다. 영역을 더하면 여기 두 줄에 함께 넣는다 — 영어 쪽이 빠지면 타입 검사가 잡는다.
 */
export const messages = {
  ko: { shell: shell.ko, settings: settings.ko, backup: backup.ko, deviceUsage: deviceUsage.ko },
  en: { shell: shell.en, settings: settings.en, backup: backup.en, deviceUsage: deviceUsage.en },
} satisfies Record<string, unknown>;

export type Messages = (typeof messages)["ko"];
