import { describe, expect, it } from "vitest";
import { buildReels } from "./reels";

describe("buildReels", () => {
  it("makes one reel per word, each ending on its word", () => {
    const reels = buildReels("Babama yardım ettim.", "seed-a2-03#1");
    expect(reels.map((r) => r.word)).toEqual(["Babama", "yardım", "ettim."]);
    for (const r of reels) {
      expect(r.strip.length).toBeGreaterThan(5);
      expect(r.strip.every((w) => typeof w === "string" && w.length > 0)).toBe(true);
      expect(r.after).toBeTruthy();
    }
  });

  it("stops the reels one after another, within about 1.6 seconds even for long sentences", () => {
    const words = "Bu cümle makara sayısı artsın diye on beş kelimeden oluşan uzun ve biraz da sıkıcı bir örnek";
    for (const text of ["Ich bin müde.", words]) {
      const durations = buildReels(text, "x").map((r) => r.duration);
      expect([...durations].sort((a, b) => a - b)).toEqual(durations);
      expect(Math.max(...durations)).toBeLessThanOrEqual(1650);
    }
  });

  it("gives the same reels for the same seed and different ones for another", () => {
    expect(buildReels("Ich bin müde.", "a")).toEqual(buildReels("Ich bin müde.", "a"));
    expect(buildReels("Ich bin müde.", "a")).not.toEqual(buildReels("Ich bin müde.", "b"));
  });

  it("has no reels for empty text", () => {
    expect(buildReels("   ", "a")).toEqual([]);
  });
});
