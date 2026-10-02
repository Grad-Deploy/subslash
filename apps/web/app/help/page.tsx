"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, Mail } from "lucide-react";
import { PRIVACY_OFFICER, isGmailAutoImportOpen, isSocialLoginOpen } from "@lib/privacy";
import { copyText, openExternal } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { Button } from "../../components/ui/button";

interface Faq {
  q: string;
  a: React.ReactNode;
}

interface FaqGroup {
  title: string;
  items: Faq[];
}

/**
 * 자주 묻는 질문. 답은 코드가 실제로 하는 일만 적는다(CLAUDE.md '제1원칙') — 하지 않는 일을 하는 것처럼 적으면
 * 그 말을 믿고 해지를 미룬 사람이 손해를 본다. 기능이 바뀌면 여기도 함께 고친다.
 */
function faqGroups(gmailOpen: boolean, socialOpen: boolean): FaqGroup[] {
  return [
    {
      title: "시작하기",
      items: [
        {
          q: "SubSlash는 무엇을 하나요?",
          a: "구독마다 한 번 쓸 때 얼마인지(1회 단가)를 보여 주고, 아깝다고 판단한 구독은 해지하는 곳까지 안내해요. 구독을 등록하고 지난 30일 동안 몇 번 썼는지 체크인하면 계산돼요.",
        },
        {
          q: "1회 단가는 어떻게 계산하나요?",
          a: "한 달에 내는 내 몫을 지난 30일 동안 쓴 횟수로 나눠요. 여럿이 나눠 내는 구독은 내 몫만 셈하고, 연간 구독은 한 달치로 나눠 계산해요. 체크인하지 않은 구독은 횟수를 모르기 때문에 단가를 지어내지 않고 '체크인 전'으로 둬요.",
        },
      ],
    },
    {
      title: "기록과 로그인",
      items: [
        {
          q: "내 구독 기록은 어디에 저장되나요?",
          a: "기본으로 이 기기(브라우저나 앱) 안에만 저장되고 서버로 보내지 않아요. 로그인하면 기록이 계정에도 저장돼, 로그인한 다른 기기와 자동으로 맞춰져요.",
        },
        {
          q: "기기를 바꾸거나 브라우저 데이터를 지우면 기록이 사라지나요?",
          a: "로그인하지 않았다면 사라질 수 있어요. 미리 로그인해 두거나, 설정의 '백업 · 계정 저장'에서 백업 파일을 저장해 두세요. 새 기기에서 로그인하거나 백업 파일을 불러오면 돼요.",
        },
        ...(socialOpen
          ? [
              {
                q: "구글·카카오·네이버로 로그인하면 '이미 가입한 계정이 있어요'라고 나와요.",
                a: "그 이메일로 먼저 가입한 계정이 있으면, 다른 사람이 같은 주소로 계정에 들어오지 못하게 자동으로 합치지 않아요. 처음 가입한 방법(이메일과 비밀번호, 또는 처음 쓴 간편 로그인)으로 로그인한 뒤 내 정보의 '로그인 방법'에서 연결하면, 다음부터 그 방법으로도 같은 계정에 들어가요. 기록은 한 계정에 그대로 있어서 합치거나 지울 것이 없어요.",
              },
            ]
          : []),
        {
          q: "기록을 지우거나 탈퇴하려면 어떻게 하나요?",
          a: "이 기기의 구독 기록은 설정의 '전체 초기화'로 지워요. 계정은 내 정보의 '회원 탈퇴'로 지우는데, 이때 이 기기에 있는 기록은 지워지지 않고 로그인하지 않은 기록으로 남아요.",
        },
      ],
    },
    {
      title: "해지",
      items: [
        {
          q: "SubSlash에서 바로 해지되나요?",
          a: "아니요. 해지는 각 서비스에서 해야 해요. SubSlash는 해지하는 곳으로 가는 링크와 메뉴 경로를 안내해요. 해지를 마치고 '해지 완료했어요'를 누르면 해지로 기록돼요 — SubSlash가 해지 여부를 직접 확인하지는 못해요.",
        },
        {
          q: "해지 버튼이 빨간색일 때와 테두리일 때는 무엇이 다른가요?",
          a: "빨간 버튼은 해지 화면으로 바로 가는 것이 확인된 링크예요. 테두리 버튼은 첫 화면이나 계정 화면으로 가는 링크라, 그다음은 아래 안내대로 해지 메뉴를 찾아가야 해요.",
        },
        {
          q: "앱스토어나 구글 플레이로 결제한 구독은 어디서 해지하나요?",
          a: "결제한 곳에서 해지해요. 구독의 결제 수단을 'Apple App Store 인앱결제'나 'Google Play 정기결제'로 적어 두면 해지 안내에 그 구독 관리 화면이 먼저 나와요.",
        },
      ],
    },
    {
      title: "알림과 가져오기",
      items: [
        {
          q: "결제일 전에 알림을 받을 수 있나요?",
          a: gmailOpen
            ? "앱에서는 설정의 '이 기기 결제 알림'을 켜면 이 휴대폰으로 알려요. 웹에서는 '내 구독' 목록 아래의 '구글 캘린더에 결제일 등록'으로 결제일을 캘린더 일정으로 넣으면 캘린더 알림이 떠요. 이메일 결제 알림은 종료했어요."
            : "앱에서는 설정의 '이 기기 결제 알림'을 켜면 이 휴대폰으로 알려요. 이메일 결제 알림은 종료했어요.",
        },
        ...(gmailOpen
          ? [
              {
                q: "Gmail을 연결할 때 '확인되지 않은 앱' 경고가 나와요.",
                a: "SubSlash의 연결 앱이 아직 Google 심사를 받기 전이라 나오는 경고예요. '고급'에서 계속하면 연결돼요. 경고 없이 쓰고 싶으면 가져오기 화면의 '경고 없이 직접 설치하기(스크립트 복사)'로 내 계정에 직접 설치할 수도 있어요.",
              },
              {
                q: "Gmail 메일 내용이 SubSlash에 저장되나요?",
                a: "아니요. 결제 메일에서 서비스 이름·금액·결제일 같은 구독 후보만 남기고, 메일 제목과 본문은 저장하지 않아요. 연결은 언제든 가져오기 화면에서 끊을 수 있어요.",
              },
              {
                q: "1년에 한 번 결제하는 구독이 가져오기에 안 보여요.",
                a: "Gmail을 연결하면 최근 40일 메일을 먼저 확인하고, 1년 치 나머지는 몇 분 동안 이어서 확인해요. 잠시 뒤 다시 열어 보세요. 그래도 없다면 그 결제 메일을 찾지 못한 것이니 직접 등록해 주세요.",
              },
            ]
          : []),
      ],
    },
  ];
}

/**
 * 도움말(자주 묻는 질문 + 문의하기, 웹·앱). 웹은 설정 화면과 하단 푸터에서, 앱은 설정 탭에서 들어온다.
 * 문의 주소는 개인정보 보호책임자 연락처와 같은 곳(lib/privacy.ts)에서 가져온다 — 주소를 두 군데 적지 않는다.
 */
export default function HelpPage() {
  const groups = faqGroups(isGmailAutoImportOpen(), isSocialLoginOpen());
  const email = PRIVACY_OFFICER?.email ?? null;
  const subject = "[SubSlash 문의] ";
  const body = `문의 내용:\n\n\n---\n사용 환경: ${IS_APP_BUILD ? "앱" : "웹"}`;
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  // mailto:는 기기에 기본 메일 앱이 정해져 있어야 열린다. 메일을 웹(Gmail)으로만 쓰는 PC에서는 눌러도 아무것도
  // 열리지 않았고, 열리지 않은 것을 페이지는 알 수 없다. 그래서 웹 주소로 여는 Gmail 쓰기 화면을 함께 둔다.
  const gmailCompose = email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  const [copied, setCopied] = React.useState(false);

  const copyEmail = async () => {
    if (!email) return;
    // 복사하지 못했으면 '복사됨'을 띄우지 않는다. 주소는 화면에 그대로 보인다.
    if (await copyText(email)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">도움말</h1>
        <p className="text-sm text-muted-foreground">자주 묻는 질문과 문의하는 곳이에요.</p>
      </header>

      {groups.map((group) => (
        <section key={group.title} className="space-y-2" aria-label={group.title}>
          <h2 className="px-1 text-xs font-bold text-muted-foreground">{group.title}</h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card">
            {group.items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-sm font-bold hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-3.5 pb-3.5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="contact-heading" className="space-y-2">
        <h2 id="contact-heading" className="px-1 text-xs font-bold text-muted-foreground">
          문의하기
        </h2>
        <div className="space-y-3 rounded-2xl border bg-card p-4 text-sm">
          {email && mailto && gmailCompose ? (
            <>
              <p className="leading-relaxed text-muted-foreground">
                찾는 답이 없으면 메일로 알려 주세요. 오류라면 어느 화면에서 무엇을 눌렀는지 함께
                적어 주시면 빨리 확인할 수 있어요.
              </p>
              <p className="font-semibold">{email}</p>
              <div className="flex flex-wrap gap-2">
                {/* 메일 앱을 여는 링크(mailto:). openExternal은 http(s)만 열기 때문에 쓰지 않는다. */}
                <a
                  href={mailto}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Mail className="size-4" aria-hidden />
                  메일 앱으로 문의하기
                </a>
                <Button type="button" variant="outline" onClick={() => openExternal(gmailCompose)}>
                  Gmail로 쓰기
                </Button>
                <Button type="button" variant="outline" onClick={() => void copyEmail()}>
                  {copied ? "복사했어요" : "주소 복사"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                메일 앱이 열리지 않으면 &lsquo;Gmail로 쓰기&rsquo;를 누르거나, 주소를 복사해 쓰는
                메일에서 보내 주세요.
              </p>
              <p className="text-xs text-muted-foreground">
                개인정보에 관한 요청도 같은 주소로 받아요(
                <Link href="/privacy" className="underline underline-offset-4">
                  개인정보처리방침
                </Link>
                ).
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">아직 문의 창구를 정하지 못했어요.</p>
          )}
        </div>
      </section>
    </div>
  );
}
