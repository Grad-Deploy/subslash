/**
 * 영수증 이미지(lib/receipt-image, lib/receipt-image-themes)가 캔버스에 그릴 때 같이 쓰는 도구. 캡처 라이브러리를
 * 넣지 않고 직접 그린다 — 화면 테마(어두운 화면)와 관계없이 늘 같은 그림이 나오고, 앱 웹뷰에서도 똑같이 그려진다.
 */

export const SANS = `"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
/** 금액·번호·날짜. 디자인은 JetBrains Mono이고, 기기에 없으면 시스템 고정폭 글꼴로 그린다. */
export const MONO = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`;

export interface FontSpec {
  size: number;
  weight?: number;
  mono?: boolean;
  /** em 단위(디자인의 letter-spacing). 캔버스가 모르면 무시한다. */
  tracking?: number;
}

export function setFont(ctx: CanvasRenderingContext2D, spec: FontSpec): void {
  ctx.font = `${spec.weight ?? 400} ${spec.size}px ${spec.mono ? MONO : SANS}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      `${(spec.tracking ?? 0) * spec.size}px`;
  }
}

/**
 * 금액의 통화 기호와 숫자 사이(em). 큰 금액은 디자인대로 자간을 좁히는데, 그 자간을 기호까지 걸면 ₩가 숫자에 붙는다 —
 * 기기에 JetBrains Mono가 없어 대체 고정폭 글꼴로 그리면 ₩가 더 좁아 거의 겹쳐 보였다. 그래서 기호는 자간 없이 따로
 * 그리고 숫자와 이만큼 띄운다.
 */
const SYMBOL_GAP = 0.14;

function splitMoney(text: string): [string | null, string] {
  const match = /^([₩$€¥£])\s?(.+)$/u.exec(text);
  return match ? [match[1], match[2]] : [null, text];
}

/** `drawMoney`로 그렸을 때의 폭. */
export function moneyWidth(ctx: CanvasRenderingContext2D, text: string, spec: FontSpec): number {
  const [symbol, number] = splitMoney(text);
  setFont(ctx, spec);
  const numberWidth = ctx.measureText(number).width;
  if (!symbol) return numberWidth;
  setFont(ctx, { ...spec, tracking: 0 });
  return ctx.measureText(symbol).width + spec.size * SYMBOL_GAP + numberWidth;
}

/** 금액("₩37,111")을 그린다. 기호는 자간 없이, 숫자와 `SYMBOL_GAP`만큼 띄운다. */
export function drawMoney(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  spec: FontSpec & { color: string },
  align: CanvasTextAlign = "left",
): void {
  const [symbol, number] = splitMoney(text);
  const width = moneyWidth(ctx, text, spec);
  let left = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
  ctx.fillStyle = spec.color;
  ctx.textAlign = "left";
  if (symbol) {
    setFont(ctx, { ...spec, tracking: 0 });
    ctx.fillText(symbol, left, baseline);
    left += ctx.measureText(symbol).width + spec.size * SYMBOL_GAP;
  }
  setFont(ctx, spec);
  ctx.fillText(number, left, baseline);
}

/** 폭을 넘으면 말줄임표로 자른다. */
export function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** 폭에 맞춰 줄을 나눈다. 한국어는 낱말 사이가 아니어도 끊을 수 있어 글자 단위로 나눈다. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    if (ctx.measureText(current + char).width > maxWidth && current) {
      lines.push(current);
      current = char.trimStart();
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | [number, number, number, number],
): void {
  const [tl, tr, br, bl] = typeof radius === "number" ? [radius, radius, radius, radius] : radius;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string,
  width: number,
  dash: number[] = [],
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

/** 디자인의 바코드 무늬(13px마다 2·1·3px 막대). 장식이고 읽을 수 있는 코드가 아니다. */
export function barcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let start = 0; start < w; start += 13) {
    for (const [from, to] of [
      [0, 2],
      [4, 5],
      [8, 11],
    ]) {
      const left = start + from;
      if (left >= w) break;
      ctx.fillRect(x + left, y, Math.min(to, w - start) - from, h);
    }
  }
}

/**
 * 위에서 아래로 쌓는 글 상자. 그리기 전에 높이를 알아야 카드·종이를 먼저 칠할 수 있어, 그릴 일을 모아 두었다가
 * `draw`에서 한꺼번에 그린다. `y`는 상자 안에서의 위치이고 `draw(ctx, top)`에 상자 위치를 넘긴다.
 */
export class Column {
  y = 0;
  private ops: ((ctx: CanvasRenderingContext2D, top: number) => void)[] = [];

  constructor(
    private measure: CanvasRenderingContext2D,
    readonly x: number,
    readonly width: number,
  ) {}

  gap(px: number): void {
    this.y += px;
  }

  /** 한 줄. `lineHeight`만큼 내려가고 글자는 그 줄의 가운데쯤(밑줄)에 놓인다. */
  text(
    value: string,
    spec: FontSpec & { color: string; align?: CanvasTextAlign; lineHeight?: number },
  ): void {
    const lineHeight = spec.lineHeight ?? spec.size * 1.3;
    const baseline = this.y + (lineHeight + spec.size * 0.72) / 2;
    const x =
      spec.align === "right"
        ? this.x + this.width
        : spec.align === "center"
          ? this.x + this.width / 2
          : this.x;
    this.ops.push((ctx, top) => {
      setFont(ctx, spec);
      ctx.fillStyle = spec.color;
      ctx.textAlign = spec.align ?? "left";
      ctx.fillText(value, x, top + baseline);
    });
    this.y += lineHeight;
  }

  /** 금액 한 줄(`drawMoney`). */
  money(
    value: string,
    spec: FontSpec & { color: string; align?: CanvasTextAlign; lineHeight?: number },
  ): void {
    const lineHeight = spec.lineHeight ?? spec.size * 1.3;
    const baseline = this.y + (lineHeight + spec.size * 0.72) / 2;
    const x =
      spec.align === "right"
        ? this.x + this.width
        : spec.align === "center"
          ? this.x + this.width / 2
          : this.x;
    this.ops.push((ctx, top) => drawMoney(ctx, value, x, top + baseline, spec, spec.align));
    this.y += lineHeight;
  }

  /** 폭에 맞춰 여러 줄로. */
  paragraph(
    value: string,
    spec: FontSpec & { color: string; align?: CanvasTextAlign; lineHeight?: number },
  ): void {
    setFont(this.measure, spec);
    for (const part of wrap(this.measure, value, this.width)) this.text(part, spec);
  }

  /** 높이가 정해진 그림. `paint`는 (ctx, 상자 안 왼쪽, 위) 좌표로 그린다. */
  block(
    height: number,
    paint: (ctx: CanvasRenderingContext2D, x: number, y: number) => void,
  ): void {
    const at = this.y;
    this.ops.push((ctx, top) => paint(ctx, this.x, top + at));
    this.y += height;
  }

  /** 다른 상자를 이 자리에 넣는다(배경을 먼저 칠할 수 있게 `under`를 받는다). */
  nest(
    child: Column,
    height: number,
    under?: (ctx: CanvasRenderingContext2D, y: number) => void,
  ): void {
    const at = this.y;
    this.ops.push((ctx, top) => {
      under?.(ctx, top + at);
      child.draw(ctx, top + at);
    });
    this.y += height;
  }

  draw(ctx: CanvasRenderingContext2D, top: number): void {
    for (const op of this.ops) op(ctx, top);
  }

  measureText(value: string, spec: FontSpec): number {
    setFont(this.measure, spec);
    return this.measure.measureText(value).width;
  }

  fit(value: string, spec: FontSpec, maxWidth: number): string {
    setFont(this.measure, spec);
    return fit(this.measure, value, maxWidth);
  }

  get context(): CanvasRenderingContext2D {
    return this.measure;
  }
}

export function canvasToPng(canvas: HTMLCanvasElement, error: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(error))), "image/png"),
  );
}
