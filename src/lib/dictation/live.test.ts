import { describe, expect, it } from "vitest";
import { decideTick, initialLiveState, lineAt, liveReducer, liveScore, type TimedLine } from "./live";

const lines: TimedLine[] = [
  { start: 10, end: 14 },
  { start: 14, end: 18 },
  { start: 25, end: 29 },
];
const base = { lines, line: 0, prevT: null, playing: true, mode: "bekle" as const, pausedFor: null };

describe("lineAt", () => {
  it("finds the sung line, the next one in a gap and the end", () => {
    expect(lineAt(lines, 0)).toBe(0);
    expect(lineAt(lines, 15)).toBe(1);
    expect(lineAt(lines, 20)).toBe(2);
    expect(lineAt(lines, 40)).toBe(3);
  });
});

describe("decideTick", () => {
  it("waits for the learner in bekle mode", () => {
    expect(decideTick({ ...base, t: 13.9, prevT: 13.8 })).toEqual({ type: "none" });
    expect(decideTick({ ...base, t: 14.05, prevT: 13.95 })).toEqual({ type: "pause" });
    expect(decideTick({ ...base, t: 14.05, prevT: 14.05, playing: false, pausedFor: 0 })).toEqual({ type: "none" });
  });

  it("moves on if the learner presses play while it waits", () => {
    expect(decideTick({ ...base, t: 15.2, prevT: 15.1, pausedFor: 0 })).toEqual({ type: "jump", to: 1, miss: true, count: true });
  });

  it("never stops in akis mode and counts the rest as missed", () => {
    expect(decideTick({ ...base, mode: "akis", t: 14.1, prevT: 14 })).toEqual({ type: "none" });
    expect(decideTick({ ...base, mode: "akis", t: 14.3, prevT: 14.2 })).toEqual({ type: "jump", to: 1, miss: true, count: true });
    expect(decideTick({ ...base, mode: "akis", line: 2, t: 29.05, prevT: 29.05, playing: false })).toEqual({ type: "jump", to: 3, miss: true, count: true });
  });

  it("follows seeks without counting them", () => {
    expect(decideTick({ ...base, t: 26, prevT: 11 })).toEqual({ type: "jump", to: 2, miss: true, count: false });
    expect(decideTick({ ...base, line: 2, t: 11, prevT: 26 })).toEqual({ type: "jump", to: 0, miss: false, count: false });
  });
});

describe("liveReducer", () => {
  const slots = Array.from("hallo");

  it("finishes a line, clears the wait and keeps the result", () => {
    let s = liveReducer(initialLiveState(), { type: "paused", line: 0 });
    s = liveReducer(s, { type: "keys", chars: "hxallo", slots });
    expect(s.line).toBe(1);
    expect(s.pausedFor).toBeNull();
    expect(s.results[0]).toEqual({ typed: 5, hinted: [], missedFrom: null });
    expect([s.correct, s.mistakes]).toEqual([5, 1]);
  });

  it("records missed letters when the song moves on", () => {
    let s = liveReducer(initialLiveState(), { type: "keys", chars: "ha", slots });
    s = liveReducer(s, { type: "jump", to: 1, slots, miss: true, count: true });
    expect(s.results[0].missedFrom).toBe(2);
    expect(s.missed).toBe(3);
    expect(liveScore(s)).toBe(40);
  });

  it("forgets later results when jumping back", () => {
    let s = liveReducer(initialLiveState(), { type: "keys", chars: "hallo", slots });
    s = liveReducer(s, { type: "jump", to: 0, slots, miss: false, count: false });
    expect(s.line).toBe(0);
    expect(s.results).toEqual({});
  });
});
