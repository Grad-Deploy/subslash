/**
 * SQLite WAL 파일(`*-wal`)의 커밋된 페이지를 본 DB 파일에 덮어쓴다.
 *
 * WAL 모드 DB는 최근 변경이 본 파일이 아니라 WAL 파일에 있다(체크포인트 전까지). 명령줄의 node:sqlite는 둘을 함께
 * 읽지만, 브라우저의 sql.js는 파일 하나만 받으므로 그대로 열면 최근 기록이 빠진다(Antigravity의 대화 요약은 표 자체가
 * 아직 WAL에만 있었다). SQLite 파일 형식 문서의 WAL 규격대로 읽는다:
 *
 * - 헤더 32바이트: magic(0x377f0682·0x377f0683 — 끝 비트가 체크섬의 바이트 순서), 버전, 페이지 크기, 체크포인트 순번,
 *   salt 두 개, 체크섬 두 개.
 * - 프레임마다 24바이트 머리(페이지 번호, 커밋이면 커밋 뒤 DB 페이지 수, salt 두 개, 체크섬 두 개) + 페이지.
 * - salt가 헤더와 같고 체크섬이 이어지는 프레임까지만 유효하고, 그중 **마지막 커밋 프레임까지**만 적용한다.
 *
 * 돌려주는 파일은 롤백 저널 모드로 표시한다(헤더 18·19바이트) — WAL 표시를 남기면 WAL 파일을 다시 찾는다.
 * WAL이 비었거나 형식이 맞지 않으면 본 파일을 그대로 돌려준다.
 */
export function applySqliteWal(db: Uint8Array, wal: Uint8Array | null | undefined): Uint8Array {
  if (!wal || wal.length < 32) return asRollbackJournal(db);
  const view = new DataView(wal.buffer, wal.byteOffset, wal.byteLength);
  const magic = view.getUint32(0);
  if (magic !== 0x377f0682 && magic !== 0x377f0683) return asRollbackJournal(db);
  const bigEndian = (magic & 1) === 1;
  const pageSize = view.getUint32(8);
  if (pageSize < 512 || pageSize > 65536 || (pageSize & (pageSize - 1)) !== 0) {
    return asRollbackJournal(db);
  }
  const salt1 = view.getUint32(16);
  const salt2 = view.getUint32(20);

  let [s0, s1] = checksum(wal, 0, 24, 0, 0, bigEndian);
  if (s0 !== view.getUint32(24) || s1 !== view.getUint32(28)) return asRollbackJournal(db);

  const frameSize = 24 + pageSize;
  const committed = new Map<number, number>(); // 페이지 번호 → 프레임 시작
  const pending = new Map<number, number>();
  let dbPages = 0;
  for (let offset = 32; offset + frameSize <= wal.length; offset += frameSize) {
    if (view.getUint32(offset + 8) !== salt1 || view.getUint32(offset + 12) !== salt2) break;
    [s0, s1] = checksum(wal, offset, 8, s0, s1, bigEndian);
    [s0, s1] = checksum(wal, offset + 24, pageSize, s0, s1, bigEndian);
    if (s0 !== view.getUint32(offset + 16) || s1 !== view.getUint32(offset + 20)) break;
    pending.set(view.getUint32(offset), offset + 24);
    const commitSize = view.getUint32(offset + 4);
    if (commitSize > 0) {
      for (const [page, start] of pending) committed.set(page, start);
      pending.clear();
      dbPages = commitSize;
    }
  }
  if (committed.size === 0) return asRollbackJournal(db);

  const out = new Uint8Array(dbPages * pageSize);
  out.set(db.subarray(0, Math.min(db.length, out.length)));
  for (const [page, start] of committed) {
    if (page >= 1 && page <= dbPages) {
      out.set(wal.subarray(start, start + pageSize), (page - 1) * pageSize);
    }
  }
  return asRollbackJournal(out);
}

/** DB 헤더의 쓰기·읽기 버전을 롤백 저널(1)로 바꾼 사본. WAL(2)로 남으면 WAL 파일을 찾는다. */
function asRollbackJournal(db: Uint8Array): Uint8Array {
  if (db.length < 100 || (db[18] !== 2 && db[19] !== 2)) return db;
  const copy = db.slice();
  copy[18] = 1;
  copy[19] = 1;
  return copy;
}

/** WAL 체크섬(32비트 단어 둘씩: s0 += x0 + s1; s1 += x1 + s0). */
function checksum(
  data: Uint8Array,
  start: number,
  length: number,
  s0: number,
  s1: number,
  bigEndian: boolean,
): [number, number] {
  const view = new DataView(data.buffer, data.byteOffset + start, length);
  for (let i = 0; i < length; i += 8) {
    s0 = (s0 + view.getUint32(i, !bigEndian) + s1) >>> 0;
    s1 = (s1 + view.getUint32(i + 4, !bigEndian) + s0) >>> 0;
  }
  return [s0, s1];
}
