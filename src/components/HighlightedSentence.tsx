import type { ReactNode } from "react";

const TONE = {
  error:
    "rounded bg-rose-100 px-0.5 text-rose-900 underline decoration-rose-500 decoration-wavy underline-offset-4 dark:bg-rose-950 dark:text-rose-200",
  fix: "rounded bg-emerald-100 px-0.5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

/** Highlights each fragment's first non-overlapping occurrence, scanning left to right. */
export function HighlightedSentence({
  text,
  fragments,
  tone,
}: {
  text: string;
  fragments: { text: string; title?: string }[];
  tone: keyof typeof TONE;
}) {
  const ranges: { start: number; end: number; title?: string }[] = [];
  let from = 0;
  for (const f of fragments) {
    if (!f.text) continue;
    let idx = text.indexOf(f.text, from);
    if (idx < 0) idx = text.indexOf(f.text);
    if (idx < 0) continue;
    const end = idx + f.text.length;
    if (ranges.some((r) => idx < r.end && end > r.start)) continue;
    ranges.push({ start: idx, end, title: f.title });
    from = end;
  }
  ranges.sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r, i) => {
    if (r.start > pos) parts.push(text.slice(pos, r.start));
    parts.push(
      <mark key={i} title={r.title} className={TONE[tone]}>
        {text.slice(r.start, r.end)}
      </mark>,
    );
    pos = r.end;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}
