# iPad·iPhone 미리보기 (Expo Go)

Mac 없이 iPad나 iPhone에서 SubSlash를 **iPhone에서 보는 모습 그대로** 보는 도구다. 웹 화면을
WKWebView로 띄운다. 앱(Capacitor iOS)도 같은 WKWebView로 그리므로 앱 안에서의 모습과 거의 같다.

- **iPad**: 화면 가운데에 iPhone 크기의 틀을 그리고 그 안에 띄운다.
  - 틀: iPhone 15(393×852pt), iPhone SE, iPhone 15 Pro Max 중에서 고른다. iPad를 눕히면 비율 그대로 줄인다.
  - 주소: 운영·미러 사이트, 또는 직접 적은 주소(예: PR 미리보기 배포).
  - 상태 표시줄·홈 표시줄 자리는 틀 안에서 그만큼 비워 둔다(페이지 배경색).
- **iPhone**: 틀 없이 화면 전체에 운영 사이트를 띄운다. 앱처럼 웹이 상태 표시줄 자리까지 그리고,
  페이지가 safe-area 여백으로 비켜 간다. 주소·틀을 바꾸는 도구 줄은 iPad에서만 보인다.

이 폴더는 pnpm 워크스페이스(`apps/*`, `packages/*`) 밖이라 npm으로 따로 설치한다. CI와 웹 빌드에는
들어가지 않는다. 실제 출시할 앱이 아니라 디자인 확인용이다 — 로컬 알림 같은 네이티브 기능과
앱에서만 달라지는 동작(인앱 브라우저, 기기 공유 창 등)은 여기서 볼 수 없다. 화면은 앱 빌드가 아니라
웹 사이트 그대로다.

## 준비 (처음 한 번)

1. iPad·iPhone: App Store에서 **Expo Go**를 설치하고, Expo 계정(무료)으로 로그인한다.
   Expo SDK 57부터는 PC와 기기에 **같은 계정**으로 로그인해야 열린다.
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

터미널에 뜬 QR 코드를 기기의 카메라 앱으로 찍고, 알림을 눌러 Expo Go에서 연다.

- PC와 기기가 **같은 Wi-Fi**여야 한다. 다른 망이면 `npx expo start --tunnel`.
- PC에 네트워크 어댑터가 여럿이면(VirtualBox, WSL 등) QR에 기기가 닿지 않는 주소가 들어갈 수 있다.
  QR 아래 `exp://` 주소가 PC의 Wi-Fi 주소가 아니면 그 주소를 지정해서 다시 띄운다:
  `REACT_NATIVE_PACKAGER_HOSTNAME=<PC의 Wi-Fi IP> npx expo start`
  (Wi-Fi IP는 PowerShell의 `ipconfig`에서 "무선 LAN 어댑터 Wi-Fi"의 IPv4 주소).
- 처음 띄울 때 Windows 방화벽이 Node.js의 네트워크 접근을 물으면 "개인 네트워크"를 허용한다.
  막으면 기기에서 "Could not connect to the server"가 뜬다.
- QR을 찍었는데 Safari가 열리면: 설정 › 앱 › Safari › "데스크탑 웹 사이트 요청"을 끈다.
- 로그인한 화면·데이터는 이 미리보기 안에만 저장된다(실제 사이트의 브라우저 데이터와 따로).
