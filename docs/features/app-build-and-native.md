# 앱(Capacitor) 빌드·네이티브·로컬 알림·EAS

> CLAUDE.md에서 옮겨 온 설명서다(내용은 바꾸지 않았다). 본문의 '위'·'아래'·'작업 절차' 같은 말은 CLAUDE.md의 절을 가리킨다.

**언제 읽나:** `apps/mobile`, 안드로이드 릴리스 빌드(R8), `lib/mirrored-storage`, 로컬 알림, EAS 빌드를 고칠 때.

앱 화면은 `pnpm --filter @subslash/web build:app`(정적 내보내기 → `apps/web/out`)으로 만들고,
`apps/mobile`(Capacitor 8, appId `com.subslash.app`)이 그 폴더를 담는다. 빌드에는 앱이 부를 배포
주소(`NEXT_PUBLIC_WEB_ORIGIN`)가 꼭 있어야 하고, 없으면 빌드를 멈춘다. 앱에서만 달라지는 동작은
`IS_APP_BUILD`(`lib/platform`)로 가른다. CI가 이 빌드를 돌려 정적 내보내기를 깨는 코드를 막는다.
안드로이드 빌드·실행은 docs/DEVELOPMENT.md의 '모바일 앱'에 있다. 고친 것을 폰에서 확인할 때는 `pnpm --filter @subslash/mobile android:dev`로 테스트용 앱(`com.subslash.app.dev`)을 스토어 앱 옆에 설치한다 — 확인하려고 versionCode를 올리거나 스토어 앱을 지우지 않는다.

`apps/mobile`은 안드로이드(`android/`)만 담는다. iOS 앱은 2026년 10월에 만들지 않기로 하고 `ios/`·`@capacitor/ios`·
EAS의 iOS 프로필·iPad 미리보기 도구(`tools/ipad-preview`)를 걷었다. iOS 앱 출처(`capacitor://localhost`)도
`lib/app-origins`에서 뺐다 — 다시 만들면 `npx cap add ios`와 함께 그 출처를 더한다. `@capacitor/android`는
코드에서 import하지 않지만 `npx cap sync`가 네이티브 프로젝트를 갱신할 때 쓰므로 지우지 않는다. 네이티브
플러그인은 안드로이드에만 있으므로(`AppWindowPlugin`), 플러그인을 부르는 코드는 `Capacitor.getPlatform()`으로
가른다 — 안드로이드가 아닌 곳에서 부르면 거절당해 경고만 쌓인다.

안드로이드 릴리스 빌드는 R8로 코드를 줄이고 최적화·난독화한다(AGP 9, `minifyEnabled`·`shrinkResources`).
AGP 9는 최적화를 끄는 `proguard-android.txt`를 받지 않으므로 `proguard-android-optimize.txt`를 쓴다. 웹 화면이
네이티브를 이름으로 부르므로, 이름이 바뀌면 빌드는 되는데 앱에서만 기능이 조용히 멈춘다. 플러그인
(`@CapacitorPlugin`·`@PluginMethod`)은 Capacitor가 함께 주는 keep 규칙이, 웹뷰 브리지(`@JavascriptInterface`)는
기본 규칙이 지킨다. 리플렉션으로 찾는 코드를 새로 넣으면 `app/proguard-rules.pro`에 규칙을 더하고, 릴리스
빌드의 `mapping/release/seeds.txt`에 그 이름이 남는지 확인한다. 난독화를 풀 매핑은 AAB에 들어가 Play가 쓴다.

앱의 구독 기록은 웹처럼 localStorage가 원본이고, 쓸 때마다 기기 저장소(Preferences)에 사본을
적는다(`lib/mirrored-storage`). 앱을 열 때 localStorage가 비어 있었으면 사본으로 되살린다 — 운영체제가
웹뷰 저장소를 비워도 기록이 남게 하려는 것이다. 저장소를 통째로 Preferences로 옮기지 않는 이유는 그
파일에 있다. 상태 표시줄 색은 테마를 따라 `syncSystemBars`(`lib/native`)가 맞춘다.

앱의 결제 알림은 기기 안의 로컬 알림이다(`lib/local-reminders`가 목록을 정하고
`lib/native-reminders`가 건다). 서버를 거치지 않아 로그인 없이 쓴다.
알림 권한은 앱을 켤 때가 아니라 사용자가 '알림 켜기'를 누를 때 묻는다. 정확한 시각 알람
(`SCHEDULE_EXACT_ALARM`)은 매니페스트에서 뺀다 — 몇 분 늦어도 되는 알림에 사용자가 따로 켜야 하는
권한을 요구하지 않는다. 결제 월을 모르는 연간 구독은 날짜가 없으므로 알리지 않는다. 켜짐·며칠 전
설정은 기기마다 다르므로 스토어·백업·동기화에 넣지 않는다. 같은 기기에서도 기록 주인(비로그인·계정)마다 따로
둔다(`lib/owner-scoped`) — 로그아웃하면 비로그인의 설정으로 다시 건다.

클라우드 빌드는 EAS Build를 쓴다(`apps/mobile/eas.json`, Expo 프로젝트 `@leesean2/subslash-mobile`). 앱은
Expo가 아니라 Capacitor이므로 `expo` 패키지를 넣지 않는다 — EAS는 `app.json`·`eas.json`만 읽는다. EAS의
Android 이미지에는 JDK 17뿐인데 Capacitor 8은 Java 21로 컴파일해서, 설치 뒤 훅
(`scripts/eas-build-post-install.sh`)이 JDK 21을 받고 웹 화면을 만들어 `cap sync`한다. EAS는 작업 폴더를
`.gitignore` 기준으로 올린다. `.easignore`를 만들면 `.gitignore`를 통째로 대신해서 `.env`까지 올라갈 수
있으니 만들지 않는다.
