import { determiner, konj2, nounForm, pi, present, REFLEXIVE, REFLEXIVE_DAT, sentence, type Person } from "../grammar/de";
import * as T from "../grammar/tr";
import { konj1, LX, type DeWho, type Ev, type LV, type St } from "./lexicon";

// Turns events and states into German clauses (with their accepted word orders) and Turkish
// clause text in the form a construction needs ("gittiğim için", "gitmeme rağmen"…).

// ---------- German ----------

export type DeTense = "pres" | "perf" | "praet" | "plusq" | "fut" | "wuerde" | "k2" | "k2perf" | "k1" | "k1perf";

export interface VerbGroup {
  fin: string;
  /** Right bracket: participle or infinitive */
  end: string[];
  /** Separable prefix of the finite verb (simple tenses only) */
  sep?: string;
}

const auxOf = (v: LV): LV => (v.aux === "sein" ? LX.sein : LX.haben);

export function verbGroup(v: LV, p: Person, t: DeTense, modal?: LV): VerbGroup {
  if (modal) {
    const fin = t === "praet" ? modal.praet[pi(p)] : t === "k2" ? konj2(modal, p) : present(modal, p);
    return { fin, end: [v.inf] };
  }
  switch (t) {
    case "pres":
      return { fin: present(v, p), end: [], sep: v.prefix };
    case "praet":
      return { fin: v.praet[pi(p)], end: [], sep: v.prefix };
    case "perf":
      return { fin: present(auxOf(v), p), end: [v.part2] };
    case "plusq":
      return { fin: auxOf(v).praet[pi(p)], end: [v.part2] };
    case "fut":
      return { fin: present(LX.werden, p), end: [v.inf] };
    case "wuerde":
      return { fin: konj2(LX.werden, p), end: [v.inf] };
    case "k2":
      return v.konj2 ? { fin: konj2(v, p), end: [], sep: v.prefix } : { fin: konj2(LX.werden, p), end: [v.inf] };
    case "k2perf":
      return { fin: konj2(auxOf(v), p), end: [v.part2] };
    case "k1":
      return { fin: konj1(v), end: [], sep: v.prefix };
    case "k1perf":
      return { fin: konj1(auxOf(v)), end: [v.part2] };
  }
}

export interface DeClause {
  subj: string;
  vg: VerbGroup;
  refl?: string;
  mid: string[];
  /** The subject is a noun (a reflexive pronoun may then stand before it) */
  noun: boolean;
}

const words = (xs: (string | undefined | false)[]) => xs.filter((x): x is string => Boolean(x));

/** Main clause word orders; `front` stands before the finite verb (verb second). */
export function mainOrders(c: DeClause, front?: string): string[][] {
  const tail = [...c.mid, ...c.vg.end, c.vg.sep];
  if (!front) return [words([c.subj, c.vg.fin, c.refl, ...tail])];
  const out = [words([front, c.vg.fin, c.subj, c.refl, ...tail])];
  if (c.refl && c.noun) out.push(words([front, c.vg.fin, c.refl, c.subj, ...tail]));
  return out;
}

/** Subordinate clause word orders: the finite verb goes last. */
export function subOrders(c: DeClause, conj: string): string[][] {
  const verb = [...c.vg.end, c.vg.sep ? c.vg.sep + c.vg.fin : c.vg.fin];
  const out = [words([conj, c.subj, c.refl, ...c.mid, ...verb])];
  if (c.refl && c.noun) out.push(words([conj, c.refl, c.subj, ...c.mid, ...verb]));
  return out;
}

/** The clause in plain verb-second order without the conjunction, as a learner might wrongly write it after weil/dass… */
export function v2Text(c: DeClause): string {
  return words([c.subj, c.vg.fin, c.refl, ...c.mid, ...c.vg.end, c.vg.sep]).join(" ");
}

/** The words of a subordinate clause after the conjunction (subject … verb). */
export function subText(c: DeClause): string {
  return subOrders(c, "")[0].join(" ");
}

export interface EvOpts {
  time?: string;
  neg?: boolean;
  modal?: LV;
}

export function ownPhrases(e: Ev, who: DeWho): string[] {
  if (!e.own) return [""];
  const { n: owned, de: c } = e.own;
  return owned.de.map((noun) => {
    const g = owned.plural ? "pl" : noun.g;
    return `${determiner(who.det, c, g)} ${nounForm(noun, c, owned.plural)}`;
  });
}

/** Complements of an event as they stand in the middle field (with negation if asked). */
function eventMid(e: Ev, own: string, neg: boolean): string {
  const fill = (s: string) => s.replace("@", own).trim();
  if (!neg) return fill(e.mid ?? "");
  if (e.kein) return e.kein;
  if (e.nicht) return fill(e.nicht);
  const mid = fill(e.mid ?? "");
  if (!mid) return "nicht";
  return e.own || /^(das|die|den|der|dem) /.test(mid) ? `${mid} nicht` : `nicht ${mid}`;
}

/** The middle field of an event (one entry per possessive noun variant). */
export function deMids(e: Ev, who: DeWho, neg = false): string[] {
  return ownPhrases(e, who).map((own) => eventMid(e, own, neg));
}

/** Reflexive pronoun of an event for the subject's person. */
export function reflOf(e: Ev, p: Person): string | undefined {
  return e.refl ? (e.refl === "akk" ? REFLEXIVE : REFLEXIVE_DAT)[p] : undefined;
}

/** German clause variants for an event done by `who`. */
export function deEvent(e: Ev, who: DeWho, t: DeTense, o: EvOpts = {}): DeClause[] {
  const vg = verbGroup(e.v, who.p, t, o.modal);
  const refl = e.refl ? (e.refl === "akk" ? REFLEXIVE : REFLEXIVE_DAT)[who.p] : undefined;
  const noun = !/^(ich|du|er|sie|es|wir|ihr|Sie)$/.test(who.s);
  const out: DeClause[] = [];
  for (const own of ownPhrases(e, who)) {
    const mid = eventMid(e, own, Boolean(o.neg));
    out.push({ subj: who.s, vg, refl, mid: words([o.time, mid]), noun });
    // a definite object may also stand before the time expression
    const definite = Boolean(e.own) || /^(das|die|den|der|dem) \S+$/.test(e.mid ?? "");
    if (o.time && definite && !e.nicht && !(o.neg && e.kein)) {
      const obj = (e.mid ?? "").replace("@", own);
      if (mid.startsWith(obj)) out.push({ subj: who.s, vg, refl, mid: words([obj, o.time, mid.slice(obj.length).trim()]), noun });
    }
  }
  return out;
}

/** German clause for a state (müde sein, keine Zeit haben, es regnet…). */
export function deState(s: St, who: DeWho, t: DeTense, o: { time?: string; neg?: boolean } = {}): DeClause {
  const p: Person = s.subj ? "3sg" : who.p;
  const subj = s.subj ?? who.s;
  const mid = o.neg ? (s.mid ? `nicht ${s.mid}` : "nicht") : s.mid;
  return {
    subj,
    vg: verbGroup(s.v, p, t),
    mid: words([o.time, mid]),
    noun: !/^(ich|du|er|sie|es|wir|ihr|Sie)$/.test(subj),
  };
}

/** Joins clause word lists into a sentence. */
export function joinDe(parts: string[][], end = "."): string {
  return sentence(parts.map((w) => w.join(" ")), end).replace(/ ,/g, ",");
}

// ---------- Turkish ----------

export type TrForm =
  | "pres"
  | "past"
  | "fut"
  | "aor"
  | "pastCont"
  | "pastPerf"
  | "evid"
  | "nec"
  | "necPast"
  | "abil"
  | "inabPast"
  | "abilQ"
  | "presQ"
  | "pastQ"
  | "futQ"
  | "aorPast"
  | "condPast"
  | "condDa"
  | "aorCond"
  | "dikIcin"
  | "dikLoc"
  | "dikAcc"
  | "dikBeri"
  | "futAcc"
  | "vnRagmen"
  | "vnIcin"
  | "infIcin"
  | "infYerine"
  | "madan"
  | "madanOnce"
  | "diktan"
  | "ken"
  | "ince"
  | "ene"
  | "ip"
  | "ipDik"
  | "arak"
  | "vnAcc"
  | "vnDat"
  | "inf"
  | "sinDiye"
  | "optWe"
  | "optWeQ"
  | "optI"
  | "aorQ"
  | "desire"
  | "dikDat"
  | "sana"
  | "sanaPl"
  | "imp"
  | "impPl";

/** The negative stem as a verb of its own: gitme- (aorist gitmez) */
const negVerb = (v: T.TrVerb): T.TrVerb => {
  const stem = v.stem + "m" + T.h2(v.stem);
  return { stem, aor: stem + "z" };
};

/** Turkish verb form for person `p`; postpositions are included (… için, … rağmen, … önce). */
export function trVerb(v: T.TrVerb, p: Person, f: TrForm, neg = false): string {
  const nv = neg ? negVerb(v) : v;
  switch (f) {
    case "pres":
      return T.present(v, p, neg);
    case "past":
      return T.past(v, p, neg);
    case "fut":
      return T.future(nv, p);
    case "aor":
      return T.aorist(v, p, neg);
    case "pastCont":
      return T.pastCont(v, p, neg);
    case "pastPerf":
      return T.pastPerfect(v, p, neg);
    case "evid":
      return T.evidential(v, p, neg);
    case "nec":
      return T.necessity(nv, p);
    case "necPast":
      return T.necessityPast(nv, p);
    case "abil":
      return T.ability(v, p);
    case "inabPast":
      return T.inabilityPast(v, p);
    case "abilQ":
      return T.abilityQ(v, p);
    case "presQ":
      return T.presentQ(nv, p);
    case "pastQ":
      return T.pastQ(nv, p);
    case "futQ":
      return T.futureQ(nv, p);
    case "aorPast":
      return T.aoristPast(nv, p);
    case "condPast":
      return T.condPast(v, p, neg);
    case "condDa": {
      const c = T.cond(v, p, neg);
      return `${c} d${T.h2(c)}`;
    }
    case "aorCond":
      return T.aoristCond(v, p, neg);
    case "dikIcin":
      return `${T.dik(v, p, neg)} için`;
    case "dikLoc":
      return T.partCase(T.dik(v, p, neg), p, "loc");
    case "dikAcc":
      return T.partCase(T.dik(v, p, neg), p, "acc");
    case "dikBeri":
      return `${T.partCase(T.dik(v, p, neg), p, "abl")} beri`;
    case "futAcc":
      return T.partCase(T.futPart(nv, p), p, "acc");
    case "vnRagmen":
      return `${T.possCase(T.verbNoun(v, neg), p, "dat")} rağmen`;
    case "vnIcin":
      return `${T.poss(T.verbNoun(v, neg), p)} için`;
    case "infIcin":
      return `${T.infinitive(nv)} için`;
    case "infYerine":
      return `${T.infinitive(nv)} yerine`;
    case "madan":
      return T.madan(v);
    case "madanOnce":
      return `${T.madan(v)} önce`;
    case "diktan":
      return `${T.diktan(v)} sonra`;
    case "ken":
      return T.ken(v, neg);
    case "ince":
      return T.ince(nv);
    case "ene":
      return `${T.ene(v)} kadar`;
    case "ip":
      return T.ip(v);
    case "ipDik":
      return `${T.ip(v)} ${T.partCase(T.dik(v, p, true), p, "acc")}`;
    case "arak":
      return T.arak(v);
    case "vnAcc":
      return T.kase(T.verbNoun(v, neg), "acc");
    case "vnDat":
      return T.kase(T.verbNoun(v, neg), "dat");
    case "inf":
      return T.infinitive(nv);
    case "sinDiye":
      return `${v.stem}s${T.h4(v.stem)}n diye`;
    case "optWe":
      return T.optativeWe(v);
    case "optWeQ":
      return T.optativeWeQ(v);
    case "optI":
      return T.optativeI(v);
    case "aorQ":
      return T.aoristQ(v, p);
    case "desire":
      return T.desire(v, p);
    case "dikDat":
      return T.partCase(T.dik(v, p, neg), p, "dat");
    case "sana":
      return T.sana(v);
    case "sanaPl":
      return T.sana(v, true);
    case "imp":
      return T.imperative(v);
    case "impPl":
      return T.imperative(v, true);
  }
}

/** Turkish complements of an event for person `p` ("annemi", "eve", "bir kahve"). */
export function trObject(e: Ev, p: Person, neg = false): string {
  const base = neg && e.trNeg !== undefined ? e.trNeg : (e.trObj ?? "");
  if (!base.includes("@") || !e.own) return base;
  const { n: owned, tr: c } = e.own;
  return base.replace("@", T.possCase(owned.tr, p, c, owned.soft));
}

/** Turkish event text: complements + verb form. */
export function trEvent(e: Ev, p: Person, f: TrForm, neg = false): string {
  return [trObject(e, p, neg), trVerb(e.tr, p, f, neg)].filter(Boolean).join(" ");
}

/** Turkish state text in a given form: "yorgunum", "zamanım yok", "yağmur yağdığı için"… */
export function trState(s: St, p: Person, f: TrForm, neg = false): string {
  const tr = s.tr;
  if (tr.k === "cop") {
    const q: Person = tr.subj ? "3sg" : p;
    const n = neg !== Boolean(tr.neg);
    const lead = tr.subj ? `${tr.subj} ` : "";
    if (f === "pres") return lead + (n ? `${tr.word} ${T.copula("değil", q)}` : T.copula(tr.word, q));
    if (f === "past") return lead + (n ? `${tr.word} ${T.copulaPast("değil", q)}` : T.copulaPast(tr.word, q));
    return lead + trVerb(T.tv(`${tr.word} ol`), q, f, n);
  }
  if (tr.k === "have") {
    const n = neg !== Boolean(tr.neg);
    const noun = [tr.pre, T.poss(tr.noun, p, tr.soft)].filter(Boolean).join(" ");
    if (f === "pres") return `${noun} ${n ? "yok" : "var"}`;
    if (f === "past") return `${noun} ${n ? "yoktu" : "vardı"}`;
    return `${noun} ${trVerb(T.tv("ol"), "3sg", f, n)}`;
  }
  const q: Person = tr.subj ? "3sg" : p;
  return [tr.subj, tr.obj, trVerb(tr.v, q, f, neg)].filter(Boolean).join(" ");
}

/** Turkish sentence from parts. */
export function joinTr(parts: (string | null | undefined | false)[], end = "."): string {
  return T.trSentence(parts, end);
}
