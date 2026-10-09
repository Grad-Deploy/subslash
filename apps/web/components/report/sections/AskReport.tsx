"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles } from "lucide-react";
import type { Subscription, UsageLog } from "@subslash/shared";
import { answerAsk, type AskAnswer } from "@lib/ask/answer";
import { askReport } from "@lib/ask/client";
import { Spinner } from "@components/ui/spinner";
import { cn } from "@lib/utils";
import { useKnownText, useLatestT, useLocale, useT } from "@lib/i18n";

/**
 * '리포트에 물어보기'. 질문 문장만 서버(AI)로 가고, AI가 고른 도구를 이 기기의 기록으로 계산해 답한다(lib/ask).
 * 답 아래에 무엇으로 계산했는지를 적는다 — AI가 만든 숫자가 아니라는 것을 사용자가 볼 수 있게.
 */
export function AskReport({
  subscriptions,
  usageLogs,
  rate,
  now,
}: {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  rate: number;
  now: Date;
}) {
  const t = useT();
  const known = useKnownText();
  const a = t.reportPage.ask;
  const tRef = useLatestT();
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [result, setResult] = useState<AskAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    setAsked(trimmed);
    setResult(null);
    try {
      const call = await askReport(trimmed);
      setResult(answerAsk(call, { subscriptions, usageLogs, rate, now, t: tRef.current, locale }));
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.reportPage.ask.unavailable);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <section aria-label={a.label} className="space-y-3 rounded-2xl border p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-bold">
        <Sparkles className="size-4" aria-hidden />
        {a.title}
      </h2>

      <div className="flex flex-wrap gap-1.5">
        {t.ask.suggestions.map((text) => (
          <button
            key={text}
            type="button"
            disabled={busy}
            onClick={() => void ask(text)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              asked === text
                ? "border-foreground bg-foreground text-background"
                : "bg-card hover:bg-muted",
            )}
          >
            {text}
          </button>
        ))}
      </div>

      {(busy || result || error) && (
        <div
          role="status"
          aria-live="polite"
          className="space-y-2 rounded-xl bg-muted/40 p-3 text-sm"
        >
          {asked && <p className="text-xs text-muted-foreground">{asked}</p>}
          {busy && <Spinner className="size-5" />}
          {error && <p className="text-destructive">{known(error)}</p>}
          {result && (
            <>
              <p className="font-bold leading-relaxed">{result.headline}</p>
              {result.rows.length > 0 && (
                <dl className="divide-y rounded-lg border bg-card text-xs">
                  {result.rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 px-3 py-2">
                      <dt className="min-w-0 [overflow-wrap:anywhere]">{row.label}</dt>
                      <dd className="shrink-0 font-semibold tabular-nums">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {result.notes.map((note) => (
                <p key={note} className="text-xs text-muted-foreground">
                  {note}
                </p>
              ))}
              {result.goHelp && (
                <Link
                  href={`/help?q=${encodeURIComponent(asked ?? "")}`}
                  className="inline-block text-xs font-bold underline underline-offset-2"
                >
                  {a.goHelp}
                </Link>
              )}
              <p className="text-[11px] text-muted-foreground">{a.source(result.source)}</p>
            </>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={200}
          placeholder={a.placeholder}
          aria-label={a.inputLabel}
          className="min-w-0 flex-1 rounded-xl border bg-card px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          aria-label={a.send}
          className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
      </form>
      <p className="text-[11px] text-muted-foreground">{a.privacy}</p>
    </section>
  );
}
