/**
 * 앱(Capacitor)에 담을 화면을 정적으로 내보낸다: `pnpm build:app` → out/
 *
 * 앱 안의 화면은 서버 API를 배포된 웹 주소로 부른다(lib/api). 그 주소(NEXT_PUBLIC_WEB_ORIGIN)가
 * 없으면 앱이 자기 자신(https://localhost/api/...)을 불러 모든 서버 기능이 조용히 실패하므로,
 * 비어 있으면 빌드하지 않는다.
 *
 * 빌드 중간 파일도 out/에 둔다(next.config.ts의 distDir). 웹 빌드와 같은 .next를 쓰면 한쪽
 * 빌드가 다른 쪽 결과를 덮는다.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

const OUT_DIR = "out";

const origin = process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim();
if (!origin || !/^https:\/\/[^/]+$/.test(origin.replace(/\/+$/, ""))) {
  console.error(
    "NEXT_PUBLIC_WEB_ORIGIN에 앱이 부를 배포된 웹 주소(https://…)를 넣어주세요. " +
      "예: NEXT_PUBLIC_WEB_ORIGIN=https://subslash.example pnpm build:app",
  );
  process.exit(1);
}

const result = spawnSync("next", ["build"], {
  stdio: "inherit",
  // Windows에서 pnpm이 만든 next.cmd를 찾으려면 셸을 거쳐야 한다.
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_BUILD_TARGET: "app", NEXT_PUBLIC_WEB_ORIGIN: origin },
});
if (result.status !== 0) process.exit(result.status ?? 1);

flattenSegmentFiles(OUT_DIR);

/**
 * Next 16.3의 정적 내보내기는 Windows에서 세그먼트 미리 불러오기 파일을 엉뚱한 곳에 쓴다.
 *
 * 화면은 `subs/__next.subs.__PAGE__.txt`를 요청하는데, 내보내기가 세그먼트 경로를 Windows
 * 구분자(`subs\__PAGE__`)로 받아 `/`만 점으로 바꾸므로 `subs/__next.subs/__PAGE__.txt`라는
 * 폴더 속 파일이 된다(next/dist/export). 앱에서는 이 요청이 모두 실패해, 탭을 옮길 때 미리
 * 불러온 화면 대신 전체 데이터를 새로 받는다. 폴더로 들어간 파일을 점으로 이은 이름으로 옮긴다.
 * Linux(CI)에서는 처음부터 맞게 만들어져 옮길 것이 없다.
 */
function flattenSegmentFiles(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "_next") continue;
    const full = path.join(dir, entry.name);
    if (!entry.name.startsWith("__next.")) {
      flattenSegmentFiles(full);
      continue;
    }
    for (const file of readdirSync(full, { recursive: true, withFileTypes: true })) {
      if (!file.isFile()) continue;
      const src = path.join(file.parentPath, file.name);
      // out/savings/review/__next.savings/review/__PAGE__.txt → __next.savings.review.__PAGE__.txt
      renameSync(src, path.join(dir, path.relative(dir, src).split(path.sep).join(".")));
    }
    rmSync(full, { recursive: true });
  }
}
