/**
 * 브라우저 저장소(localStorage)를 막혀 있어도 터지지 않게 읽고 쓴다. 사생활 보호 모드·사이트 데이터 차단·
 * 서버 렌더링에서는 접근만 해도 예외가 나므로, 기기 설정을 두는 곳마다 try/catch로 감싸던 것을 여기 모았다.
 * 읽지 못하면 없는 것으로, 쓰지 못하면 이번 화면에서만 그 값을 쓴다(부르는 쪽이 정한다).
 */

/** 저장된 값. 없거나 저장소를 쓸 수 없으면 null. */
export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 값을 남긴다. 남기지 못했으면 false. */
export function writeLocal(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** 값을 지운다. 지우지 못해도 조용히 넘어간다. */
export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
}
