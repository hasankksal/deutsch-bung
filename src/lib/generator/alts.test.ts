import { describe, expect, it } from "vitest";
import { gradeLocally } from "../local-grader";
import { expand, say } from "./alts";
import { SPOKEN_BANK } from "./spoken-bank";

describe("sentence patterns", () => {
  it("expands alternatives, optional parts and nested groups", () => {
    expect(expand("Ich {hab|habe} [echt] keine Zeit.")).toEqual(["Ich hab echt keine Zeit.", "Ich hab keine Zeit.", "Ich habe echt keine Zeit.", "Ich habe keine Zeit."]);
    expect(expand("Weißt du [zufällig|vielleicht], ob er kommt?")).toEqual(["Weißt du zufällig, ob er kommt?", "Weißt du vielleicht, ob er kommt?", "Weißt du, ob er kommt?"]);
    expect(expand("{|Komm, }lass uns {gehen|{ins Kino|nach Hause} fahren}!")).toEqual([
      "Lass uns gehen!",
      "Lass uns ins Kino fahren!",
      "Lass uns nach Hause fahren!",
      "Komm, lass uns gehen!",
      "Komm, lass uns ins Kino fahren!",
      "Komm, lass uns nach Hause fahren!",
    ]);
    expect(say("A {b|c}.", "A b.")).toEqual(["A b.", "A c."]);
    expect(() => expand("Ich {hab keine Zeit.")).toThrow();
  });
});

describe("curated spoken sentences", () => {
  /** Every item of a list template (the picker walks through the list). */
  function collect(t: (typeof SPOKEN_BANK)[number]) {
    const out: { tr: string; de: string[] }[] = [];
    for (let i = 0, size = 1; i < size; i++) {
      const g = t.make({
        pick: <T,>(xs: readonly T[]) => {
          size = xs.length;
          return xs[i];
        },
      });
      out.push({ tr: g.tr, de: g.de });
    }
    return out;
  }
  const items = SPOKEN_BANK.flatMap((t) => collect(t).map((x) => ({ ...x, id: t.id })));

  it("has many long sentences, each with clean accepted variants", () => {
    expect(items.length).toBeGreaterThan(90);
    for (const it of items) {
      expect(it.tr, it.id).toMatch(/^\S.*[.?!]$/);
      expect(it.tr.split(" ").length, it.tr).toBeGreaterThanOrEqual(6);
      expect(it.de.length, it.tr).toBeGreaterThan(0);
      for (const d of it.de) {
        expect(d, it.tr).toMatch(/^[A-ZÄÖÜ0-9].*[.?!]$/);
        expect(d, it.tr).not.toMatch(/[{}[\]|]|\s{2}| [.,?!]|,,/);
      }
    }
  });

  it("grades every listed variant as correct", () => {
    for (const t of SPOKEN_BANK) {
      for (const it of collect(t)) {
        const ex = { id: "x", level: t.level, topicId: t.topicId, tr: it.tr, de: it.de, vocab: [], hint: "", source: "gen" as const, ruleIds: t.rules, focus: [] };
        for (const d of it.de) expect(gradeLocally(ex, d).result.verdict, `${it.tr} | ${d}`).toBe("correct");
      }
    }
  });
});
