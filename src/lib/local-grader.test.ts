import { describe, expect, it } from "vitest";
import { TOPICS } from "./curriculum";
import { run } from "./generator/engine";
import { TEMPLATES } from "./generator";
import { alignForDisplay, gradeLocally, words } from "./local-grader";
import { SEED_EXERCISES } from "./seed-sentences";
import { normalizeAnswer, tokenize } from "./text";
import type { Exercise } from "./types";

const seed = (id: string) => SEED_EXERCISES.find((e) => e.id === `seed-${id}`)!;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The generated exercise with this Turkish sentence, found with a fixed seed. */
function generated(templateId: string, tr: string): Exercise {
  const t = TEMPLATES.find((x) => x.id === templateId)!;
  const rand = mulberry32(5);
  for (let i = 0; i < 20000; i++) {
    const ex = run(t, rand);
    if (ex.tr === tr) return ex;
  }
  throw new Error(`${templateId}: no exercise "${tr}"`);
}

describe("text helpers", () => {
  it("normalizes spacing, quotes and final punctuation", () => {
    expect(normalizeAnswer("  Ich  bin   müde .  ")).toBe("Ich bin müde");
    expect(normalizeAnswer("Wann fährt der Zug ab?")).toBe("Wann fährt der Zug ab");
  });

  it("tokenizes words and punctuation; words() expands contractions", () => {
    expect(tokenize("Ich kann nicht kommen, weil ich krank bin")).toContain(",");
    expect(words("Wir gehen ins Kino.")).toEqual(["Wir", "gehen", "in", "das", "Kino"]);
  });
});

describe("trivial differences are not errors", () => {
  const dativ = seed("a2-03");

  it("accepts exact and alternative translations", () => {
    expect(gradeLocally(dativ, " Ich habe meinem Vater geholfen ").result.verdict).toBe("correct");
    expect(gradeLocally(dativ, "Ich half meinem Vater!").result.verdict).toBe("correct");
  });

  it("ignores capitalization but leaves a note", () => {
    const g = gradeLocally(dativ, "ich habe meinem vater geholfen");
    expect(g.confident).toBe(true);
    expect(g.result.verdict).toBe("correct");
    expect(g.result.errors).toHaveLength(0);
    expect(g.result.notes.join(" ")).toContain("Vater");
  });

  it("ignores missing commas, umlaut spelling and contractions", () => {
    expect(gradeLocally(seed("a2-07"), "Ich kann heute nicht kommen weil ich krank bin").result.verdict).toBe("correct");
    expect(gradeLocally(seed("a2-10"), "Berlin ist groesser als Muenchen").result.verdict).toBe("correct");
    expect(gradeLocally(seed("a2-10"), "Berlin ist grosser als Munchen").result.verdict).toBe("correct");
    const ex: Exercise = { ...dativ, de: ["Wir gehen ins Kino."] };
    const g = gradeLocally(ex, "Wir gehen in das Kino");
    expect(g.result.verdict).toBe("correct");
    expect(g.result.notes.join(" ")).toContain("ins");
  });
});

describe("natural alternative translations are accepted", () => {
  const concert = "Bu akşam iş arkadaşlarımla bir konsere gidiyorum.";
  const verdict = (ex: Exercise, answer: string) => gradeLocally(ex, answer).result.verdict;

  it("accepts 'in ein Konzert' and 'ins Konzert' next to 'zu einem Konzert'", () => {
    const ex = generated("a2-mit", concert);
    for (const answer of [
      "Heute Abend gehe ich mit meinen Kollegen in ein Konzert",
      "Ich gehe heute Abend mit meinen Kollegen ins Konzert.",
      "Heute Abend gehe ich mit meinen Kollegen zu einem Konzert.",
      "Heute Abend gehe ich mit meinen Arbeitskollegen in ein Konzert.",
    ]) {
      expect(verdict(ex, answer), answer).toBe("correct");
    }
  });

  it("still catches a real mistake in the same sentence", () => {
    const g = gradeLocally(generated("a2-mit", concert), "Heute Abend gehe ich mit meine Kollegen in ein Konzert");
    expect(g.result.verdict).not.toBe("correct");
    expect(g.result.errors).toHaveLength(1);
    expect(g.result.errors[0]).toMatchObject({ wrong: "meine", fix: "meinen" });
    expect(g.result.errors[0].explanation).toContain("mit her zaman Dativ ister");
  });

  it("accepts other common wordings", () => {
    const cases: [string, string, string][] = [
      ["a1-tasitla", "Bugün bisikletle şehir merkezine gidiyorum.", "Ich fahre heute mit dem Rad ins Stadtzentrum."],
      ["a1-akk-ariyorum", "Şemsiyemi arıyorum.", "Ich suche meinen Schirm."],
      ["a1-duzensiz", "Cuma günleri arkadaşlarla buluşuyorum.", "Ich treffe mich freitags mit Freunden."],
      ["a1-ayrilabilen-saat", "Film saat sekizde başlıyor.", "Der Film beginnt um 8 Uhr."],
      ["a2-weil", "Partiye gitmiyorum çünkü hastayım.", "Ich gehe nicht auf die Party, weil ich krank bin."],
    ];
    for (const [id, tr, answer] of cases) expect(verdict(generated(id, tr), answer), answer).toBe("correct");
    expect(verdict(seed("a2-08"), "Ich finde Deutsch schwierig.")).toBe("correct");
  });

  it("a synonym does not hide the separable-verb rule", () => {
    const g = gradeLocally(generated("a1-ayrilabilen-saat", "Film saat sekizde başlıyor."), "Der Film anfängt um acht Uhr.");
    expect(g.result.verdict).not.toBe("correct");
    expect(g.result.errors[0].explanation).toContain("Ön ek ayrılır");
  });
});

describe("real mistakes are located and explained with a rule", () => {
  it("explains a wrong case after helfen", () => {
    const g = gradeLocally(seed("a2-03"), "Ich habe meinen Vater geholfen");
    expect(g.result.verdict).not.toBe("correct");
    expect(g.result.errors).toHaveLength(1);
    const e = g.result.errors[0];
    expect(e).toMatchObject({ wrong: "meinen", fix: "meinem", category: "hal" });
    expect(e.rule?.id).toBe("dativ-verben");
    expect(e.explanation).toContain('Sen "meinen" yazdın');
  });

  it("explains a missing article", () => {
    const e = gradeLocally(seed("a1-02"), "Ich habe Bruder und zwei Schwestern").result.errors[0];
    expect(e.category).toBe("eksik_kelime");
    expect(e.fix).toBe("einen");
    expect(e.rule?.id).toBe("eksik-artikel");
  });

  it("recognizes pure word-order mistakes and names the rule", () => {
    const g = gradeLocally(seed("a1-09"), "Morgen ich muss früh aufstehen");
    expect(g.result.errors[0].category).toBe("kelime_sirasi");
    expect(g.result.errors[0].rule?.id).toBe("modal");
  });

  it("uses the sentence's focus spots for precise reasons", () => {
    const ex = run(TEMPLATES.find((t) => t.id === "a2-dativ-fiiller")!, mulberry32(3));
    const focus = ex.focus!.find((f) => f.wrong?.length)!;
    const wrongAnswer = ex.de[0].replace(focus.expect, focus.wrong![0].form);
    const g = gradeLocally(ex, wrongAnswer);
    expect(g.result.verdict).not.toBe("correct");
    expect(g.result.errors.some((e) => e.explanation.includes(focus.wrong![0].why))).toBe(true);
    expect(g.confident).toBe(true);
  });

  it("flags answers that have little in common with the reference", () => {
    const g = gradeLocally(seed("a2-03"), "Das Wetter ist heute schön");
    expect(g.result.errors[0].category).toBe("anlam");
  });
});

describe("sentence banks are self-consistent", () => {
  it("seed sentences: ids, topics and accepted translations", () => {
    const ids = new Set(SEED_EXERCISES.map((e) => e.id));
    expect(ids.size).toBe(SEED_EXERCISES.length);
    for (const e of SEED_EXERCISES) {
      expect(TOPICS.find((t) => t.id === e.topicId)?.level, e.id).toBe(e.level);
      for (const d of e.de) expect(gradeLocally(e, d).result.verdict, `${e.id}: ${d}`).toBe("correct");
    }
  });

  it("every topic has practice material", () => {
    for (const t of TOPICS) {
      const has = SEED_EXERCISES.some((e) => e.topicId === t.id) || TEMPLATES.some((x) => x.topicId === t.id);
      expect(has, t.id).toBe(true);
    }
  });

  it("generated sentences: every accepted variant is graded correct", () => {
    const rand = mulberry32(7);
    for (const t of TEMPLATES) {
      for (let i = 0; i < 25; i++) {
        const ex = run(t, rand);
        for (const d of ex.de) expect(gradeLocally(ex, d).result.verdict, `${t.id}: ${d}`).toBe("correct");
      }
    }
  });

  it("generated sentences: typical wrong forms are caught with their specific reason", () => {
    const rand = mulberry32(11);
    let tried = 0;
    const misses: string[] = [];
    for (const t of TEMPLATES) {
      for (let i = 0; i < 12; i++) {
        const ex = run(t, rand);
        for (const f of ex.focus ?? []) {
          const base = ex.de.find((d) => d.toLowerCase().includes(f.expect.toLowerCase()));
          if (!base) continue;
          for (const w of f.wrong ?? []) {
            const at = base.toLowerCase().indexOf(f.expect.toLowerCase());
            const answer = base.slice(0, at) + w.form + base.slice(at + f.expect.length);
            const g = gradeLocally(ex, answer);
            if (g.result.verdict === "correct") continue; // the "wrong" form is also an accepted variant here
            tried++;
            const hit = g.result.errors.some((e) => e.explanation.includes(w.why));
            if (!hit) misses.push(`${t.id} | ${answer} | expected: ${w.why} | got: ${g.result.errors.map((e) => e.explanation).join(" / ")}`);
          }
        }
      }
    }
    if (misses.length) console.log(misses.slice(0, 40).join("\n"));
    expect(tried).toBeGreaterThan(300);
    expect(misses.length / tried).toBeLessThan(0.1);
  });
});

describe("everyday spoken German (level GK)", () => {
  const spoken = (de: string[], level: Exercise["level"] = "GK"): Exercise => ({
    id: "t-gk",
    level,
    topicId: level === "GK" ? "gk-argo" : "a1-sein-haben",
    tr: "…",
    de,
    vocab: [],
    hint: "",
    source: "gen",
    ruleIds: ["indirekte-frage"],
    focus: [],
  });
  const verdict = (ex: Exercise, answer: string) => gradeLocally(ex, answer).result.verdict;

  it("accepts spoken short forms next to the full ones", () => {
    const bock = spoken(["Ich habe null Bock, heute das Geschirr zu spülen, aber ich muss wohl."]);
    expect(verdict(bock, "Ich hab null Bock, heute das Geschirr zu spülen, aber ich muss wohl")).toBe("correct");
    const wie = spoken(["Wie wär's, wenn wir heute Abend ins Kino gehen?"]);
    for (const a of ["Wie wäre es, wenn wir heute Abend ins Kino gehen?", "Wie wärs wenn wir heute abend ins Kino gehen", "Wie wär es, wenn wir heute Abend ins Kino gehen?"]) {
      expect(verdict(wie, a), a).toBe("correct");
    }
    const drauf = spoken(["Es kommt darauf an, ob Ali morgen kommen kann."]);
    expect(verdict(drauf, "Es kommt drauf an, ob Ali morgen kommen kann")).toBe("correct");
    const geh = spoken(["Dann gehe ich eben nach Hause."]);
    expect(verdict(geh, "Dann geh ich eben nach Hause")).toBe("correct");
    expect(verdict(spoken(["Ich habe nichts gemacht."]), "Ich hab nix gemacht")).toBe("correct");
  });

  it("filler particles only leave a note", () => {
    const ex = spoken(["Wenn das Wetter morgen schön ist, könnten wir doch Fahrrad fahren, oder?"]);
    const g = gradeLocally(ex, "Wenn das Wetter morgen schön ist, könnten wir Fahrrad fahren, oder?");
    expect(g.result.verdict).toBe("correct");
    expect(g.result.notes.join(" ")).toContain("doch");
    expect(verdict(ex, "Wenn das Wetter morgen echt schön ist, könnten wir doch mal Fahrrad fahren, oder?")).toBe("correct");
  });

  it("shows the wording closest to the answer and does not mark spoken forms in the diff", () => {
    const ex = spoken(["Ich hab gehört, dass du Fotos gemacht hast.", "Ich habe gehört, dass du Fotos gemacht hast."]);
    const g = gradeLocally(ex, "Ich habe gehört, dass du hast Fotos gemacht");
    expect(g.result.corrected).toBe("Ich habe gehört, dass du Fotos gemacht hast.");
    const diff = alignForDisplay("Ich habe gehört", "Ich hab gehört", true);
    expect(diff.every((o) => o.type === "same")).toBe(true);
    expect(alignForDisplay("Ich habe gehört", "Ich hab gehört").some((o) => o.type !== "same")).toBe(true);
  });

  it("keeps real mistakes and stays strict outside the spoken level", () => {
    const ob = spoken(["Weißt du zufällig, ob Ali morgen kommt?"]);
    expect(verdict(ob, "Weißt du zufällig, ob kommt Ali morgen?")).toBe("incorrect");
    expect(verdict(ob, "Weißt du zufällig, ob Ali morgen kommen?")).not.toBe("correct");
    expect(verdict(spoken(["Ich habe keine Zeit."], "A1"), "Ich hab keine Zeit")).not.toBe("correct");
    expect(verdict(spoken(["Ich habe doch keine Zeit."], "A1"), "Ich habe keine Zeit")).not.toBe("correct");
  });
});
