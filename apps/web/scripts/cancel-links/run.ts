/**
 * 해지 링크 점검 실행기. `pnpm --filter @subslash/web check:cancel-links`
 *
 * 보고서는 REPORT_PATH가 있으면 그 파일에, 없으면 표준 출력에 쓴다. 진행
 * 상황은 표준 오류로 보낸다. GitHub Actions에서는 확인 필요 건수를
 * `needs_review` 출력으로 남겨, 워크플로가 이슈를 열지 정하게 한다.
 *
 * 링크가 깨져 있어도 실패로 끝내지 않는다. 결과는 보고서가 전하고, 실패는
 * 점검 자체가 돌지 못했을 때만이다.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { NEEDS_REVIEW, checkCancelLinks, collectCancelLinks, renderReport } from "./check";

async function main() {
  const links = collectCancelLinks();
  console.error(`해지 링크 ${links.length}개를 확인합니다.`);

  const results = await checkCancelLinks(links, {
    onResult: (result) => console.error(`  ${result.verdict.padEnd(11)} ${result.link.url}`),
  });
  const report = renderReport(results, new Date());

  const reportPath = process.env.REPORT_PATH;
  if (reportPath) writeFileSync(reportPath, report);
  else process.stdout.write(report);

  const needsReview = results.filter((result) => NEEDS_REVIEW.has(result.verdict)).length;
  console.error(`확인 필요 ${needsReview}개.`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `needs_review=${needsReview}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
