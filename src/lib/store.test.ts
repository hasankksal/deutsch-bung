import { beforeEach, describe, expect, it } from "vitest";
import { dueReviews, pickNext } from "./queue";
import { correctStreak } from "./stats";
import {
  getState,
  markSeen,
  recordAttempt,
  resetAll,
  reviewWord,
  setSound,
  toggleWord,
} from "./store";
import type { Exercise, GradeResult } from "./types";

const DAY = 86_400_000;

const exercise: Exercise = {
  id: "seed-a2-03",
  level: "A2",
  topicId: "a2-dativ",
  tr: "Babama yardım ettim.",
  de: ["Ich habe meinem Vater geholfen."],
  vocab: [{ de: "helfen (+D)", tr: "yardım etmek" }],
  hint: "",
  source: "seed",
};

const result = (verdict: GradeResult["verdict"]): GradeResult => ({
  verdict,
  score: verdict === "correct" ? 100 : 50,
  corrected: exercise.de[0],
  natural: exercise.de[0],
  errors: verdict === "correct" ? [] : [{ wrong: "meinen", fix: "meinem", category: "hal", explanation: "", turkishTip: null, rule: null }],
  notes: [],
  praise: null,
  summary: "",
  focusTopic: null,
  followup: null,
  source: "local",
});

beforeEach(() => resetAll());

describe("recordAttempt", () => {
  it("counts errors per category and per topic", () => {
    recordAttempt({ exercise, answer: "x", result: result("incorrect"), isFollowup: false, revealed: false });
    recordAttempt({ exercise, answer: "y", result: result("correct"), isFollowup: true, revealed: false });
    const s = getState();
    expect(s.categoryCounts.hal).toBe(1);
    expect(s.topicStats["a2-dativ"]).toMatchObject({ attempts: 2, correct: 1, followupTotal: 1, followupOk: 1 });
    expect(s.attempts).toHaveLength(2);
  });

  it("schedules a missed sentence for tomorrow and moves it up the boxes when answered correctly", () => {
    const before = Date.now();
    recordAttempt({ exercise, answer: "x", result: result("incorrect"), isFollowup: false, revealed: false });
    let item = getState().review[0];
    expect(item.box).toBe(0);
    expect(item.due).toBeGreaterThanOrEqual(before + DAY);
    expect(dueReviews(getState(), before + DAY + 1000)).toHaveLength(1);

    recordAttempt({ exercise, answer: "ok", result: result("correct"), isFollowup: false, revealed: false });
    item = getState().review[0];
    expect(item.box).toBe(1);
    expect(item.due).toBeGreaterThanOrEqual(before + 3 * DAY);
  });

  it("does not count a revealed answer as correct", () => {
    recordAttempt({ exercise, answer: "ok", result: result("correct"), isFollowup: false, revealed: true });
    const s = getState();
    expect(s.topicStats["a2-dativ"].correct).toBe(0);
    expect(s.attempts[0].verdict).toBe("almost");
    expect(s.review).toHaveLength(1);
  });
});

describe("correctStreak", () => {
  it("counts correct answers in a row, newest first; a revealed answer breaks the run", () => {
    expect(correctStreak(getState())).toBe(0);
    recordAttempt({ exercise, answer: "x", result: result("incorrect"), isFollowup: false, revealed: false });
    recordAttempt({ exercise, answer: "ok", result: result("correct"), isFollowup: false, revealed: false });
    recordAttempt({ exercise, answer: "ok", result: result("correct"), isFollowup: true, revealed: false });
    expect(correctStreak(getState())).toBe(2);
    recordAttempt({ exercise, answer: "ok", result: result("correct"), isFollowup: false, revealed: true });
    expect(correctStreak(getState())).toBe(0);
  });
});

describe("settings", () => {
  it("keeps the sound setting when all progress is reset", () => {
    setSound(false);
    resetAll();
    expect(getState().sound).toBe(false);
    setSound(true);
    expect(getState().sound).toBe(true);
  });
});

describe("starred words", () => {
  it("toggles a word and schedules reviews by box", () => {
    toggleWord(exercise.vocab[0], { tr: exercise.tr, de: exercise.de[0] });
    const w = getState().words[0];
    expect(w.de).toBe("helfen (+D)");
    reviewWord(w.id, "good");
    expect(getState().words[0].box).toBe(1);
    reviewWord(w.id, "again");
    expect(getState().words[0].box).toBe(0);
    toggleWord(exercise.vocab[0], { tr: exercise.tr, de: exercise.de[0] });
    expect(getState().words).toHaveLength(0);
  });
});

describe("pickNext", () => {
  it("prefers unseen sentences, then the least recently seen one", () => {
    const s0 = getState();
    const first = pickNext(s0, "A2", "a2-dativ");
    expect(first?.topicId).toBe("a2-dativ");
    markSeen("seed-a2-03");
    markSeen("seed-a2-04");
    // seeds are used up, so fresh generated sentences of the same topic come next
    for (let i = 0; i < 10; i++) {
      const next = pickNext(getState(), "A2", "a2-dativ", ["seed-a2-03"]);
      expect(next?.topicId).toBe("a2-dativ");
      expect(next?.id).not.toBe("seed-a2-03");
    }
  });
});
