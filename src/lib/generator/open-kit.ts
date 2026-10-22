import { sentence, type Person } from "../grammar/de";
import type { Focus, Level } from "../types";
import { mainOrders, subOrders, subText, v2Text, type DeClause } from "./clause";
import { focus, type Generated, type Picker, type Template } from "./engine";
import { EVENTS, EVERYONE, fitsWho, type DeWho, type Ev, type Who } from "./lexicon";

// Shared helpers for the open-ended templates: combining clauses, choosing subjects, focus spots.

export const unique = <T,>(xs: T[]): T[] => [...new Set(xs)];

export function openTemplate(
  id: string,
  level: Level,
  topicId: string,
  rules: string[],
  hint: string,
  make: (p: Picker) => Generated,
): Template {
  return { id, level, topicId, rules, hint, make };
}

/** Subordinate clause first; the main clause then starts with its verb. */
export function subFirst(conj: string, subs: DeClause[], mains: DeClause[]): string[] {
  const out: string[] = [];
  for (const s of subs) {
    for (const m of mains) {
      for (const so of subOrders(s, conj)) for (const mo of mainOrders(m, so.join(" ") + ",")) out.push(sentence(mo));
    }
  }
  return out;
}

/** Main clause first, subordinate clause after a comma. */
export function mainFirst(conj: string, subs: DeClause[], mains: DeClause[]): string[] {
  const out: string[] = [];
  for (const s of subs) {
    for (const m of mains) {
      for (const mo of mainOrders(m)) for (const so of subOrders(s, conj)) out.push(sentence([...mo, ",", ...so]));
    }
  }
  return out;
}

/** German sentences in both clause orders. */
export function combine(conj: string, subs: DeClause[], mains: DeClause[], both = true): string[] {
  return unique([...subFirst(conj, subs, mains), ...(both ? mainFirst(conj, subs, mains) : [])]);
}

const PRONOUN = /^(ich|du|er|sie|es|wir|ihr|Sie)$/;

/** The pronoun that refers back to a subject (meine Mutter → sie). */
export function pronounOf(d: DeWho): DeWho {
  if (PRONOUN.test(d.s)) return d;
  return { ...d, s: d.p === "3pl" ? "sie" : d.det === "sein" ? "er" : "sie" };
}

/**
 * Both clauses have the same subject: a noun is named in the first clause and referred to with
 * a pronoun in the second (Obwohl meine Mutter müde war, hat sie … / Meine Mutter hat …, obwohl sie …).
 */
export function combineSame(
  conj: string,
  w: Who,
  sub: (d: DeWho) => DeClause[],
  main: (d: DeWho) => DeClause[],
  both = true,
): string[] {
  const out: string[] = [];
  for (const d of w.de) {
    const pron = pronounOf(d);
    out.push(...subFirst(conj, sub(d), main(pron)));
    if (both) out.push(...mainFirst(conj, sub(pron), main(d)));
  }
  return unique(out);
}

/** Focus spots every subordinate clause sentence shares: verb at the end, verb first in the main clause after it. */
export function clauseFocus(rule: string, conj: string, sub: DeClause, main: DeClause | null): Focus[] {
  const out: Focus[] = [];
  const right = subText(sub);
  const wrong = v2Text(sub);
  if (right !== wrong) {
    out.push(focus(rule, right, [[wrong, `${conj} yan cümle açar; yan cümlede çekimli fiil en sona gider: ${conj} ${right}.`]]));
  }
  if (main) {
    out.push(
      focus("nebensatz", `${main.vg.fin} ${main.subj}`, [
        [`${main.subj} ${main.vg.fin}`, `Yan cümle başta olduğu için ana cümle çekimli fiille başlar: …, ${main.vg.fin} ${main.subj} …`],
      ]),
    );
  }
  return out;
}

export function pickOne<T>(p: Picker, items: readonly T[]): T {
  return p.pick(items);
}

/** A subject that fits the event (no office work for children). */
export function whoFor(p: Picker, e?: Ev, pool: Who[] = EVERYONE): Who {
  return p.pick(pool.filter((w) => !e || fitsWho(e, w)));
}

/** People who would be odd together in one sentence (meine Eltern … mein Vater). */
const OVERLAP: Record<string, string[]> = { ebeveyn: ["anne", "baba"], anne: ["ebeveyn"], baba: ["ebeveyn"] };

/** A second subject different from the first (and not another pronoun of the same Turkish person). */
export function otherWho(p: Picker, first: Who, e?: Ev): Who {
  return p.pick(
    EVERYONE.filter(
      (w) => w.id !== first.id && w.trP !== first.trP && !(OVERLAP[first.id] ?? []).includes(w.id) && (!e || fitsWho(e, w)),
    ),
  );
}

/** Turkish subject as it is written when it must be explicit (pronouns too). */
export const trSubj = (w: Who) => w.tr;

/** Turkish subject that a pro-drop language leaves out when it is a pronoun. */
export const trSubjDrop = (w: Who) => (w.pron ? null : w.tr);

export function eventsWith(tags: string[], exclude: string[] = []): Ev[] {
  return EVENTS.filter((e) => e.tags.some((t) => tags.includes(t)) && !exclude.includes(e.id));
}

/** German realisations shared by two clauses with the same subject. */
export function sameSubject<T>(w: Who, build: (d: DeWho) => T[]): T[] {
  return w.de.flatMap(build);
}

export type { Person };
