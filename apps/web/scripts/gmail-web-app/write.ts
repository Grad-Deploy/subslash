import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { GMAIL_CONNECT_WEB_APP_MANIFEST, gmailConnectWebApp } from "../../lib/gmail-import";

/**
 * 원클릭 Gmail 연결 웹 앱의 파일을 쓴다. 운영자가 이 파일을 Apps Script 프로젝트에 넣고 웹 앱으로
 * 한 번 배포한다. 코드는 lib/gmail-import.ts 한 곳에만 있다 — 여기서 고치지 않는다.
 *
 *   pnpm --filter @subslash/web gmail:web-app -- --origins https://www.subslash.me,https://subslash-web-qki1.vercel.app --out ./gmail-web-app
 */

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const origins = (arg("origins") ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const out = resolve(arg("out") ?? "gmail-web-app");

if (origins.length === 0 || origins.some((origin) => !/^https:\/\/[^/]+$/.test(origin))) {
  console.error("--origins에 https://로 시작하는 SubSlash 주소를 쉼표로 나눠 적어 주세요.");
  process.exit(1);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "Code.gs"), gmailConnectWebApp(origins));
writeFileSync(join(out, "appsscript.json"), GMAIL_CONNECT_WEB_APP_MANIFEST);
console.error(`웹 앱 파일을 썼습니다: ${out}`);
console.error(`허용한 주소: ${origins.join(", ")}`);
