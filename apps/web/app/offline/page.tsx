import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오프라인 - SubSlash",
};

/**
 * Served by the service worker when a navigation fails with no network.
 *
 * It is precached as plain HTML, so it has to say something useful without its
 * JavaScript ever running — no store access, no interactivity.
 */
export default function OfflinePage() {
  return (
    <div className="py-16 text-center space-y-3">
      <div className="text-4xl">📡</div>
      <h1 className="text-xl font-black tracking-tight">지금은 오프라인입니다</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        구독 정보는 이 기기에 그대로 있습니다.
        <br />
        네트워크가 돌아오면 새로고침해주세요.
      </p>
    </div>
  );
}
