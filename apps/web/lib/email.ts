import { logError } from "./log";

/**
 * Resend is called over its REST API rather than through the SDK: one less
 * dependency in a serverless function that sends two kinds of mail.
 *
 * Without RESEND_API_KEY nothing is sent and the message is logged instead, so
 * the whole flow can be exercised locally.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Resend에서 인증한 발신 도메인(subslash.me)의 주소. 인증하지 않은 도메인으로는 Resend가
 * 거절하고, onboarding@resend.dev는 Resend 계정 주인에게만 보낸다.
 */
const DEFAULT_FROM = "SubSlash <noreply@subslash.me>";

/**
 * 로그에 남길 때 가리는 메일 주소.
 *
 * 메일 주소는 그 자체로 사람을 가리키는 개인정보이고, 배포 로그는 방침이 말하는 보관 대상이
 * 아니다(방침의 '접속 기록'은 IP·시각·경로다). 그렇다고 통째로 지우면 "어느 주소로 못 보냈나"를
 * 못 보므로, 앞 한 글자와 도메인만 남긴다. 문자열 안의 모든 주소를 바꾸므로 남이 보낸 오류
 * 본문에도 쓸 수 있다.
 */
export function maskEmail(value: string): string {
  return value.replace(
    /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+.[A-Za-z]{2,})/g,
    "$1***$2",
  );
}

export interface SendResult {
  delivered: boolean;
  /** Set when the message was logged instead of sent. */
  simulated?: boolean;
  error?: string;
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — not sending. to=${maskEmail(params.to)} subject=${params.subject}`,
    );
    // `pnpm dev`에서 확인 링크를 직접 눌러볼 수 있게 본문을 찍는다. 링크는
    // 자격증명이라, 배포 로그와 테스트 출력에는 남기지 않는다.
    if (process.env.NODE_ENV === "development") console.warn(params.text);
    return { delivered: false, simulated: true };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      // 거절 본문에 받는 주소가 그대로 실려 오는 경우가 있다.
      console.error(
        `[email] Resend rejected the message (${response.status}): ${maskEmail(detail)}`,
      );
      return { delivered: false, error: `resend_${response.status}` };
    }

    return { delivered: true };
  } catch (error) {
    logError("email Failed to reach Resend", error);
    return { delivered: false, error: "network" };
  }
}

/**
 * 메일 HTML에 사용자가 적은 글자를 넣을 때. 구독 이름은 브라우저가 올려 보낸
 * 값이라, 그대로 넣으면 이름에 쓴 태그와 링크가 SubSlash 메일 안에서 살아난다.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 제목 줄은 한 줄이어야 한다. 이름에 든 줄바꿈을 공백으로 편다. */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const shell = (body: string) => `<!doctype html>
<html lang="ko"><body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
${body}
<p style="margin-top:28px;font-size:11px;color:#a1a1aa;">SubSlash — 구독, 끊을 용기</p>
</div></body></html>`;

/**
 * 가입한 이메일이 본인 것인지 묻는 메일.
 *
 * 받는 사람이 가입한 본인이 아닐 수 있다 — 남의 주소로 가입하는 것은 막을 수
 * 없다. 그래서 어떤 아이디가 이 주소를 썼는지 보여주고, 모르는 가입이면 지울 수
 * 있다고 알린다. 링크는 선택지를 보여주는 페이지로 갈 뿐, 여는 것만으로는 아무것도
 * 바뀌지 않는다. 메일 검사기가 링크를 미리 열어보기 때문이다.
 */
export function accountVerificationEmail(params: {
  username: string;
  confirmUrl: string;
  validDays: number;
}) {
  const { username, confirmUrl, validDays } = params;
  return {
    subject: "[SubSlash] 가입한 이메일이 맞는지 확인해주세요",
    html: shell(`
<h1 style="margin:0 0 12px;font-size:20px;color:#18181b;">SubSlash에 가입하셨나요?</h1>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
아이디 <strong>${escapeHtml(username)}</strong> 계정이 이 이메일 주소로 가입했습니다.
아래 버튼을 눌러 본인이 맞는지 알려주세요.
</p>
<a href="${confirmUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">확인하러 가기</a>
<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
가입한 적이 없다면 같은 버튼을 누른 뒤 '제가 가입하지 않았어요'를 고르세요. 그 계정은 지워지고,
이 주소로 다시 가입할 수 있게 됩니다. 링크는 ${validDays}일 동안 쓸 수 있습니다.
</p>`),
    text:
      `SubSlash 가입 이메일 확인\n\n` +
      `아이디 ${oneLine(username)} 계정이 이 이메일 주소로 가입했습니다.\n` +
      `아래 링크를 열어 본인이 맞는지 알려주세요.\n${confirmUrl}\n\n` +
      `가입한 적이 없다면 링크를 연 뒤 '제가 가입하지 않았어요'를 고르세요. ` +
      `그 계정은 지워지고, 이 주소로 다시 가입할 수 있게 됩니다. 링크는 ${validDays}일 동안 쓸 수 있습니다.`,
  };
}

/**
 * 비밀번호 재설정 메일.
 *
 * 요청한 사람이 이 주소의 주인이 아닐 수 있다 — 남의 주소를 적어 요청할 수 있다.
 * 그래서 요청하지 않았다면 무시하면 되고 비밀번호는 그대로라고 먼저 알린다.
 */
export function passwordResetEmail(params: {
  username: string;
  resetUrl: string;
  validMinutes: number;
}) {
  const { username, resetUrl, validMinutes } = params;
  return {
    subject: "[SubSlash] 비밀번호 재설정 링크입니다",
    html: shell(`
<h1 style="margin:0 0 12px;font-size:20px;color:#18181b;">새 비밀번호를 정하세요</h1>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
아이디 <strong>${escapeHtml(username)}</strong> 계정의 비밀번호 재설정을 요청하셨다면
아래 버튼을 눌러 새 비밀번호를 정하세요.
</p>
<a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">새 비밀번호 정하기</a>
<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#71717a;">
요청하지 않았다면 이 메일을 무시하세요. 비밀번호는 바뀌지 않습니다.
링크는 ${validMinutes}분 동안, 한 번만 쓸 수 있습니다.
</p>`),
    text:
      `SubSlash 비밀번호 재설정\n\n` +
      `아이디 ${oneLine(username)} 계정의 비밀번호 재설정을 요청하셨다면 아래 링크에서 새 비밀번호를 정하세요.\n` +
      `${resetUrl}\n\n` +
      `요청하지 않았다면 이 메일을 무시하세요. 비밀번호는 바뀌지 않습니다. ` +
      `링크는 ${validMinutes}분 동안, 한 번만 쓸 수 있습니다.`,
  };
}
