// 앱 아이콘과 스플래시를 웹의 앱 아이콘(apps/web/app/icon.svg)에서 다시 만든다.
//
//   pnpm --filter @subslash/mobile assets
//
// 네이티브 에셋은 Capacitor가 처음 만든 기본 그림(파란 X와 격자)이 그대로 남아 있어서, 홈 화면과
// 실행 화면이 웹의 브랜드(검은 바탕, 카드 두 장, 빨간 슬래시)와 다른 로고였다. 좌표와 색은 icon.svg
// 한 곳에만 두고 여기서는 그 파일을 읽는다 — 로고를 고치면 이 스크립트를 다시 돌린다.
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const res = (p) => resolve(root, "android/app/src/main/res", p);
const ios = (p) => resolve(root, "ios/App/App/Assets.xcassets", p);

// 웹 manifest의 background_color·theme_color, 브랜드 검정.
const BACKGROUND = "#09090B";

const iconSvg = await readFile(resolve(root, "../web/app/icon.svg"), "utf8");
const BG_RECT = /<rect width="512" height="512" rx="123" fill="#09090B" \/>/;
if (!BG_RECT.test(iconSvg)) {
  throw new Error(
    "icon.svg의 바탕 사각형을 찾지 못했습니다. 이 스크립트의 BG_RECT를 함께 고치세요.",
  );
}
const svg = (body, viewBox = "0 0 512 512") =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`);
const inner = iconSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const mark = inner.replace(BG_RECT, "");

// 바탕 모양만 다른 네 가지.
const rounded = svg(inner); // 웹과 같은 둥근 사각형(안드로이드 7 이하 런처)
// 슬래시 끝(가운데에서 259)이 원(반지름 256) 밖으로 나가므로 마크를 90%로 줄인다.
const circle = svg(
  `<circle cx="256" cy="256" r="256" fill="${BACKGROUND}" /><g transform="translate(25.6 25.6) scale(0.9)">${mark}</g>`,
);
const square = svg(
  inner.replace(BG_RECT, `<rect width="512" height="512" fill="${BACKGROUND}" />`),
); // iOS가 모서리를 깎는다
// 적응형 아이콘 전경은 108dp 틀이고 런처가 가운데 72dp만 보이며, 원형 마스크에서도 잘리지 않는 자리는
// 지름 66dp다. 슬래시 끝은 512 틀의 가운데에서 259만큼 떨어져 있으므로 512 틀을 64dp로 줄이면 반지름
// 32.4dp 안에 든다.
const adaptive = svg(`<g transform="translate(22 22) scale(0.125)">${mark}</g>`, "0 0 108 108");

const png = (input, size) => sharp(input, { density: 1200 }).resize(size, size).png();
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

for (const [name, scale] of Object.entries(densities)) {
  await png(rounded, 48 * scale).toFile(res(`mipmap-${name}/ic_launcher.png`));
  await png(circle, 48 * scale).toFile(res(`mipmap-${name}/ic_launcher_round.png`));
  await png(adaptive, 108 * scale).toFile(res(`mipmap-${name}/ic_launcher_foreground.png`));
}

// iOS 앱 아이콘은 투명 픽셀이 있으면 스토어에서 거절된다.
await png(square, 1024)
  .flatten({ background: BACKGROUND })
  .toFile(ios("AppIcon.appiconset/AppIcon-512@2x.png"));

// 스플래시: 검은 바탕 가운데에 마크. 크기는 짧은 변의 30%(마크 자체는 그 75%).
async function splash(file, width, height) {
  const size = Math.round(Math.min(width, height) * 0.3);
  const markPng = await png(svg(mark), size).toBuffer();
  await sharp({ create: { width, height, channels: 3, background: BACKGROUND } })
    .composite([{ input: markPng, gravity: "center" }])
    .png()
    .toFile(file);
}

const port = {
  mdpi: [320, 480],
  hdpi: [480, 800],
  xhdpi: [720, 1280],
  xxhdpi: [960, 1600],
  xxxhdpi: [1280, 1920],
};
for (const [name, [w, h]] of Object.entries(port)) {
  await splash(res(`drawable-port-${name}/splash.png`), w, h);
  await splash(res(`drawable-land-${name}/splash.png`), h, w);
}
await splash(res("drawable/splash.png"), 480, 320);
for (const file of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
  await splash(ios(`Splash.imageset/${file}`), 2732, 2732);
}

console.log("앱 아이콘과 스플래시를 apps/web/app/icon.svg에서 다시 만들었습니다.");
