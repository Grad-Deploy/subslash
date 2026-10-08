/**
 * 이름 뒤에 붙일 조사. 마지막 글자의 받침으로 고른다("웨이브예요"·"넷플릭스는"·"광고형 스탠다드로"). 한글이 아니면
 * 받침을 알 수 없어 둘을 함께 적는다("ChatGPT Plus은(는)"). 한국어 문구(`messages/ask`)가 쓴다.
 */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00;
  if (Number.isNaN(code) || code < 0 || code > 11171) return `${withFinal}(${withoutFinal})`;
  const final = code % 28;
  // '으로/로'는 ㄹ 받침 뒤에서도 '로'다.
  if (withoutFinal === "로" && final === 8) return "로";
  return final === 0 ? withoutFinal : withFinal;
}
