/**
 * 주소에 싣는 웹 안전 base64(`-`·`_`, 끝의 `=` 없음). 영수증 공유 링크·Gmail 가져오기(`#` 뒤)·간편 로그인의 verifier가 쓴다.
 */

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  // 한 번에 펼치면 큰 배열에서 인자 수 한도를 넘는다.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 웹 안전 base64를 바이트로. 끝의 `=`는 있어도 없어도 된다(Apps Script는 붙인다). 모양이 틀리면 null. */
export function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(text)) return null;
  const base64 = text.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  try {
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}
