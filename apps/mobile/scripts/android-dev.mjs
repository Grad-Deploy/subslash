#!/usr/bin/env node
/**
 * 테스트용 앱을 만들어 연결된 안드로이드 기기에 설치하고 연다.
 *
 *   pnpm --filter @subslash/mobile android:dev              # 웹 화면까지 새로 만든다
 *   pnpm --filter @subslash/mobile android:dev --skip-web   # 네이티브만 고쳤을 때
 *
 * 테스트용 앱은 `com.subslash.app.dev`('SubSlash Dev')라 스토어에서 받은 앱과 나란히 설치된다. 그래서
 * 고칠 때마다 versionCode를 올려 스토어에 올리지 않아도 되고, 스토어 앱을 지우지 않아도 된다(서명이 달라
 * 덮어 설치할 수 없다). 기록은 두 앱이 따로 가진다. 웹뷰 디버깅이 켜져 있어 크롬의 chrome://inspect로 볼
 * 수 있다.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEV_APP_ID = "com.subslash.app.dev";
const mobileDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(mobileDir, "android");
const isWindows = process.platform === "win32";
const skipWeb = process.argv.includes("--skip-web");

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: isWindows, ...options });
  if (result.status !== 0) {
    console.error(`\n[android:dev] 실패했습니다: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

/** 앱이 부를 서버. 따로 주지 않으면 스토어 앱과 같은 곳(eas.json)을 부른다 — 다르면 계정이 갈린다. */
function webOrigin() {
  if (process.env.NEXT_PUBLIC_WEB_ORIGIN) return process.env.NEXT_PUBLIC_WEB_ORIGIN;
  const eas = JSON.parse(readFileSync(path.join(mobileDir, "eas.json"), "utf8"));
  const origin = eas.build?.base?.env?.NEXT_PUBLIC_WEB_ORIGIN;
  if (!origin) {
    console.error("[android:dev] NEXT_PUBLIC_WEB_ORIGIN을 정하지 못했습니다. 환경 변수로 주세요.");
    process.exit(1);
  }
  return origin;
}

function findAdb() {
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    isWindows && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Android", "Sdk"),
    path.join(homedir(), "Library", "Android", "sdk"),
    path.join(homedir(), "Android", "Sdk"),
  ].filter(Boolean);
  for (const root of sdkRoots) {
    const adb = path.join(root, "platform-tools", isWindows ? "adb.exe" : "adb");
    if (existsSync(adb)) return adb;
  }
  return "adb";
}

const adb = findAdb();
const devices = execFileSync(adb, ["devices"], { encoding: "utf8" })
  .split("\n")
  .slice(1)
  .filter((line) => line.trim().endsWith("device"));
if (devices.length === 0) {
  console.error(
    "[android:dev] 연결된 기기가 없습니다. USB 디버깅을 켜고, 폰에 뜬 'USB 디버깅 허용'을 눌렀는지 확인하세요.",
  );
  process.exit(1);
}

if (!skipWeb) {
  const env = { ...process.env, NEXT_PUBLIC_WEB_ORIGIN: webOrigin() };
  run("pnpm", ["--filter", "@subslash/web", "build:app"], { env });
  run("npx", ["cap", "sync", "android"], { cwd: mobileDir, env });
}

// 절대 경로로 부른다. Windows의 cmd는 현재 폴더의 gradlew.bat을 찾지 않을 수 있다.
const gradlew = path.join(androidDir, isWindows ? "gradlew.bat" : "gradlew");
run(isWindows ? `"${gradlew}"` : gradlew, ["installDebug", "-PdevApp"], { cwd: androidDir });
run(adb, ["shell", "monkey", "-p", DEV_APP_ID, "-c", "android.intent.category.LAUNCHER", "1"], {
  shell: false,
  stdio: "ignore",
});
console.log(`\n[android:dev] 설치하고 열었습니다: ${DEV_APP_ID} ('SubSlash Dev')`);
console.log(`[android:dev] 지우려면: ${adb} uninstall ${DEV_APP_ID}`);
