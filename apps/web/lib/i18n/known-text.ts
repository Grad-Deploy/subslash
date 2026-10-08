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
  [/^확인을 위해 '(.+)'를 입력해주세요\.$/, (word) => `Type '${word}' to confirm.`],
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
