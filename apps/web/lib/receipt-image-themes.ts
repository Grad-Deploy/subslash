import type { Messages } from "@lib/i18n/messages";
import type { ReceiptArt } from "./receipt-art";
import type { ReceiptTheme } from "./receipt-theme";
import {
  Column,
  barcode,
  canvasToPng,
  drawMoney,
  moneyWidth,
  line,
  roundRectPath,
  setFont,
  type FontSpec,
} from "./receipt-canvas";

/**
 * 공유용 영수증 이미지의 디자인 테마(Claude Design 'Receipt Redesign'의 핸드오프: 1c 컬러 감열지 · 3a 탑승권 ·
 * 4c 가격표 태그 · 4b 채팅). 아트보드는 600×800(저장은 2배 1200×1600)이고, 항목이 많아 넘치면 세로로 늘린다 — 메타 줄을
 * 빼거나 글자를 줄이지 않는다(빠진 줄은 그 결제의 근거가 사라진 것이다).
 *
 * 색·크기·간격은 핸드오프의 값이다. 금액 글꼴(JetBrains Mono)이 기기에 없으면 시스템 고정폭 글꼴로 그린다.
 */

export const ART_WIDTH = 600;
const ART_MIN_HEIGHT = 800;
const SCALE = 2;

type Ink = FontSpec & { color: string; align?: CanvasTextAlign; lineHeight?: number };

function measureContext(t: Messages): CanvasRenderingContext2D {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error(t.receiptView.image.noCanvas);
  return ctx;
}

function newCanvas(t: Messages, height: number, background: string) {
  const canvas = document.createElement("canvas");
  canvas.width = ART_WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(t.receiptView.image.noCanvas);
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, ART_WIDTH, height);
  ctx.textBaseline = "alphabetic";
  return { canvas, ctx };
}

/** 이름 + (가운데 채움) + 금액 한 줄. 이름은 금액 자리를 남기고 자른다. */
function nameAmountRow(
  col: Column,
  name: string,
  amount: string,
  nameInk: Ink,
  amountInk: Ink,
  leader?: { color: string },
): void {
  const lineHeight = Math.max(nameInk.size, amountInk.size) * 1.35;
  const amountWidth = moneyWidth(col.context, amount, amountInk);
  const room = col.width - amountWidth - (leader ? 40 : 14);
  const shown = col.fit(name, nameInk, room);
  const nameWidth = col.measureText(shown, nameInk);
  const baseline = (lineHeight + Math.max(nameInk.size, amountInk.size) * 0.72) / 2;
  col.block(lineHeight, (ctx, x, y) => {
    setFont(ctx, nameInk);
    ctx.fillStyle = nameInk.color;
    ctx.textAlign = "left";
    ctx.fillText(shown, x, y + baseline);
    drawMoney(ctx, amount, x + col.width, y + baseline, amountInk, "right");
    if (leader) {
      // 디자인의 점선 리더: 이름과 금액 사이, 밑줄보다 4px 위.
      const from = x + nameWidth + 8;
      const to = x + col.width - amountWidth - 8;
      if (to > from) line(ctx, from, to, y + baseline - 4, leader.color, 2, [2, 3]);
    }
  });
}

/** 펀치 홈이 있는 절취선(1c·3a). 가장자리에 걸친 원을 배경색으로 칠한다. */
function perforation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  hole: string,
  dash: string,
): void {
  ctx.fillStyle = hole;
  for (const cx of [x, x + width]) {
    ctx.beginPath();
    ctx.arc(cx, y + 12, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  line(ctx, x + 22, x + width - 22, y + 12, dash, 2, [6, 4]);
}

/** 톱니 가장자리(1c): 종이 띠에 16px마다 반원 홈을 배경색으로 판다. `bottom`이면 아래 가장자리다. */
function teeth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  paper: string,
  background: string,
  bottom: boolean,
): void {
  ctx.fillStyle = paper;
  ctx.fillRect(x, y, width, 12);
  ctx.fillStyle = background;
  for (let cx = x + 8; cx < x + width; cx += 16) {
    ctx.beginPath();
    ctx.arc(cx, bottom ? y + 12 : y, 6.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function linesOf(
  col: Column,
  art: ReceiptArt,
  opts: {
    name: Ink;
    amount: Ink;
    meta: Ink;
    gap: number;
    leader?: { color: string };
  },
): void {
  if (art.empty) {
    col.paragraph(art.empty, { ...opts.meta, size: opts.name.size - 2 });
    return;
  }
  art.lines.forEach((item, i) => {
    if (i > 0) col.gap(opts.gap);
    nameAmountRow(col, item.name, item.amount, opts.name, opts.amount, opts.leader);
    col.gap(2);
    col.paragraph(item.meta, opts.meta);
  });
}

function notesOf(col: Column, notes: string[], ink: Ink): void {
  for (const note of notes) col.paragraph(`· ${note}`, ink);
}

// ── 1c 컬러 감열지 ────────────────────────────────────────────────

async function renderColor(art: ReceiptArt, t: Messages): Promise<HTMLCanvasElement> {
  const BG = "#1F3BFF";
  const PAPER = "#FFE24A";
  const INK = "#141414";
  const PAPER_W = 480;
  const px = (ART_WIDTH - PAPER_W) / 2;
  const measure = measureContext(t);
  const inner = new Column(measure, px + 32, PAPER_W - 64);

  // 본문
  const body = new Column(measure, inner.x, inner.width);
  body.gap(24);
  const header = { size: 26, weight: 900, tracking: -0.02, color: INK, lineHeight: 32 };
  body.block(32, (ctx, x, y) => {
    setFont(ctx, header);
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText("SubSlash", x, y + 26);
    setFont(ctx, { size: 12, weight: 600, mono: true });
    ctx.textAlign = "right";
    ctx.fillText(t.receiptView.title, x + inner.width, y + 26);
  });
  body.gap(16);
  body.block(3, (ctx, x, y) => {
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, inner.width, 3);
  });
  body.gap(14);
  body.paragraph(`${art.period} · ${art.totalLabel}`, {
    size: 15,
    weight: 700,
    color: INK,
    lineHeight: 20,
  });
  body.gap(2);
  body.money(art.total, {
    size: 72,
    weight: 800,
    mono: true,
    tracking: -0.05,
    color: INK,
    lineHeight: 76,
  });
  body.gap(16);
  linesOf(body, art, {
    name: { size: 18, weight: 800, color: INK },
    amount: { size: 18, weight: 600, mono: true, color: INK },
    meta: { size: 12, color: "#5a5320", lineHeight: 17 },
    gap: 12,
    leader: { color: INK },
  });
  if (art.extras.length > 0) {
    body.gap(14);
    for (const extra of art.extras)
      body.paragraph(extra, { size: 13, weight: 700, color: INK, lineHeight: 19 });
  }
  body.gap(22);

  // 절취선 아래
  const stub = new Column(measure, inner.x, inner.width);
  stub.gap(14);
  notesOf(stub, art.notes, { size: 11, color: "#4a4419", lineHeight: 17.6 });
  stub.gap(14);
  stub.block(56, (ctx, x, y) => {
    barcode(ctx, x, y, 190, 38, INK);
    setFont(ctx, { size: 10, mono: true });
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(art.issuedLine, x, y + 54);
    setFont(ctx, { size: 14, weight: 800, mono: true });
    ctx.textAlign = "right";
    ctx.fillText("subslash.me", x + inner.width, y + 54);
  });
  stub.gap(22);

  const paperH = 12 + body.y + 24 + stub.y + 12;
  const height = Math.max(ART_MIN_HEIGHT, Math.ceil(paperH + 80));
  const top = (height - paperH) / 2;
  const { canvas, ctx } = newCanvas(t, height, BG);

  teeth(ctx, px, top, PAPER_W, PAPER, BG, false);
  const bodyTop = top + 12;
  ctx.fillStyle = PAPER;
  ctx.fillRect(px, bodyTop, PAPER_W, body.y + 24 + stub.y);
  body.draw(ctx, bodyTop);
  perforation(ctx, px, bodyTop + body.y, PAPER_W, BG, INK);
  const stubTop = bodyTop + body.y + 24;
  stub.draw(ctx, stubTop);
  teeth(ctx, px, stubTop + stub.y, PAPER_W, PAPER, BG, true);
  return canvas;
}

// ── 3a 탑승권 ─────────────────────────────────────────────────────

async function renderPass(art: ReceiptArt, t: Messages): Promise<HTMLCanvasElement> {
  const BG = "#DCE6F0";
  const CARD = "#FFFFFF";
  const INK = "#0E1B2C";
  const MUTED = "#7a8698";
  const ACCENT = "#2F6BFF";
  const RULE = "#b9c4d2";
  const a = t.receiptView.art;
  const CARD_W = 500;
  const cx = (ART_WIDTH - CARD_W) / 2;
  const measure = measureContext(t);
  const pad = 28;
  const innerX = cx + pad;
  const innerW = CARD_W - pad * 2;

  const HEADER_H = 64;
  const body = new Column(measure, innerX, innerW);
  body.gap(26);
  // 구간
  body.block(62, (ctx, x, y) => {
    setFont(ctx, { size: 11, weight: 700, tracking: 0.08 });
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText(a.from, x, y + 12);
    ctx.textAlign = "right";
    ctx.fillText(a.to, x + innerW, y + 12);
    setFont(ctx, { size: 40, weight: 800, mono: true, tracking: -0.03 });
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(art.from, x, y + 54);
    const fromW = ctx.measureText(art.from).width;
    ctx.textAlign = "right";
    ctx.fillText(art.to, x + innerW, y + 54);
    const toW = ctx.measureText(art.to).width;
    const lineY = y + 40;
    const left = x + fromW + 18;
    const right = x + innerW - toW - 18;
    line(ctx, left, right, lineY, RULE, 2, [6, 4]);
    const mid = (left + right) / 2;
    ctx.fillStyle = CARD;
    ctx.fillRect(mid - 16, lineY - 12, 32, 24);
    setFont(ctx, { size: 16, weight: 900 });
    ctx.fillStyle = ACCENT;
    ctx.textAlign = "center";
    ctx.fillText("→", mid, lineY + 6);
  });
  body.gap(22);
  // 기간·건수·발행
  const cells: [string, string][] = [
    [a.period, art.periodPlain],
    [a.count, a.countValue(art.count)],
    [a.issued, art.issuedDate],
  ];
  const cellW = (innerW - 24) / 3;
  const valueInk: Ink = { size: 15, weight: 700, color: INK, lineHeight: 20 };
  const cellCols = cells.map(([, value], i) => {
    const col = new Column(measure, innerX + i * (cellW + 12), cellW);
    col.paragraph(value, valueInk);
    return col;
  });
  const cellH = 17 + Math.max(...cellCols.map((col) => col.y));
  body.block(cellH, (ctx, x, y) => {
    cells.forEach(([label], i) => {
      setFont(ctx, { size: 11, weight: 700 });
      ctx.fillStyle = MUTED;
      ctx.textAlign = "left";
      ctx.fillText(label, x + i * (cellW + 12), y + 12);
      cellCols[i].draw(ctx, y + 17);
    });
  });
  body.gap(22);
  // 항목 상자
  const box = new Column(measure, innerX + 18, innerW - 36);
  box.gap(16);
  linesOf(box, art, {
    name: { size: 17, weight: 700, color: INK },
    amount: { size: 17, weight: 600, mono: true, color: INK },
    meta: { size: 12, color: MUTED, lineHeight: 17 },
    gap: 12,
  });
  box.gap(16);
  body.nest(box, box.y, (ctx, y) => {
    ctx.fillStyle = "#F2F5F9";
    roundRectPath(ctx, innerX, y, innerW, box.y, 14);
    ctx.fill();
  });
  if (art.extras.length > 0) {
    body.gap(14);
    for (const extra of art.extras)
      body.paragraph(extra, { size: 13, weight: 700, color: INK, lineHeight: 19 });
  }
  body.gap(26);

  // 스텁
  const stub = new Column(measure, innerX, innerW);
  stub.gap(16);
  stub.block(62, (ctx, x, y) => {
    setFont(ctx, { size: 12, weight: 700 });
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText(t.receiptView.share.total, x, y + 13);
    drawMoney(ctx, art.total, x, y + 58, {
      size: 46,
      weight: 800,
      mono: true,
      tracking: -0.04,
      color: ACCENT,
    });
    barcode(ctx, x + innerW - 120, y + 20, 120, 42, INK);
  });
  stub.gap(14);
  notesOf(stub, art.notes, { size: 10, color: MUTED, lineHeight: 15.5 });
  stub.gap(14);
  stub.block(16, (ctx, x, y) => {
    setFont(ctx, { size: 11, mono: true });
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText(`No. ${art.number}`, x, y + 12);
    setFont(ctx, { size: 11, weight: 800, mono: true });
    ctx.fillStyle = INK;
    ctx.textAlign = "right";
    ctx.fillText("subslash.me", x + innerW, y + 12);
  });
  stub.gap(22);

  const cardH = HEADER_H + body.y + 24 + stub.y;
  const height = Math.max(ART_MIN_HEIGHT, Math.ceil(cardH + 100));
  const top = (height - cardH) / 2;
  const { canvas, ctx } = newCanvas(t, height, BG);

  ctx.save();
  ctx.shadowColor = "rgba(20,40,70,.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = CARD;
  roundRectPath(ctx, cx, top, CARD_W, cardH, 22);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, cx, top, CARD_W, cardH, 22);
  ctx.clip();
  ctx.fillStyle = INK;
  ctx.fillRect(cx, top, CARD_W, HEADER_H);
  setFont(ctx, { size: 20, weight: 900 });
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText("SubSlash", innerX, top + 39);
  setFont(ctx, { size: 12, weight: 700, tracking: 0.12 });
  ctx.fillStyle = "#7FB2FF";
  ctx.textAlign = "right";
  ctx.fillText(a.passHeader, innerX + innerW, top + 38);
  body.draw(ctx, top + HEADER_H);
  perforation(ctx, cx, top + HEADER_H + body.y, CARD_W, BG, RULE);
  stub.draw(ctx, top + HEADER_H + body.y + 24);
  ctx.restore();
  return canvas;
}

// ── 4c 가격표 태그 ────────────────────────────────────────────────

async function renderTag(art: ReceiptArt, t: Messages): Promise<HTMLCanvasElement> {
  const BG = "#1E2B24";
  const KRAFT = "#C9A574";
  const INK = "#2A1D0E";
  const STRING = "#E9D9B4";
  const TAG_W = 420;
  const measure = measureContext(t);
  const pad = 30;
  // 태그 안의 좌표는 태그 왼쪽 위가 (0,0)이다. 그린 뒤 통째로 돌린다.
  const col = new Column(measure, pad, TAG_W - pad * 2);
  const center: Ink = { size: 13, weight: 600, color: INK, align: "center", lineHeight: 18 };
  col.gap(30);
  col.block(26, (ctx, _x, y) => {
    ctx.beginPath();
    ctx.arc(TAG_W / 2, y + 13, 13, 0, Math.PI * 2);
    ctx.fillStyle = STRING;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(TAG_W / 2, y + 13, 8, 0, Math.PI * 2);
    ctx.fillStyle = BG;
    ctx.fill();
  });
  col.gap(18);
  col.text("SubSlash", { size: 24, weight: 900, color: INK, align: "center", lineHeight: 30 });
  col.gap(2);
  col.paragraph(`${t.receiptView.title} · ${art.period}`, center);
  col.gap(18);
  col.block(2, (ctx, x, y) => {
    ctx.save();
    ctx.globalAlpha = 0.5;
    line(ctx, x, x + col.width, y + 1, INK, 2, [6, 4]);
    ctx.restore();
  });
  col.gap(18);
  col.paragraph(art.totalLabel, center);
  col.gap(2);
  col.money(art.total, {
    size: 58,
    weight: 800,
    mono: true,
    tracking: -0.05,
    color: INK,
    align: "center",
    lineHeight: 60,
  });
  col.gap(18);
  const box = new Column(measure, pad + 16, col.width - 32);
  box.gap(14);
  linesOf(box, art, {
    name: { size: 16, weight: 700, color: INK },
    amount: { size: 16, weight: 600, mono: true, color: INK },
    meta: { size: 11, color: "#5e4a2c", lineHeight: 16 },
    gap: 12,
  });
  box.gap(14);
  col.nest(box, box.y, (ctx, y) => {
    ctx.fillStyle = STRING;
    roundRectPath(ctx, pad, y, col.width, box.y, 12);
    ctx.fill();
  });
  if (art.extras.length > 0) {
    col.gap(18);
    for (const extra of art.extras)
      col.paragraph(extra, { size: 12, weight: 700, color: INK, lineHeight: 17 });
  }
  col.gap(18);
  notesOf(col, art.notes, { size: 10, color: "#3f2f18", lineHeight: 15.5 });
  col.gap(18);
  col.block(14, (ctx, x, y) => {
    setFont(ctx, { size: 11, mono: true });
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText(`No. ${art.number} · ${art.issuedDate}`, x, y + 11);
    setFont(ctx, { size: 11, weight: 800, mono: true });
    ctx.textAlign = "right";
    ctx.fillText("subslash.me", x + col.width, y + 11);
  });
  col.gap(26);

  const tagH = col.y;
  const tagTop = 26 + 60 - 6;
  // -3도로 돌리면 오른쪽 아래 끝이 TAG_W/2 · sin(3°)만큼 더 내려간다.
  const swing = (TAG_W / 2) * Math.sin((3 * Math.PI) / 180);
  const height = Math.max(ART_MIN_HEIGHT, Math.ceil(tagTop + tagH + swing + 60));
  const { canvas, ctx } = newCanvas(t, height, BG);

  ctx.fillStyle = STRING;
  ctx.fillRect(ART_WIDTH / 2 - 1, 26, 2, 60);

  ctx.save();
  ctx.translate(ART_WIDTH / 2, tagTop);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.translate(-TAG_W / 2, 0);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = KRAFT;
  roundRectPath(ctx, 0, 0, TAG_W, tagH, [56, 56, 18, 18]);
  ctx.fill();
  ctx.restore();
  col.draw(ctx, 0);
  ctx.restore();
  return canvas;
}

// ── 4b 채팅 ───────────────────────────────────────────────────────

/** 글에 맞춘 말풍선. 폭은 가장 긴 줄 + 좌우 여백이고 `maxWidth`를 넘지 않는다. */
function bubble(
  measure: CanvasRenderingContext2D,
  text: string,
  ink: Ink,
  maxWidth: number,
  padX: number,
  padY: number,
): { width: number; height: number; col: Column } {
  setFont(measure, ink);
  const textWidth = Math.min(maxWidth - padX * 2, measure.measureText(text).width);
  const col = new Column(measure, 0, textWidth);
  col.paragraph(text, ink);
  return { width: Math.ceil(textWidth) + padX * 2, height: col.y + padY * 2, col };
}

async function renderChat(art: ReceiptArt, t: Messages): Promise<HTMLCanvasElement> {
  const BG = "#BFD3E6";
  const INK = "#1B1B1B";
  const WHITE = "#FFFFFF";
  const MUTED = "#6b7684";
  const PAD = 32;
  const measure = measureContext(t);
  const contentW = ART_WIDTH - PAD * 2;
  const ops: ((ctx: CanvasRenderingContext2D) => void)[] = [];
  let y = PAD;

  // 머리
  const headY = y;
  ops.push((ctx) => {
    setFont(ctx, { size: 20, weight: 900 });
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.fillText("SubSlash", PAD, headY + 21);
    setFont(ctx, { size: 11, mono: true });
    ctx.fillStyle = "#3d5168";
    ctx.textAlign = "right";
    ctx.fillText(art.issuedLine, PAD + contentW, headY + 20);
  });
  y += 26 + 6 + 12;

  // 사용자 말풍선(오른쪽)
  const askInk: Ink = { size: 16, weight: 600, color: INK, lineHeight: 22 };
  const ask = bubble(measure, art.ask, askInk, contentW - 80, 16, 12);
  const askY = y;
  ops.push((ctx) => {
    const x = PAD + contentW - ask.width;
    ctx.fillStyle = "#FFE94D";
    roundRectPath(ctx, x, askY, ask.width, ask.height, [18, 18, 4, 18]);
    ctx.fill();
    ctx.save();
    ctx.translate(x + 16, 0);
    ask.col.draw(ctx, askY + 12);
    ctx.restore();
  });
  y += ask.height + 12;

  // 봇 줄: 아바타 + 말풍선 묶음
  const avatarY = y;
  ops.push((ctx) => {
    ctx.fillStyle = INK;
    roundRectPath(ctx, PAD, avatarY, 40, 40, 14);
    ctx.fill();
    setFont(ctx, { size: 18, weight: 900 });
    ctx.fillStyle = "#FFE94D";
    ctx.textAlign = "center";
    ctx.fillText("S", PAD + 20, avatarY + 27);
  });
  const stackX = PAD + 40 + 10;
  const stackW = ART_WIDTH - PAD - stackX;

  // a. 답 첫 줄
  const reply = bubble(
    measure,
    art.reply,
    { size: 16, color: INK, lineHeight: 22 },
    stackW,
    16,
    12,
  );
  const replyY = y;
  ops.push((ctx) => {
    ctx.fillStyle = WHITE;
    roundRectPath(ctx, stackX, replyY, reply.width, reply.height, [4, 18, 18, 18]);
    ctx.fill();
    ctx.save();
    ctx.translate(stackX + 16, 0);
    reply.col.draw(ctx, replyY + 12);
    ctx.restore();
  });
  y += reply.height + 8;

  // b. 영수증 카드
  const card = new Column(measure, stackX + 20, stackW - 40);
  card.gap(20);
  card.paragraph(art.totalLabel, { size: 13, weight: 600, color: MUTED, lineHeight: 18 });
  card.gap(2);
  card.money(art.total, {
    size: 50,
    weight: 800,
    mono: true,
    tracking: -0.05,
    color: INK,
    lineHeight: 53,
  });
  card.gap(14);
  card.block(1, (ctx, x, top) => {
    ctx.fillStyle = "#eceef1";
    ctx.fillRect(x, top, card.width, 1);
  });
  card.gap(14);
  linesOf(card, art, {
    name: { size: 16, weight: 700, color: INK },
    amount: { size: 16, weight: 600, mono: true, color: INK },
    meta: { size: 12, color: MUTED, lineHeight: 17 },
    gap: 14,
  });
  if (art.extras.length > 0) {
    card.gap(14);
    for (const extra of art.extras) {
      card.paragraph(extra, { size: 13, weight: 700, color: INK, lineHeight: 19 });
    }
  }
  card.gap(20);
  const cardY = y;
  ops.push((ctx) => {
    ctx.fillStyle = WHITE;
    roundRectPath(ctx, stackX, cardY, stackW, card.y, 18);
    ctx.fill();
    card.draw(ctx, cardY);
  });
  y += card.y + 8;

  // c. 안내문 말풍선
  const notes = new Column(measure, stackX + 16, stackW - 32);
  notes.gap(14);
  notesOf(notes, art.notes, { size: 10.5, color: "#4e5968", lineHeight: 16.8 });
  notes.gap(14);
  const notesY = y;
  ops.push((ctx) => {
    ctx.fillStyle = WHITE;
    roundRectPath(ctx, stackX, notesY, stackW, notes.y, 18);
    ctx.fill();
    notes.draw(ctx, notesY);
  });
  y += notes.y;

  // 꼬리: 맨 아래 가운데. 내용이 짧으면 아트보드 바닥에, 길면 내용 아래에 붙는다(margin-top: auto).
  const height = Math.max(ART_MIN_HEIGHT, Math.ceil(y + 24 + 18 + PAD));
  const { canvas, ctx } = newCanvas(t, height, BG);
  for (const op of ops) op(ctx);
  setFont(ctx, { size: 14, weight: 800, mono: true });
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText("subslash.me", ART_WIDTH / 2, height - PAD - 4);
  return canvas;
}

export type ArtTheme = Exclude<ReceiptTheme, "classic">;

const RENDERERS: Record<ArtTheme, (art: ReceiptArt, t: Messages) => Promise<HTMLCanvasElement>> = {
  color: renderColor,
  pass: renderPass,
  tag: renderTag,
  chat: renderChat,
};

export async function renderThemedReceipt(
  theme: ArtTheme,
  art: ReceiptArt,
  t: Messages,
): Promise<Blob> {
  // 글꼴이 늦게 오면 대체 글꼴로 그려진다. 이미 받아 둔 글꼴만 기다린다.
  await document.fonts?.ready;
  const canvas = await RENDERERS[theme](art, t);
  return canvasToPng(canvas, t.receiptView.image.noBlob);
}
