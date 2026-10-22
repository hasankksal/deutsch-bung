"use client";

import { useEffect, useRef, useState } from "react";
import { LEVEL_INFO, levelLabel, topicName, topicsForLevel } from "@/lib/curriculum";
import { gradeAnswer } from "@/lib/grading";
import { dueReviews, pickNext, similarExercise } from "@/lib/queue";
import { sfx } from "@/lib/sound";
import { correctStreak, todayCount } from "@/lib/stats";
import {
  DAILY_GOAL,
  getState,
  markSeen,
  recordAttempt,
  setLevel,
  setTopic,
  toggleSentence,
  toggleWord,
  useAppState,
  useHydrated,
} from "@/lib/store";
import { LEVELS, MIXED_TOPIC, type Exercise, type Level, type Verdict, type VocabItem } from "@/lib/types";
import { ExercisePanel, newSlot, type Slot } from "./ExercisePanel";
import { Icon } from "./icons";
import { CoinBurst, Led } from "./SlotMachine";
import { Button, Card, Segmented, useNow, useReducedMotion } from "./ui";

type Mode = "normal" | "review";
type SlotKey = "main" | number;

/** A correct-answer streak of this length (and its multiples) pays out coins. */
const STREAK_PRIZE = 5;

function MachineSkeleton() {
  return (
    <div className="machine sketch sketch-bold animate-pulse p-3 sm:mr-12">
      <span className="machine-shade" aria-hidden="true" />
      <div className="h-10" />
      <div className="h-4" />
      <div className="reel-window sketch sketch-bold h-32 opacity-70 sm:h-36" />
    </div>
  );
}

export function PracticeView() {
  const state = useAppState();
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const now = useNow();

  const [mode, setMode] = useState<Mode>("normal");
  const [main, setMain] = useState<Slot | null>(null);
  const [followups, setFollowups] = useState<Slot[]>([]);
  const [loaded, setLoaded] = useState(false);
  /** Key of the latest coin burst (0 = none yet) */
  const [prize, setPrize] = useState(0);
  const startedRef = useRef(false);
  const mainRef = useRef<Slot | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    mainRef.current = main;
  }, [main]);

  const starredWords = new Set(state.words.map((w) => w.de));
  const starredSentences = new Set(state.sentences.map((s) => s.tr));
  const due = dueReviews(state, now);
  const today = hydrated ? todayCount(state, new Date(now)) : 0;
  const streak = hydrated ? correctStreak(state) : 0;

  function show(exercise: Exercise) {
    markSeen(exercise.id);
    setMain(newSlot(exercise));
    setFollowups([]);
  }

  function loadNext(nextMode: Mode, excludeCurrent: boolean) {
    setLoaded(true);
    const s = getState();
    const currentId = excludeCurrent ? mainRef.current?.exercise.id : undefined;
    if (nextMode === "review") {
      const pending = dueReviews(s).filter((r) => r.exercise.id !== currentId);
      if (pending.length) {
        setMode("review");
        show(pending[0].exercise);
        return;
      }
    }
    setMode("normal");
    const next = pickNext(s, s.level, s.topicId, currentId ? [currentId] : []);
    if (next) {
      show(next);
      return;
    }
    setMain(null);
    setFollowups([]);
  }

  // First exercise once the saved level and topic are known.
  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    startedRef.current = true;
    loadNext("normal", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // After the last reinforcement answer, move focus to "next".
  useEffect(() => {
    if (followups.length && followups.every((f) => f.status === "graded")) nextButtonRef.current?.focus({ preventScroll: true });
  }, [followups]);

  function slotOf(key: SlotKey): Slot | null {
    return key === "main" ? main : (followups[key] ?? null);
  }

  /** Patch a slot, but only if it still shows the same exercise (answers arrive asynchronously). */
  function patch(key: SlotKey, slotKey: string, p: Partial<Slot>) {
    if (key === "main") {
      setMain((cur) => (cur && cur.key === slotKey ? { ...cur, ...p } : cur));
    } else {
      setFollowups((list) => list.map((f, i) => (i === key && f.key === slotKey ? { ...f, ...p } : f)));
    }
  }

  function celebrate(verdict: Verdict, isFollowup: boolean) {
    if (verdict === "almost") return sfx.almost();
    if (verdict !== "correct") return sfx.lose();
    const run = correctStreak(getState());
    if (isFollowup || run % STREAK_PRIZE === 0) {
      sfx.jackpot();
      if (!isFollowup) setPrize((n) => n + 1);
    } else {
      sfx.win();
    }
  }

  function check(key: SlotKey) {
    const slot = slotOf(key);
    if (!slot || slot.status !== "answering") return;
    const id = slot.key;
    if (!slot.answer.trim()) {
      patch(key, id, { inputError: "Önce bir cevap yaz." });
      return;
    }
    const result = gradeAnswer(slot.exercise, slot.answer);
    recordAttempt({
      exercise: slot.exercise,
      answer: slot.answer,
      result,
      isFollowup: key !== "main",
      revealed: slot.hints >= 3,
    });
    patch(key, id, { status: "graded", result, inputError: null });
    celebrate(slot.hints >= 3 && result.verdict === "correct" ? "almost" : result.verdict, key !== "main");
    if (result.verdict === "correct") return;
    // Spelling or capitalization slips do not need a reinforcement sentence.
    if (result.errors.length && result.errors.every((e) => e.category === "yazim" || e.category === "buyuk_harf")) return;

    // Reinforcement: a similar sentence on the same rule, at most two in a row.
    const nextIndex = key === "main" ? 0 : key + 1;
    if (nextIndex > 1) return;
    const exclude = [mainRef.current?.exercise.id ?? "", ...followups.map((f) => f.exercise.id)];
    const next = similarExercise(getState(), slot.exercise, result, exclude);
    if (!next) return;
    if (key === "main") setFollowups([newSlot(next)]);
    else setFollowups((list) => (list.length === nextIndex ? [...list, newSlot(next)] : list));
  }

  function hint(key: SlotKey) {
    const slot = slotOf(key);
    if (slot) patch(key, slot.key, { hints: Math.min(3, slot.hints + 1) });
  }

  function changeAnswer(key: SlotKey, value: string) {
    const slot = slotOf(key);
    if (slot) patch(key, slot.key, { answer: value, inputError: null });
  }

  function starSentence(slot: Slot) {
    toggleSentence(slot.exercise.tr, slot.result?.natural || slot.exercise.de[0], slot.exercise.level);
  }

  function starWord(v: VocabItem, exercise: Exercise) {
    toggleWord(v, { tr: exercise.tr, de: exercise.de[0] });
  }

  function changeLevel(level: Level) {
    setLevel(level);
    loadNext("normal", false);
  }

  function changeTopic(topicId: string) {
    setTopic(topicId);
    loadNext("normal", false);
  }

  const mastered = followups.some((f) => f.result?.verdict === "correct");
  const followupsDone = followups.length > 0 && followups.every((f) => f.status === "graded");
  const moreDue = mode === "review" && due.some((r) => r.exercise.id !== main?.exercise.id);

  /** The lever, "Geç" and "Sonraki cümle" all spin a new sentence. */
  function spin() {
    if (main?.status === "grading") return;
    loadNext(main?.status === "graded" ? (moreDue ? "review" : "normal") : mode, true);
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  const ruleOf = (i: number) => {
    const parent = i === 0 ? main?.result : followups[i - 1]?.result;
    return parent?.errors.find((e) => e.rule)?.rule?.title ?? parent?.focusTopic ?? null;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 sm:mr-12">
        <Segmented
          label="Seviye"
          value={hydrated ? state.level : null}
          onChange={changeLevel}
          options={LEVELS.map((l) => ({
            value: l,
            label: levelLabel(l),
            title: `${LEVEL_INFO[l].name}: ${LEVEL_INFO[l].description}`,
          }))}
        />
        <span className="sketch sketch-thin flex h-10 w-full min-w-0 rotate-[0.4deg] bg-sheet focus-within:[--line:var(--color-blue-pencil)] sm:w-auto sm:max-w-xs sm:flex-1">
        <select
          value={state.topicId}
          onChange={(e) => changeTopic(e.target.value)}
          aria-label="Konu"
          className="w-full min-w-0 cursor-pointer bg-transparent px-3 text-sm outline-none"
        >
          <option value={MIXED_TOPIC}>Karışık: bu seviyenin tüm konuları</option>
          {topicsForLevel(state.level).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        </span>
      </div>

      {hydrated && due.length > 0 && mode === "normal" && (
        <button
          type="button"
          onClick={() => loadNext("review", false)}
          className="sketch sketch-thin jitter-hover flex w-full -rotate-[0.3deg] animate-rise items-center gap-3 bg-marker-soft px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-marker sm:w-[calc(100%-3rem)]"
        >
          <Icon name="repeat" className="size-4 shrink-0 text-red-pencil" />
          <span className="flex-1">
            <span className="font-semibold">{due.length} cümle</span> tekrar bekliyor: daha önce hata yaptığın cümleler
          </span>
          <span className="hand-bold inline-flex items-center gap-1">
            Başla <Icon name="arrowRight" className="size-3.5" />
          </span>
        </button>
      )}

      {!hydrated || !loaded ? (
        <MachineSkeleton />
      ) : main ? (
        <div className="relative">
          {prize > 0 && <CoinBurst key={prize} className="bottom-auto h-56" />}
          <ExercisePanel
            slot={main}
            header={
              <div className="flex min-w-0 items-center gap-2.5 text-sm">
                <span className="led text-sm font-bold">{levelLabel(main.exercise.level)}</span>
                <span className="truncate text-graphite">{topicName(main.exercise.topicId)}</span>
                {mode === "review" && (
                  <span className="sketch sketch-thin sketch-once shrink-0 bg-marker-soft px-1.5 py-px text-[10px] font-bold tracking-wider text-red-pencil">
                    TEKRAR
                  </span>
                )}
              </div>
            }
            counters={
              <>
                <Led label="Bugün" value={`${today}/${DAILY_GOAL}`} title="Bugün çevirdiğin cümleler / günlük hedef" />
                <Led label="Seri" value={String(streak)} title="Üst üste doğru cevap" className="hidden sm:flex" />
              </>
            }
            onPull={spin}
            sentenceStarred={starredSentences.has(main.exercise.tr)}
            onToggleSentence={() => starSentence(main)}
            starredWords={starredWords}
            onToggleWord={(v) => starWord(v, main.exercise)}
            onChange={(value) => changeAnswer("main", value)}
            onSubmit={() => check("main")}
            onHint={() => hint("main")}
            onSkip={spin}
            autoFocus
          />
        </div>
      ) : (
        <Card className="sm:mr-12">
          <div className="space-y-3">
            <p className="hand-bold">Bu konudaki hazır cümleleri bitirdin</p>
            <p className="text-sm text-graphite">Başka bir konu ya da seviye seç.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => changeTopic(MIXED_TOPIC)}>Karışık konulara geç</Button>
              <Button variant="ghost" onClick={() => loadNext("normal", false)}>
                <Icon name="repeat" /> Baştan tekrar et
              </Button>
            </div>
          </div>
        </Card>
      )}

      {main && followups.length > 0 && (
        <section aria-label="Pekiştirme" className="space-y-4 pt-4">
          <div className="px-1 sm:mr-12">
            <h2 className="hand-bold wobble-text scribble inline-block text-3xl">Şimdi sıra sende</h2>
            <p className="mt-1 text-sm text-graphite">
              Aynı kuralla kurulmuş yeni bir cümle. Doğru çevirirsen kuralı kapmışsın demektir.
            </p>
          </div>
          {followups.map((f, i) => (
            <div key={f.key} className="sm:mr-12">
              <ExercisePanel
                slot={f}
                size="md"
                header={
                  <div className="flex min-w-0 items-center gap-2.5 text-sm">
                    <span className="led shrink-0 text-xs font-bold tracking-wider">
                      SIRA SENDE{followups.length > 1 ? ` ${i + 1}` : ""}
                    </span>
                    {ruleOf(i) && <span className="truncate text-graphite">{ruleOf(i)}</span>}
                  </div>
                }
                sentenceStarred={starredSentences.has(f.exercise.tr)}
                onToggleSentence={() => starSentence(f)}
                starredWords={starredWords}
                onToggleWord={(v) => starWord(v, f.exercise)}
                onChange={(value) => changeAnswer(i, value)}
                onSubmit={() => check(i)}
                onHint={() => hint(i)}
                autoFocus
              />
            </div>
          ))}
          {mastered && (
            <div className="sketch sketch-bold jitter relative animate-pop bg-marker-soft px-5 py-4 text-ink sm:mr-12">
              <CoinBurst />
              <p className="hand-bold relative flex items-center gap-3 text-base">
                <span className="led text-3xl">★</span>
                Kuralı kaptın! Aynı kuralla kurulmuş yeni cümleyi doğru çevirdin.
              </p>
            </div>
          )}
          {followupsDone && !mastered && (
            <p className="sketch sketch-thin sketch-once margin-note bg-sheet py-4 pr-5 text-sm text-graphite sm:mr-12">
              Bu kural biraz daha pratik istiyor. Yukarıdaki kural kartına bir daha göz at; hatalı cümleleri tekrar listene
              ekledim, yakında yeniden soracağım.
            </p>
          )}
        </section>
      )}

      {main && main.status === "graded" && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1 sm:mr-12">
          <span className="hidden font-note text-xl text-graphite sm:inline">ya da kolu çek →</span>
          <Button ref={nextButtonRef} variant="primary" size="lg" onClick={spin} autoFocus={followups.length === 0}>
            {moreDue ? "Sıradaki tekrar" : "Sonraki cümle"}
            <Icon name="arrowRight" />
          </Button>
        </div>
      )}

    </div>
  );
}
