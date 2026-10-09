"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import type { Faq } from "@lib/help/faq";
import { isConfident, searchFaqs } from "@lib/help/match";
import { askHelp } from "@lib/help/client";
import { Spinner } from "@components/ui/spinner";
import { useKnownText, useLatestT, useT } from "@lib/i18n";

/**
 * 도움말 검색. 적는 대로 기기에서 비슷한 질문을 찾아 보여 주고(AI 없음), 찾지 못했을 때만 AI에게 고르게 한다(lib/help/ai).
 * AI가 고른 것도 도움말의 답을 그대로 보여 준다 — 도움말에 없는 답은 '없다'고 하고 문의로 보낸다.
 * 리포트의 '리포트에 물어보기'가 사용법 질문을 받으면 `/help?q=…`로 넘어와 그 질문으로 시작한다.
 */
export function HelpSearch({ faqs, aiOpen }: { faqs: Faq[]; aiOpen: boolean }) {
  // 리포트에서 넘어온 질문(`?q=`)으로 시작한다. 부르는 쪽이 Suspense로 감싼다(정적 내보내기).
  const h = useT().helpPage.search;
  const known = useKnownText();
  const tRef = useLatestT();
  const initial = useSearchParams().get("q")?.slice(0, 200) ?? "";
  const [question, setQuestion] = useState(initial);
  const [aiIds, setAiIds] = useState<string[] | null>(null);
  const [aiFor, setAiFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hits = useMemo(() => searchFaqs(question, faqs), [question, faqs]);
  const confident = isConfident(hits);
  const byId = useMemo(() => new Map(faqs.map((faq) => [faq.id, faq])), [faqs]);
  const trimmed = question.trim();
  const aiAnswers =
    aiFor === trimmed && aiIds
      ? aiIds.map((id) => byId.get(id)).filter((f): f is Faq => !!f)
      : null;

  const ask = async () => {
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      setAiIds(await askHelp(trimmed));
      setAiFor(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.helpPage.search.unavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={h.label} className="space-y-3">
      <label className="flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-3 focus-within:ring-1 focus-within:ring-ring">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={200}
          placeholder={h.placeholder}
          aria-label={h.label}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      {trimmed && (
        <div className="space-y-2" role="status" aria-live="polite">
          {aiAnswers ? (
            <FaqAnswers
              label={aiAnswers.length > 0 ? h.aiFound : h.aiNone}
              icon
              faqs={aiAnswers}
              empty={h.aiEmpty}
            />
          ) : hits.length > 0 ? (
            <FaqAnswers
              label={confident ? h.closest : h.similar}
              // 자신 있으면 그 하나만 보여 준다 — 아래에 붙는 항목은 관계없는 경우가 많았다.
              faqs={(confident ? hits.slice(0, 1) : hits).map((hit) => hit.faq)}
            />
          ) : (
            <p className="px-1 text-sm text-muted-foreground">{h.noMatch}</p>
          )}

          {aiOpen && !aiAnswers && (
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => void ask()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
              >
                {busy ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Sparkles className="size-3.5" aria-hidden />
                )}
                {confident ? h.askAiNotThis : h.askAi}
              </button>
            </div>
          )}
          {error && <p className="px-1 text-xs text-destructive">{known(error)}</p>}
          {aiOpen && <p className="px-1 text-[11px] text-muted-foreground">{h.aiPrivacy}</p>}
        </div>
      )}
    </section>
  );
}

function FaqAnswers({
  label,
  faqs,
  empty,
  icon,
}: {
  label: string;
  faqs: Faq[];
  empty?: string;
  icon?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-3.5">
      <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
        {icon && <Sparkles className="size-3.5" aria-hidden />}
        {label}
      </p>
      {faqs.length === 0 && empty && <p className="text-sm">{empty}</p>}
      {faqs.map((faq, index) => (
        <details key={faq.id} open={index === 0} className="group">
          <summary className="cursor-pointer list-none text-sm font-bold [&::-webkit-details-marker]:hidden">
            {faq.q}
          </summary>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
