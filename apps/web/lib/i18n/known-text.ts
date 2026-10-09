"use client";

import { useCallback } from "react";
import { useLocale } from "./locale";
import type { Locale } from "./config";

/**
 * 화면 문구 파일(messages) 밖에서 만들어져 화면에 그대로 닿는 한국어 문장의 영어. 입력 검사
 * (`@subslash/shared`의 validateSignup 등)는 서버와 같은 함수라 한국어 문장을 돌려주고, 서버도 그 문장과 자기
 * 오류 문구를 응답에 싣는다. 검사 함수를 언어마다 나누면 서버 경로를 모두 고쳐야 해서, 보여 주는 자리에서
 * 이 표로 바꾼다.
 *
 * 표에 없는 문장은 원문(한국어)을 그대로 보인다 — 뜻을 짐작해 지어내지 않는다. 검사 함수나 서버 문구를 고치면
 * 이 표도 고친다. `__tests__/unit/known-text.test.ts`가 검사 함수의 갈래마다 영어가 나오는지 본다.
 */
/** 백업 파일 검사(lib/backup)가 틀렸다고 알리는 목록·칸 이름. */
const BACKUP_LISTS_EN: Record<string, string> = {
  구독: "subscription",
  "체크인 기록": "check-in",
  "연동 계정": "linked account",
};
const BACKUP_FIELDS_EN: Record<string, string> = {
  형식: "format",
  ID: "ID",
  이름: "name",
  금액: "amount",
  통화: "currency",
  결제일: "billing day",
  "결제 주기": "billing cycle",
  "결제 월": "billing month",
  카테고리: "category",
  상태: "status",
  등록일: "added date",
  해지일: "cancelled date",
  "숨긴 날": "hidden date",
  "요금 확인일": "price checked date",
  "함께 쓰는 사람 수": "people sharing",
  "내 몫": "my share",
  "결제 수단": "payment method",
  "해지 링크": "cancel link",
  "해지 안내": "cancel guide",
  아이콘: "icon",
  "아이콘 색": "icon color",
  요금제: "plan",
  "요금제 이름": "plan name",
  세금: "tax",
  "연동 계정": "linked account",
  "연동 계정 이름": "linked account name",
  메모: "memo",
  "무료 요금제로 충분했는지": "free plan answer",
  "토큰 사용량": "token usage",
  "다시 살펴볼 날": "review date",
  "해지 기록": "cancellation record",
  "주문 메일 근거": "order email evidence",
  "결제 메일 기록": "payment email history",
  "구독 ID": "subscription ID",
  월: "month",
  "사용 횟수": "usage count",
  "1회당 비용": "cost per use",
  위험도: "risk level",
  "체크인 시각": "check-in time",
  "체크인 출처": "check-in source",
  "체크인 지표": "check-in metric",
  "로그인 제공자": "login provider",
  칭호: "title",
  "이메일/ID": "email/ID",
  색: "color",
};

const EN: [RegExp, (...groups: string[]) => string][] = [
  // 아이디
  [/^아이디를 입력해주세요\.$/, () => "Enter a username."],
  [
    /^아이디는 (\d+)~(\d+)자로 입력해주세요\.$/,
    (min, max) => `Usernames must be ${min}–${max} characters.`,
  ],
  [
    /^아이디는 영문 소문자, 숫자, 밑줄\(_\)만 쓸 수 있습니다\.$/,
    () => "Usernames can only use lowercase letters, numbers and underscores (_).",
  ],
  [/^아이디 또는 이메일을 입력해주세요\.$/, () => "Enter your username or email."],
  [/^이미 사용 중인 아이디입니다\.$/, () => "That username is already taken."],
  [
    /^쓸 수 있는 형식입니다\. 이미 쓰는 아이디인지는 가입할 때 확인합니다\.$/,
    () => "This format works. Whether the username is taken is checked when you sign up.",
  ],

  // Gmail 가져오기
  [
    /^가져온 메일 내용을 읽지 못했습니다\. Apps Script 화면에서 버튼을 다시 눌러주세요\.$/,
    () => "Couldn't read the imported emails. Tap the button again on the Apps Script screen.",
  ],

  // 서비스 주소(구독 등록 폼)
  [/^주소를 확인해주세요\. \(예: service\.com\)$/, () => "Check the address (e.g. service.com)."],

  // 이메일
  [/^이메일을 입력해주세요\.$/, () => "Enter an email address."],
  [/^이메일이 너무 깁니다\.$/, () => "That email address is too long."],
  [
    /^잘못된 이메일 형식입니다\. \(예: you@example\.com\)$/,
    () => "That's not a valid email address (e.g. you@example.com).",
  ],
  [
    /^잘못된 이메일 형식입니다\. @ 뒤의 도메인을 확인해주세요\. \(예: gmail\.com, naver\.com\)$/,
    () => "That's not a valid email address. Check the domain after @ (e.g. gmail.com, naver.com).",
  ],
  [
    /^잘못된 이메일 주소입니다\. 혹시 (.+) 아닌가요\?$/,
    (s) => `That email address looks wrong. Did you mean ${s}?`,
  ],
  [
    /^가입할 수 없는 이메일입니다\. naver\.com, gmail\.com, daum\.net 등 자주 쓰는 메일 주소를 입력해주세요\.$/,
    () =>
      "This email address can't be used to sign up. Use a common email provider such as naver.com, gmail.com or daum.net.",
  ],
  [
    /^쓸 수 있는 이메일입니다\. 이미 가입된 이메일인지는 가입할 때 확인합니다\.$/,
    () => "This email works. Whether it's already registered is checked when you sign up.",
  ],
  [/^이미 가입된 이메일입니다\.$/, () => "That email is already registered."],
  [
    /^확인을 기다리는 계정이 있는 이메일입니다\.$/,
    () => "An account waiting for email confirmation already uses this email.",
  ],

  // 비밀번호
  [/^비밀번호를 입력해주세요\.$/, () => "Enter a password."],
  [
    /^비밀번호를 (\d+)자 더 입력해주세요\. \((\d+)자 이상\)$/,
    (more, min) =>
      `Enter ${more} more ${more === "1" ? "character" : "characters"} (at least ${min}).`,
  ],
  [
    /^비밀번호는 (\d+)자 이하여야 합니다\.$/,
    (max) => `Passwords can be at most ${max} characters.`,
  ],
  [
    /^같은 문자만으로는 비밀번호를 만들 수 없습니다\.$/,
    () => "A password can't be one repeated character.",
  ],
  [/^비밀번호가 너무 깁니다\.$/, () => "That password is too long."],
  [/^비밀번호를 한 번 더 입력해주세요\.$/, () => "Enter the password again."],
  [/^비밀번호가 서로 다릅니다\.$/, () => "The passwords don't match."],
  [/^비밀번호가 일치하지 않습니다\.$/, () => "The passwords don't match."],
  [/^비밀번호가 일치합니다\.$/, () => "The passwords match."],
  [/^사용할 수 있는 비밀번호입니다\.$/, () => "This password works."],

  // 나이·성별·만 14세
  [/^나이를 입력해주세요\.$/, () => "Enter your age."],
  [/^나이는 숫자로 입력해주세요\.$/, () => "Enter your age as a number."],
  [
    /^만 (\d+)세 이상만 이용할 수 있습니다\.$/,
    (age) => `You must be ${age} or older to use SubSlash.`,
  ],
  [/^나이를 다시 확인해주세요\.$/, () => "Please check your age."],
  [/^성별을 선택해주세요\.$/, () => "Select a gender."],
  [/^성별을 다시 선택해주세요\.$/, () => "Please select a gender again."],
  [/^만 (\d+)세 이상인지 확인해주세요\.$/, (age) => `Confirm that you are ${age} or older.`],

  // 서버 응답
  [/^요청을 이해할 수 없습니다\.$/, () => "The request couldn't be understood."],
  [/^입력값을 확인해주세요\.$/, () => "Please check what you entered."],
  [/^아이디 또는 비밀번호가 올바르지 않습니다\.$/, () => "Incorrect username or password."],
  [/^로그인을 처리하지 못했습니다\.$/, () => "Couldn't log you in."],
  [/^이미 사용 중인 정보가 있습니다\.$/, () => "Some of these details are already in use."],
  [/^가입을 처리하지 못했습니다\.$/, () => "Couldn't complete sign-up."],
  [
    /^요청이 너무 많습니다\. (\d+)분 뒤에 다시 시도해 주세요\.$/,
    (m) => `Too many requests. Try again in ${m} minutes.`,
  ],
  [
    /^요청이 너무 많습니다\. 잠시 뒤에 다시 시도해 주세요\.$/,
    () => "Too many requests. Try again shortly.",
  ],

  // 확인 메일 발송 결과(describeSendOutcome)
  [
    /^(.+)로 확인 메일을 보냈습니다\. 받은편지함에 없으면 스팸함도 확인해주세요\.$/,
    (email) =>
      `We sent a confirmation email to ${email}. If it's not in your inbox, check your spam folder.`,
  ],
  [
    /^이 주소로 메일을 너무 자주 보냈습니다\. (\d+)(초|분|시간) 뒤에 다시 보낼 수 있습니다\.$/,
    (n, unit) =>
      `Too many emails were sent to this address. You can send again in ${n} ${
        { 초: "second", 분: "minute", 시간: "hour" }[unit] ?? unit
      }${n === "1" ? "" : "s"}.`,
  ],
  [
    /^이 서버에는 메일 발송이 설정돼 있지 않아 확인 메일을 보내지 못했습니다\.$/,
    () => "Email sending isn't set up on this server, so the confirmation email wasn't sent.",
  ],
  [
    /^확인 메일을 보내지 못했습니다\. 잠시 뒤 다시 보내주세요\.$/,
    () => "Couldn't send the confirmation email. Please try again shortly.",
  ],
  [/^확인 메일을 보내지 못했습니다\.$/, () => "Couldn't send the confirmation email."],

  // 비밀번호 재설정 메일(describeResetOutcome)
  [
    /^(.+)로 비밀번호 재설정 메일을 보냈습니다\. 링크는 (\d+)분 동안 한 번만 쓸 수 있습니다\. 받은편지함에 없으면 스팸함도 확인해주세요\.$/,
    (email, m) =>
      `We sent a password reset email to ${email}. The link works once, for ${m} minutes. If it's not in your inbox, check your spam folder.`,
  ],
  [
    /^이 주소로 메일을 너무 자주 보냈습니다\. (\d+)(초|분|시간) 뒤에 다시 요청할 수 있습니다\.$/,
    (n, unit) =>
      `Too many emails were sent to this address. You can ask again in ${n} ${
        { 초: "second", 분: "minute", 시간: "hour" }[unit] ?? unit
      }${n === "1" ? "" : "s"}.`,
  ],
  [
    /^이 서버에는 메일 발송이 설정돼 있지 않아 재설정 메일을 보내지 못했습니다\.$/,
    () => "Email sending isn't set up on this server, so the reset email wasn't sent.",
  ],
  [
    /^재설정 메일을 보내지 못했습니다\. 잠시 뒤 다시 요청해주세요\.$/,
    () => "Couldn't send the reset email. Please try again shortly.",
  ],
  [/^재설정 메일을 보내지 못했습니다\.$/, () => "Couldn't send the reset email."],
  [/^이 이메일로 가입한 계정이 없습니다\.$/, () => "No account is signed up with this email."],

  // 내 정보·비밀번호·탈퇴·로그인 방법
  [/^로그인이 필요합니다\.$/, () => "You need to log in."],
  [/^내 정보를 저장하지 못했습니다\.$/, () => "Couldn't save your details."],
  [/^지금 비밀번호를 입력해주세요\.$/, () => "Enter your current password."],
  [/^지금 비밀번호가 맞지 않습니다\.$/, () => "Your current password is incorrect."],
  [
    /^지금 비밀번호와 다른 비밀번호를 정해주세요\.$/,
    () => "Choose a password different from your current one.",
  ],
  [
    /^다른 곳에서 비밀번호가 먼저 바뀌었습니다\. 새 비밀번호로 다시 로그인해주세요\.$/,
    () => "Your password was changed elsewhere first. Log in again with the new password.",
  ],
  [
    /^비밀번호를 바꾸지 못했습니다\. 잠시 후 다시 시도해주세요\.$/,
    () => "Couldn't change the password. Please try again shortly.",
  ],
  [/^비밀번호를 바꾸지 못했습니다\.$/, () => "Couldn't change the password."],
  [/^비밀번호가 맞지 않습니다\.$/, () => "The password is incorrect."],
  [/^재설정 링크를 처리하지 못했습니다\.$/, () => "Couldn't process the reset link."],
  [/^확인 링크를 처리하지 못했습니다\.$/, () => "Couldn't process the confirmation link."],
  [
    /^이미 확인된 계정이라 이 링크로는 지울 수 없습니다\.$/,
    () => "This account is already confirmed, so this link can't delete it.",
  ],
  [
    /^탈퇴를 처리하지 못했습니다\. 잠시 후 다시 시도해주세요\.$/,
    () => "Couldn't delete the account. Please try again shortly.",
  ],
  // 서버는 '탈퇴'와 'DELETE'를 모두 받으므로 영어 화면에는 영어 확인 글자를 안내한다.
  [/^확인을 위해 '탈퇴'를 입력해주세요\.$/, () => "Type 'DELETE' to confirm."],
  [/^로그인 방법을 불러오지 못했습니다\.$/, () => "Couldn't load your login methods."],
  [/^연결을 시작하지 못했습니다\.$/, () => "Couldn't start connecting."],
  [/^연결을 끊지 못했습니다\.$/, () => "Couldn't disconnect."],
  [/^이미 연결돼 있어요\.$/, () => "It's already connected."],
  [/^지금은 연결할 수 없어요\.$/, () => "Can't connect right now."],
  [
    /^로그인할 방법이 하나뿐이라 끊을 수 없어요\. 비밀번호를 만들거나 다른 계정을 먼저 연결해 주세요\.$/,
    () =>
      "It's your only way to log in, so it can't be disconnected. Create a password or connect another account first.",
  ],

  // Gmail 자동 가져오기(api/gmail, lib/gmail-auto-client)
  [/^아직 시작하지 않은 기능입니다\.$/, () => "This feature hasn't started yet."],
  [/^연결 상태를 읽지 못했습니다\.$/, () => "Couldn't read the connection status."],
  [/^연결 토큰을 만들지 못했습니다\.$/, () => "Couldn't create a connection token."],
  [/^Gmail 연결을 시작하지 못했습니다\.$/, () => "Couldn't start connecting Gmail."],
  [
    /^원클릭 연결이 설정되지 않았습니다\. 스크립트를 직접 설치해 주세요\.$/,
    () => "One-click connection isn't set up. Please install the script yourself.",
  ],
  [/^찾아 둔 구독을 읽지 못했습니다\.$/, () => "Couldn't read the subscriptions we found."],
  [/^찾아 둔 구독을 지우지 못했습니다\.$/, () => "Couldn't clear the subscriptions we found."],

  // 구글 캘린더 등록(api/calendar-sync)
  [
    /^이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다\. 알림 설정의 캘린더 구독을 쓰세요\.$/,
    () => "Google Calendar sync isn't set up on this server.",
  ],
  [/^보낸 구독 목록을 읽지 못했습니다\.$/, () => "Couldn't read the subscriptions you sent."],
  [/^캘린더에 올릴 구독이 없습니다\.$/, () => "There are no subscriptions to add to the calendar."],
  [/^캘린더 등록을 시작하지 못했습니다\.$/, () => "Couldn't start the calendar sync."],

  // 여러 기기 사용 측정(api/usage, lib/device-usage-client)
  [/^사용 정보 접근 설정을 열지 못했습니다\.$/, () => "Couldn't open the usage access settings."],
  [/^사용 기록을 올리지 못했습니다\.$/, () => "Couldn't upload your usage."],
  [/^사용 기록을 읽지 못했습니다\.$/, () => "Couldn't read your usage."],
  [/^보낸 사용 기록을 읽지 못했습니다\.$/, () => "Couldn't read the usage you sent."],
  [/^사용 기록을 저장하지 못했습니다\.$/, () => "Couldn't save your usage."],
  [/^사용 기록을 지우지 못했습니다\.$/, () => "Couldn't delete your usage."],

  // 익명 통계(api/stats, lib/stats-client)
  [
    /^로그인해야 통계에 참여할 수 있습니다\.$/,
    () => "You need to be logged in to take part in the statistics.",
  ],
  [/^보낸 요약을 읽지 못했습니다\.$/, () => "Couldn't read the summary you sent."],
  [/^참여 기록이 없습니다\.$/, () => "There's no participation record."],
  [/^통계에 보내지 못했습니다\.$/, () => "Couldn't send to the statistics."],
  [/^토큰이 없습니다\.$/, () => "The token is missing."],
  [/^기록을 지우지 못했습니다\.$/, () => "Couldn't delete the record."],
  [/^통계를 읽지 못했습니다\.$/, () => "Couldn't read the statistics."],

  // 리포트에 물어보기·도움말 AI(api/ask, api/help-ask, lib/ask/guard)
  [/^아직 준비 중인 기능이에요\.$/, () => "This feature isn't ready yet."],
  [/^지금은 답할 수 없어요\.$/, () => "Can't answer right now."],
  [
    /^지금은 답할 수 없어요\. 잠시 뒤에 다시 물어봐 주세요\.$/,
    () => "Can't answer right now. Please ask again in a moment.",
  ],
  [/^질문을 적어 주세요\.$/, () => "Type a question."],
  [/^질문은 (\d+)자까지 적을 수 있어요\.$/, (max) => `Questions can be up to ${max} characters.`],
  [
    /^질문이 많아 잠시 쉬어 갈게요\. 조금 뒤에 다시 물어봐 주세요\.$/,
    () => "Lots of questions right now. Please ask again in a little while.",
  ],

  // 계정 저장(api/account/snapshot)
  [/^계정에 저장된 기록이 없습니다\.$/, () => "There are no records saved to your account."],
  [
    /^계정에 저장된 기록을 읽지 못했습니다\.$/,
    () => "Couldn't read the records saved to your account.",
  ],
  [
    /^기록이 너무 커서 계정에 저장할 수 없습니다\. 백업 파일로 저장해 주세요\.$/,
    () => "Your records are too large to save to your account. Save a backup file instead.",
  ],
  [/^계정에 저장하지 못했습니다\.$/, () => "Couldn't save to your account."],
  [
    /^계정에 저장된 기록을 지우지 못했습니다\.$/,
    () => "Couldn't delete the records saved to your account.",
  ],
  [
    /^다른 기기에서 먼저 계정의 기록을 바꿨습니다\.$/,
    () => "Another device changed your account's records first.",
  ],
  [
    /^이 서버에는 데이터베이스가 설정되어 있지 않아 알림·계정 기능을 사용할 수 없습니다\. 구독 목록은 브라우저에 그대로 남아 있습니다\.$/,
    () =>
      "This server has no database set up, so account features aren't available. Your subscriptions stay in this browser.",
  ],

  // 백업 파일 복원(lib/backup의 parseBackup)
  [
    /^JSON 파일이 아닙니다\. SubSlash에서 저장한 백업 파일을 골라주세요\.$/,
    () => "This isn't a JSON file. Choose a backup file saved from SubSlash.",
  ],
  [/^SubSlash 백업 파일이 아닙니다\.$/, () => "This isn't a SubSlash backup file."],
  [
    /^백업 파일의 형식 버전을 알 수 없습니다\.$/,
    () => "The backup file's format version is unknown.",
  ],
  [
    /^이 앱보다 새로운 형식의 백업입니다\. 페이지를 새로 고친 뒤 다시 시도해주세요\.$/,
    () => "This backup is in a newer format than this app. Refresh the page and try again.",
  ],
  [
    /^백업 파일에 구독·체크인·연동 계정 목록이 모두 있어야 합니다\.$/,
    () => "The backup file must contain the subscription, check-in and linked account lists.",
  ],
  [
    /^(구독|체크인 기록|연동 계정) (\d+)번째 항목의 '(.+)' 칸이 올바르지 않습니다\.$/,
    (list, index, field) =>
      `The '${BACKUP_FIELDS_EN[field] ?? field}' field of ${BACKUP_LISTS_EN[list]} #${index} isn't valid.`,
  ],
  [
    /^구독 (\d+)번째 항목의 ID가 다른 구독과 겹칩니다\.$/,
    (index) => `Subscription #${index} has the same ID as another subscription.`,
  ],
  [/^환율 설정이 올바르지 않습니다\.$/, () => "The exchange rate setting isn't valid."],
];

/** 표에 있는 한국어 문장이면 그 언어로, 아니면 그대로. */
export function translateKnownText(text: string, locale: Locale): string {
  if (locale === "ko") return text;
  for (const [pattern, render] of EN) {
    const match = pattern.exec(text);
    if (match) return render(...match.slice(1));
  }
  return text;
}

/** 지금 언어로 바꾸는 함수. 검사 결과·서버 응답을 화면에 붙이는 자리에서 쓴다. */
export function useKnownText(): (text: string) => string {
  const locale = useLocale();
  return useCallback((text: string) => translateKnownText(text, locale), [locale]);
}
