import { useT } from "@lib/i18n";

/**
 * 붙여 넣는 스크립트 안내의 첫 단계 — 'script.new에서 새 Apps Script 프로젝트를 만든다'. `/import`와 자동 가져오기
 * 설정이 같은 단계를 보여 주므로 한 곳에 둔다(한쪽만 앞말 `step1Before`를 빠뜨린 적이 있다).
 */
export function ScriptNewStep() {
  const p = useT().importing.page;
  return (
    <li>
      {/* 영어 "Create a "처럼 링크 앞에 오는 말. 한국어는 비어 있다. */}
      {p.step1Before}
      <a
        href="https://script.new"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2"
      >
        {p.step1Link}
      </a>
      {p.step1After}
    </li>
  );
}
