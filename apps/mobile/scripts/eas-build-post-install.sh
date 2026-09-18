#!/usr/bin/env bash
# EAS Build 작업 서버에서 의존성 설치가 끝난 뒤, 네이티브 빌드 전에 돈다
# (apps/mobile/package.json의 eas-build-post-install). 로컬 빌드는 `pnpm sync`를 쓴다.
set -euo pipefail

if [ "${EAS_BUILD_PLATFORM:-}" = "android" ]; then
  # Capacitor 8 안드로이드는 Java 21로 컴파일하는데, EAS의 Android 이미지는 모두 JDK 17 이하다.
  # JDK 21을 받아 Gradle 데몬이 그것으로 돌게 한다. 고치는 gradle.properties는 작업 서버의 사본이다.
  JDK_DIR="$HOME/jdk-21"
  if [ ! -x "$JDK_DIR/bin/java" ]; then
    case "$(uname -m)" in
      x86_64) arch=x64 ;;
      aarch64 | arm64) arch=aarch64 ;;
      *)
        echo "지원하지 않는 CPU입니다: $(uname -m)" >&2
        exit 1
        ;;
    esac
    mkdir -p "$JDK_DIR"
    curl -fsSL "https://api.adoptium.net/v3/binary/latest/21/ga/linux/${arch}/jdk/hotspot/normal/eclipse" |
      tar -xz -C "$JDK_DIR" --strip-components=1
  fi
  "$JDK_DIR/bin/java" -version
  printf '\norg.gradle.java.home=%s\n' "$JDK_DIR" >>android/gradle.properties
fi

# 앱에 담을 화면(apps/web/out)은 저장소에 없으므로 여기서 만들어 네이티브 프로젝트에 복사한다.
# 앱이 부를 배포 주소(NEXT_PUBLIC_WEB_ORIGIN)는 eas.json 빌드 프로필의 env에 있다.
pnpm --filter @subslash/web build:app
pnpm exec cap sync "$EAS_BUILD_PLATFORM"
