import { acceptsChar, isTypable } from "./cloze";

// Live mode: the song or scene keeps playing and the learner fills the blanks of the line being
// sung. "bekle" pauses at the end of a line until it is done; "akis" never stops and counts what
// was not typed in time as missed.

export type LiveMode = "bekle" | "akis";

export interface TimedLine {
  start: number;
  end: number;
}

export interface LineResult {
  typed: number;
  hinted: number[];
  /** Letters from here on were not typed (null when the line was finished) */
  missedFrom: number | null;
}

export interface LiveState {
  /** Line being typed; equals the line count once everything is done */
  line: number;
  typed: number;
  hinted: number[];
  wrong: { at: number; ch: string; n: number } | null;
  results: Record<number, LineResult>;
  /** The media was paused at the end of this line, waiting for the learner */
  pausedFor: number | null;
  correct: number;
  mistakes: number;
  hints: number;
  /** Letters that were not typed before the song moved on */
  missed: number;
}

export type LiveAction =
  | { type: "keys"; chars: string; slots: string[] }
  | { type: "reveal"; upTo: number; slots: string[] }
  | { type: "jump"; to: number; slots: string[]; miss: boolean; count: boolean }
  | { type: "paused"; line: number }
  | { type: "replay" }
  | { type: "restart" };

export function initialLiveState(): LiveState {
  return { line: 0, typed: 0, hinted: [], wrong: null, results: {}, pausedFor: null, correct: 0, mistakes: 0, hints: 0, missed: 0 };
}

function finishIfDone(s: LiveState, slots: string[]): LiveState {
  if (s.typed < slots.length) return s;
  return {
    ...s,
    results: { ...s.results, [s.line]: { typed: s.typed, hinted: s.hinted, missedFrom: null } },
    line: s.line + 1,
    typed: 0,
    hinted: [],
    wrong: null,
    pausedFor: null,
  };
}

export function liveReducer(s: LiveState, a: LiveAction): LiveState {
  switch (a.type) {
    case "keys": {
      let next = s;
      for (const ch of a.chars) {
        if (!isTypable(ch) || next.typed >= a.slots.length) continue;
        if (acceptsChar(a.slots[next.typed], ch)) next = { ...next, typed: next.typed + 1, correct: next.correct + 1, wrong: null };
        else next = { ...next, mistakes: next.mistakes + 1, wrong: { at: next.typed, ch, n: (next.wrong?.n ?? 0) + 1 } };
      }
      return finishIfDone(next, a.slots);
    }
    case "reveal": {
      const upTo = Math.min(a.upTo, a.slots.length);
      if (upTo <= s.typed) return s;
      const added = Array.from({ length: upTo - s.typed }, (_, i) => s.typed + i);
      return finishIfDone({ ...s, typed: upTo, hinted: [...s.hinted, ...added], hints: s.hints + added.length, wrong: null }, a.slots);
    }
    case "jump": {
      if (a.to === s.line) return s;
      const fresh = { typed: 0, hinted: [], wrong: null, pausedFor: null };
      if (a.to < s.line) {
        const results = Object.fromEntries(Object.entries(s.results).filter(([k]) => Number(k) < a.to));
        return { ...s, ...fresh, line: a.to, results };
      }
      const result: LineResult = { typed: s.typed, hinted: s.hinted, missedFrom: a.miss ? s.typed : null };
      return {
        ...s,
        ...fresh,
        line: a.to,
        results: { ...s.results, [s.line]: result },
        missed: s.missed + (a.count ? a.slots.length - s.typed : 0),
      };
    }
    case "paused":
      return { ...s, pausedFor: a.line };
    case "replay":
      return { ...s, pausedFor: null };
    case "restart":
      return initialLiveState();
  }
}

/** The line that is being sung at `t`, or the next one in a pause (the line count after the last). */
export function lineAt(lines: TimedLine[], t: number): number {
  const i = lines.findIndex((l) => l.end > t);
  return i < 0 ? lines.length : i;
}

export type TickDecision = { type: "none" } | { type: "pause" } | { type: "jump"; to: number; miss: boolean; count: boolean };

const NONE: TickDecision = { type: "none" };

/**
 * What to do on a clock tick. `t` and `prevT` are positions on the lyrics' own clock (media time minus
 * the offset); a jump between ticks larger than normal playback means the learner seeked.
 */
export function decideTick({
  lines,
  line,
  t,
  prevT,
  playing,
  mode,
  pausedFor,
}: {
  lines: TimedLine[];
  line: number;
  t: number;
  prevT: number | null;
  playing: boolean;
  mode: LiveMode;
  pausedFor: number | null;
}): TickDecision {
  if (prevT !== null && t < prevT - 1.5) {
    const to = lineAt(lines, t);
    return to < line ? { type: "jump", to, miss: false, count: false } : NONE;
  }
  if (line >= lines.length) return NONE;
  if (prevT !== null && t > prevT + 2) {
    const to = lineAt(lines, t);
    return to > line ? { type: "jump", to, miss: true, count: false } : NONE;
  }
  const { end } = lines[line];
  if (t < end) return NONE;
  if (mode === "bekle") {
    if (pausedFor !== line) return playing ? { type: "pause" } : NONE;
    // paused for this line, but the learner pressed play: let the song go on
    return playing && t > end + 1 ? { type: "jump", to: Math.max(line + 1, lineAt(lines, t)), miss: true, count: true } : NONE;
  }
  // a stopped player past the end (the media ran out, or the learner paused) also moves on
  return t >= end + 0.25 || !playing ? { type: "jump", to: Math.max(line + 1, lineAt(lines, t)), miss: true, count: true } : NONE;
}

export function liveScore(s: Pick<LiveState, "correct" | "mistakes" | "missed">): number {
  const total = s.correct + s.mistakes + s.missed;
  return total ? Math.round((100 * s.correct) / total) : 100;
}
