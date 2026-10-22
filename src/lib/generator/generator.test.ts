import { describe, expect, it } from "vitest";
import { RULES } from "../grammar/rules";
import { TOPICS } from "../curriculum";
import { run } from "./engine";
import { generateBatch, generateSimilar, TEMPLATES } from "./index";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("sentence templates", () => {
  for (const t of TEMPLATES) {
    it(`${t.id} produces well-formed pairs`, () => {
      const topic = TOPICS.find((x) => x.id === t.topicId);
      expect(topic?.level).toBe(t.level);
      for (const r of t.rules) expect(RULES[r], `${t.id}: unknown rule ${r}`).toBeDefined();
      const rand = mulberry32(t.id.length * 7919);
      for (let i = 0; i < 80; i++) {
        const ex = run(t, rand);
        const where = `${t.id} → ${ex.tr}`;
        expect(ex.tr, where).toMatch(/^\S.*[.?!]$/);
        expect(ex.tr, where).not.toMatch(/undefined|\bnull\b(?! Bock)|\s{2}| \.|\?\?/);
        expect(ex.de.length, where).toBeGreaterThan(0);
        for (const d of ex.de) {
          expect(d, where).toMatch(/^[A-ZÄÖÜ0-9].*[.?!]$/);
          expect(d, `${where} | ${d}`).not.toMatch(/undefined|\bnull\b(?! Bock)|\s{2}| [.,?!]|,,/);
        }
        for (const f of ex.focus ?? []) {
          expect(f.rule in RULES, `${where}: focus rule ${f.rule}`).toBe(true);
          const found = ex.de.some((d) => d.toLowerCase().includes(f.expect.toLowerCase()));
          expect(found, `${where}: focus "${f.expect}" not in ${ex.de.join(" | ")}`).toBe(true);
        }
      }
    });
  }

  it("generates fresh sentences and similar follow-ups", () => {
    const batch = generateBatch({ level: "A2", topicId: "a2-dativ", count: 8, avoid: new Set(), rand: mulberry32(1) });
    expect(batch.length).toBe(8);
    expect(new Set(batch.map((b) => b.id)).size).toBe(8);
    const similar = generateSimilar(batch[0], new Set());
    expect(similar).not.toBeNull();
    expect(similar!.id).not.toBe(batch[0].id);
    expect(similar!.topicId).toBe(batch[0].topicId);
  });
});

if (process.env.SHOW_SAMPLES) {
  it("prints samples", () => {
    const rand = mulberry32(42);
    for (const t of TEMPLATES) {
      console.log(`\n### ${t.id}`);
      for (let i = 0; i < Number(process.env.SHOW_SAMPLES); i++) {
        const ex = run(t, rand);
        console.log(`TR: ${ex.tr}\n   ${ex.de.slice(0, 3).join("  |  ")}${ex.de.length > 3 ? `  (+${ex.de.length - 3})` : ""}`);
      }
    }
  });
}
