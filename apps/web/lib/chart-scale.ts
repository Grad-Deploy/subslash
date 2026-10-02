/**
 * 차트 눈금 맨 위를 1·2·2.5·5 단위의 깔끔한 수로 올린다(예: 37,400 → 50,000). 웹과 앱의 해지 방어
 * 그래프가 같은 함수를 따로 들고 있던 것을 모았다.
 */
export function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const base = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}
