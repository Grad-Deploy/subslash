# iPad 미리보기 (Expo Go)

Mac 없이 iPad에서 SubSlash를 **iPhone 크기 그대로** 보는 도구다. iPad 화면 가운데에 iPhone 크기의
틀을 그리고, 그 안에 웹 화면을 WKWebView로 띄운다. 앱(Capacitor iOS)도 같은 WKWebView로 그리므로
앱 안에서의 모습과 거의 같다.

- 틀: iPhone 15(393×852pt), iPhone SE, iPhone 15 Pro Max 중에서 고른다. iPad를 눕히면 비율 그대로 줄인다.
- 주소: 운영·미러 사이트, 또는 직접 적은 주소(예: PR 미리보기 배포).
- 상태 표시줄·홈 표시줄 자리는 틀 안에서 그만큼 비워 둔다(페이지 배경색).

이 폴더는 pnpm 워크스페이스(`apps/*`, `packages/*`) 밖이라 npm으로 따로 설치한다. CI와 웹 빌드에는
들어가지 않는다. 실제 출시할 앱이 아니라 디자인 확인용이다 — 로컬 알림 같은 네이티브 기능은
여기서 볼 수 없다.

## 준비 (처음 한 번)

1. iPad: App Store에서 **Expo Go**를 설치하고, Expo 계정(무료)으로 로그인한다.
   Expo SDK 57부터는 PC와 iPad에 **같은 계정**으로 로그인해야 열린다.
2. PC(Git Bash)에서 한 줄씩:

```bash
cd tools/ipad-preview
npm install
npx expo login
```

## 실행

```bash
cd tools/ipad-preview
npx expo start
```

터미널에 뜬 QR 코드를 iPad의 카메라 앱으로 찍고, 알림을 눌러 Expo Go에서 연다.

- PC와 iPad가 **같은 Wi-Fi**여야 한다. 다른 망이면 `npx expo start --tunnel`.
- QR을 찍었는데 Safari가 열리면: iPad 설정 › 앱 › Safari › "데스크탑 웹 사이트 요청"을 끈다.
- 로그인한 화면·데이터는 이 미리보기 안에만 저장된다(실제 사이트의 브라우저 데이터와 따로).
