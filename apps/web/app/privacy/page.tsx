import React from "react";
import Link from "next/link";
import { GMAIL_AUTO_IMPORT_STARTS_ON, PRIVACY_EFFECTIVE_DATE, PRIVACY_OFFICER } from "@lib/privacy";

/** "2026-10-01" → "2026년 10월 1일". */
function koreanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export const metadata = {
  title: "개인정보처리방침 · SubSlash",
};

/**
 * 개인정보처리방침.
 *
 * 이 페이지의 문장은 코드가 실제로 하는 일과 맞아야 한다(CLAUDE.md '데이터 위치').
 * 저장하는 칸·보관 기간·삭제 경로를 바꾸면 여기도 함께 고친다.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 py-6 text-sm leading-relaxed">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">개인정보처리방침</h1>
        <p className="text-xs text-muted-foreground">시행일: {PRIVACY_EFFECTIVE_DATE}</p>
        <p className="text-muted-foreground">
          SubSlash는 구독 기록을 기본적으로 이 기기 안에만 저장합니다. 서버에 개인정보가 저장되는
          것은 로그인, 계정에 저장, 결제 알림
          {GMAIL_AUTO_IMPORT_STARTS_ON && ", Gmail 자동 가져오기"}처럼 직접 고른 기능을 쓸
          때뿐입니다. 로그인하면 구독 기록이 계정에 자동으로 저장됩니다(기기마다 끌 수 있음). 아래에
          무엇을, 왜, 얼마나 저장하는지 적습니다.
        </p>
      </header>

      <Section title="1. 처리하는 개인정보와 목적">
        <Item title="로그인 없이 쓸 때">
          구독·체크인·절약 기록과 연동 계정 목록은 이 브라우저(앱은 이 기기)의 저장공간에만 저장되고
          서버로 보내지 않습니다.
        </Item>
        <Item title="Gmail에서 구독 찾기 (선택)">
          사용자가 자기 Google 계정에 만든 Apps Script가 메일 읽기 권한으로 최근 결제 메일의 보낸
          사람·제목·받은 시각·본문 앞부분을 찾습니다. 이 내용은 SubSlash 주소의 &lsquo;#&rsquo; 뒤에
          담겨 브라우저 안에서만 읽히고 SubSlash 서버로 전송되거나 저장되지 않습니다. 등록한 구독은
          위와 같이 브라우저에 저장됩니다.
        </Item>
        {/*
          저장 항목이 늘어나는 변경이라 시행 전에 알린다. 시작일을 정하면 이 항목이 먼저 게시되고,
          그날부터 기능이 열린다(lib/privacy.ts의 GMAIL_AUTO_IMPORT_STARTS_ON).
        */}
        {GMAIL_AUTO_IMPORT_STARTS_ON && (
          <Item
            title={`Gmail 자동 가져오기 (선택, ${koreanDate(GMAIL_AUTO_IMPORT_STARTS_ON)}부터)`}
          >
            로그인한 뒤 &lsquo;Gmail 연결하기&rsquo;에서 Google 권한(메일 읽기·SubSlash로
            보내기·2주마다 실행)을 허용하거나 내 Google 계정에 스크립트를 직접 설치하면, Apps
            Script가 2주마다 새 결제 메일의 보낸 사람·제목·받은 시각·본문 앞부분을 SubSlash 서버로
            보냅니다. 서버는 이 메일에서 찾은 구독 후보(서비스 이름·금액·통화·결제일·결제 주기·결제
            월·분류· 결제수단·메일 받은 날·보낸 사람)만 저장하고, 메일 제목과 본문은 저장하지
            않습니다. 연결 토큰은 되돌릴 수 없는 해시로만, 마지막 검사 시각과 받은 메일 수와 함께
            저장합니다. 로그인한 브라우저가 열릴 때 후보를 받아 구독으로 등록하거나 확인을 받습니다.
            목적: 결제 메일에서 구독을 찾아 등록.
          </Item>
        )}
        {GMAIL_AUTO_IMPORT_STARTS_ON && (
          <Item
            title={`구글 캘린더에 결제일 등록 (선택, ${koreanDate(GMAIL_AUTO_IMPORT_STARTS_ON)}부터)`}
          >
            로그인한 뒤 &lsquo;구글 캘린더에 등록하기&rsquo;를 직접 누르면, 구독 중인 구독의
            이름·금액·통화·결제일·결제 주기·결제 월·해지 주소와 알림 일수를 서버가 잠깐 맡아
            둡니다(해지 주소는 캘린더 일정 메모에 적어 캘린더에서 바로 해지하러 갈 수 있게 합니다).
            이 목록은 이용자의 Google 권한으로 실행되는 SubSlash Apps Script 웹 앱이 받아 가는
            즉시(늦어도 10분 뒤) 지웁니다. 캘린더에 쓰는 것은 SubSlash가 아니라 이용자가 허용한
            Google 권한이며, SubSlash는 캘린더를 읽지 않습니다. 목적: 결제일을 이용자의 구글
            캘린더에 반복 일정으로 넣기.
          </Item>
        )}
        <Item title="회원가입·로그인 (선택)">
          아이디, 이메일, 비밀번호(되돌릴 수 없는 해시로만 저장하며 원문은 저장하지 않음), 이메일
          확인 시각, 가입·마지막 로그인 시각을 저장합니다. 나이·성별은 &lsquo;내 정보&rsquo;에서
          직접 적었을 때만 저장합니다. 가입할 때 묻는 만 14세 이상 여부는 확인에만 쓰고 저장하지
          않습니다. 목적: 본인 식별, 로그인 유지, 가입 확인·비밀번호 재설정 메일 발송.
        </Item>
        <Item title="계정 동기화 (로그인 시)">
          로그인하면 이 기기의 구독·체크인·연동 계정·환율 기록 한 벌을 계정에 저장하고, 기록이 바뀔
          때마다 새로 저장해 로그인한 다른 기기(웹·앱)와 맞춥니다. 기기마다 &lsquo;자동 동기화
          끄기&rsquo;로 끌 수 있고, 끈 기기는 &lsquo;계정에 저장&rsquo;을 직접 누를 때만 저장합니다.
          결제 알림 설정은 넣지 않습니다. 목적: 여러 기기에서 같은 기록 쓰기.
        </Item>
        <Item title="결제 알림 (선택)">
          알림을 받을 이메일 주소, 알림 날짜 설정, 알림 확인 시각을 저장하고, 구독 중인 구독의
          이름·금액·통화·결제일·결제 주기·결제 월·해지 주소만 서버에 복사해 둡니다. 체크인·절약
          기록과 해지한 구독은 보내지 않습니다. 같은 결제일에 메일을 두 번 보내지 않도록 보낸 기록도
          남깁니다. 목적: 결제일 전 이메일 알림과 캘린더 구독 주소 제공, 그리고 캘린더 일정 메모에
          해지 주소를 적어 캘린더에서 바로 해지하러 갈 수 있게 하기.
        </Item>
        <Item title="계정 메일 발송 기록">
          가입 확인·비밀번호 재설정 메일을 보낸 주소와 시각을 남깁니다. 목적: 한 주소로 보내는 메일
          수를 제한해(24시간 5통) 다른 사람의 받은편지함에 메일이 쌓이는 것을 막기.
        </Item>
        <Item title="접속 기록">
          서비스를 호스팅하는 Vercel이 요청을 처리하며 IP 주소, 요청 시각·경로 같은 접속 기록을 일정
          기간 남길 수 있습니다. SubSlash는 분석 도구나 광고 쿠키를 쓰지 않습니다.
        </Item>
      </Section>

      <Section title="2. 보관 기간과 파기">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>계정 정보: 회원 탈퇴하면 계정·로그인 세션·계정에 저장한 기록을 곧바로 지웁니다.</li>
          <li>로그인 세션: 로그아웃하면 지우고, 로그인하고 30일이 지나면 만료됩니다.</li>
          <li>
            계정에 저장한 기록: 가장 최근 한 벌만 보관합니다. 자동 동기화나 &lsquo;계정에
            저장&rsquo;으로 새로 저장하면 이전 것을 덮어쓰고, &lsquo;계정에서 지우기&rsquo;나 회원
            탈퇴로 지웁니다.
          </li>
          <li>
            결제 알림: 알림 설정에서 끄거나 알림 메일의 수신 거부 링크를 누르면, 알림 정보와 서버에
            복사한 구독을 지웁니다.
          </li>
          {GMAIL_AUTO_IMPORT_STARTS_ON && (
            <li>
              Gmail 자동 가져오기: 구독 후보는 브라우저가 받아 가면 곧바로 지우고, 받아 가지 않은
              후보도 30일이 지나면 지웁니다. 연결 토큰은 &lsquo;연결 끊기&rsquo;나 회원 탈퇴로 남은
              후보와 함께 지웁니다. &lsquo;Gmail 연결하기&rsquo;로 Google에 보관된 연결 토큰과 검사
              시각은 연결을 끊은 뒤 다음 검사 때(최대 2주) 스크립트가 스스로 지우고 검사를 멈춥니다.
            </li>
          )}
          {GMAIL_AUTO_IMPORT_STARTS_ON && (
            <li>
              구글 캘린더에 결제일 등록: 맡아 둔 구독 목록은 웹 앱이 받아 가면 곧바로 지우고, 받아
              가지 않아도 10분이 지나면 쓸 수 없으며 다음 등록 때 지웁니다. 캘린더에 들어간 일정은
              구글 캘린더에서 &lsquo;SubSlash 결제일&rsquo; 캘린더를 지워야 없어집니다.
            </li>
          )}
          <li>
            계정 메일 발송 기록: 24시간이 지난 기록은 같은 주소로 다음 메일을 보낼 때 지웁니다.
          </li>
          <li>
            브라우저에 있는 기록: 서버가 지울 수 없습니다. 내 구독의 &lsquo;전체 초기화&rsquo;나
            브라우저의 사이트 데이터 삭제로 지웁니다.
          </li>
        </ul>
      </Section>

      <Section title="3. 제3자 제공">
        <p>개인정보를 다른 사람이나 회사에 제공하지 않습니다.</p>
      </Section>

      <Section title="4. 처리 위탁과 국외 이전">
        <p>
          서비스를 운영하려고 아래 회사의 서비스를 씁니다. 서버로 가는 정보는 이용하는 순간
          네트워크로 전송되어 국외에서 처리·저장됩니다. 로그인·계정에 저장·결제 알림을 쓰지 않으면
          서버로 가는 개인정보가 없습니다.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">받는 곳</th>
                <th className="px-3 py-2 text-left font-medium">하는 일</th>
                <th className="px-3 py-2 text-left font-medium">처리·저장 위치</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2 font-medium">Vercel</td>
                <td className="px-3 py-2">웹 서비스 호스팅, 서버 실행</td>
                <td className="px-3 py-2">미국(서버 실행 지역: 미국 동부)</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2 font-medium">Turso</td>
                <td className="px-3 py-2">데이터베이스(위 1번의 서버 저장 항목)</td>
                <td className="px-3 py-2">일본 도쿄(AWS)</td>
              </tr>
              {GMAIL_AUTO_IMPORT_STARTS_ON && (
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">Google</td>
                  <td className="px-3 py-2">
                    &lsquo;Gmail 연결하기&rsquo;를 쓴 경우, SubSlash의 Apps Script를 이용자 권한으로
                    실행해 결제 메일을 읽고 SubSlash로 보냄 — 연결 토큰과 마지막 검사 시각 보관.
                    &lsquo;구글 캘린더에 등록하기&rsquo;를 쓴 경우, 같은 방식으로 구독
                    이름·금액·결제일을 받아 이용자의 캘린더에 일정으로 씀
                  </td>
                  <td className="px-3 py-2">국외(Google 데이터센터)</td>
                </tr>
              )}
              <tr className="border-t">
                <td className="px-3 py-2 font-medium">Resend</td>
                <td className="px-3 py-2">이메일 발송 — 받는 주소와 메일 내용 전달</td>
                <td className="px-3 py-2">미국</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="5. 이용자의 권리와 행사 방법">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            열람·정정:{" "}
            <Link href="/me" className="underline underline-offset-4">
              내 정보
            </Link>
            에서 계정 정보를 보고 나이·성별을 고치거나 지울 수 있습니다.
          </li>
          <li>
            삭제: 내 정보의 &lsquo;회원 탈퇴&rsquo;, 결제 알림 설정의 &lsquo;알림 끄기&rsquo;,
            &lsquo;계정에서 지우기&rsquo;로 직접 지울 수 있습니다.
          </li>
          <li>그 밖의 요청은 아래 개인정보 보호책임자에게 해 주세요.</li>
        </ul>
      </Section>

      <Section title="6. 만 14세 미만 아동">
        <p>가입할 때 만 14세 이상인지 확인하며, 만 14세 미만은 가입할 수 없습니다.</p>
      </Section>

      <Section title="7. 쿠키와 브라우저 저장공간">
        <p>
          로그인 상태를 유지하는 세션 쿠키 하나(<code>subslash_session</code>, 자바스크립트가 읽을
          수 없음, 30일)를 씁니다. 구독 기록·테마·보기 방식 같은 설정은 브라우저
          저장공간(localStorage)에 두며 서버로 보내지 않습니다. 브라우저 설정에서 쿠키를 막으면
          로그인을 쓸 수 없고, 나머지 기능은 그대로 쓸 수 있습니다.
        </p>
      </Section>

      <Section title="8. 안전성 확보 조치">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>비밀번호는 scrypt로 해시해 저장하고 원문은 저장하지 않습니다.</li>
          <li>
            로그인 세션·알림 동기화·캘린더 토큰은 SHA-256 해시만 서버에 저장합니다. 데이터베이스가
            새더라도 그 값으로는 로그인하거나 알림을 바꿀 수 없습니다.
          </li>
          <li>모든 통신은 HTTPS로 암호화됩니다.</li>
        </ul>
      </Section>

      <Section title="9. 개인정보 보호책임자">
        {PRIVACY_OFFICER ? (
          <p>
            {PRIVACY_OFFICER.name} ·{" "}
            <a href={`mailto:${PRIVACY_OFFICER.email}`} className="underline underline-offset-4">
              {PRIVACY_OFFICER.email}
            </a>
          </p>
        ) : (
          <p className="rounded-xl border border-dashed p-3 text-muted-foreground">
            개인정보 보호책임자와 연락처를 아직 정하지 않았습니다. 정해지는 대로 이 자리에 적습니다.
          </p>
        )}
      </Section>

      <Section title="10. 방침의 변경">
        <p>
          이 방침을 바꾸면 이 페이지에 새 내용과 시행일을 적습니다. 저장하는 항목이 늘어나는 변경은
          시행 전에 알립니다.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
