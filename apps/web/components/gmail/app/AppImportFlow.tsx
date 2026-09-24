import { ListChecks, MailSearch } from "lucide-react";
import { cn } from "@lib/utils";
import styles from "./AppImportFlow.module.css";

/**
 * Gmail 글리프. simple-icons v16(CC0-1.0)의 `gmail` 24x24 path와 브랜드 색 #EA4335를 그대로
 * 옮겼다(lib/service-logos.ts와 같은 규칙 — 로고를 눈대중으로 그리지 않는다).
 */
const GMAIL_PATH =
  "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z";

const STEPS = [
  { key: "connect", label: ["Gmail", "연결"] },
  { key: "scan", label: ["2주마다", "자동 검사"] },
  { key: "register", label: ["앱에서", "골라 등록"] },
] as const;

/**
 * 결제 메일 불러오기가 하는 일(연결 → 검사 → 등록)을 앱 아이콘 세 칸이 차례로 켜지는 짧은
 * 애니메이션으로 보여준다. 글로 적던 설명을 대신한다. 한 번만 돌고 셋 다 켜진 모습에서 멈춘다.
 * '동작 줄이기'를 켠 기기에서는 처음부터 마지막 모습으로 둔다. 움직임은 AppImportFlow.module.css.
 */
export function AppImportFlow() {
  return (
    <div
      className={cn(styles.flow, "mx-1 mt-5 mb-2")}
      role="img"
      aria-label="Gmail을 연결하면 2주마다 자동으로 결제 메일을 검사하고, 앱에서 골라 등록해요"
    >
      <span className={cn(styles.track, styles.track1)} aria-hidden>
        <i className={styles.fill} />
      </span>
      <span className={cn(styles.track, styles.track2)} aria-hidden>
        <i className={styles.fill} />
      </span>
      <div className={styles.steps}>
        {STEPS.map((step, i) => (
          <div key={step.key} className={styles.step}>
            <div
              className={cn(
                styles.tile,
                "relative grid size-14 place-items-center rounded-2xl shadow-sm",
                i === 0 ? "bg-[#EA4335] text-white" : "bg-primary text-primary-foreground",
              )}
            >
              {i === 0 ? (
                <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
                  <path d={GMAIL_PATH} />
                </svg>
              ) : i === 1 ? (
                <MailSearch className="size-7" aria-hidden />
              ) : (
                <ListChecks className="size-7" aria-hidden />
              )}
              <span
                className={cn(
                  styles.ok,
                  "absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border-2 border-background bg-emerald-500 text-[11px] font-black text-white",
                )}
              >
                ✓
              </span>
            </div>
            <p className={cn(styles.label, "text-center text-[11.5px] leading-snug font-bold")}>
              {step.label[0]}
              <br />
              {step.label[1]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
