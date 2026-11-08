# 구글·카카오·네이버로 로그인

> CLAUDE.md에서 옮겨 온 설명서다(내용은 바꾸지 않았다). 본문의 '위'·'아래'·'작업 절차' 같은 말은 CLAUDE.md의 절을 가리킨다.

**언제 읽나:** `lib/oauth`, `lib/oauth-accounts`, `/api/auth/oauth/*`, 카카오톡 로그인을 고칠 때.

`lib/oauth`(제공자 설정·프로필 읽기), `lib/oauth-accounts`(계정 찾기·만들기, 앱 넘겨받기), 경로는
`/api/auth/oauth/[provider]/start|callback`, `/api/auth/oauth/claim`, `/api/auth/oauth/providers`. 제공자
키(`GOOGLE_|KAKAO_|NAVER_OAUTH_CLIENT_ID/SECRET`)가 있는 것만 버튼이 뜨고, `SOCIAL_LOGIN_STARTS_ON`
(`lib/privacy.ts`)을 정해야 열린다. **열기 전에 두 배포 DB에 `drizzle/0014_social_login.sql`을 적용한다.**

- 받는 것은 이메일과 회원 번호뿐이고, 회원 번호는 제공자 이름을 섞은 해시(`account_identities`)로만 둔다.
  제공자 토큰은 저장하지 않는다.
- 같은 이메일의 계정이 이미 있으면 **잇지 않고** 거절한다(`email-taken`). 제공자가 확인하지 않은 주소로 남의
  계정에 들어가는 길이 된다. 제공자가 확인했다고 밝힌 이메일만 확인된 것으로 두고(네이버는 밝히지 않는다),
  아니면 가입처럼 확인 메일을 보낸다.
- 여러 방법으로 로그인하려면 처음 가입한 방법으로 로그인한 뒤 '내 정보 → 로그인 방법'(`LoginMethodsSection`,
  `/api/auth/oauth/link`)에서 잇는다(`linkOAuthIdentity`) — 계정이 하나로 남아 기록을 합칠 일이 없다. 앱은 인앱
  브라우저라 세션이 없으므로 시작 주소에 세션 대신 10분짜리 서명 코드(`oauth-link`, 제공자·연결 지문 포함)를 싣고,
  웹은 그 코드의 계정과 브라우저에 로그인한 계정이 같아야 시작한다. 다른 계정에 이어진 제공자 계정, 같은 회사의 두
  번째 계정은 잇지 않고, 로그인할 방법이 하나뿐이면 끊지 않는다. `email-taken`은 제공자가 이메일을 확인했을 때만 그
  계정의 로그인 방법(`oauthVia`)을 실어 "구글로 로그인한 뒤 카카오를 연결하세요"라고 말한다 — 예전 문구 "아이디와
  비밀번호로 로그인"은 비밀번호 없는 간편 가입 계정이 따를 수 없었다.
- 새 계정은 만 14세 확인(가입 화면의 체크)이 있어야 만들고, 비밀번호가 없다(`NO_PASSWORD`, 어떤 비밀번호와도
  맞지 않음). 비밀번호는 재설정 메일로 만든다. 탈퇴는 비밀번호 대신 '탈퇴'를 입력받는다.
- 안드로이드 앱의 카카오는 인앱 브라우저 대신 카카오톡으로 로그인한다(`KakaoLoginPlugin` → `lib/kakao-native` →
  `/api/auth/oauth/native`). 앱이 받은 액세스 토큰은 서버가 토큰 정보의 앱 ID(`KAKAO_APP_ID`)로 우리 앱이 발급한
  것인지 확인한 뒤 웹 로그인과 같은 `resolveOAuthAccount`·`linkOAuthIdentity`로 처리한다 — 확인하지 않으면 사용자가
  로그인한 아무 카카오 앱의 토큰으로 들어올 수 있다. `KAKAO_APP_ID`가 없거나 예전 앱이면 인앱 브라우저로 한다.
  네이티브 앱 키는 APK에 들어가는 공개 값이라 `apps/mobile/android/gradle.properties`에 두고, 카카오 콘솔의
  안드로이드 플랫폼에 패키지와 서명 키마다의 키 해시를 등록해야 동작한다. 콘솔은 키 하나에 패키지명을 하나만
  받아, 테스트용 앱(`.dev`)은 따로 만든 키(`KAKAO_NATIVE_APP_KEY_DEV`, 디버그 키 해시만 등록)를 쓴다. 스토어 키에는
  Play 앱 서명 키(현재·이전)·업로드 키·디버그 키의 해시가 있다 — 서명 키를 바꾸면 새 해시를 더한다.
- 앱은 인앱 브라우저에서 로그인하므로 쿠키를 주지 않는다. 앱이 만든 verifier의 해시(challenge)만 주소에
  싣고, 서버는 challenge에 계정을 적어 두었다가(`oauth_app_claims`, 10분·1회) 앱 출처가 verifier를 내밀 때
  세션을 준다. 계정을 지우는 경로는 `deleteOAuthData`를 부른다.
