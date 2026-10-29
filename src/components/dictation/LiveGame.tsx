"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { lineEnd, makeCloze, type Difficulty, type SongLine } from "@/lib/dictation/cloze";
import { decideTick, initialLiveState, liveReducer, liveScore, type LiveMode, type TimedLine } from "@/lib/dictation/live";
import { recordScore, useDictationState } from "@/lib/dictation/store";
import { sfx } from "@/lib/sound";
import { Icon } from "../icons";
import { Led } from "../SlotMachine";
import { Button, Chip, LABEL, Segmented, cn } from "../ui";
import { ClozeLine, NO_HINTS, slotsOf } from "./ClozeLine";
import { DIFFICULTY_LABEL } from "./DictationGame";
import { FilePlayer } from "./FilePlayer";
import { YouTubePlayer, type PlayerHandle } from "./YouTubePlayer";

export type LiveSource = { kind: "youtube"; videoId: string } | { kind: "file"; url: string; audio: boolean };

const SPECIAL_CHARS = ["ä", "ö", "ü", "ß"];
const TICK_MS = 100;
/** Lines drawn above and below the current one */
const WINDOW = 14;
/** After a seek the page made itself, seek detection rests for a moment */
const SELF_SEEK_MS = 700;
const RATES = [1, 0.85, 0.7];

function fmtOffset(o: number): string {
  return `${o > 0 ? "+" : o < 0 ? "−" : "±"}${Math.abs(o).toFixed(1)} sn`;
}

export function LiveGame({
  title,
  lines,
  source,
  difficulty,
  scoreKey,
  offset,
  onOffset,
  onExit,
}: {
  title: string;
  /** Timed lines (lines without a start time are left out) */
  lines: SongLine[];
  source: LiveSource;
  difficulty: Difficulty;
  scoreKey: string;
  /** Seconds added to every time stamp */
  offset: number;
  onOffset: (offset: number) => void;
  onExit: () => void;
}) {
  const timedLines = useMemo(() => lines.filter((l) => l.start !== undefined), [lines]);
  const times: TimedLine[] = useMemo(
    () => timedLines.map((l, i) => ({ start: l.start!, end: lineEnd(timedLines, i)! })),
    [timedLines],
  );
  const [round, setRound] = useState(0);
  const clozes = useMemo(() => timedLines.map((l, i) => makeCloze(l.text, difficulty, round * 97 + i)), [timedLines, difficulty, round]);

  const [state, dispatch] = useReducer(liveReducer, undefined, initialLiveState);
  const [mode, setMode] = useState<LiveMode>("bekle");
  const [rate, setRate] = useState(1);
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { best } = useDictationState();
  const bestKey = `${scoreKey}:${difficulty}`;
  const [bestAtStart] = useState(() => best[bestKey]);

  const player = useRef<PlayerHandle | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const currentRow = useRef<HTMLDivElement>(null);

  const finished = state.line >= timedLines.length;
  const cur = Math.min(state.line, timedLines.length - 1);
  const { slots, wordEnds } = useMemo(() => slotsOf(clozes[cur] ?? []), [clozes, cur]);
  const hinted = useMemo(() => new Set(state.hinted), [state.hinted]);
  const pastHints = useMemo(
    () => Object.fromEntries(Object.entries(state.results).map(([k, r]) => [k, new Set(r.hinted)])),
    [state.results],
  );

  // The clock: follows the media, pauses at line ends, follows seeks.
  const live = useRef({ state, slots, mode, offset, prevT: null as number | null, selfSeekAt: 0 });
  useEffect(() => {
    live.current = { ...live.current, state, slots, mode, offset };
  });
  useEffect(() => {
    const timer = window.setInterval(() => {
      const h = player.current;
      if (!h) return;
      const L = live.current;
      const t = h.time() - L.offset;
      setNow(t);
      const selfSeek = performance.now() - L.selfSeekAt < SELF_SEEK_MS;
      const d = decideTick({
        lines: times,
        line: L.state.line,
        t,
        prevT: selfSeek ? null : L.prevT,
        playing: h.isPlaying(),
        mode: L.mode,
        pausedFor: L.state.pausedFor,
      });
      L.prevT = t;
      if (d.type === "pause") {
        h.pause();
        dispatch({ type: "paused", line: L.state.line });
      } else if (d.type === "jump") dispatch({ type: "jump", to: d.to, slots: L.slots, miss: d.miss, count: d.count });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [times]);

  // A line finished while the media waited for it: carry on.
  const waitingOn = useRef<number | null>(null);
  useEffect(() => {
    if (waitingOn.current !== null && state.line > waitingOn.current) {
      player.current?.play();
      if (state.line < timedLines.length) sfx.almost();
    }
    waitingOn.current = state.pausedFor;
  }, [state.line, state.pausedFor, timedLines.length]);

  // Keep the current line in the middle of the lyrics panel, like a karaoke screen.
  useEffect(() => {
    const box = list.current;
    const row = currentRow.current;
    if (!box || !row) return;
    box.scrollTo({ top: row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2, behavior: "smooth" });
  }, [state.line, round]);

  useEffect(() => {
    if (!finished) return;
    recordScore(bestKey, { accuracy: liveScore(state), cpm: 0 });
    player.current?.pause();
    if (liveScore(state) >= 90) sfx.jackpot();
    else sfx.win();
    // only when the run ends
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const focus = () => input.current?.focus({ preventScroll: true });
  const seekTo = (t: number) => {
    live.current.selfSeekAt = performance.now();
    player.current?.seek(t + offset);
    player.current?.play();
  };
  const replay = () => {
    if (finished) return;
    dispatch({ type: "replay" });
    seekTo(times[cur].start - 0.3);
    focus();
  };
  const goTo = (i: number) => {
    dispatch({ type: "jump", to: i, slots, miss: false, count: false });
    seekTo(times[i].start - 0.3);
    focus();
  };
  /** The learner heard the current line start right now: shift all stamps to match. */
  const align = () => {
    const h = player.current;
    if (!h || finished) return;
    live.current.selfSeekAt = performance.now();
    dispatch({ type: "replay" });
    onOffset(h.time() - times[cur].start);
    focus();
  };
  const nudge = (d: number) => {
    live.current.selfSeekAt = performance.now();
    onOffset(offset + d);
  };
  const changeRate = (r: number) => {
    setRate(r);
    player.current?.setRate(r);
  };
  const restart = () => {
    setRound((r) => r + 1);
    dispatch({ type: "restart" });
    live.current.selfSeekAt = performance.now();
    player.current?.seek(Math.max(0, (times[0]?.start ?? 0) + offset - 2));
    player.current?.play();
  };

  const type = (chars: string) => dispatch({ type: "keys", chars, slots });
  const reveal = (upTo: number) => {
    dispatch({ type: "reveal", upTo, slots });
    focus();
  };

  const score = liveScore(state);
  const waiting = state.pausedFor === state.line && !finished;
  const currentWordEnd = wordEnds.find((e) => e > state.typed) ?? slots.length;
  const singing = !finished && now >= times[cur].start && now < times[cur].end;
  const progress = singing ? (now - times[cur].start) / (times[cur].end - times[cur].start) : now >= times[cur]?.end ? 1 : 0;
  const from = Math.max(0, cur - WINDOW);
  const to = Math.min(timedLines.length, cur + WINDOW + 1);

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

      <div className={cn("sketch sketch-bold overflow-hidden bg-ink p-1.5", source.kind === "file" && source.audio && "bg-sheet")}>
        {source.kind === "youtube" ? (
          <YouTubePlayer videoId={source.videoId} handleRef={player} className="aspect-video w-full" onReady={() => setReady(true)} onError={setError} />
        ) : (
          <FilePlayer
            url={source.url}
            audio={source.audio}
            handleRef={player}
            className={source.audio ? "w-full" : "aspect-video w-full"}
            onReady={() => setReady(true)}
          />
        )}
      </div>
      {error && <p className="text-sm text-red-pencil">{error}</p>}

      {finished ? (
        <div className="animate-rise space-y-4">
          <div className="machine sketch sketch-bold jitter p-2.5 sm:p-3">
            <span className="machine-shade" aria-hidden="true" />
            <div className="reel-window sketch sketch-bold px-6 py-8 text-center" data-state={score >= 90 ? "correct" : "almost"}>
              <span className="drum" aria-hidden="true" />
              <p className="hand-bold relative text-5xl">%{score}</p>
              <p className="relative mt-1 text-graphite">doğruluk</p>
              {(!bestAtStart || score > bestAtStart.accuracy) && state.correct > 0 && (
                <p className="relative mt-3 font-note text-2xl font-bold text-red-pencil">Yeni rekor!</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Doğru harf", state.correct],
              ["Yanlış tuş", state.mistakes],
              ["Kaçan harf", state.missed],
            ].map(([label, value]) => (
              <div key={label} className="sketch sketch-thin sketch-once bg-sheet px-2 py-3">
                <p className={LABEL}>{label}</p>
                <p className="hand-bold text-2xl">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={restart}>
              Baştan oyna
            </Button>
            <Button variant="ghost" onClick={onExit}>
              Listeye dön
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="machine sketch sketch-bold p-2.5 sm:p-3">
            <span className="machine-shade" aria-hidden="true" />
            <div className="relative flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 pr-2 pl-3">
              <Led label="Satır" value={`${state.line + 1}/${timedLines.length}`} />
              <Led label="Doğruluk" value={`%${score}`} />
              <Led label="Kaçan" value={String(state.missed)} className="ml-auto" />
            </div>
            <div
              ref={list}
              className="reel-window sketch sketch-bold relative h-[21rem] cursor-text overflow-y-auto px-4 py-[9rem] sm:px-6"
              data-state={waiting ? "almost" : undefined}
              onClick={focus}
            >
              <div className="space-y-2.5">
                {timedLines.slice(from, to).map((l, k) => {
                  const i = from + k;
                  const result = state.results[i];
                  if (i === state.line)
                    return (
                      <div key={i} ref={currentRow} className="relative -mx-2 rounded-lg bg-marker-soft/60 px-2 py-1.5">
                        <ClozeLine
                          segments={clozes[i]}
                          typed={state.typed}
                          hinted={hinted}
                          wrong={state.wrong}
                          cursor
                          className="hand-bold text-[1.45rem] leading-[2.3rem] sm:text-2xl"
                        />
                        <span aria-hidden="true" className="mt-1 block h-1 overflow-hidden rounded-full bg-ink/10">
                          <span className="block h-full bg-red-pencil/70 transition-[width] duration-100 ease-linear" style={{ width: `${progress * 100}%` }} />
                        </span>
                      </div>
                    );
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goTo(i);
                      }}
                      title="Bu satırdan başla"
                      className={cn("block w-full text-left transition-opacity hover:opacity-100", result ? "opacity-70" : "opacity-40")}
                    >
                      <ClozeLine
                        segments={clozes[i]}
                        typed={result?.typed ?? 0}
                        hinted={pastHints[i] ?? NO_HINTS}
                        missedFrom={result?.missedFrom ?? null}
                        className="text-lg leading-8"
                      />
                      {result && l.tr && <span className="block font-note text-lg leading-tight text-graphite">{l.tr}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {waiting && <p className="font-note text-xl font-bold text-red-pencil">Bekliyor: satırı tamamla, şarkı devam etsin.</p>}
          {!ready && !error && <p className="text-sm text-pencil">Oynatıcı yükleniyor… Hazır olunca oynat tuşuna bas.</p>}

          <div className="sketch lined bg-sheet transition-colors focus-within:[--line:var(--color-blue-pencil)]">
            <input
              ref={input}
              value=""
              autoFocus
              onChange={(e) => type(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                replay();
              }}
              lang="de"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Boşlukları yaz"
              placeholder="Duyduğunu yaz…"
              className="block h-[2.6rem] w-full bg-transparent pr-5 pl-12 text-lg text-ink caret-transparent outline-none placeholder:text-pencil"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1 pr-4 pb-3 pl-12">
              {SPECIAL_CHARS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    type(ch);
                    focus();
                  }}
                  className="sketch sketch-thin sketch-once h-7 min-w-7 bg-paper px-1.5 text-sm font-semibold text-graphite transition-colors hover:bg-marker-soft hover:text-ink"
                  aria-label={`${ch} harfini yaz`}
                >
                  {ch}
                </button>
              ))}
              <span className="ml-1 text-xs text-pencil">ä yerine a da olur · Enter: satırı tekrar çal</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={replay}>
              <Icon name="volume" className="size-4" />
              Tekrar çal
            </Button>
            <Button variant="ghost" onClick={() => reveal(state.typed + 1)} title="Sıradaki harfi göster">
              <Icon name="help" className="size-4" />
              Harf
            </Button>
            <Button variant="ghost" onClick={() => reveal(currentWordEnd)} title="Bu kelimeyi göster">
              Kelime
            </Button>
            <Button variant="ghost" onClick={() => reveal(slots.length)} title="Satırın tamamını göster">
              Satırı aç
            </Button>
          </div>

          <div className="sketch sketch-thin grid gap-3 bg-sheet/70 p-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={LABEL}>Satır sonunda</p>
              <Segmented
                label="Satır sonunda"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "bekle", label: "Beni bekle", title: "Satırı bitirene kadar durur" },
                  { value: "akis", label: "Akmaya devam", title: "Durmaz, yetişemediğin harfler kaçar" },
                ]}
              />
            </div>
            <div className="space-y-1">
              <p className={LABEL}>Hız</p>
              <Segmented
                label="Hız"
                value={String(rate)}
                onChange={(v) => changeRate(Number(v))}
                options={RATES.map((r) => ({ value: String(r), label: `${r}×` }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className={LABEL}>Sözler videoyla kaymışsa ({fmtOffset(offset)})</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => nudge(-0.5)} title="Sözler geç kalıyorsa">
                  −0.5
                </Button>
                <Button size="sm" onClick={() => nudge(0.5)} title="Sözler erken geliyorsa">
                  +0.5
                </Button>
                <Button size="sm" variant="primary" onClick={align} disabled={!ready}>
                  Şimdi başladı
                </Button>
                <span className="text-xs text-pencil">Vurgulu satırı duyduğun an &quot;Şimdi başladı&quot;ya bas, hepsi ona göre kayar.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
