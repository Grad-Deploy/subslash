"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import type { Subscription, UsageLog } from "@subslash/shared";
import { answerAsk, type AskAnswer } from "@lib/ask/answer";
import { askReport } from "@lib/ask/client";
import { localAskCall, refineCall } from "@lib/ask/local";
import { SUGGESTED_CALLS } from "@lib/ask/suggestions";
import type { AskCall, AskTurn } from "@lib/ask/tools";
import { Spinner } from "@components/ui/spinner";
import { cn } from "@lib/utils";
import { useKnownText, useLatestT, useLocale, useT } from "@lib/i18n";

/** 대화 한 턴. 답은 물은 때 이 기기의 기록으로 계산해 둔 것이다. */
interface ChatTurn {
  id: number;
  question: string;
  call?: AskCall;
  answer?: AskAnswer;
  error?: string;
  /** AI가 닫혀 있고 기기 규칙도 알아듣지 못한 질문. 서버로 보내지 않았다. */
  miss?: boolean;
}

/** 화면에 남기는 턴 수. 오래된 것부터 지운다(앞선 턴으로 보내는 것은 그중 최근 몇 개뿐이다). */
const MAX_TURNS = 20;

/**
 * '리포트에 물어보기'. 질문 문장만 서버(AI)로 가고, AI가 고른 도구를 이 기기의 기록으로 계산해 답한다(lib/ask).
 * 흔하고 뜻이 하나뿐인 질문은 기기의 규칙(lib/ask/local)으로 답해 서버로 보내지 않는다.
 * 대화처럼 이어 물을 수 있다 — 꼬리 질문("그럼 1년이면?")을 알아듣게 앞선 턴의 질문과 고른 호출을 함께 보내고
 * (`AskTurn`), 답과 숫자는 보내지 않는다. 대화는 이 화면에만 있고 저장하지 않는다.
 * 답 아래에 무엇으로 계산했는지를 적는다 — AI가 만든 숫자가 아니라는 것을 사용자가 볼 수 있게.
 *
 * AI가 닫혀 있으면(`aiOpen`이 false) 아무것도 서버로 보내지 않는다. 추천 질문 버튼은 정해 둔 호출
 * (`SUGGESTED_CALLS`)로, 직접 쓴 질문은 기기 규칙으로만 답하고, 규칙이 알아듣지 못하면 버튼을 다시 보여 준다.
 */
export function AskReport({
  subscriptions,
  usageLogs,
  rate,
  now,
  aiOpen,
}: {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  rate: number;
  now: Date;
  aiOpen: boolean;
}) {
  const t = useT();
  const known = useKnownText();
  const a = t.reportPage.ask;
  const tRef = useLatestT();
  const locale = useLocale();
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const nextId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns]);

  /** `preset`은 추천 질문 버튼의 호출이다 — 문장을 해석하지 않고 그대로 답한다. */
  const ask = async (text: string, preset?: AskCall) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const id = nextId.current++;
    // 답을 받은 턴만 앞선 턴이 된다. 실패한 질문은 AI가 무엇으로 읽었는지 모르므로 보내지 않는다.
    const history: AskTurn[] = turns.flatMap((turn) =>
      turn.call ? [{ question: turn.question, call: turn.call }] : [],
    );
    setBusy(true);
    setQuestion("");
    setTurns((prev) => [...prev, { id, question: trimmed }].slice(-MAX_TURNS));
    const settle = (patch: Partial<ChatTurn>) =>
      setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));
    try {
      // 뜻이 하나뿐인 흔한 질문은 기기의 규칙으로 고르고 서버로 보내지 않는다. 기간은 오늘을 아는 기기가 다시 맞춘다.
      const local =
        preset ?? localAskCall(trimmed, { now, subscriptions, hasHistory: history.length > 0 });
      if (!local && !aiOpen) {
        settle({ miss: true });
        return;
      }
      const call = preset ?? refineCall(local ?? (await askReport(trimmed, history)), trimmed, now);
      settle({
        call,
        answer: answerAsk(call, {
          subscriptions,
          usageLogs,
          rate,
          now,
          t: tRef.current,
          locale,
          asked: preset ? undefined : [trimmed, ...history.map((turn) => turn.question)],
        }),
      });
    } catch (e) {
      settle({ error: e instanceof Error ? e.message : tRef.current.reportPage.ask.unavailable });
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-bold">
          <Sparkles className="size-4" aria-hidden />
          {a.title}
        </h2>
        {turns.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setTurns([])}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {a.newChat}
          </button>
        )}
      </div>

      {turns.length === 0 && (
        <Suggestions disabled={busy} onPick={(text, preset) => void ask(text, preset)} />
      )}

      {turns.length > 0 && (
        <ol aria-live="polite" className="space-y-3">
          {turns.map((turn) => (
            <li key={turn.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-3 py-2 text-sm text-background [overflow-wrap:anywhere]">
                <span className="sr-only">{a.youAsked}: </span>
                {turn.question}
              </p>
              <div
                className={cn(
                  "max-w-[92%] space-y-2 rounded-2xl rounded-bl-sm bg-muted/40 p-3 text-sm",
                  !turn.answer && !turn.error && !turn.miss && "w-fit",
                )}
              >
                {!turn.answer && !turn.error && !turn.miss && <Spinner className="size-5" />}
                {turn.miss && (
                  <>
                    <p>{a.localMiss}</p>
                    <Suggestions
                      disabled={busy}
                      onPick={(text, preset) => void ask(text, preset)}
                    />
                  </>
                )}
                {turn.error && <p className="text-destructive">{known(turn.error)}</p>}
                {turn.answer && <AnswerBody answer={turn.answer} question={turn.question} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      <div ref={endRef} />

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={200}
          placeholder={aiOpen && turns.length > 0 ? a.followupPlaceholder : a.placeholder}
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
      <p className="text-[11px] text-muted-foreground">{aiOpen ? a.privacy : a.privacyLocal}</p>
      {aiOpen && turns.length > 0 && (
        <p className="text-[11px] text-muted-foreground">{a.contextNote}</p>
      )}
    </section>
  );
}

/** 추천 질문 버튼. 누르면 버튼 문장과 그 뜻의 호출(`SUGGESTED_CALLS`)로 묻는다. */
function Suggestions({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (text: string, preset: AskCall) => void;
}) {
  const suggestions = useT().ask.suggestions;
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((text, i) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onPick(text, SUGGESTED_CALLS[i])}
          className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function AnswerBody({ answer, question }: { answer: AskAnswer; question: string }) {
  const a = useT().reportPage.ask;
  return (
    <>
      <p className="font-bold leading-relaxed">{answer.headline}</p>
      {answer.rows.length > 0 && (
        <dl className="divide-y rounded-lg border bg-card text-xs">
          {answer.rows.map((row) => (
            // 한 줄에 들어가지 않으면 값이 다음 줄 오른쪽으로 내려간다. 값을 줄이지 않던 때는 값이 긴 줄(겹치는
            // 구독의 서비스 목록)에서 이름 칸이 눌려 "OTT"가 "OT / T"로 끊겼다.
            <div key={row.label} className="flex flex-wrap justify-between gap-x-3 px-3 py-2">
              <dt className="min-w-0 [overflow-wrap:anywhere]">{row.label}</dt>
              <dd className="ml-auto min-w-0 text-right font-semibold tabular-nums [overflow-wrap:anywhere]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {answer.notes.map((note) => (
        <p key={note} className="text-xs text-muted-foreground">
          {note}
        </p>
      ))}
      {answer.goHelp && (
        <Link
          href={`/help?q=${encodeURIComponent(question)}`}
          className="inline-block text-xs font-bold underline underline-offset-2"
        >
          {a.goHelp}
        </Link>
      )}
      <p className="text-[11px] text-muted-foreground">{a.source(answer.source)}</p>
    </>
  );
}
