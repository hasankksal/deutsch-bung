"use client";

import { memo } from "react";
import { isTypable, type Segment } from "@/lib/dictation/cloze";
import { cn } from "../ui";

export type WrongKey = { at: number; ch: string; n: number } | null;

export const NO_HINTS: ReadonlySet<number> = new Set();

/** Letters of the blanks in order (what has to be typed), and where each blank word ends. */
export function slotsOf(segments: Segment[]): { slots: string[]; wordEnds: number[] } {
  const slots: string[] = [];
  const wordEnds: number[] = [];
  for (const seg of segments) {
    if (seg.kind !== "word" || !seg.blank) continue;
    for (const ch of seg.text) if (isTypable(ch)) slots.push(ch);
    wordEnds.push(slots.length);
  }
  return { slots, wordEnds };
}

/**
 * A line with its blanks: typed letters in green, hints in grey, letters that were missed in red,
 * and the cursor as a marker stroke.
 */
export const ClozeLine = memo(function ClozeLine({
  segments,
  typed,
  hinted = NO_HINTS,
  wrong = null,
  cursor = false,
  missedFrom = null,
  className,
}: {
  segments: Segment[];
  typed: number;
  hinted?: ReadonlySet<number>;
  wrong?: WrongKey;
  /** Show the cursor on the next letter */
  cursor?: boolean;
  /** Letters from here on were not typed in time and are shown in red */
  missedFrom?: number | null;
  className?: string;
}) {
  let k = 0;
  return (
    <p lang="de" className={cn("whitespace-pre-wrap", className)}>
      {segments.map((seg, si) => {
        if (seg.kind === "text" || !seg.blank) return <span key={si}>{seg.text}</span>;
        return (
          <span key={si} className="inline-flex whitespace-nowrap">
            {Array.from(seg.text).map((ch, ci) => {
              if (!isTypable(ch)) return <span key={ci}>{ch}</span>;
              const idx = k++;
              const filled = idx < typed;
              const missed = !filled && missedFrom !== null && idx >= missedFrom;
              const here = cursor && idx === typed;
              return (
                <span
                  key={ci}
                  className={cn(
                    "relative inline-block min-w-[0.62em] text-center",
                    !filled && !missed && "border-b-2 border-pencil/70",
                    here && "border-ink bg-marker-soft",
                    filled && (hinted.has(idx) ? "text-pencil" : "text-green-pencil"),
                    missed && "text-red-pencil",
                  )}
                >
                  {filled || missed ? (
                    ch
                  ) : here && wrong && wrong.at === idx ? (
                    <span key={wrong.n} className="inline-block animate-shake text-red-pencil">
                      {wrong.ch}
                    </span>
                  ) : (
                    " "
                  )}
                </span>
              );
            })}
          </span>
        );
      })}
    </p>
  );
});
