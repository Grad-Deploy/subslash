import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "crypto";

/**
 * 비밀번호 저장.
 *
 * 비밀번호는 되돌릴 수 있는 암호문이 아니라 단방향 해시로 저장한다. 복호화
 * 할 수 있게 두면 DB와 키가 함께 새는 순간 전부 평문이 되고, 그 전까지도
 * 서버가 사용자의 비밀번호를 알 수 있게 된다. 우리는 알 필요가 없고,
 * 알아서도 안 된다.
 *
 * scrypt를 쓰는 이유는 SHA-256 같은 범용 해시와 달리 메모리를 많이 쓰도록
 * 설계돼, GPU를 동원한 대량 추측이 비싸지기 때문이다. 사용자마다 다른 솔트를
 * 붙여 같은 비밀번호라도 다른 결과가 나오게 하고, 레인보우 테이블을 무력화한다.
 *
 * 저장 형식은 `scrypt$N$r$p$솔트$해시`다. 파라미터를 값 안에 함께 적어두면
 * 나중에 비용을 올려도 기존 계정이 그대로 로그인된다.
 */

/** OWASP 권고(N=2^17, r=8, p=1) 기준. 올릴 수는 있어도 내리지는 말 것. */
const SCRYPT_N = 1 << 17;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** N이 클수록 메모리를 많이 쓴다. 기본 상한(32MB)으로는 부족해 넉넉히 잡는다. */
const MAX_MEMORY = 256 * 1024 * 1024;

// promisify는 옵션을 받지 않는 오버로드로 잡혀서, 직접 감싼다.
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  // 유니코드 표기가 달라도(조합형/완성형) 같은 비밀번호로 보이게 정규화한다.
  return scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: n,
    r,
    p,
    maxmem: MAX_MEMORY,
  });
}

/** 저장할 해시 문자열을 만든다. 같은 비밀번호라도 매번 다른 값이 나온다. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

/**
 * 입력한 비밀번호가 저장된 해시와 맞는지 확인한다.
 *
 * 비교는 `timingSafeEqual`로 한다. 일반 비교는 앞에서부터 다르면 바로
 * 멈춰서, 응답 시간 차이만으로 해시를 한 바이트씩 알아낼 여지를 준다.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // 저장된 값이 조작돼 터무니없는 파라미터가 들어오면 계산 자체가 공격이 된다.
  if (n < 2 || n > 1 << 20 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let derived: Buffer;
  try {
    derived = await derive(password, salt, n, r, p);
  } catch {
    return false;
  }

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/**
 * 저장된 해시가 지금 기준보다 약한지 알려준다.
 *
 * 비용을 올린 뒤에는 로그인에 성공한 순간이 다시 해시할 유일한 기회다.
 * 그때만 평문을 손에 쥐고 있기 때문이다.
 */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return true;
  return Number(parts[1]) < SCRYPT_N || Number(parts[2]) < SCRYPT_R || Number(parts[3]) < SCRYPT_P;
}
