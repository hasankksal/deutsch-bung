"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { acceptsChar, isTypable, makeCloze, type Difficulty } from "@/lib/dictation/cloze";
import { recordScore } from "@/lib/dictation/store";
import { sfx } from "@/lib/sound";
import { speakGerman, stopSpeaking } from "@/lib/speech";
import { Icon } from "../icons";
import { Led } from "../SlotMachine";
import { Button, Chip, LABEL, cn, useReducedMotion } from "../ui";
import { ClozeLine, slotsOf } from "./ClozeLine";
import { YouTubePlayer, type PlayerHandle } from "./YouTubePlayer";

export interface GameLine {
  de: string;
  tr?: string;
  speaker?: string;
  /** Clip inside the video, in seconds */
  start?: number;
  end?: number;
}

const SPECIAL_CHARS = ["ä", "ö", "ü", "ß"];
const NEXT_DELAY_MS = 1600;
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { kolay: "Kolay", orta: "Orta", zor: "Dikte" };

interface GameState {
  line: number;
  /** Letters of the current line typed so far (index into the line's slots) */
  typed: number;
  /** Slots filled by a hint instead of typing */
  hinted: number[];
  wrong: { at: number; ch: string; n: number } | null;
  lineDone: boolean;
  finished: boolean;
  lineStartedAt: number | null;
  correct: number;
  mistakes: number;
  hints: number;
  /** Typing time, summed over lines (time spent listening before the first key is not counted) */
  ms: number;
}

type Action =
  | { type: "keys"; chars: string; slots: string[]; now: number }
  | { type: "reveal"; upTo: number; slots: string[]; now: number }
  | { type: "next"; lineCount: number }
  | { type: "restart" };

function initialState(): GameState {
  return { line: 0, typed: 0, hinted: [], wrong: null, lineDone: false, finished: false, lineStartedAt: null, correct: 0, mistakes: 0, hints: 0, ms: 0 };
}

function closeLine(s: GameState, slots: string[], now: number): GameState {
  if (s.typed < slots.length) return s;
  return { ...s, lineDone: true, wrong: null, ms: s.ms + (s.lineStartedAt === null ? 0 : now - s.lineStartedAt) };
}

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "keys": {
      if (s.lineDone || s.finished) return s;
      let next = { ...s, lineStartedAt: s.lineStartedAt ?? a.now };
      for (const ch of a.chars) {
        if (!isTypable(ch) || next.typed >= a.slots.length) continue;
        if (acceptsChar(a.slots[next.typed], ch)) next = { ...next, typed: next.typed + 1, correct: next.correct + 1, wrong: null };
        else next = { ...next, mistakes: next.mistakes + 1, wrong: { at: next.typed, ch, n: (next.wrong?.n ?? 0) + 1 } };
      }
      return closeLine(next, a.slots, a.now);
    }
    case "reveal": {
      if (s.lineDone || s.finished || a.upTo <= s.typed) return s;
      const upTo = Math.min(a.upTo, a.slots.length);
      const added = Array.from({ length: upTo - s.typed }, (_, i) => s.typed + i);
      const next = { ...s, lineStartedAt: s.lineStartedAt ?? a.now, typed: upTo, hinted: [...s.hinted, ...added], hints: s.hints + added.length, wrong: null };
      return closeLine(next, a.slots, a.now);
    }
    case "next":
      if (!s.lineDone) return s;
      if (s.line + 1 >= a.lineCount) return { ...s, finished: true };
      return { ...s, line: s.line + 1, typed: 0, hinted: [], wrong: null, lineDone: false, lineStartedAt: null };
    case "restart":
      return initialState();
  }
}

export function scoreOf(s: Pick<GameState, "correct" | "mistakes" | "ms">): { accuracy: number; cpm: number } {
  const accuracy = s.correct + s.mistakes ? Math.round((100 * s.correct) / (s.correct + s.mistakes)) : 100;
  const cpm = s.ms > 0 ? Math.round(s.correct / (s.ms / 60_000)) : 0;
  return { accuracy, cpm };
}

export function DictationGame({
  title,
  lines,
  difficulty,
  scoreKey,
  videoId,
  onExit,
  onHarder,
}: {
  title: string;
  lines: GameLine[];
  difficulty: Difficulty;
  /** Where the best score is kept */
  scoreKey: string;
  videoId?: string;
  onExit: () => void;
  /** Start again on the next difficulty (missing on the hardest one) */
  onHarder?: () => void;
}) {
  const [round, setRound] = useState(0);
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [record, setRecord] = useState<boolean | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const player = useRef<PlayerHandle | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  const line = lines[state.line];
  const timed = videoId !== undefined && line.start !== undefined;
  const segments = useMemo(() => makeCloze(line.de, difficulty, round * 97 + state.line), [line.de, difficulty, round, state.line]);
  const { slots, wordEnds } = useMemo(() => slotsOf(segments), [segments]);
  const hinted = useMemo(() => new Set(state.hinted), [state.hinted]);

  const listen = (slow = false) => {
    if (timed && player.current) {
      stopSpeaking();
      player.current.playClip(line.start!, line.end);
    } else speakGerman(line.de, { rate: slow ? 0.7 : 0.92 });
    input.current?.focus({ preventScroll: true });
  };

  // Play each new line once as it comes up.
  useEffect(() => {
    if (state.finished) return;
    if (timed) player.current?.playClip(line.start!, line.end);
    else if (!videoId) speakGerman(line.de, { rate: 0.92 });
    input.current?.focus({ preventScroll: true });
    // the line index and round decide when to play, not the callback identities
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.line, round, state.finished]);

  useEffect(() => stopSpeaking, []);

  const advance = () => {
    if (!state.lineDone) return;
    if (state.line + 1 >= lines.length) {
      const score = scoreOf(state);
      setRecord(recordScore(`${scoreKey}:${difficulty}`, score));
      if (score.accuracy >= 90) sfx.jackpot();
      else sfx.win();
    }
    dispatch({ type: "next", lineCount: lines.length });
  };

  // A finished line moves on by itself after a short look at the translation.
  useEffect(() => {
    if (!state.lineDone || state.finished) return;
    sfx.almost();
    const t = window.setTimeout(advance, NEXT_DELAY_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lineDone, state.line, state.finished]);

  const type = (chars: string) => dispatch({ type: "keys", chars, slots, now: performance.now() });
  const reveal = (upTo: number) => {
    dispatch({ type: "reveal", upTo, slots, now: performance.now() });
    input.current?.focus({ preventScroll: true });
  };
  const restart = () => {
    setRound((r) => r + 1);
    setRecord(null);
    dispatch({ type: "restart" });
  };

  const score = scoreOf(state);
  const currentWordEnd = wordEnds.find((e) => e > state.typed) ?? slots.length;

  if (state.finished) {
    return (
      <div className="animate-rise space-y-5">
        <div className="machine sketch sketch-bold jitter p-2.5 sm:p-3">
          <span className="machine-shade" aria-hidden="true" />
          <div className="reel-window sketch sketch-bold px-6 py-8 text-center" data-state={score.accuracy >= 90 ? "correct" : "almost"}>
            <span className="drum" aria-hidden="true" />
            <p className="relative font-note text-2xl font-bold text-graphite">{title}</p>
            <p className="hand-bold relative mt-1 text-5xl">%{score.accuracy}</p>
            <p className="relative mt-1 text-graphite">doğruluk</p>
            {record && <p className="relative mt-3 font-note text-2xl font-bold text-red-pencil">Yeni rekor!</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            ["Hız", `${score.cpm}`, "harf / dk"],
            ["Yanlış harf", `${state.mistakes}`, "tuş"],
            ["İpucu", `${state.hints}`, "harf"],
          ].map(([label, value, unit]) => (
            <div key={label} className="sketch sketch-thin sketch-once bg-sheet px-2 py-3">
              <p className={LABEL}>{label}</p>
              <p className="hand-bold text-2xl">{value}</p>
              <p className="text-xs text-pencil">{unit}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={restart}>
            Tekrar oyna
          </Button>
          {onHarder && <Button onClick={onHarder}>Zorlaştır</Button>}
          <Button variant="ghost" onClick={onExit}>
            Listeye dön
          </Button>
        </div>
      </div>
    );
  }

  const previous = lines.slice(Math.max(0, state.line - 2), state.line);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onExit} aria-label="Listeye dön">
          <Icon name="arrowRight" className="size-4 rotate-180" />
          Liste
        </Button>
        <p lang="de" className="hand-bold min-w-0 truncate">
          {title}
        </p>
        <Chip className="ml-auto shrink-0">{DIFFICULTY_LABEL[difficulty]}</Chip>
      </div>

      {videoId && (
        <div className="sketch sketch-bold overflow-hidden bg-ink p-1.5">
          <YouTubePlayer
            videoId={videoId}
            handleRef={player}
            className="aspect-video w-full"
            onReady={() => {
              if (timed) player.current?.playClip(line.start!, line.end);
            }}
            onError={setPlayerError}
          />
        </div>
      )}
      {playerError && <p className="text-sm text-red-pencil">{playerError}</p>}
      {videoId && !timed && (
        <p className="margin-note text-sm text-graphite">
          Bu satırın zamanı yok: videoyu kendin oynat ya da listeden şarkıyı senkronla, satırlar kendi parçasını çalsın.
        </p>
      )}

      <div className="machine sketch sketch-bold p-2.5 sm:p-3">
        <span className="machine-shade" aria-hidden="true" />
        <div className="relative flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 pr-2 pl-3">
          <Led label="Satır" value={`${state.line + 1}/${lines.length}`} />
          <Led label="Doğruluk" value={`%${score.accuracy}`} />
          <Led label="Yanlış" value={String(state.mistakes)} className="ml-auto" />
        </div>

        <div
          className="reel-window sketch sketch-bold cursor-text px-5 py-6 sm:px-7"
          data-state={state.lineDone ? "correct" : undefined}
          onClick={() => input.current?.focus({ preventScroll: true })}
        >
          <span className="drum" aria-hidden="true" />
          <div className="relative space-y-3">
            {previous.map((l, i) => (
              <div key={state.line - previous.length + i} className="opacity-45">
                {l.speaker && <p className="font-note text-lg leading-none font-bold text-graphite">{l.speaker}</p>}
                <p lang="de" className="text-lg">
                  {l.de}
                </p>
              </div>
            ))}
            <div key={`${state.line}:${round}`} className={cn(!reducedMotion && "animate-rise")}>
              {line.speaker && <p className="font-note text-xl leading-none font-bold text-red-pencil">{line.speaker}</p>}
              <ClozeLine
                segments={segments}
                typed={state.typed}
                hinted={hinted}
                wrong={state.wrong}
                cursor={!state.lineDone}
                className="hand-bold text-2xl leading-[2.6rem] sm:text-[1.7rem]"
              />
              <p lang="tr" className={cn("mt-2 min-h-7 font-note text-xl font-bold text-graphite", !state.lineDone && "invisible")}>
                {line.tr}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("sketch lined bg-sheet transition-colors focus-within:[--line:var(--color-blue-pencil)]", state.lineDone && "bg-paper/70")}>
        <input
          ref={input}
          value=""
          onChange={(e) => type(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            if (state.lineDone) advance();
            else listen();
          }}
          lang="de"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Boşlukları yaz"
          placeholder={state.lineDone ? "Enter: sonraki satır" : "Duyduğunu yaz…"}
          className="block h-[2.6rem] w-full bg-transparent pr-5 pl-12 text-lg text-ink caret-transparent outline-none placeholder:text-pencil"
        />
        <div className="flex flex-wrap items-center gap-1.5 pt-1 pr-4 pb-3 pl-12">
          {SPECIAL_CHARS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                type(ch);
                input.current?.focus({ preventScroll: true });
              }}
              className="sketch sketch-thin sketch-once h-7 min-w-7 bg-paper px-1.5 text-sm font-semibold text-graphite transition-colors hover:bg-marker-soft hover:text-ink"
              aria-label={`${ch} harfini yaz`}
            >
              {ch}
            </button>
          ))}
          <span className="ml-1 text-xs text-pencil">ä yerine a da olur · Enter: tekrar dinle</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => listen()}>
          <Icon name="volume" className="size-4" />
          Tekrar dinle
        </Button>
        {!timed && (
          <Button onClick={() => listen(true)} title="Yavaş oku">
            Yavaş
          </Button>
        )}
        {state.lineDone ? (
          <Button onClick={advance} className="ml-auto">
            Sonraki
            <Icon name="arrowRight" className="size-4" />
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => reveal(state.typed + 1)} title="Sıradaki harfi göster">
              <Icon name="help" className="size-4" />
              Harf
            </Button>
            <Button variant="ghost" onClick={() => reveal(currentWordEnd)} title="Bu kelimeyi göster">
              Kelime
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
