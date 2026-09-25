import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ANONYMOUS_STATS_STARTS_ON,
  DEVICE_USAGE_STARTS_ON,
  GMAIL_AUTO_IMPORT_STARTS_ON,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_OFFICER,
} from "@lib/privacy";
import { siteOpenGraph } from "@lib/site-metadata";

/** "2026-10-01" → "2026년 10월 1일". */
function koreanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 권익침해 구제를 맡는 기관. 번호와 주소는 각 기관이 안내하는 값이고, 확인하지 못한 값은
 * 적지 않는다 — 도움을 받으려는 사람이 엉뚱한 곳으로 가면 안 된다.
 */
const REMEDY_BODIES = [
  {
    name: "개인정보분쟁조정위원회",
    role: "분쟁 조정 신청, 집단분쟁조정",
    phone: "1833-6972",
    url: "https://www.kopico.go.kr",
  },
  {
    name: "개인정보침해신고센터",
    role: "침해 사실 신고, 상담",
    phone: "118",
    url: "https://privacy.kisa.or.kr",
  },
  {
    name: "대검찰청 사이버수사과",
    role: "형사 사건 고소·상담",
    phone: "1301",
    url: "https://www.spo.go.kr",
  },
  {
    name: "경찰청 사이버수사국",
    role: "형사 사건 신고·상담",
    phone: "182",
    url: "https://ecrm.cyber.go.kr/minwon/main",
  },
] as const;

const TITLE = "개인정보처리방침 · SubSlash";
const DESCRIPTION =
  "SubSlash가 무엇을, 왜, 얼마나 저장하는지 적었습니다. 구독 기록은 기본적으로 기기 안에만 저장됩니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { ...siteOpenGraph, title: TITLE, description: DESCRIPTION, url: "/privacy" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
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
          {GMAIL_AUTO_IMPORT_STARTS_ON && ", Gmail 자동 가져오기"}
          {ANONYMOUS_STATS_STARTS_ON && ", 익명 구독 통계"}
          {DEVICE_USAGE_STARTS_ON && ", 여러 기기 사용 측정"}처럼 직접 고른 기능을 쓸 때뿐입니다.
          로그인하면 구독 기록이 계정에 자동으로 저장됩니다(기기마다 끌 수 있음). 아래에 무엇을, 왜,
          얼마나 저장하는지 적습니다.
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
        {/*
          익명 구독 통계도 저장 항목이 늘어나는 변경이라 시작일을 정하면 먼저 게시된다
          (lib/privacy.ts의 ANONYMOUS_STATS_STARTS_ON). 비교 화면의 '무엇을 모으나요?'가 이 항목을 가리킨다.
        */}
        {ANONYMOUS_STATS_STARTS_ON && (
          <div id="anonymous-stats">
            <Item title={`익명 구독 통계 (선택, ${koreanDate(ANONYMOUS_STATS_STARTS_ON)}부터)`}>
              리포트에서 &lsquo;익명으로 참여하기&rsquo;를 누른 기기만, 한 달 구독 지출 합계(1,000원
              단위)와 구독 개수, 그리고 서비스 목록에 있는 서비스마다 서비스 종류·내 몫의 한 달
              금액(100원 단위)·마지막 체크인의 이용 횟수를 서버에 보냅니다. 구독 이름을 직접 적은
              서비스, 메모, 결제일, 이메일, 계정은 보내지 않고, 로그인 계정·알림 정보·IP와 묶지
              않습니다. 기기는 기록을 고치고 지울 때 쓰는 토큰을 갖고, 서버는 그 토큰의 되돌릴 수
              없는 해시만 저장합니다. 비교는 참여자가 충분할 때(전체 20명, 서비스마다 10명 이상)만
              가운데 값으로 보여 주어 한 사람의 값이 드러나지 않게 합니다. 목적: 다른 사용자와 구독
              지출·이용 횟수 비교.
            </Item>
          </div>
        )}
        {/*
          여러 기기 사용 측정도 저장 항목이 늘어나는 변경이라 시작일을 정하면 먼저 게시된다
          (lib/privacy.ts의 DEVICE_USAGE_STARTS_ON, lib/device-usage).
        */}
        {DEVICE_USAGE_STARTS_ON && (
          <div id="device-usage">
            <Item
              title={`여러 기기 사용 측정 (선택, 로그인 시, ${koreanDate(DEVICE_USAGE_STARTS_ON)}부터)`}
            >
              안드로이드 앱에서 &lsquo;사용 측정 켜기&rsquo;를 누르고 기기 설정의 &lsquo;사용 정보
              접근&rsquo;을 직접 허용한 기기만, 서비스 목록에 있는 서비스의 앱(넷플릭스·스포티파이
              등)이 화면 맨 앞에 있던 시작·끝 시각을 서비스 종류와 함께 로그인한 계정에 저장합니다.
              기기마다 SubSlash가 만든 무작위 기기 번호와 측정한 기간, 이용자가 붙인 기기 이름을
              함께 저장합니다. 목록에 없는 앱, 앱 안에서 본 콘텐츠, 재생 배속, 위치, 기기 모델·광고
              ID는 저장하지 않습니다. 같은 계정의 여러 기기 기록을 이어, 휴대폰에서 보다가 30분 안에
              태블릿에서 이어 본 것을 한 번으로 셉니다. 목적: 구독별 이용 횟수와 1회 사용 단가 계산.
            </Item>
          </div>
        )}
        <Item title="회원가입·로그인 (선택)">
          아이디, 이메일, 비밀번호(되돌릴 수 없는 해시로만 저장하며 원문은 저장하지 않음), 이메일
          확인 시각, 가입·마지막 로그인 시각을 저장합니다. 나이·성별은 선택 항목으로, 가입할 때나
          &lsquo;내 정보&rsquo;에서 직접 적었을 때만 저장하고 적지 않아도 가입과 모든 기능을 쓸 수
          있습니다. 지금은 어떤 계산이나 통계에도 쓰지 않습니다. 가입할 때 묻는 만 14세 이상 여부는
          확인에만 쓰고 저장하지 않습니다. 목적: 본인 식별, 로그인 유지, 가입 확인·비밀번호 재설정
          메일 발송.
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
            복사한 구독을 지웁니다. 신청하고 3일 안에 확인 메일의 링크를 누르지 않으면 그 신청을
            자동으로 지웁니다.
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
          {DEVICE_USAGE_STARTS_ON && (
            <li>
              여러 기기 사용 측정: 40일이 지난 기록은 자동으로 지웁니다. 기기에서 측정을 끄면 그
              기기의 기록을, 회원 탈퇴하면 모든 기기의 기록을 곧바로 지웁니다.
            </li>
          )}
          {ANONYMOUS_STATS_STARTS_ON && (
            <li>
              익명 구독 통계: 리포트에서 &lsquo;그만두기&rsquo;를 누르면 곧바로 지우고, 180일 동안
              갱신되지 않은 기록은 자동으로 지웁니다.
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
        {/*
          국외 이전은 거부할 권리와 방법을 함께 알려야 한다(개인정보 보호법 제28조의8 제5항).
          SubSlash는 국외 서버 하나로 돌아가므로, 거부하는 방법은 곧 그 기능을 쓰지 않는 것이다 —
          '거부할 수 있다'고만 적고 무엇을 못 쓰게 되는지 적지 않으면 고른 결과를 알 수 없다.
        */}
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">국외 이전을 원하지 않을 때</h3>
          <p className="text-muted-foreground">
            국외 이전을 거부할 수 있습니다. SubSlash의 서버는 위 표의 국외 서비스 위에서만 돌기
            때문에, 거부하는 방법은 서버로 정보를 보내는 기능을 쓰지 않는 것입니다. 회원가입을 하지
            않고 쓰면 구독 기록이 이 기기 밖으로 나가지 않으며, 그 상태에서도 구독 등록·체크인·1회
            사용 단가·해지 안내·백업 파일 내려받기를 모두 쓸 수 있습니다. 이미 쓰고 있다면 내 정보의
            &lsquo;회원 탈퇴&rsquo;, 결제 알림 설정의 &lsquo;알림 끄기&rsquo;, &lsquo;계정에서
            지우기&rsquo;, Gmail 연결의 &lsquo;연결 끊기&rsquo;로 보낸 정보를 지우고 멈출 수
            있습니다. 다만 거부하면 로그인, 계정에 저장, 여러 기기 동기화, 결제 알림 메일과 캘린더
            구독
            {GMAIL_AUTO_IMPORT_STARTS_ON && ", Gmail 자동 가져오기, 구글 캘린더에 결제일 등록"}
            {ANONYMOUS_STATS_STARTS_ON && ", 익명 구독 통계 참여"}
            {DEVICE_USAGE_STARTS_ON && ", 여러 기기 사용 측정"}은 쓸 수 없습니다.
          </p>
        </div>
      </Section>

      {/*
        Google API로 받은 사용자 데이터를 어떻게 쓰는지 밝히는 절. Gmail 읽기(gmail.readonly)는
        Google이 '제한된 범위'로 분류하는 권한이라, 방침에 Limited Use를 명시해야 심사를 받을 수
        있다. 문장은 Google API Services User Data Policy의 요구를 그대로 옮긴 것이므로, 코드가
        하는 일을 바꾸면 이 절도 함께 본다.
      */}
      <Section title="5. Google 사용자 데이터 취급 (Limited Use)">
        <p>
          SubSlash가 Google API로 받은 정보를 쓰고 다른 앱으로 넘기는 방식은 Google API Services
          User Data Policy를 따르며, 여기에는 Limited Use 요구사항이 포함됩니다.
        </p>
        <p className="text-muted-foreground">
          SubSlash&rsquo;s use and transfer to any other app of information received from Google
          APIs will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            메일 읽기 권한(<code>gmail.readonly</code>)으로 받은 내용은 결제 메일에서 구독을 찾아
            등록하는 기능에만 씁니다. 그 밖의 목적으로 쓰지 않습니다.
          </li>
          <li>
            광고에 쓰지 않습니다. 맞춤·관심 기반 광고나 리타기팅에 쓰거나 넘기지 않으며,
            SubSlash에는 광고가 없습니다.
          </li>
          <li>
            사람이 읽지 않습니다. 메일은 서버가 그 자리에서 기계적으로 파싱하고, 제목과 본문은
            저장하지 않습니다(남는 것은 서비스 이름·금액·결제일 같은 구독 후보뿐입니다). 다만 법령이
            요구하거나 보안 문제를 조사해야 하거나 이용자가 직접 동의한 경우는 예외입니다.
          </li>
          <li>
            제3자에게 팔거나 넘기지 않습니다. 광고 플랫폼·데이터 중개업자에게 제공하지 않습니다.
          </li>
          <li>인공지능 모델을 학습시키는 데 쓰지 않습니다.</li>
        </ul>
      </Section>

      <Section title="6. 이용자의 권리와 행사 방법">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            열람·정정:{" "}
            <Link href="/me" className="underline underline-offset-4">
              내 정보
            </Link>
            에서 계정 정보를 보고 나이·성별을 고치거나 지울 수 있습니다.
          </li>
          <li>
            삭제: 내 정보의 &lsquo;회원 탈퇴&rsquo;와 &lsquo;계정에서 지우기&rsquo;, 결제 알림
            설정의 &lsquo;알림 끄기&rsquo;로 직접 지울 수 있습니다.
          </li>
          <li>
            처리정지: 서버에서 일어나는 처리는 그 기능을 끄면 곧바로 멈춥니다 — 결제 알림 설정의
            &lsquo;알림 끄기&rsquo;, 내 정보에서 기기마다 끄는 &lsquo;자동 동기화 끄기&rsquo;, Gmail
            연결의 &lsquo;연결 끊기&rsquo;가 그것입니다. 그 밖의 처리를 멈춰 달라는 요구는 아래
            보호책임자에게 해 주세요. 법에서 정한 사유로 멈출 수 없을 때는 그 이유를 알려드립니다.
          </li>
          <li>그 밖의 요청은 아래 개인정보 보호책임자에게 해 주세요.</li>
        </ul>
      </Section>

      <Section title="7. 만 14세 미만 아동">
        <p>가입할 때 만 14세 이상인지 확인하며, 만 14세 미만은 가입할 수 없습니다.</p>
      </Section>

      <Section title="8. 쿠키와 브라우저 저장공간">
        <p>
          로그인 상태를 유지하는 세션 쿠키 하나(<code>subslash_session</code>, 자바스크립트가 읽을
          수 없음, 30일)를 씁니다. 구독 기록·테마·보기 방식 같은 설정은 브라우저
          저장공간(localStorage)에 두며 서버로 보내지 않습니다. 브라우저 설정에서 쿠키를 막으면
          로그인을 쓸 수 없고, 나머지 기능은 그대로 쓸 수 있습니다.
        </p>
      </Section>

      <Section title="9. 안전성 확보 조치">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>비밀번호는 scrypt로 해시해 저장하고 원문은 저장하지 않습니다.</li>
          <li>
            로그인 세션·알림 동기화·캘린더 토큰은 SHA-256 해시만 서버에 저장합니다. 데이터베이스가
            새더라도 그 값으로는 로그인하거나 알림을 바꿀 수 없습니다.
          </li>
          <li>모든 통신은 HTTPS로 암호화됩니다.</li>
        </ul>
      </Section>

      <Section title="10. 개인정보 보호책임자">
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

      {/*
        권익침해 구제 방법. 기관 이름·번호·주소는 각 기관이 안내하는 값을 그대로 적는다 —
        연락처를 잘못 적으면 도움을 받으려는 사람이 엉뚱한 곳으로 간다.
      */}
      <Section title="11. 권익침해 구제 방법">
        <p>
          개인정보가 침해되어 도움이 필요하면 아래 기관에 분쟁 해결이나 상담을 신청할 수 있습니다.
          SubSlash의 처리에 대한 이의는 위 개인정보 보호책임자에게 먼저 알려 주셔도 됩니다.
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">기관</th>
                <th className="px-3 py-2 text-left font-medium">하는 일</th>
                <th className="px-3 py-2 text-left font-medium">연락처</th>
              </tr>
            </thead>
            <tbody>
              {REMEDY_BODIES.map((body) => (
                <tr key={body.name} className="border-t">
                  <td className="px-3 py-2 font-medium">{body.name}</td>
                  <td className="px-3 py-2">{body.role}</td>
                  <td className="px-3 py-2">
                    (국번 없이) {body.phone}
                    <br />
                    <a
                      href={body.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {body.url.replace(/^https?:\/\//, "")}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          개인정보 보호법 제35조(열람), 제36조(정정·삭제), 제37조(처리정지)에 따른 요구를 거절당했을
          때는 행정심판법에 따라 행정심판을 청구할 수도 있습니다.
        </p>
      </Section>

      <Section title="12. 방침의 변경">
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
