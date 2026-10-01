import React from "react";
import Link from "next/link";
import { HardDrive, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { cn } from "@lib/utils";

/**
 * 첫 화면(소개) 아래쪽 — 무엇을 하는지 화면으로 보여 주고, 웹에서 바로 쓰거나 앱을 받는 곳으로 보낸다.
 *
 * 문장은 앱이 실제로 하는 일만 적는다(CLAUDE.md '제1원칙'). 화면 캡처는 샘플 데이터로 찍은 앱 화면이고,
 * 그렇게 밝혀 둔다. 앱은 아직 비공개 테스트라 받을 곳이 없으므로 '준비 중'으로 두고 링크를 만들지 않는다 —
 * 받을 수 없는 스토어 주소를 걸면 눌러 본 사람이 막힌다.
 */

const FEATURES = [
  {
    image: "/landing/dashboard.png",
    alt: "대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액",
    title: "결정할 구독만 골라 보여 줘요",
    body: "결제일이 다가오는데 잘 쓰지 않는 구독을 맨 위에 모아요. 1회당 얼마인지, 결제 전에 끊으면 얼마를 아끼는지 함께 보여요.",
  },
  {
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
    title: "해지하는 곳까지 데려다줘요",
    body: "서비스마다 해지 화면 링크와 메뉴 경로를 정리해 뒀어요. 해지는 각 서비스에서 하고, 마치면 '해지 완료'로 기록해요.",
  },
  {
    image: "/landing/gmail-import.png",
    alt: "결제 메일 가져오기 화면",
    title: "결제 메일로 구독을 찾아요",
    body: "Gmail 결제 메일이나 결제 문자에서 구독을 찾아 등록 후보로 모아요. 메일 제목과 본문은 저장하지 않아요.",
  },
  {
    image: "/landing/savings.png",
    alt: "절약 현황 화면 — 해지로 지킨 돈",
    title: "해지로 지킨 돈이 쌓여요",
    body: "해지한 뒤 결제일이 지나고 결제가 없었다고 확인한 금액만 '지킨 돈'으로 세요. 확인하지 않은 돈은 부풀리지 않아요.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section className="w-full space-y-10" aria-labelledby="features">
      <h2 id="features" className="text-base font-bold tracking-tight">
        SubSlash로 할 수 있는 것
      </h2>
      {FEATURES.map((feature, i) => (
        <div
          key={feature.image}
          className={cn(
            "flex flex-col items-center gap-6 md:flex-row md:gap-12",
            i % 2 === 1 && "md:flex-row-reverse",
          )}
        >
          {/*
            앱 화면 캡처(1080×1920). 앱 화면이라 폭을 좁게 두고, 넓은 화면에서는 글과 나란히 둔다. 앱 빌드는
            정적 내보내기라 next/image의 최적화를 쓸 수 없다(ServiceLogo와 같다).
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={feature.image}
            alt={feature.alt}
            width={1080}
            height={1920}
            loading="lazy"
            className="w-48 shrink-0 rounded-[1.75rem] border bg-card shadow-md sm:w-56"
          />
          <div className="max-w-md space-y-2 text-center md:text-left">
            <h3 className="text-xl font-black tracking-tight">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        </div>
      ))}
      <p className="text-center text-[11px] text-muted-foreground">
        화면은 샘플 데이터로 찍은 앱 화면이에요. 지금 화면과 조금 다를 수 있어요.
      </p>
    </section>
  );
}

const TRUST = [
  {
    Icon: HardDrive,
    title: "기록은 기본으로 이 기기에",
    body: "가입하지 않아도 쓸 수 있고, 구독 기록은 이 브라우저나 휴대폰 안에만 저장돼요.",
  },
  {
    Icon: MailCheck,
    title: "메일 본문은 저장하지 않아요",
    body: "결제 메일에서는 서비스·금액·결제일 같은 구독 후보만 남겨요.",
  },
  {
    Icon: ShieldCheck,
    title: "광고가 없어요",
    body: "구독 기록을 광고에 쓰거나 다른 회사에 넘기지 않아요.",
  },
] as const;

export function LandingTrust() {
  return (
    <section className="w-full space-y-3" aria-labelledby="trust">
      <h2 id="trust" className="text-base font-bold tracking-tight">
        안심하고 쓰세요
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TRUST.map(({ Icon, title, body }) => (
          <li key={title} className="space-y-1.5 rounded-2xl border bg-card p-4">
            <Icon className="size-5 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        자세한 내용은{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          개인정보처리방침
        </Link>
        과{" "}
        <Link href="/help" className="underline underline-offset-4">
          도움말
        </Link>
        에 있어요.
      </p>
    </section>
  );
}

/** 앱 받기 자리. 공개 출시 전에는 누를 수 없는 '준비 중' 표시로 둔다. */
export function AppDownloadPending({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      <Smartphone className="size-4" aria-hidden />
      안드로이드 앱 · Google Play 준비 중
    </span>
  );
}

export function LandingFinalCta() {
  return (
    <section
      className="w-full space-y-4 rounded-2xl border bg-card px-5 py-8 text-center sm:px-10"
      aria-labelledby="final-cta"
    >
      <h2 id="final-cta" className="text-2xl font-black tracking-tight">
        이번 달 구독, 지금 점검해 보세요
      </h2>
      <p className="text-sm text-muted-foreground">가입 없이 웹에서 바로 쓸 수 있어요.</p>
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link
          href="/dashboard"
          className="whitespace-nowrap rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          웹에서 바로 시작하기 →
        </Link>
        <AppDownloadPending />
      </div>
    </section>
  );
}
