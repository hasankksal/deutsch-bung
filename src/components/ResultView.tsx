"use client";

import type { ReactNode } from "react";
import { alignForDisplay } from "@/lib/local-grader";
import { CATEGORY_LABELS, type Exercise, type GradeError, type GradeResult, type RuleInfo, type VocabItem } from "@/lib/types";
import { Icon } from "./icons";
import { Chip, cn, LABEL, SpeakButton, StarButton } from "./ui";

const VERDICT = {
  correct: {
    title: "Doğru!",
    text: "text-green-pencil",
    badge: "bg-wash-green text-green-pencil [--line:var(--color-green-pencil)]",
    icon: "check",
  },
  almost: {
    title: "Neredeyse doğru",
    text: "text-[#9a6418]",
    badge: "bg-marker-soft text-ink [--line:#b7791f]",
    icon: "info",
  },
  incorrect: {
    title: "Burada hata var",
    text: "text-red-pencil",
    badge: "bg-wash-red text-red-pencil [--line:var(--color-red-pencil)]",
    icon: "x",
  },
} as const;

const SOURCE_LABEL: Record<GradeResult["source"], string> = {
  exact: "Hazır çevirilerle karşılaştırıldı",
  local: "Kural bankasıyla değerlendirildi",
};

export function VocabList({
  vocab,
  starred,
  onToggle,
}: {
  vocab: VocabItem[];
  starred: Set<string>;
  onToggle: (v: VocabItem) => void;
}) {
  if (!vocab.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {vocab.map((v) => (
        <li
          key={v.de}
          className="sketch sketch-thin sketch-once inline-flex items-center gap-1 bg-sheet py-0.5 pr-0.5 pl-3 text-sm"
        >
          <span lang="de" className="font-semibold">
            {v.de}
          </span>
          <span className="text-graphite">— {v.tr}</span>
          <StarButton
            active={starred.has(v.de)}
            onToggle={() => onToggle(v)}
            label={starred.has(v.de) ? "Yıldızı kaldır" : "Kelimeyi yıldızla"}
          />
        </li>
      ))}
    </ul>
  );
}

/** The learner's sentence with wrong words struck through and the right ones inserted next to them. */
function InlineDiff({ answer, target, spoken }: { answer: string; target: string; spoken: boolean }) {
  const ops = alignForDisplay(answer, target, spoken);
  const parts: ReactNode[] = [];
  ops.forEach((op, i) => {
    const punct = !/[\p{L}\p{N}]/u.test(op.text);
    if (punct && op.type !== "same") return;
    const space = i > 0 && !punct ? " " : "";
    if (op.type === "same") {
      parts.push(
        <span key={i}>
          {space}
          {op.text}
        </span>,
      );
    } else if (op.type === "del") {
      parts.push(
        <span key={i}>
          {space}
          <del className="rounded-sm bg-wash-red px-1 text-red-pencil decoration-red-pencil decoration-2">
            {op.text}
          </del>
        </span>,
      );
    } else {
      parts.push(
        <span key={i}>
          {space}
          <ins className="marker px-1 font-bold text-green-pencil no-underline">
            {op.text}
          </ins>
        </span>,
      );
    }
  });
  return <>{parts}</>;
}

interface RuleGroup {
  rule: RuleInfo | null;
  tip: string | null;
  errors: GradeError[];
}

function groupByRule(errors: GradeError[]): RuleGroup[] {
  const groups: RuleGroup[] = [];
  for (const e of errors) {
    const key = e.rule?.title ?? "";
    let g = groups.find((x) => (x.rule?.title ?? "") === key);
    if (!g) {
      g = { rule: e.rule ?? null, tip: null, errors: [] };
      groups.push(g);
    }
    g.errors.push(e);
    g.tip ??= e.turkishTip;
  }
  return groups;
}

function RuleCard({ group }: { group: RuleGroup }) {
  const { rule, tip, errors } = group;
  return (
    <div className="sketch sketch-thin margin-note bg-sheet py-4 pr-4">
      {rule && (
        <p className="hand-bold flex items-center gap-2">
          <Icon name="book" className="size-4 text-red-pencil" />
          {rule.title}
        </p>
      )}
      <ul className={cn("space-y-3", rule && "mt-3")}>
        {errors.map((e, i) => (
          <li key={i}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Chip tone="danger">{CATEGORY_LABELS[e.category]}</Chip>
              {e.wrong && e.category !== "kelime_sirasi" && e.category !== "anlam" && (
                <span lang="de" className="text-red-pencil line-through decoration-red-pencil decoration-2">
                  {e.wrong}
                </span>
              )}
              {e.wrong && e.fix && e.category !== "kelime_sirasi" && e.category !== "anlam" && (
                <Icon name="arrowRight" className="size-3.5 text-pencil" />
              )}
              {e.fix && e.category !== "kelime_sirasi" && e.category !== "anlam" && (
                <span lang="de" className="marker px-1 font-bold text-green-pencil">
                  {e.fix}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{e.explanation}</p>
          </li>
        ))}
      </ul>
      {rule && (
        <div className="mt-4 border-t border-dashed border-ink/25 pt-3">
          <p className={LABEL}>Bu kalıpta</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{rule.pattern}</p>
          {rule.examples.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {rule.examples.slice(0, 3).map((x) => (
                <li key={x} lang="de" className="flex items-center gap-1 text-sm text-graphite">
                  <span className="text-red-pencil">✎</span>
                  <span>{x}</span>
                  <SpeakButton text={x} className="size-7" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tip && (
        <p className="tape-note mt-5 mr-2 px-4 pt-4 pb-3 text-sm leading-relaxed text-ink">
          <span className="hand-bold">Türkçe ipucu: </span>
          {tip}
        </p>
      )}
    </div>
  );
}

export function ResultView({
  exercise,
  answer,
  result,
  starredWords,
  onToggleWord,
}: {
  exercise: Exercise;
  answer: string;
  result: GradeResult;
  starredWords: Set<string>;
  onToggleWord: (v: VocabItem) => void;
}) {
  const v = VERDICT[result.verdict];
  const isCorrect = result.verdict === "correct";
  const notes = result.notes ?? [];
  const fallbackRule: RuleInfo | null = exercise.hint
    ? { title: "Bu cümlenin kuralı", pattern: exercise.hint, examples: [] }
    : null;
  const groups = groupByRule(result.errors.map((e) => ({ ...e, rule: e.rule ?? fallbackRule })));
  const showNatural =
    result.natural &&
    result.natural.replace(/[.!?]$/, "") !== result.corrected.replace(/[.!?]$/, "") &&
    result.natural !== answer.trim();

  return (
    <section
      aria-live="polite"
      className="sketch mt-5 animate-rise bg-sheet"
    >
      <div className="flex items-start gap-3 px-5 pt-5 sm:px-6">
        <span className={cn("sketch sketch-round mt-0.5 inline-flex size-9 shrink-0 animate-pop items-center justify-center", v.badge)}>
          <Icon name={v.icon} className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <p className={cn("hand-bold wobble-text text-2xl", v.text)}>{v.title}</p>
          <p className="mt-0.5 text-sm text-graphite">{result.summary}</p>
        </div>
      </div>

      <div className="space-y-5 px-5 pt-4 pb-5 sm:px-6">
        {isCorrect ? (
          <div>
            <p className={LABEL}>Senin cevabın</p>
            <p lang="de" className="mt-1 flex items-start gap-1 text-lg leading-relaxed">
              <span className="min-w-0">{answer.trim()}</span>
              <SpeakButton text={result.corrected || answer} />
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className={LABEL}>Hatan burada</p>
              <p lang="de" className="mt-1 text-lg leading-loose">
                <InlineDiff answer={answer} target={result.corrected} spoken={exercise.level === "GK"} />
              </p>
            </div>
            <div>
              <p className={LABEL}>Doğru cümle</p>
              <p lang="de" className="hand-bold mt-1 flex items-start gap-1 text-lg leading-relaxed">
                <span className="min-w-0">{result.corrected}</span>
                <SpeakButton text={result.corrected} />
              </p>
            </div>
          </>
        )}

        {groups.length > 0 && (
          <div className="space-y-2">
            <p className={LABEL}>Neden?</p>
            {groups.map((g, i) => (
              <RuleCard key={i} group={g} />
            ))}
          </div>
        )}

        {showNatural && (
          <div>
            <p className={LABEL}>{isCorrect ? "Şöyle de söylenebilir" : "Daha doğal söyleyiş"}</p>
            <p lang="de" className="mt-1 flex items-start gap-1 leading-relaxed">
              <span className="min-w-0">{result.natural}</span>
              <SpeakButton text={result.natural} />
            </p>
          </div>
        )}

        {notes.length > 0 && (
          <div className="sketch sketch-thin sketch-once bg-paper/50 px-3 py-2">
            <p className="font-note text-lg text-red-pencil">Küçük notlar (hata saymadım)</p>
            <ul className="mt-1 space-y-1 text-sm text-graphite">
              {notes.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}

        {isCorrect && result.praise && (
          <p className="flex items-start gap-2 text-sm text-green-pencil">
            <Icon name="check" className="mt-0.5 size-4 shrink-0" />
            {result.praise}
          </p>
        )}

        {exercise.vocab.length > 0 && (
          <div>
            <p className={cn(LABEL, "mb-2")}>Kelimeler · yıldızla, sonra Defterim&apos;de tekrar et</p>
            <VocabList vocab={exercise.vocab} starred={starredWords} onToggle={onToggleWord} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-ink/25 px-5 py-2.5 font-note text-base text-graphite sm:px-6">
        <span>{SOURCE_LABEL[result.source]}</span>
      </div>
    </section>
  );
}
