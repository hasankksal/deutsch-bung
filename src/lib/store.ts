import { useSyncExternalStore } from "react";
import {
  MIXED_TOPIC,
  type ErrorCategory,
  type Exercise,
  type GradeResult,
  type Level,
  type VocabItem,
  type Verdict,
} from "./types";

// All learner data lives in this browser (localStorage). No account, no server database.

export interface Attempt {
  id: string;
  at: number;
  exerciseId: string;
  level: Level;
  topicId: string;
  tr: string;
  answer: string;
  verdict: Verdict;
  score: number;
  categories: ErrorCategory[];
  isFollowup: boolean;
}

export interface StarredWord {
  id: string;
  de: string;
  tr: string;
  contextTr: string;
  contextDe: string;
  addedAt: number;
  /** Leitner box: 0 = new, higher = known longer */
  box: number;
  due: number;
}

export interface StarredSentence {
  id: string;
  tr: string;
  de: string;
  level: Level;
  addedAt: number;
}

export interface ReviewItem {
  exercise: Exercise;
  box: number;
  due: number;
}

export interface TopicStat {
  attempts: number;
  correct: number;
  followupTotal: number;
  followupOk: number;
  lastAt: number;
}

export interface AppState {
  v: 1;
  level: Level;
  topicId: string;
  /** Recently shown exercise ids, newest first */
  seen: string[];
  attempts: Attempt[];
  categoryCounts: Partial<Record<ErrorCategory, number>>;
  topicStats: Record<string, TopicStat>;
  practiceDays: string[];
  words: StarredWord[];
  sentences: StarredSentence[];
  review: ReviewItem[];
  /** Slot machine sound effects */
  sound: boolean;
}

const STORAGE_KEY = "almanca-pratik:v1";
const MINUTE = 60_000;
const DAY = 86_400_000;
export const DAILY_GOAL = 10;
/** Days until a missed sentence comes back, per box */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
/** Days until a starred word comes back, per box */
export const WORD_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60];

function defaultState(): AppState {
  return {
    v: 1,
    level: "A1",
    topicId: MIXED_TOPIC,
    seen: [],
    attempts: [],
    categoryCounts: {},
    topicStats: {},
    practiceDays: [],
    words: [],
    sentences: [],
    review: [],
    sound: true,
  };
}

const SERVER_STATE = defaultState();
let state: AppState = SERVER_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function parseStored(raw: string | null): AppState {
  if (!raw) return defaultState();
  const data = JSON.parse(raw) as Partial<AppState>;
  return { ...defaultState(), ...data, v: 1 };
}

function emit() {
  listeners.forEach((l) => l());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    state = defaultState();
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = parseStored(e.newValue);
      emit();
    } catch {
      // ignore unreadable data written by another tab
    }
  });
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: keep working in memory
  }
}

export function getState(): AppState {
  load();
  return state;
}

function update(fn: (s: AppState) => AppState) {
  load();
  state = fn(state);
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}

const noopSubscribe = () => () => {};
/** False during server render and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ---------- settings ----------

export function setLevel(level: Level) {
  update((s) => ({ ...s, level, topicId: MIXED_TOPIC }));
}

export function setTopic(topicId: string) {
  update((s) => ({ ...s, topicId }));
}

export function setLevelAndTopic(level: Level, topicId: string) {
  update((s) => ({ ...s, level, topicId }));
}

export function setSound(sound: boolean) {
  update((s) => ({ ...s, sound }));
}

// ---------- exercises ----------

export function markSeen(id: string) {
  update((s) => ({ ...s, seen: [id, ...s.seen.filter((x) => x !== id)].slice(0, 400) }));
}

export function recordAttempt(input: {
  exercise: Exercise;
  answer: string;
  result: GradeResult;
  isFollowup: boolean;
  revealed: boolean;
}) {
  const { exercise, result } = input;
  update((s) => {
    const now = Date.now();
    const ok = result.verdict === "correct" && !input.revealed;
    const attempt: Attempt = {
      id: uid(),
      at: now,
      exerciseId: exercise.id,
      level: exercise.level,
      topicId: exercise.topicId,
      tr: exercise.tr,
      answer: input.answer,
      verdict: input.revealed && result.verdict === "correct" ? "almost" : result.verdict,
      score: result.score,
      categories: result.errors.map((e) => e.category),
      isFollowup: input.isFollowup,
    };

    const categoryCounts = { ...s.categoryCounts };
    for (const e of result.errors) categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1;

    const prev = s.topicStats[exercise.topicId] ?? { attempts: 0, correct: 0, followupTotal: 0, followupOk: 0, lastAt: 0 };
    const topicStats = {
      ...s.topicStats,
      [exercise.topicId]: {
        attempts: prev.attempts + 1,
        correct: prev.correct + (ok ? 1 : 0),
        followupTotal: prev.followupTotal + (input.isFollowup ? 1 : 0),
        followupOk: prev.followupOk + (input.isFollowup && ok ? 1 : 0),
        lastAt: now,
      },
    };

    const today = dayKey();
    const practiceDays = s.practiceDays.includes(today) ? s.practiceDays : [...s.practiceDays, today].slice(-400);

    // Missed sentences come back later (spaced repetition). "almost" keeps the box and asks again tomorrow.
    let review = s.review;
    const existing = review.find((r) => r.exercise.id === exercise.id);
    if (ok && existing) {
      const box = existing.box + 1;
      review =
        box >= REVIEW_INTERVALS_DAYS.length
          ? review.filter((r) => r !== existing)
          : review.map((r) => (r === existing ? { ...r, box, due: now + REVIEW_INTERVALS_DAYS[box] * DAY } : r));
    } else if (existing && result.verdict === "almost" && !input.revealed) {
      review = review.map((r) => (r === existing ? { ...r, due: now + DAY } : r));
    } else if (result.verdict === "incorrect" || input.revealed) {
      const item: ReviewItem = { exercise, box: 0, due: now + REVIEW_INTERVALS_DAYS[0] * DAY };
      review = existing ? review.map((r) => (r === existing ? item : r)) : [...review, item].slice(-200);
    }

    return {
      ...s,
      attempts: [attempt, ...s.attempts].slice(0, 300),
      categoryCounts,
      topicStats,
      practiceDays,
      review,
    };
  });
}

// ---------- starred words and sentences ----------

export function toggleWord(item: VocabItem, context: { tr: string; de: string }) {
  update((s) => {
    if (s.words.some((w) => w.de === item.de)) {
      return { ...s, words: s.words.filter((w) => w.de !== item.de) };
    }
    const now = Date.now();
    const word: StarredWord = {
      id: uid(),
      de: item.de,
      tr: item.tr,
      contextTr: context.tr,
      contextDe: context.de,
      addedAt: now,
      box: 0,
      due: now,
    };
    return { ...s, words: [word, ...s.words] };
  });
}

export function reviewWord(id: string, grade: "again" | "hard" | "good") {
  update((s) => ({
    ...s,
    words: s.words.map((w) => {
      if (w.id !== id) return w;
      const now = Date.now();
      if (grade === "again") return { ...w, box: 0, due: now + MINUTE };
      const box = grade === "good" ? Math.min(w.box + 1, WORD_INTERVALS_DAYS.length - 1) : Math.max(1, w.box);
      const days = grade === "hard" ? Math.max(1, Math.round(WORD_INTERVALS_DAYS[box] / 2)) : WORD_INTERVALS_DAYS[box];
      return { ...w, box, due: now + days * DAY };
    }),
  }));
}

export function removeWord(id: string) {
  update((s) => ({ ...s, words: s.words.filter((w) => w.id !== id) }));
}

export function toggleSentence(tr: string, de: string, level: Level) {
  update((s) => {
    if (s.sentences.some((x) => x.tr === tr)) {
      return { ...s, sentences: s.sentences.filter((x) => x.tr !== tr) };
    }
    return { ...s, sentences: [{ id: uid(), tr, de, level, addedAt: Date.now() }, ...s.sentences] };
  });
}

export function removeSentence(id: string) {
  update((s) => ({ ...s, sentences: s.sentences.filter((x) => x.id !== id) }));
}

export function resetAll() {
  update((s) => ({ ...defaultState(), sound: s.sound }));
}
