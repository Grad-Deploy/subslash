/**
 * 가입 확인 링크의 유효 기간. 메일 문구, 서명 만료, 만료된 링크 안내 화면이 같은
 * 값을 쓴다. 서버 모듈(DB·crypto)과 떨어뜨려 두어 클라이언트 컴포넌트도 가져다 쓸 수 있다.
 */
export const VERIFY_ACCOUNT_TTL_DAYS = 3;
