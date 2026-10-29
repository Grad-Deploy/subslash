/**
 * 브라우저에서 바이트를 글자로 옮긴다(Buffer가 없는 곳). 서버 코드는 Buffer의 `toString("base64url" | "hex")`를 쓴다.
 */

/** base64url(패딩 없음). 큰 배열도 인자 수 한도에 걸리지 않게 나눠 옮긴다. */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** base64url을 바이트로. 알파벳 밖의 글자가 있거나 풀 수 없으면 null. */
export function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** 소문자 16진수. */
export function toHex(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
