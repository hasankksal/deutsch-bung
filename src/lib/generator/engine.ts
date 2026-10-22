import { sentence, type Person } from "../grammar/de";
import type { Exercise, Focus, Level } from "../types";

// Sentence templates combine word lists into Turkish–German pairs. Each run records which
// options it picked, so the same combination always gets the same id.

export interface Picker {
  pick<T>(items: readonly T[]): T;
}

export interface Generated {
  tr: string;
  de: string[];
  vocab?: [string, string][];
  focus?: Focus[];
  hint?: string;
}

export interface Template {
  id: string;
  level: Level;
  topicId: string;
  rules: string[];
  hint: string;
  make(p: Picker): Generated;
}

/** A spot where a rule is tested, with typical wrong forms. Forms equal to `expect` are dropped. */
export function focus(rule: string, expect: string, wrong: [string, string][] = [], missing?: string): Focus {
  const seen = new Set<string>([expect.toLowerCase()]);
  const list = wrong
    .filter(([form]) => {
      const key = form.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(([form, why]) => ({ form, why }));
  return { rule, expect, ...(list.length ? { wrong: list } : {}), ...(missing ? { missing } : {}) };
}

export function run(t: Template, rand: () => number = Math.random): Exercise {
  const trace: number[] = [];
  const picker: Picker = {
    pick(items) {
      if (!items.length) throw new Error(`empty pick in ${t.id}`);
      const i = Math.floor(rand() * items.length);
      trace.push(i);
      return items[i];
    },
  };
  const g = t.make(picker);
  return {
    id: `gen-${t.id}-${trace.join(".")}`,
    level: t.level,
    topicId: t.topicId,
    tr: g.tr,
    de: [...new Set(g.de)],
    vocab: (g.vocab ?? []).map(([de, tr]) => ({ de, tr })),
    hint: g.hint ?? t.hint,
    source: "gen",
    ruleIds: t.rules,
    focus: g.focus ?? [],
    templateId: t.id,
  };
}

/** A main clause in its natural orders: subject first, adverbial fronted (verb stays second), optionally adverbial late. */
export function v2(o: {
  subj: string;
  fin: string;
  adv?: string;
  mid?: string;
  end?: string;
  punct?: string;
  advLate?: boolean;
  frontFirst?: boolean;
}): string[] {
  const subjectFirst = sentence([o.subj, o.fin, o.adv, o.mid, o.end], o.punct);
  if (!o.adv) return [subjectFirst];
  const fronted = sentence([o.adv, o.fin, o.subj, o.mid, o.end], o.punct);
  const out = o.frontFirst ? [fronted, subjectFirst] : [subjectFirst, fronted];
  if (o.advLate && o.mid) out.push(sentence([o.subj, o.fin, o.mid, o.adv, o.end], o.punct));
  return out;
}

export interface Subj {
  /** Turkish person for the verb ending */
  trP: Person;
  /** German subject options (Turkish "o" can be er or sie, "siz" can be ihr or Sie) */
  de: { pron: string; p: Person }[];
}

export const SUBJ = {
  ben: { trP: "1sg", de: [{ pron: "ich", p: "1sg" }] },
  sen: { trP: "2sg", de: [{ pron: "du", p: "2sg" }] },
  o: { trP: "3sg", de: [{ pron: "er", p: "3sg" }, { pron: "sie", p: "3sg" }] },
  biz: { trP: "1pl", de: [{ pron: "wir", p: "1pl" }] },
  siz: { trP: "2pl", de: [{ pron: "ihr", p: "2pl" }, { pron: "Sie", p: "3pl" }] },
  onlar: { trP: "3pl", de: [{ pron: "sie", p: "3pl" }] },
} satisfies Record<string, Subj>;

export type SubjKey = keyof typeof SUBJ;

export interface ListItem {
  tr: string;
  de: string[];
  vocab?: [string, string][];
  focus?: Focus[];
  hint?: string;
}

/** A template that picks one hand-written item: curated sentences with rule annotations. */
export function listTemplate(
  id: string,
  level: Level,
  topicId: string,
  rules: string[],
  hint: string,
  items: ListItem[],
): Template {
  return { id, level, topicId, rules, hint, make: (p) => p.pick(items) };
}
