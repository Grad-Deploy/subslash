import { formatCurrency, type Currency } from "@subslash/shared";

/**
 * Resend is called over its REST API rather than through the SDK: one less
 * dependency in a serverless function that sends two kinds of mail.
 *
 * Without RESEND_API_KEY nothing is sent and the message is logged instead, so
 * the whole reminder flow can be exercised locally.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

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
  const from = process.env.RESEND_FROM_EMAIL || "SubSlash <noreply@subslash.app>";

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — not sending. to=${params.to} subject=${params.subject}`,
    );
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
      console.error(`[email] Resend rejected the message (${response.status}): ${detail}`);
      return { delivered: false, error: `resend_${response.status}` };
    }

    return { delivered: true };
  } catch (error) {
    console.error("[email] Failed to reach Resend:", error);
    return { delivered: false, error: "network" };
  }
}

const shell = (body: string) => `<!doctype html>
<html lang="ko"><body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
${body}
<p style="margin-top:28px;font-size:11px;color:#a1a1aa;">SubSlash — 구독, 끊을 용기</p>
</div></body></html>`;

export function verificationEmail(verifyUrl: string) {
  return {
    subject: "[SubSlash] 결제 알림 수신을 확인해주세요",
    html: shell(`
<h1 style="margin:0 0 12px;font-size:20px;color:#18181b;">결제 알림을 켤까요?</h1>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
아래 버튼을 누르면 결제일이 다가올 때 <strong>딱 한 가지 질문</strong>을 이메일로 보내드립니다.
본인이 신청한 게 아니라면 이 메일을 무시하세요 — 확인 전에는 아무것도 발송되지 않습니다.
</p>
<a href="${verifyUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;">알림 수신 확인하기</a>`),
    text: `SubSlash 결제 알림 수신 확인\n\n아래 링크를 열면 결제일 알림이 시작됩니다.\n${verifyUrl}\n\n본인이 신청하지 않았다면 이 메일을 무시하세요.`,
  };
}

export interface ReminderItem {
  clientId: string;
  name: string;
  amount: number;
  currency: Currency;
  billingDate: string;
  daysLeft: number;
}

export function reminderEmail(items: ReminderItem[], unsubscribeUrl: string) {
  const base = appUrl();
  const counts = [0, 1, 3, 5, 10];

  const blocks = items
    .map((item) => {
      const buttons = counts
        .map(
          (n) =>
            `<a href="${base}/check-in?sub=${encodeURIComponent(item.clientId)}&count=${n}" style="display:inline-block;margin:0 6px 6px 0;padding:9px 15px;border:1px solid #d4d4d8;border-radius:9px;color:#18181b;text-decoration:none;font-size:13px;font-weight:600;">${n}회</a>`,
        )
        .join("");

      return `<div style="margin:0 0 22px;padding:18px;border:1px solid #e4e4e7;border-radius:12px;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#18181b;">${item.name}</p>
<p style="margin:0 0 14px;font-size:13px;color:#71717a;">${item.billingDate}에 ${formatCurrency(item.amount, item.currency)}이 결제됩니다 (D-${item.daysLeft})</p>
<p style="margin:0 0 10px;font-size:13px;color:#3f3f46;">지난 30일 동안 몇 번 이용하셨나요?</p>
${buttons}
</div>`;
    })
    .join("");

  const title =
    items.length === 1
      ? `[SubSlash] ${items[0].name} 결제 D-${items[0].daysLeft} — 몇 번 쓰셨나요?`
      : `[SubSlash] 결제 임박 구독 ${items.length}건 — 몇 번 쓰셨나요?`;

  const textBody = items
    .map(
      (item) =>
        `${item.name} — ${item.billingDate} ${formatCurrency(item.amount, item.currency)} (D-${item.daysLeft})\n` +
        counts.map((n) => `  ${n}회: ${base}/check-in?sub=${item.clientId}&count=${n}`).join("\n"),
    )
    .join("\n\n");

  return {
    subject: title,
    html: shell(`
<h1 style="margin:0 0 6px;font-size:20px;color:#18181b;">결제 전 마지막 점검</h1>
<p style="margin:0 0 20px;font-size:13px;color:#71717a;">버튼을 누르면 1회당 실제 사용 단가가 계산됩니다.</p>
${blocks}
<p style="margin:20px 0 0;font-size:11px;color:#a1a1aa;">
알림이 필요 없다면 <a href="${unsubscribeUrl}" style="color:#71717a;">수신 거부</a>할 수 있습니다.
</p>`),
    text: `결제 전 마지막 점검\n\n${textBody}\n\n수신 거부: ${unsubscribeUrl}`,
  };
}
