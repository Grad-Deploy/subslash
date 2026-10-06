import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  STORAGE_QUOTA_WEB_APP,
  STORAGE_QUOTA_WEB_APP_MANIFEST,
} from "../../lib/storage-quota/web-app";

/**
 * 'Google 계정 용량 확인' 웹 앱의 파일을 쓴다. 운영자가 Gmail 연결과 다른 Apps Script 프로젝트에 이 파일을
 * 넣고 웹 앱으로 한 번 배포한 뒤, 나온 /exec 주소를 NEXT_PUBLIC_STORAGE_QUOTA_WEB_APP_URL에 넣는다.
 * 코드는 lib/storage-quota/web-app.ts 한 곳에만 있다 — 여기서 고치지 않는다.
 *
 *   pnpm --filter @subslash/web storage:web-app -- --out ./storage-web-app
 */

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const out = resolve(arg("out") ?? "storage-web-app");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "Code.gs"), STORAGE_QUOTA_WEB_APP);
writeFileSync(join(out, "appsscript.json"), STORAGE_QUOTA_WEB_APP_MANIFEST);
console.error(`웹 앱 파일을 썼습니다: ${out}`);
