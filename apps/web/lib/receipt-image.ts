import { formatKRW, type Receipt } from "@subslash/shared";
import type { Messages } from "@lib/i18n/messages";
import { receiptNumber, type ReceiptRenderOptions } from "./receipt-view";
import { receiptArt } from "./receipt-art";
import { fit, wrap } from "./receipt-canvas";
import { renderThemedReceipt } from "./receipt-image-themes";
import type { ReceiptTheme } from "./receipt-theme";

/**
 * 영수증을 PNG로 그린다(공유·저장용). 화면의 영수증을 캡처하지 않고 캔버스에 직접 그린다 — 캡처
 * 라이브러리를 넣지 않고, 테마(어두운 화면)와 관계없이 늘 같은 종이 모양이 나오게.
 *
 * 문구는 화면과 같은 함수(lib/receipt-view)로 만든다. 기본(`classic`)은 화면의 영수증과 같은 종이이고, 다른 테마는
 * lib/receipt-image-themes가 그린다.
 */

const WIDTH = 400;
const SCALE = 3;
const PAD = 28;
const PAPER = "#fbfaf7";
const INK = "#18181b";
const MUTED = "#71717a";
const FONT = `"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;

type Op = (ctx: CanvasRenderingContext2D) => void;

function font(size: number, weight = 400): string {
  return `${weight} ${size}px ${FONT}`;
}

/** 기간에서 정해지는 막대 무늬(바코드 모양 장식). 읽을 수 있는 코드가 아니다. */
function barWidths(seed: string): number[] {
  let hash = 0x811c9dc5;
  const widths: number[] = [];
  for (let i = 0; i < 48; i++) {
    hash ^= seed.charCodeAt(i % seed.length) + i;
    hash = Math.imul(hash, 0x01000193);
    widths.push(1 + ((hash >>> 0) % 3));
  }
  return widths;
}

export async function renderReceiptImage(
  receipt: Receipt,
  issuedAt: Date,
  t: Messages,
  theme: ReceiptTheme = "classic",
  options: ReceiptRenderOptions = {},
): Promise<Blob> {
  if (theme !== "classic") {
    return renderThemedReceipt(theme, receiptArt(t, receipt, issuedAt, options), t);
  }
  return renderClassic(receipt, issuedAt, t, options);
}

async function renderClassic(
  receipt: Receipt,
  issuedAt: Date,
  t: Messages,
  options: ReceiptRenderOptions,
): Promise<Blob> {
  const v = t.receiptView;
  // 적는 말은 다른 테마와 같은 곳(receiptArt)에서 만든다. 합계 아래 덧붙임만 이 종이의 모양대로 나눠 적는다.
  const art = receiptArt(t, receipt, issuedAt, options);
  // 글꼴이 늦게 오면 대체 글꼴로 그려진다. 이미 받아 둔 글꼴만 기다린다.
  await document.fonts?.ready;

  const measureCanvas = document.createElement("canvas");
  const measure = measureCanvas.getContext("2d");
  if (!measure) throw new Error(v.image.noCanvas);

  const inner = WIDTH - PAD * 2;
  const ops: Op[] = [];
  let y = PAD + 8;

  const text = (
    value: string,
    options: { size: number; weight?: number; color?: string; align?: "left" | "right" | "center" },
  ) => {
    const at = y;
    const x =
      options.align === "right" ? WIDTH - PAD : options.align === "center" ? WIDTH / 2 : PAD;
    ops.push((ctx) => {
      ctx.font = font(options.size, options.weight);
      ctx.fillStyle = options.color ?? INK;
      ctx.textAlign = options.align ?? "left";
      ctx.fillText(value, x, at);
    });
  };
  const dashed = () => {
    y += 10;
    const at = y;
    ops.push((ctx) => {
      ctx.strokeStyle = MUTED;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, at);
      ctx.lineTo(WIDTH - PAD, at);
      ctx.stroke();
      ctx.setLineDash([]);
    });
    y += 22;
  };
  // y는 글자의 밑줄(baseline)이다. `advance`는 다음 줄의 밑줄까지 — 기본은 한 줄 띄움.
  const row = (
    label: string,
    value: string,
    size: number,
    weight = 400,
    color = INK,
    advance = size + 8,
  ) => {
    measure.font = font(size, weight);
    const valueWidth = measure.measureText(value).width;
    text(fit(measure, label, inner - valueWidth - 12), { size, weight, color });
    text(value, { size, weight, color, align: "right" });
    y += advance;
  };

  // 머리
  text("SubSlash", { size: 22, weight: 800, align: "center" });
  y += 22;
  text(v.title, { size: 13, color: MUTED, align: "center" });
  y += 24;
  text(art.period, {
    size: 15,
    weight: 700,
    align: "center",
  });
  y += 20;
  text(art.issuedLine, {
    size: 11,
    color: MUTED,
    align: "center",
  });
  dashed();

  // 줄
  if (art.empty !== null) {
    // 모르는 영수증의 설명은 길어서 줄을 나눈다.
    measure.font = font(14);
    for (const part of wrap(measure, art.empty, inner)) {
      text(part, { size: 14, color: MUTED, align: "center" });
      y += 20;
    }
    y += 2;
  }
  for (const line of art.lines) {
    // 이름과 그 아래 설명은 붙여 쓰고, 다음 구독과는 띄운다.
    row(line.name, line.amount, 15, 600, INK, 18);
    measure.font = font(11);
    for (const detail of wrap(measure, line.meta, inner)) {
      text(detail, { size: 11, color: MUTED });
      y += 15;
    }
    y += 14;
  }
  dashed();

  // 합계
  row(art.totalLabel, art.total, 18, 800);
  if (receipt.billedTotalKRW !== receipt.totalKRW) {
    row(v.billed, formatKRW(receipt.billedTotalKRW), 12, 400, MUTED);
  }
  if (receipt.defendedKRW > 0) {
    row(v.defended, formatKRW(receipt.defendedKRW), 14, 700, "#047857");
  }
  if (receipt.killed.length > 0) {
    measure.font = font(11);
    const names = receipt.killed.map((k) => k.name).join(", ");
    for (const detail of wrap(measure, v.killedIn(names), inner)) {
      text(detail, { size: 11, color: MUTED });
      y += 15;
    }
  }
  if (receipt.priciestPerUse?.usage) {
    y += 4;
    measure.font = font(11);
    const note = v.priciestPlain(
      receipt.priciestPerUse.name,
      formatKRW(receipt.priciestPerUse.usage.costPerUseKRW),
    );
    for (const detail of wrap(measure, note, inner)) {
      text(detail, { size: 11, color: INK });
      y += 15;
    }
  }
  dashed();

  // 알림
  measure.font = font(10);
  for (const note of art.notes) {
    for (const detail of wrap(measure, `· ${note}`, inner)) {
      text(detail, { size: 10, color: MUTED });
      y += 14;
    }
  }
  y += 12;

  // 바코드 모양 장식
  const barsTop = y;
  const bars = barWidths(receiptNumber(receipt.period));
  ops.push((ctx) => {
    ctx.fillStyle = INK;
    const total = bars.reduce((sum, w) => sum + w * 2, 0);
    let x = (WIDTH - total) / 2;
    bars.forEach((w, index) => {
      if (index % 2 === 0) ctx.fillRect(x, barsTop, w, 36);
      x += w * 2;
    });
  });
  y += 36 + 18;
  text("subslash.me", { size: 11, color: MUTED, align: "center" });
  y += PAD;

  const height = Math.ceil(y + 10);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(v.image.noCanvas);
  ctx.scale(SCALE, SCALE);

  // 종이 — 아래 가장자리를 톱니 모양으로.
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(WIDTH, 0);
  ctx.lineTo(WIDTH, height - 8);
  const tooth = 10;
  for (let x = WIDTH; x > 0; x -= tooth) {
    ctx.lineTo(x - tooth / 2, height);
    ctx.lineTo(Math.max(0, x - tooth), height - 8);
  }
  ctx.closePath();
  ctx.fill();
  ctx.textBaseline = "alphabetic";

  for (const op of ops) op(ctx);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(v.image.noBlob))),
      "image/png",
    ),
  );
}
