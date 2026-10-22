import { describe, expect, it } from "vitest";
import { TOPICS } from "../curriculum";
import { RULES } from "../grammar/rules";
import { gradeLocally } from "../local-grader";
import { run, type Template } from "./engine";
import { OPEN_A } from "./open-a";
import { OPEN_B1 } from "./open-b1";
import { OPEN_B2C1 } from "./open-b2c1";
import { OPEN_C1 } from "./open-c1";
import { SPOKEN } from "./spoken";

const OPEN: Template[] = [...OPEN_A, ...OPEN_B1, ...OPEN_B2C1, ...OPEN_C1, ...SPOKEN];

/** Curated patterns with a smaller (but still large) set; their topics also have bigger templates. */
const MIN_UNIQUE: Record<string, number> = {
  "b2-acik-je-desto": 40,
  "gk-zor-rica": 55,
  "c1-zor-als-ob": 75,
  "c1-zor-passiversatz": 60,
  "c1-zor-irreal": 60,
  "c1-zor-partikel": 50,
};

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("open-ended templates", () => {
  for (const t of OPEN) {
    it(`${t.id}: well-formed, varied and graded correctly`, () => {
      expect(TOPICS.find((x) => x.id === t.topicId)?.level).toBe(t.level);
      for (const r of t.rules) expect(RULES[r], `${t.id}: unknown rule ${r}`).toBeDefined();
      const rand = mulberry32(t.id.length * 104729);
      const seen = new Set<string>();
      for (let i = 0; i < 150; i++) {
        const ex = run(t, rand);
        seen.add(ex.tr);
        const where = `${t.id} → ${ex.tr}`;
        expect(ex.tr, where).toMatch(/^\S.*[.?!]$/);
        expect(ex.tr, where).not.toMatch(/undefined|\bnull\b(?! Bock)|\s{2}| [.,?!]|@/);
        expect(ex.de.length, where).toBeGreaterThan(0);
        for (const d of ex.de) {
          expect(d, where).toMatch(/^[A-ZÄÖÜ0-9].*[.?!]$/);
          expect(d, `${where} | ${d}`).not.toMatch(/undefined|\bnull\b(?! Bock)|\s{2}| [.,?!]|,,|@/);
        }
        for (const f of ex.focus ?? []) {
          expect(f.rule in RULES, `${where}: focus rule ${f.rule}`).toBe(true);
          expect(ex.de.some((d) => d.toLowerCase().includes(f.expect.toLowerCase())), `${where}: focus "${f.expect}"`).toBe(true);
        }
        if (i < 40) for (const d of ex.de) expect(gradeLocally(ex, d).result.verdict, `${where} | ${d}`).toBe("correct");
      }
      // practically endless: many different sentences already in a small sample
      expect(seen.size, t.id).toBeGreaterThan(MIN_UNIQUE[t.id] ?? 90);
    });
  }

  it("typical wrong forms are caught with their specific reason", () => {
    const rand = mulberry32(17);
    let tried = 0;
    const misses: string[] = [];
    for (const t of OPEN) {
      for (let i = 0; i < 25; i++) {
        const ex = run(t, rand);
        for (const f of ex.focus ?? []) {
          const base = ex.de.find((d) => d.toLowerCase().includes(f.expect.toLowerCase()));
          if (!base) continue;
          for (const w of f.wrong ?? []) {
            const at = base.toLowerCase().indexOf(f.expect.toLowerCase());
            const answer = base.slice(0, at) + w.form + base.slice(at + f.expect.length);
            const g = gradeLocally(ex, answer);
            if (g.result.verdict === "correct") continue;
            tried++;
            if (!g.result.errors.some((e) => e.explanation.includes(w.why))) {
              misses.push(`${t.id} | ${answer} | expected: ${w.why} | got: ${g.result.errors.map((e) => e.explanation).join(" / ")}`);
            }
          }
        }
      }
    }
    if (misses.length) console.log(misses.slice(0, 30).join("\n"));
    expect(tried).toBeGreaterThan(200);
    expect(misses.length / tried).toBeLessThan(0.1);
  });
});
