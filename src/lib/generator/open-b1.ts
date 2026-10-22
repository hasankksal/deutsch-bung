import { determiner, REFLEXIVE, sentence, zuInf, type Person } from "../grammar/de";
import * as T from "../grammar/tr";
import type { Focus } from "../types";
import {
  deEvent,
  deMids,
  deState,
  joinTr,
  mainOrders,
  reflOf,
  subOrders,
  subText,
  trEvent,
  trObject,
  trState,
  trVerb,
  verbGroup,
  type DeClause,
  type DeTense,
} from "./clause";
import { focus, type Generated, type Picker } from "./engine";
import {
  EVENTS,
  EVERYONE,
  fitsTime,
  fitsWho,
  LX,
  PEOPLE,
  PRONOUNS,
  STATES,
  WHEN_HABIT,
  WHEN_NOW,
  WHEN_PAST,
  type DeWho,
  type Ev,
  type LV,
  type St,
  type Tag,
  type When,
  type Who,
} from "./lexicon";
import { clauseFocus, combine, combineSame, mainFirst, openTemplate, otherWho, pronounOf, unique, whoFor } from "./open-kit";

// Open-ended B1 (and some A2) templates: every sentence is put together from an event or state,
// a subject, a time and a connector, so the same pattern can be practised with thousands of sentences.

const E = (id: string): Ev => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`unknown event ${id}`);
  return e;
};

const has = (e: Ev, ...tags: Tag[]) => e.tags.some((t) => tags.includes(t));
const words = (xs: (string | undefined | null | false)[]) => xs.filter((x): x is string => Boolean(x)).join(" ");
const PAST_MAIN: DeTense[] = ["perf", "praet"];

/** Turkish pronouns stay explicit where the verb form does not show the person (2sg/3sg -dığında…). */
const trAmbiguous = (w: Who) => (w.pron && (w.trP === "2sg" || w.trP === "3sg") ? w.tr : !w.pron ? w.tr : null);
const trNoun = (w: Who) => (w.pron ? null : w.tr);
/** Subject in front of a state: "Annem yorgun olduğu için…" but "Annemin zamanı olmadığı için…" */
const trFront = (w: Who, st: St) => (w.pron ? null : st.tr.k === "have" ? w.gen : w.tr);

function timeFor(p: Picker, e: Ev, pool: When[], optional = true): When | null {
  const fit = pool.filter((w) => fitsTime(e, w));
  return p.pick(optional ? [null, ...fit] : fit);
}

function stateSubTenses(st: St, past: boolean): DeTense[] {
  if (!past) return ["pres"];
  return st.v === LX.sein || st.v === LX.haben ? ["praet"] : ["praet", "perf"];
}

// ---------- cause and concession: weil, obwohl ----------

function causeTemplate(kind: "weil" | "obwohl", id: string, level: "A2" | "B1", topicId: string, rules: string[], hint: string) {
  return openTemplate(id, level, topicId, rules, hint, (p) => {
    const past = p.pick([false, true]);
    const states = STATES.filter((s) => (kind === "obwohl" ? s.despite : s.because).length > 0 && !(past && s.presentOnly));
    const st = p.pick(states);
    const tags = kind === "obwohl" ? st.despite : st.because;
    const e = p.pick(EVENTS.filter((x) => has(x, ...tags) && !has(x, "arrive")));
    const w = whoFor(p, e);
    const when = timeFor(p, e, past ? WHEN_PAST : WHEN_NOW);
    const personal = !st.subj;
    const sub = (d: DeWho) => stateSubTenses(st, past).map((t) => deState(st, d, t));
    const main = (d: DeWho) => (past ? PAST_MAIN : (["pres"] as DeTense[])).flatMap((t) => deEvent(e, d, t, { time: when?.de }));
    const de = personal ? combineSame(kind, w, sub, main) : combine(kind, sub(w.de[0]), w.de.flatMap(main));
    const subTr = trState(st, w.trP, kind === "obwohl" ? "vnRagmen" : "dikIcin");
    const mainTr = trEvent(e, w.trP, past ? "past" : "pres");
    const tr = personal ? joinTr([trFront(w, st), subTr, when?.tr, mainTr]) : joinTr([subTr, trNoun(w), when?.tr, mainTr]);
    const d0 = w.de[0];
    const focusList: Focus[] = clauseFocus(kind === "obwohl" ? "obwohl" : "weil-denn", kind, sub(d0)[0], main(personal ? pronounOf(d0) : d0)[0]);
    if (kind === "obwohl") {
      focusList.push(focus("obwohl", "obwohl", [["trotz", "trotz bir isimle kullanılır (trotz des Regens); yan cümle için obwohl gerekir."]]));
    }
    return {
      tr,
      de,
      vocab: [kind === "obwohl" ? ["obwohl", "-e rağmen"] : ["weil", "-dığı için, çünkü"], st.vocab, e.vocab],
      focus: focusList,
    };
  });
}

const weilA2 = causeTemplate(
  "weil",
  "a2-acik-weil",
  "A2",
  "a2-nebensatz",
  ["weil-denn", "nebensatz"],
  "weil'li yan cümlede çekimli fiil sona gider: …, weil ich müde bin.",
);
const obwohlB1 = causeTemplate(
  "obwohl",
  "b1-acik-obwohl",
  "B1",
  "b1-nebensatz",
  ["obwohl", "nebensatz"],
  "obwohl (-e rağmen): yan cümlede fiil sona gider; yan cümle başta ise ana cümle fiille başlar.",
);

// ---------- conditions and "when": wenn ----------

const WHEN_TRIGGERS = ["eve-gel", "eve-don", "var-ofis", "var-okul", "ise-git", "okula-git"];

const wennA2 = openTemplate(
  "a2-acik-wenn",
  "A2",
  "a2-nebensatz",
  ["nebensatz"],
  "wenn (eğer / -ınca): yan cümlede fiil sona gider; yan cümle başta ise ana cümle fiille başlar.",
  (p) => {
    if (p.pick([true, false])) {
      const st = p.pick(STATES.filter((s) => s.because.length > 0));
      const e = p.pick(EVENTS.filter((x) => has(x, ...st.because) && !has(x, "arrive", "bad")));
      const w = whoFor(p, e);
      const personal = !st.subj;
      const sub = (d: DeWho) => [deState(st, d, "pres")];
      const main = (d: DeWho) => deEvent(e, d, "pres");
      const de = personal ? combineSame("wenn", w, sub, main) : combine("wenn", sub(w.de[0]), w.de.flatMap(main));
      const subTr = trState(st, w.trP, "aorCond");
      const mainTr = trEvent(e, w.trP, "aor");
      const d0 = w.de[0];
      return {
        tr: personal ? joinTr([trFront(w, st), subTr, mainTr]) : joinTr([subTr, trNoun(w), mainTr]),
        de,
        vocab: [["wenn", "eğer, -ırsa / -dığında"], st.vocab, e.vocab],
        focus: clauseFocus("nebensatz", "wenn", sub(d0)[0], main(personal ? pronounOf(d0) : d0)[0]),
      };
    }
    const e1 = E(p.pick(WHEN_TRIGGERS));
    const e2 = p.pick(EVENTS.filter((x) => x !== e1 && !has(x, "move", "arrive", "bad") && !(has(e1, "morning") && has(x, "evening"))));
    const w = p.pick(EVERYONE.filter((x) => fitsWho(e1, x) && fitsWho(e2, x)));
    const sub = (d: DeWho) => deEvent(e1, d, "pres");
    const main = (d: DeWho) => deEvent(e2, d, "pres");
    const d0 = w.de[0];
    return {
      tr: joinTr([trNoun(w), trEvent(e1, w.trP, "ince"), trEvent(e2, w.trP, "aor")]),
      de: combineSame("wenn", w, sub, main),
      vocab: [["wenn", "-ınca, -dığında"], e1.vocab, e2.vocab],
      focus: clauseFocus("nebensatz", "wenn", sub(d0)[0], main(pronounOf(d0))[0]),
    };
  },
);

// ---------- dass ----------

const DASS_VERBS: { v: LV; tr: T.TrVerb; vocab: [string, string] }[] = [
  { v: LX.glauben, tr: T.tv("san"), vocab: ["glauben", "sanmak, inanmak"] },
  { v: LX.wissen, tr: T.tv("bil"), vocab: ["wissen", "bilmek"] },
  { v: LX.hoffen, tr: T.tv("um"), vocab: ["hoffen", "ummak"] },
  { v: LX.denken, tr: T.tv("düşün"), vocab: ["denken", "düşünmek"] },
];

const dassA2 = openTemplate(
  "a2-acik-dass",
  "A2",
  "a2-nebensatz",
  ["nebensatz"],
  "dass'lı yan cümlede çekimli fiil sona gider: Ich weiß, dass er heute kommt.",
  (p) => {
    const mv = p.pick(DASS_VERBS);
    const w1 = p.pick(PRONOUNS);
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "mini")));
    const w2 = otherWho(p, w1, e);
    const tense = p.pick(["pres", "past", "fut"] as const);
    const when =
      tense === "past"
        ? timeFor(p, e, WHEN_PAST, false)
        : tense === "fut"
          ? p.pick([{ de: "morgen", tr: "yarın" }, { de: "am Wochenende", tr: "hafta sonu" }])
          : timeFor(p, e, [{ de: "heute", tr: "bugün" }, { de: "jetzt", tr: "şimdi" }, ...WHEN_HABIT], false);
    const t: DeTense = tense === "past" ? "perf" : "pres";
    const subs = w2.de.flatMap((d) => deEvent(e, d, t, { time: when?.de }));
    const mains: DeClause[] = w1.de.map((d) => ({ subj: d.s, vg: verbGroup(mv.v, d.p, "pres"), mid: [], noun: false }));
    const de = unique(mainFirst("dass", subs, mains));
    const form = tense === "fut" ? "futAcc" : "dikAcc";
    return {
      tr: joinTr([w2.gen, when?.tr, trEvent(e, w2.trP, form), trVerb(mv.tr, w1.trP, "pres")]),
      de,
      vocab: [["dass", "-dığını (bağlaç)"], mv.vocab, e.vocab],
      focus: [
        ...clauseFocus("nebensatz", "dass", subs[0], null),
        focus("nebensatz", "dass", [["das", "Yan cümle bağlacı çift s ile yazılır: dass. (das bir artikel ya da zamirdir.)"]]),
      ],
    };
  },
);

// ---------- als ----------

const ARRIVALS = ["eve-gel", "eve-don", "var-istasyon", "var-ofis", "var-parti", "var-okul"];
const background = (x: Ev) =>
  has(x, "fun", "food", "rest", "chore", "study", "home") && !has(x, "move", "arrive", "bad") && x.id !== "uyuyakal";
/** Habits rather than single actions: odd as "before / after" events */
const NOT_IN_SEQUENCE = ["para", "almanca", "uyuyakal"];

const alsB1 = openTemplate(
  "b1-acik-als",
  "B1",
  "b1-nebensatz",
  ["als-wenn", "nebensatz"],
  "Geçmişte bir kez olan olay: als + fiil sonda. Yan cümle başta ise ana cümle fiille başlar.",
  (p) => {
    const e1 = E(p.pick(ARRIVALS));
    const w1 = whoFor(p, e1);
    const same = p.pick([true, false]);
    const e2 = p.pick(EVENTS.filter((x) => x !== e1 && (same ? !has(x, "arrive", "move") : background(x))));
    const w2 = same ? w1 : otherWho(p, w1, e2);
    const sub = (d: DeWho) => deEvent(e1, d, "praet");
    const main = (d: DeWho) => PAST_MAIN.flatMap((t) => deEvent(e2, d, t));
    const de = same ? combineSame("als", w1, sub, main) : combine("als", w1.de.flatMap(sub), w2.de.flatMap(main));
    const d1 = w1.de[0];
    const subTr = trEvent(e1, w1.trP, "dikLoc");
    const tr = same
      ? joinTr([trNoun(w1), subTr, trEvent(e2, w1.trP, "past")])
      : joinTr([trAmbiguous(w1), subTr, w2.tr, trEvent(e2, w2.trP, "pastCont")]);
    return {
      tr,
      de,
      vocab: [["als", "-dığında (geçmişte bir kez)"], e1.vocab, e2.vocab],
      focus: [
        ...clauseFocus("nebensatz", "als", sub(d1)[0], main(same ? pronounOf(d1) : w2.de[0])[0]),
        focus("als-wenn", "als", [["wenn", "Geçmişte bir kez olan olay için als kullanılır; wenn tekrarlanan olaylar ya da şimdiki/gelecek zaman içindir."]]),
      ],
    };
  },
);

// ---------- bevor / nachdem / während ----------

const rank = (e: Ev) => (["yat", "uyu", "uyuyakal"].includes(e.id) ? 3 : has(e, "morning") ? 0 : has(e, "evening") ? 2 : 1);

function sequencePair(p: Picker, firstThen: boolean): [Ev, Ev] {
  const a = p.pick(EVENTS.filter((x) => !has(x, "bad") && !NOT_IN_SEQUENCE.includes(x.id)));
  const b = p.pick(
    EVENTS.filter(
      (x) =>
        x !== a &&
        !NOT_IN_SEQUENCE.includes(x.id) &&
        !has(x, "bad", "arrive") &&
        !(has(a, "move") && has(x, "move")) &&
        x.v !== a.v &&
        (firstThen ? rank(a) <= rank(x) : rank(x) <= rank(a)),
    ),
  );
  return [a, b];
}

function sequenceTemplate(kind: "bevor" | "nachdem", id: string, topicId: string, rules: string[], hint: string, onlyPast = false) {
  return openTemplate(id, "B1", topicId, rules, hint, (p) => {
    // bevor: the main clause happens first; nachdem: the subordinate clause happens first
    const [subE, mainE] = kind === "nachdem" ? sequencePair(p, true) : sequencePair(p, false);
    const past = onlyPast || p.pick([false, true]);
    const w1 = p.pick(EVERYONE.filter((x) => fitsWho(subE, x) && fitsWho(mainE, x)));
    const same = p.pick([true, true, false]);
    const w2 = same ? w1 : otherWho(p, w1, mainE);
    const subT: DeTense[] = kind === "bevor" ? (past ? ["praet", "perf"] : ["pres"]) : past ? ["plusq"] : ["perf"];
    const mainT: DeTense[] = past ? PAST_MAIN : ["pres"];
    const sub = (d: DeWho) => subT.flatMap((t) => deEvent(subE, d, t));
    const main = (d: DeWho) => mainT.flatMap((t) => deEvent(mainE, d, t));
    const de = same ? combineSame(kind, w1, sub, main) : combine(kind, w1.de.flatMap(sub), w2.de.flatMap(main));
    const subTr = trEvent(subE, w1.trP, kind === "bevor" ? "madanOnce" : "diktan");
    const mainTr = trEvent(mainE, w2.trP, past ? "past" : "pres");
    const tr = same ? joinTr([trNoun(w1), subTr, mainTr]) : joinTr([w1.tr, subTr, w2.tr, mainTr]);
    const d1 = w1.de[0];
    const subC = sub(d1)[0];
    const focusList = clauseFocus("bevor-nachdem", kind, subC, main(same ? pronounOf(d1) : w2.de[0])[0]);
    if (kind === "nachdem") {
      const simple = deEvent(subE, d1, past ? "praet" : "pres")[0];
      focusList.push(
        focus("bevor-nachdem", subText(subC), [
          [
            subText(simple),
            past
              ? `nachdem'li cümle ana cümleden önce olur; ana cümle geçmişteyse Plusquamperfekt kullanılır: nachdem ${subText(subC)}.`
              : `nachdem'li cümle ana cümleden önce olur; ana cümle şimdiki zamandaysa Perfekt kullanılır: nachdem ${subText(subC)}.`,
          ],
        ]),
      );
    }
    return {
      tr,
      de,
      vocab: [kind === "bevor" ? ["bevor", "-meden önce"] : ["nachdem", "-dikten sonra"], subE.vocab, mainE.vocab],
      focus: focusList,
    };
  });
}

const bevorB1 = sequenceTemplate(
  "bevor",
  "b1-acik-bevor",
  "b1-nebensatz",
  ["bevor-nachdem", "nebensatz"],
  "bevor: -meden önce. Yan cümlede fiil sona gider.",
);
const nachdemB1 = sequenceTemplate(
  "nachdem",
  "b1-acik-nachdem",
  "b1-nebensatz",
  ["bevor-nachdem", "nebensatz"],
  "nachdem: -dikten sonra. Ana cümle şimdiki zamandaysa yan cümle Perfekt, geçmişteyse Plusquamperfekt olur.",
);
const nachdemPlusq = sequenceTemplate(
  "nachdem",
  "b1-acik-plusq-nachdem",
  "b1-plusquam",
  ["plusquam", "bevor-nachdem"],
  "Geçmişte daha önce olan olay: hatte / war + Partizip II (nachdem ich gegessen hatte).",
  true,
);

const waehrendB1 = openTemplate(
  "b1-acik-waehrend",
  "B1",
  "b1-nebensatz",
  ["nebensatz"],
  "während (-ırken): yan cümlede fiil sona gider; yan cümle başta ise ana cümle fiille başlar.",
  (p) => {
    const e1 = p.pick(EVENTS.filter(background));
    const w1 = whoFor(p, e1);
    const e2 = p.pick(EVENTS.filter((x) => background(x) && x !== e1));
    const w2 = otherWho(p, w1, e2);
    const past = p.pick([false, true]);
    const subs = w1.de.flatMap((d) => deEvent(e1, d, past ? "praet" : "pres"));
    const mains = w2.de.flatMap((d) => (past ? PAST_MAIN : (["pres"] as DeTense[])).flatMap((t) => deEvent(e2, d, t)));
    return {
      tr: joinTr([w1.tr, trEvent(e1, w1.trP, "ken"), w2.tr, trEvent(e2, w2.trP, past ? "pastCont" : "pres")]),
      de: combine("während", subs, mains),
      vocab: [["während", "-ırken"], e1.vocab, e2.vocab],
      focus: clauseFocus("nebensatz", "während", subs[0], mains[0]),
    };
  },
);

// ---------- purpose: um … zu, damit ----------

/** The zu-infinitive group of an event: "meine Oma zu besuchen", "mich auszuruhen", "nicht zu spät zu kommen". */
function zuGroups(e: Ev, d: DeWho, neg = false, time?: string): string[] {
  return deMids(e, d, neg).map((mid) => words([reflOf(e, d.p), time, mid === "nicht" ? "nicht" : mid, zuInf(e.v)]));
}

function bareGroups(e: Ev, d: DeWho, neg = false): string[] {
  return deMids(e, d, neg).map((mid) => words([reflOf(e, d.p), mid, e.v.inf]));
}

const PURPOSES: { goal: string; neg?: boolean; actions: string[] }[] = [
  { goal: "para", actions: ["bisiklet", "otobus", "evde-kal"] },
  { goal: "almanca", actions: ["kitap", "film", "muzik", "televizyon", "berlin"] },
  { goal: "gec-kal", neg: true, actions: ["erken-kalk", "taksi", "acele", "giyin"] },
  { goal: "ekmek", actions: ["market"] },
  { goal: "ziyaret", actions: ["berlin", "sehir"] },
  { goal: "film", actions: ["sinema"] },
  { goal: "dinlen", actions: ["eve-git", "evde-kal"] },
  { goal: "arkadas-bulus", actions: ["sehir"] },
  { goal: "sinav", actions: ["erken-kalk", "eve-git", "evde-kal"] },
  { goal: "aksam-yemegi", actions: ["market", "alisveris", "eve-git"] },
];

const umZuB1 = openTemplate(
  "b1-acik-um-zu",
  "B1",
  "b1-infinitiv",
  ["damit-umzu", "zu-infinitiv"],
  "'-mek için' (özne aynı): um … zu + mastar (sonda).",
  (p) => {
    const pu = p.pick(PURPOSES);
    const goal = E(pu.goal);
    const action = E(p.pick(pu.actions));
    const w = p.pick(EVERYONE.filter((x) => fitsWho(goal, x) && fitsWho(action, x)));
    const past = p.pick([false, true]);
    const de: string[] = [];
    let first: { zu: string; bare: string; main: DeClause } | null = null;
    for (const d of w.de) {
      const pron = pronounOf(d);
      for (const zu of zuGroups(goal, d, pu.neg)) {
        for (const t of past ? PAST_MAIN : (["pres"] as DeTense[])) {
          for (const m of deEvent(action, d, t)) {
            first ??= { zu, bare: bareGroups(goal, d, pu.neg)[0], main: m };
            for (const mo of mainOrders(m)) de.push(sentence([...mo, ",", "um", zu]));
            for (const mo of mainOrders(m, `um ${zu},`)) de.push(sentence(mo));
          }
          // damit with the same subject is also correct German
          for (const m of deEvent(action, d, t)) {
            const goalClause = deEvent(goal, pron, past ? "praet" : "pres", { neg: pu.neg });
            de.push(...mainFirst("damit", goalClause, [m]));
          }
        }
      }
    }
    const f = first!;
    return {
      tr: joinTr([trNoun(w), trEvent(goal, w.trP, "infIcin", pu.neg), trEvent(action, w.trP, past ? "past" : "pres")]),
      de: unique(de),
      vocab: [["um … zu", "-mek için"], goal.vocab, action.vocab],
      focus: [
        focus("damit-umzu", `um ${f.zu}`, [
          ...(f.zu.startsWith("für ") ? [] : ([[`für ${f.zu}`, `'-mek için' um … zu ile söylenir (für değil): um ${f.zu}.`]] as [string, string][])),
          [`um ${f.bare}`, `um'dan sonra mastar zu ile gelir: um ${f.zu}.`],
        ]),
      ],
    };
  },
);

const DAMIT: { action: string; outcome: string }[] = [
  { action: "aksam-yemegi", outcome: "dinlen" },
  { action: "temizlik", outcome: "dinlen" },
  { action: "bulasik", outcome: "dinlen" },
  { action: "isik", outcome: "uyu" },
  { action: "alisveris", outcome: "aksam-yemegi" },
  { action: "market", outcome: "kek" },
];

const damitB1 = openTemplate(
  "b1-acik-damit",
  "B1",
  "b1-nebensatz",
  ["damit-umzu", "nebensatz"],
  "Özneler farklıysa damit + yan cümle (fiil sonda): …, damit meine Mutter sich ausruhen kann.",
  (p) => {
    const pair = p.pick(DAMIT);
    const action = E(pair.action);
    const outcome = E(pair.outcome);
    const w1 = p.pick(PRONOUNS.filter((x) => fitsWho(action, x)));
    const w2 = p.pick(PEOPLE.filter((x) => fitsWho(outcome, x)));
    const past = p.pick([false, true]);
    const mains = w1.de.flatMap((d) => (past ? PAST_MAIN : (["pres"] as DeTense[])).flatMap((t) => deEvent(action, d, t)));
    const subs = w2.de.flatMap((d) => deEvent(outcome, d, past ? "praet" : "pres", { modal: LX.koennen }));
    return {
      tr: joinTr([w2.tr, trObject(outcome, w2.trP), trVerb(outcome.tr, "3sg", "sinDiye"), trEvent(action, w1.trP, past ? "past" : "pres")]),
      de: combine("damit", subs, mains),
      vocab: [["damit", "-sın diye, -mesi için"], action.vocab, outcome.vocab],
      focus: clauseFocus("damit-umzu", "damit", subs[0], mains[0]),
    };
  },
);

// ---------- zu-infinitive after verbs ----------

interface ZuVerb {
  id: string;
  /** Time expressions that make sense with this verb */
  times: When[];
  main: (d: DeWho) => DeClause;
  tr: (e: Ev, p: Person) => string;
  vocab: [string, string];
  fits?: (e: Ev) => boolean;
  timeInMain?: boolean;
}

const simpleMain = (v: LV, t: DeTense, mid: string[] = []) => (d: DeWho): DeClause => ({
  subj: d.s,
  vg: verbGroup(v, d.p, t),
  mid,
  noun: !/^(ich|du|er|sie|es|wir|ihr|Sie)$/.test(d.s),
});

const noArticle = (e: Ev) => !/^(ein|eine|einen) /.test(e.mid ?? "");

const ZU_VERBS: ZuVerb[] = [
  {
    id: "versuchen",
    times: [{ de: "heute", tr: "bugün" }, { de: "jeden Tag", tr: "her gün" }],
    main: simpleMain(LX.versuchen, "pres"),
    tr: (e, p) => `${trEvent(e, p, "vnDat")} ${T.present(T.tv("çalış"), p)}`,
    vocab: ["versuchen", "-meye çalışmak"],
  },
  {
    id: "vergessen",
    times: [{ de: "heute", tr: "bugün" }],
    main: simpleMain(LX.vergessen, "perf"),
    tr: (e, p) => `${trEvent(e, p, "vnAcc")} ${T.past(T.tv("unut"), p)}`,
    vocab: ["vergessen", "-meyi unutmak"],
  },
  {
    id: "vorhaben",
    times: [{ de: "morgen", tr: "yarın" }, { de: "am Wochenende", tr: "hafta sonu" }, { de: "heute Abend", tr: "bu akşam", part: "evening" }],
    main: simpleMain(LX.vorhaben, "pres"),
    tr: (e, p) => `${trEvent(e, p, "vnAcc")} ${T.present(T.tv("planla"), p)}`,
    vocab: ["vorhaben", "-meyi planlamak"],
  },
  {
    id: "anfangen",
    times: [],
    main: simpleMain(LX.anfangen, "perf"),
    tr: (e, p) => `${trEvent(e, p, "vnDat")} ${T.past(T.tv("başla"), p)}`,
    vocab: ["anfangen", "-meye başlamak"],
    fits: (e) => has(e, "study", "sport", "fun") && noArticle(e),
  },
  {
    id: "aufhoeren",
    times: [],
    main: simpleMain(LX.aufhoeren, "perf"),
    tr: (e, p) => `${trEvent(e, p, "vnAcc")} ${T.past(T.tv("bırak"), p)}`,
    vocab: ["aufhören", "-meyi bırakmak"],
    fits: (e) => has(e, "food", "fun", "sport") && noArticle(e) && !e.own,
  },
  {
    id: "beschliessen",
    times: [{ de: "ab morgen", tr: "yarından itibaren" }, { de: "jeden Tag", tr: "her gün" }],
    main: simpleMain(LX.beschliessen, "perf"),
    tr: (e, p) => `${trEvent(e, p, "vnDat")} ${T.past(T.tv("karar ver"), p)}`,
    vocab: ["beschließen", "-meye karar vermek"],
  },
  {
    id: "keine-zeit",
    times: [{ de: "heute", tr: "bugün" }, { de: "heute Abend", tr: "bu akşam", part: "evening" }, { de: "am Wochenende", tr: "hafta sonu" }],
    main: simpleMain(LX.haben, "pres", ["keine Zeit"]),
    tr: (e, p) => `${trEvent(e, p, "vnDat")} ${T.poss("zaman", p)} yok`,
    vocab: ["keine Zeit haben", "-meye zamanı olmamak"],
    timeInMain: true,
  },
  {
    id: "keine-lust",
    times: [{ de: "heute", tr: "bugün" }, { de: "heute Abend", tr: "bu akşam", part: "evening" }, { de: "am Wochenende", tr: "hafta sonu" }],
    main: simpleMain(LX.haben, "pres", ["keine Lust"]),
    tr: (e, p) => `${trEvent(e, p, "inf")} ${T.present(T.tv("iste"), p, true)}`,
    vocab: ["keine Lust haben", "-mek istememek"],
    timeInMain: true,
  },
];

const zuVerbsB1 = openTemplate(
  "b1-acik-zu-fiiller",
  "B1",
  "b1-infinitiv",
  ["zu-infinitiv"],
  "versuchen, vergessen, vorhaben, anfangen, aufhören… + zu + mastar (sonda).",
  (p) => {
    const zv = p.pick(ZU_VERBS);
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad", "mini") && (!zv.fits || zv.fits(x))));
    const w = whoFor(p, e);
    const when = zv.times.length ? timeFor(p, e, zv.times) : null;
    const de: string[] = [];
    for (const d of w.de) {
      const m = zv.main(d);
      const withTime: DeClause = zv.timeInMain && when ? { ...m, mid: [when.de, ...m.mid] } : m;
      for (const zu of zuGroups(e, d, false, zv.timeInMain ? undefined : when?.de)) {
        for (const mo of mainOrders(withTime)) de.push(sentence([...mo, ",", zu]));
      }
    }
    const d0 = w.de[0];
    const zu0 = zuGroups(e, d0)[0];
    const right = zuInf(e.v);
    const wrongs: [string, string][] = e.v.prefix
      ? [[`zu ${e.v.inf}`, `Ayrılabilen fiilde zu ön ek ile fiilin arasına girer: ${right}.`]]
      : [[e.v.inf, `Bu fiilden sonra mastar zu ile gelir: …, ${zu0}.`]];
    return {
      tr: joinTr([trNoun(w), when?.tr, zv.tr(e, w.trP)]),
      de: unique(de),
      vocab: [zv.vocab, e.vocab],
      focus: [focus("zu-infinitiv", right, wrongs)],
    };
  },
);

const ES_ADJ: { de: string[]; tr: string; tags: Tag[] | "any"; ids?: string[] }[] = [
  { de: ["wichtig"], tr: "önemli", tags: "any" },
  { de: ["schwer", "schwierig"], tr: "zor", tags: ["study", "sport", "morning", "work"] },
  { de: ["schön"], tr: "güzel", tags: ["fun", "contact", "out", "rest", "travel"] },
  { de: ["gesund"], tr: "sağlıklı", tags: ["sport", "out", "rest"] },
  { de: ["langweilig"], tr: "sıkıcı", tags: ["chore"] },
  { de: ["teuer"], tr: "pahalı", tags: [], ids: ["berlin", "taksi", "siparis", "sinema"] },
];

const esIstB1 = openTemplate(
  "b1-acik-es-ist",
  "B1",
  "b1-infinitiv",
  ["zu-infinitiv"],
  "Es ist wichtig / schwer / schön, … zu + mastar (sonda).",
  (p) => {
    const a = p.pick(ES_ADJ);
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad") && (a.ids ? a.ids.includes(x.id) : a.tags === "any" || has(x, ...a.tags))));
    const when = timeFor(p, e, WHEN_HABIT);
    const me = PRONOUNS[0].de[0];
    const zus = zuGroups(e, me, false, when?.de);
    const bares = deMids(e, me).map((mid) => words([when?.de, reflOf(e, me.p), mid, e.v.inf]));
    const de = a.de.flatMap((adj) => [...zus.map((zu) => `Es ist ${adj}, ${zu}.`), ...bares.map((b) => sentence([b, "ist", adj]))]);
    const right = zuInf(e.v);
    return {
      tr: joinTr([when?.tr, trEvent(e, "1sg", "inf"), a.tr]),
      de: unique(de),
      vocab: [[a.de[0], a.tr], e.vocab],
      focus: [
        focus(
          "zu-infinitiv",
          right,
          e.v.prefix
            ? [[`zu ${e.v.inf}`, `Ayrılabilen fiilde zu ön ek ile fiilin arasına girer: ${right}.`]]
            : [[e.v.inf, `Bu kalıpta mastar zu ile gelir ve sona gider: Es ist …, ${zus[0]}.`]],
        ),
      ],
    };
  },
);

// ---------- Konjunktiv II ----------

const K2_CONDS: (St & { fits: Tag[] })[] = [
  { id: "k-zaman", v: LX.haben, mid: "mehr Zeit", tr: { k: "have", noun: "zaman", pre: "daha çok" }, because: [], despite: [], vocab: ["mehr Zeit", "daha çok zaman"], fits: ["fun", "sport", "contact", "study", "travel"] },
  { id: "k-para", v: LX.haben, mid: "mehr Geld", tr: { k: "have", noun: "para", pre: "daha çok" }, because: [], despite: [], vocab: ["mehr Geld", "daha çok para"], fits: ["travel", "money", "fun"] },
  { id: "k-zengin", v: LX.sein, mid: "reich", tr: { k: "cop", word: "zengin" }, because: [], despite: [], vocab: ["reich", "zengin"], fits: ["travel", "money", "fun"] },
  { id: "k-araba", v: LX.haben, mid: "ein Auto", tr: { k: "have", noun: "araba", pre: "bir" }, because: [], despite: [], vocab: ["ein Auto", "bir araba"], fits: ["travel", "contact", "out"] },
  { id: "k-yorgun", v: LX.sein, mid: "nicht so müde", tr: { k: "cop", word: "bu kadar yorgun", neg: true }, because: [], despite: [], vocab: ["müde", "yorgun"], fits: ["fun", "sport", "contact", "chore"] },
  { id: "k-tatil", v: LX.haben, mid: "Urlaub", tr: { k: "cop", word: "tatilde" }, because: [], despite: [], vocab: ["Urlaub haben", "tatilde olmak"], fits: ["travel", "fun", "rest", "out"] },
  { id: "k-hava", v: LX.sein, mid: "schöner", subj: "das Wetter", tr: { k: "cop", word: "daha güzel", subj: "hava" }, because: [], despite: [], vocab: ["das Wetter", "hava"], fits: ["out", "sport"] },
];

const K2_FIN: Record<string, [string, string]> = { hätte: ["habe", "hatte"], hätten: ["haben", "hatten"], hättest: ["hast", "hattest"], hättet: ["habt", "hattet"], wäre: ["ist", "war"], wären: ["sind", "waren"], wärst: ["bist", "warst"], wärt: ["seid", "wart"] };

const konj2B1 = openTemplate(
  "b1-acik-konj2",
  "B1",
  "b1-konjunktiv",
  ["konjunktiv2"],
  "Gerçek olmayan koşul: Wenn … hätte / wäre, würde … + mastar (sonda).",
  (p) => {
    const c = p.pick(K2_CONDS);
    const e = p.pick(EVENTS.filter((x) => has(x, ...c.fits) && !has(x, "arrive", "bad")));
    const w = whoFor(p, e);
    const personal = !c.subj;
    const sub = (d: DeWho) => [deState(c, d, "k2")];
    const main = (d: DeWho) => deEvent(e, d, "wuerde");
    const de = personal ? combineSame("wenn", w, sub, main) : combine("wenn", sub(w.de[0]), w.de.flatMap(main));
    // conditional without wenn: Hätte ich mehr Zeit, würde ich …
    for (const d of w.de) {
      const s = sub(d)[0];
      const front = words([s.vg.fin, s.subj, ...s.mid]) + ",";
      for (const m of main(personal ? pronounOf(d) : d)) for (const mo of mainOrders(m, front)) de.push(sentence(mo));
    }
    const d0 = w.de[0];
    const s0 = sub(d0)[0];
    const m0 = main(personal ? pronounOf(d0) : d0)[0];
    const [presForm, pastForm] = K2_FIN[s0.vg.fin] ?? ["", ""];
    return {
      tr: joinTr([personal ? trFront(w, c) : null, trState(c, w.trP, "condPast"), personal ? null : trNoun(w), trEvent(e, w.trP, "aorPast")]),
      de: unique(de),
      vocab: [["würde + Infinitiv", "-ırdı / -ardı"], [s0.vg.fin, "olsaydı"], e.vocab],
      focus: [
        focus("konjunktiv2", s0.vg.fin, [
          [pastForm, `Gerçek olmayan koşulda Konjunktiv II kullanılır: ${s0.vg.fin} (${pastForm} geçmiş zamandır).`],
          [presForm, `Gerçek olmayan koşulda Konjunktiv II kullanılır: ${s0.vg.fin}.`],
        ]),
        focus("konjunktiv2", `${m0.vg.fin} ${m0.subj}`, [
          [`${m0.subj} ${m0.vg.fin}`, `Wenn'li yan cümle başta olduğu için ana cümle çekimli fiille (${m0.vg.fin}) başlar.`],
          [`${verbGroup(LX.werden, d0.p, "pres").fin} ${m0.subj}`, `Varsayımda werde/wird değil, würde kullanılır: ${m0.vg.fin}.`],
        ]),
      ],
    };
  },
);

const politeB1 = openTemplate(
  "b1-acik-rica",
  "B1",
  "b1-konjunktiv",
  ["konjunktiv2"],
  "Kibar rica: Könntest du …? / Könnten Sie …? Mastar sona gider.",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => has(x, "contact", "chore", "home") && !has(x, "arrive", "bad", "rest")));
    const w = p.pick(PRONOUNS.filter((x) => x.id === "sen" || x.id === "siz"));
    const when = timeFor(p, e, [{ de: "heute", tr: "bugün" }, { de: "morgen", tr: "yarın" }, { de: "heute Abend", tr: "bu akşam", part: "evening" }]);
    const de: string[] = [];
    for (const d of w.de) {
      for (const mid of deMids(e, d)) {
        const rest = words([reflOf(e, d.p), when?.de, mid, e.v.inf]);
        for (const modal of [LX.koennen, LX.werden]) {
          const fin = verbGroup(e.v, d.p, "k2", modal).fin;
          de.push(`${sentence([fin, d.s, rest], "?")}`, `${sentence([fin, d.s, "bitte", rest], "?")}`);
        }
        const plain = verbGroup(e.v, d.p, "pres", LX.koennen).fin;
        de.push(sentence([plain, d.s, rest], "?"), sentence([plain, d.s, "bitte", rest], "?"));
      }
    }
    const mid0 = deMids(e, w.de[0])[0];
    const midW = mid0 && mid0 !== "nicht" ? words([when?.de, mid0]) : "";
    return {
      tr: joinTr([when?.tr, trEvent(e, w.trP, "abilQ")], "?"),
      de: unique(de),
      vocab: [[w.id === "sen" ? "Könntest du …?" : "Könnten Sie …?", "… -abilir misin / misiniz?"], e.vocab],
      focus: midW ? [focus("modal", `${midW} ${e.v.inf}`, [[`${e.v.inf} ${midW}`, "Modal fiille kullanılan mastar cümlenin en sonuna gider."]])] : [],
    };
  },
);

// ---------- Plusquamperfekt ----------

const plusqAls = openTemplate(
  "b1-acik-plusq-als",
  "B1",
  "b1-plusquam",
  ["plusquam", "nebensatz"],
  "Geçmişteki bir andan daha önce olan: hatte / war + Partizip II (… hatte schon gegessen).",
  (p) => {
    const e1 = E(p.pick(ARRIVALS));
    const w1 = whoFor(p, e1);
    const e2 = p.pick(EVENTS.filter((x) => background(x) && x.id !== "yat"));
    const w2 = otherWho(p, w1, e2);
    const subs = w1.de.flatMap((d) => deEvent(e1, d, "praet"));
    const mains = w2.de.flatMap((d) => ["schon", "bereits"].flatMap((adv) => deEvent(e2, d, "plusq", { time: adv })));
    const m0 = mains[0];
    const perfAux = verbGroup(e2.v, w2.de[0].p, "perf").fin;
    const otherAux = verbGroup(e2.v.aux === "sein" ? LX.haben : LX.sein, w2.de[0].p, "praet").fin;
    return {
      tr: joinTr([trAmbiguous(w1), trEvent(e1, w1.trP, "dikLoc"), w2.tr, "çoktan", trEvent(e2, w2.trP, "pastPerf")]),
      de: combine("als", subs, mains),
      vocab: [["schon / bereits", "çoktan"], ["Plusquamperfekt", "-mıştı"], e2.vocab],
      focus: [
        focus("plusquam", `${m0.vg.fin} ${m0.subj}`, [
          [`${perfAux} ${m0.subj}`, `Geçmişteki bir olaydan daha önce olan için Plusquamperfekt kullanılır: ${m0.vg.fin} … ${e2.v.part2}.`],
          [`${otherAux} ${m0.subj}`, `${e2.v.part2} için yardımcı fiil ${e2.v.aux} olmalı: ${m0.vg.fin} … ${e2.v.part2}.`],
          [`${m0.subj} ${m0.vg.fin}`, "Yan cümle başta olduğu için ana cümle çekimli fiille başlar."],
        ]),
        ...clauseFocus("nebensatz", "als", subs[0], null),
      ],
    };
  },
);

// ---------- Genitiv ----------

const GEN_CAUSES: { de: string; dat?: string; tr: string; trDat: string; because: Tag[]; despite: Tag[] }[] = [
  { de: "des Regens", dat: "dem Regen", tr: "yağmur", trDat: "yağmura", because: ["stay", "fast"], despite: ["out", "sport"] },
  { de: "des Schnees", dat: "dem Schnee", tr: "kar", trDat: "kara", because: ["stay", "warm"], despite: ["out"] },
  { de: "der Kälte", tr: "soğuk", trDat: "soğuğa", because: ["warm", "stay"], despite: ["out", "sport"] },
  { de: "der Hitze", tr: "sıcak", trDat: "sıcağa", because: ["stay", "rest"], despite: ["sport", "out"] },
  { de: "des Streiks", dat: "dem Streik", tr: "grev", trDat: "greve", because: ["fast", "stay"], despite: ["work"] },
  { de: "der Prüfung", tr: "sınav", trDat: "sınava", because: ["study", "rest"], despite: ["fun"] },
  { de: "der Arbeit", tr: "iş", trDat: "işe", because: ["work"], despite: ["fun", "sport"] },
];

const GEN_DURING: { de: string; dat?: string; tr: string; events: string[] }[] = [
  { de: "des Films", dat: "dem Film", tr: "film", events: ["uyuyakal", "pizza", "cay"] },
  { de: "der Pause", tr: "mola", events: ["kahve", "cay", "eposta"] },
  { de: "der Reise", tr: "yolculuk", events: ["foto", "kitap", "muzik", "uyuyakal"] },
  { de: "des Urlaubs", dat: "dem Urlaub", tr: "tatil", events: ["foto", "kitap", "yuzme", "dinlen"] },
  { de: "des Unterrichts", dat: "dem Unterricht", tr: "ders", events: ["uyuyakal"] },
  { de: "des Spiels", dat: "dem Spiel", tr: "maç", events: ["pizza", "foto"] },
];

const genitivB1 = openTemplate(
  "b1-acik-genitiv",
  "B1",
  "b1-genitiv",
  ["genitiv"],
  "wegen (yüzünden), trotz (-e rağmen), während (sırasında) Genitiv ister: wegen des Regens.",
  (p) => {
    const kind = p.pick(["wegen", "trotz", "während", "krankheit"] as const);
    const past = p.pick([false, true]);
    let prep = kind === "krankheit" ? p.pick(["wegen", "trotz"] as const) : kind;
    let e: Ev;
    let phraseDe: (d: DeWho) => string;
    let phraseTr: (w: Who) => string;
    let wrong: string | undefined;
    if (kind === "krankheit") {
      e = p.pick(EVENTS.filter((x) => has(x, ...(prep === "wegen" ? (["health", "stay", "rest"] as Tag[]) : (["work", "sport"] as Tag[]))) && !has(x, "arrive")));
      phraseDe = (d) => `${prep} ${determiner(d.det, "gen", "f")} Krankheit`;
      phraseTr = (w) => (prep === "wegen" ? `${T.poss("hastalık", w.trP, "hastalığ")} yüzünden` : `${T.possCase("hastalık", w.trP, "dat", "hastalığ")} rağmen`);
    } else if (kind === "während") {
      const d = p.pick(GEN_DURING);
      e = E(p.pick(d.events));
      phraseDe = () => `während ${d.de}`;
      phraseTr = () => `${d.tr} sırasında`;
      wrong = d.dat;
      prep = "während";
    } else {
      const c = p.pick(GEN_CAUSES);
      e = p.pick(EVENTS.filter((x) => has(x, ...(kind === "wegen" ? c.because : c.despite)) && !has(x, "arrive")));
      phraseDe = () => `${kind} ${c.de}`;
      phraseTr = () => (kind === "wegen" ? `${c.tr} yüzünden` : `${c.trDat} rağmen`);
      wrong = c.dat;
    }
    const w = whoFor(p, e);
    const when = timeFor(p, e, past ? WHEN_PAST : WHEN_NOW);
    const de: string[] = [];
    for (const d of w.de) {
      const ph = phraseDe(d);
      for (const t of past ? PAST_MAIN : (["pres"] as DeTense[])) {
        for (const c of deEvent(e, d, t)) {
          const time = when ? [when.de] : [];
          for (const mo of mainOrders({ ...c, mid: [...time, ...c.mid] }, ph)) de.push(sentence(mo));
          for (const mo of mainOrders({ ...c, mid: [...time, ph, ...c.mid] })) de.push(sentence(mo));
          if (when) for (const mo of mainOrders({ ...c, mid: [ph, ...c.mid] }, when.de)) de.push(sentence(mo));
        }
      }
    }
    const ph0 = phraseDe(w.de[0]);
    return {
      tr:
        kind === "krankheit"
          ? joinTr([trNoun(w), phraseTr(w), when?.tr, trEvent(e, w.trP, past ? "past" : "pres")])
          : joinTr([phraseTr(w), trNoun(w), when?.tr, trEvent(e, w.trP, past ? "past" : "pres")]),
      de: unique(de),
      vocab: [[`${prep} (+G)`, prep === "wegen" ? "yüzünden" : prep === "trotz" ? "-e rağmen" : "sırasında"], e.vocab],
      focus: wrong ? [focus("genitiv", ph0, [[`${prep} ${wrong}`, `Konuşmada duyulur ama yazı dilinde ${prep} Genitiv ister: ${ph0}.`]])] : [],
    };
  },
);

// ---------- verbs with prepositions ----------

interface PObj {
  pp: string;
  tr: string;
  wrong?: string;
}
interface PVerb {
  v: LV;
  refl?: boolean;
  extra?: string;
  tr: T.TrVerb;
  objs: PObj[];
  vocab: [string, string];
  /** Typical wrong preposition and why */
  wrongPrep?: [string, string];
  presentOnly?: boolean;
}

const PVERBS: PVerb[] = [
  {
    v: LX.warten,
    tr: T.tv("bekle"),
    vocab: ["warten auf (+A)", "beklemek"],
    objs: [
      { pp: "auf den Bus", tr: "otobüsü", wrong: "auf dem Bus" },
      { pp: "auf eine Antwort", tr: "bir cevap", wrong: "auf einer Antwort" },
      { pp: "auf das Paket", tr: "paketi", wrong: "auf dem Paket" },
      { pp: "auf den Zug", tr: "treni", wrong: "auf dem Zug" },
    ],
    wrongPrep: ["für", "Beklemek: warten auf (für değil)."],
  },
  {
    v: LX.denken,
    tr: T.tv("düşün"),
    vocab: ["denken an (+A)", "düşünmek"],
    objs: [
      { pp: "an den Urlaub", tr: "tatili", wrong: "an dem Urlaub" },
      { pp: "an die Prüfung", tr: "sınavı", wrong: "an der Prüfung" },
      { pp: "an die Zukunft", tr: "geleceği", wrong: "an der Zukunft" },
    ],
    wrongPrep: ["über", "Birini/bir şeyi düşünmek: denken an + Akkusativ."],
  },
  {
    v: LX.freuen,
    refl: true,
    tr: T.tv("dört gözle bekle"),
    vocab: ["sich freuen auf (+A)", "dört gözle beklemek"],
    objs: [
      { pp: "auf das Wochenende", tr: "hafta sonunu", wrong: "auf dem Wochenende" },
      { pp: "auf den Urlaub", tr: "tatili", wrong: "auf dem Urlaub" },
      { pp: "auf die Party", tr: "partiyi", wrong: "auf der Party" },
    ],
    wrongPrep: ["über", "Gelecekteki bir şeye sevinmek: sich freuen auf; olmuş bir şeye: sich freuen über."],
  },
  {
    v: LX.freuen,
    refl: true,
    tr: T.tv("sevin"),
    vocab: ["sich freuen über (+A)", "-e sevinmek"],
    objs: [
      { pp: "über das Geschenk", tr: "hediyeye", wrong: "über dem Geschenk" },
      { pp: "über die Nachricht", tr: "habere", wrong: "über der Nachricht" },
      { pp: "über den Brief", tr: "mektuba", wrong: "über dem Brief" },
    ],
    wrongPrep: ["auf", "Olmuş bir şeye sevinmek: sich freuen über; gelecekteki bir şey için: sich freuen auf."],
  },
  {
    v: LX.interessieren,
    refl: true,
    tr: T.tv("ilgilen"),
    vocab: ["sich interessieren für (+A)", "ile ilgilenmek"],
    objs: [
      { pp: "für Musik", tr: "müzikle" },
      { pp: "für Politik", tr: "siyasetle" },
      { pp: "für Kunst", tr: "sanatla" },
      { pp: "für Geschichte", tr: "tarihle" },
    ],
    wrongPrep: ["mit", "Türkçedeki '-le' burada mit olmaz: sich für … interessieren."],
  },
  {
    v: LX.haben,
    extra: "Angst",
    tr: T.tv("kork"),
    vocab: ["Angst haben vor (+D)", "-den korkmak"],
    objs: [
      { pp: "vor Hunden", tr: "köpeklerden", wrong: "vor Hunde" },
      { pp: "vor der Prüfung", tr: "sınavdan", wrong: "vor die Prüfung" },
      { pp: "vor dem Zahnarzt", tr: "dişçiden", wrong: "vor den Zahnarzt" },
      { pp: "vor der Dunkelheit", tr: "karanlıktan", wrong: "vor die Dunkelheit" },
    ],
    wrongPrep: ["von", "Korkmak: Angst haben vor + Dativ (von değil)."],
    presentOnly: true,
  },
  {
    v: LX.kuemmern,
    refl: true,
    tr: T.tv("ilgilen"),
    vocab: ["sich kümmern um (+A)", "ile ilgilenmek, bakmak"],
    objs: [
      { pp: "um die Kinder", tr: "çocuklarla", wrong: "um den Kindern" },
      { pp: "um den Garten", tr: "bahçeyle", wrong: "um dem Garten" },
      { pp: "um das Essen", tr: "yemekle", wrong: "um dem Essen" },
    ],
    wrongPrep: ["mit", "Bir şeyle ilgilenmek: sich um … kümmern (mit değil)."],
  },
  {
    v: LX.erinnern,
    refl: true,
    tr: T.tv("hatırla"),
    vocab: ["sich erinnern an (+A)", "hatırlamak"],
    objs: [
      { pp: "an den Urlaub", tr: "tatili", wrong: "an dem Urlaub" },
      { pp: "an diesen Tag", tr: "o günü", wrong: "an diesem Tag" },
      { pp: "an die Reise", tr: "yolculuğu", wrong: "an der Reise" },
    ],
  },
  {
    v: LX.sprechen,
    tr: T.tv("konuş"),
    vocab: ["sprechen über (+A)", "hakkında konuşmak"],
    objs: [
      { pp: "über das Wetter", tr: "hava hakkında", wrong: "über dem Wetter" },
      { pp: "über den Film", tr: "film hakkında", wrong: "über dem Film" },
      { pp: "über die Arbeit", tr: "iş hakkında", wrong: "über der Arbeit" },
    ],
  },
  {
    v: LX.traeumen,
    tr: T.tv("hayal et", "hayal ed"),
    vocab: ["träumen von (+D)", "hayal etmek"],
    objs: [
      { pp: "von einem Haus am Meer", tr: "deniz kenarında bir ev", wrong: "von ein Haus am Meer" },
      { pp: "von einer Reise nach Japan", tr: "Japonya'ya bir yolculuk", wrong: "von eine Reise nach Japan" },
      { pp: "von einem neuen Auto", tr: "yeni bir araba", wrong: "von ein neues Auto" },
    ],
  },
  {
    v: LX.aergern,
    refl: true,
    tr: T.tv("kız"),
    vocab: ["sich ärgern über (+A)", "-e kızmak"],
    objs: [
      { pp: "über den Lärm", tr: "gürültüye", wrong: "über dem Lärm" },
      { pp: "über die Verspätung", tr: "gecikmeye", wrong: "über der Verspätung" },
      { pp: "über das Wetter", tr: "havaya", wrong: "über dem Wetter" },
    ],
  },
  {
    v: LX.teilnehmen,
    tr: T.tv("katıl"),
    vocab: ["teilnehmen an (+D)", "-e katılmak"],
    objs: [
      { pp: "am Kurs", tr: "kursa", wrong: "an den Kurs" },
      { pp: "an der Sitzung", tr: "toplantıya", wrong: "an die Sitzung" },
      { pp: "am Wettbewerb", tr: "yarışmaya", wrong: "an den Wettbewerb" },
    ],
  },
  {
    v: LX.gewoehnen,
    refl: true,
    tr: T.tv("alış"),
    vocab: ["sich gewöhnen an (+A)", "-e alışmak"],
    objs: [
      { pp: "an das Wetter", tr: "havaya", wrong: "an dem Wetter" },
      { pp: "an die neue Arbeit", tr: "yeni işe", wrong: "an der neuen Arbeit" },
      { pp: "an das Essen", tr: "yemeklere", wrong: "an dem Essen" },
    ],
  },
  {
    v: LX.bewerben,
    refl: true,
    tr: T.tv("başvur"),
    vocab: ["sich bewerben um (+A)", "-e başvurmak"],
    objs: [
      { pp: "um eine Stelle", tr: "bir işe", wrong: "um einer Stelle" },
      { pp: "um ein Stipendium", tr: "bir bursa", wrong: "um einem Stipendium" },
    ],
  },
  {
    v: LX.bitten,
    tr: T.tv("iste"),
    vocab: ["bitten um (+A)", "istemek, rica etmek"],
    objs: [
      { pp: "um Hilfe", tr: "yardım" },
      { pp: "um eine Antwort", tr: "bir cevap", wrong: "um einer Antwort" },
      { pp: "um Rat", tr: "tavsiye" },
    ],
    wrongPrep: ["für", "Bir şey istemek: bitten um + Akkusativ (für değil)."],
  },
  {
    v: LX.beschweren,
    refl: true,
    tr: T.tv("şikâyet et", "şikâyet ed"),
    vocab: ["sich beschweren über (+A)", "-den şikâyet etmek"],
    objs: [
      { pp: "über das Essen", tr: "yemekten", wrong: "über dem Essen" },
      { pp: "über den Lärm", tr: "gürültüden", wrong: "über dem Lärm" },
      { pp: "über das Hotel", tr: "otelden", wrong: "über dem Hotel" },
    ],
    wrongPrep: ["von", "Şikâyet etmek: sich beschweren über + Akkusativ (von değil)."],
  },
  {
    v: LX.konzentrieren,
    refl: true,
    tr: T.tv("odaklan"),
    vocab: ["sich konzentrieren auf (+A)", "-e odaklanmak"],
    objs: [
      { pp: "auf die Arbeit", tr: "işe", wrong: "auf der Arbeit" },
      { pp: "auf die Prüfung", tr: "sınava", wrong: "auf der Prüfung" },
    ],
  },
  {
    v: LX.fragen,
    tr: T.tv("sor"),
    vocab: ["fragen nach (+D)", "sormak"],
    objs: [
      { pp: "nach dem Weg", tr: "yolu", wrong: "nach den Weg" },
      { pp: "nach dem Preis", tr: "fiyatı", wrong: "nach den Preis" },
      { pp: "nach der Uhrzeit", tr: "saati", wrong: "nach die Uhrzeit" },
    ],
  },
  {
    v: LX.vorbereiten,
    refl: true,
    tr: T.tv("hazırlan"),
    vocab: ["sich vorbereiten auf (+A)", "-e hazırlanmak"],
    objs: [
      { pp: "auf die Prüfung", tr: "sınava", wrong: "auf der Prüfung" },
      { pp: "auf das Vorstellungsgespräch", tr: "iş görüşmesine", wrong: "auf dem Vorstellungsgespräch" },
    ],
  },
];

const praepB1 = openTemplate(
  "b1-acik-edatli-fiiller",
  "B1",
  "b1-praepverben",
  ["praep-verben"],
  "Fiili edatı ve haliyle birlikte öğren: warten auf + A, Angst haben vor + D, sich freuen auf / über + A …",
  (p) => {
    const pv = p.pick(PVERBS);
    const o = p.pick(pv.objs);
    const w = p.pick(EVERYONE);
    const tense = pv.presentOnly ? "pres" : p.pick(["pres", "past", "fut"] as const);
    const when = p.pick([null, ...(tense === "past" ? WHEN_PAST : WHEN_NOW).filter((x) => !x.part)]);
    const t: DeTense[] = tense === "past" ? ["perf", "praet"] : tense === "fut" ? ["fut", "pres"] : ["pres"];
    const de: string[] = [];
    for (const d of w.de) {
      for (const tt of t) {
        if (tense === "fut" && tt === "pres" && !when) continue;
        const c: DeClause = {
          subj: d.s,
          vg: verbGroup(pv.v, d.p, tt),
          refl: pv.refl ? REFLEXIVE[d.p] : undefined,
          mid: [when?.de, pv.extra, o.pp].filter((x): x is string => Boolean(x)),
          noun: !/^(ich|du|er|sie|es|wir|ihr|Sie)$/.test(d.s),
        };
        for (const mo of mainOrders(c)) de.push(sentence(mo));
        if (when) for (const mo of mainOrders({ ...c, mid: c.mid.slice(1) }, when.de)) de.push(sentence(mo));
      }
    }
    const prep = o.pp.split(" ")[0];
    const wrongs: [string, string][] = [];
    if (o.wrong) wrongs.push([o.wrong, `${pv.vocab[0]}: bu edattan sonra ${pv.vocab[0].includes("+D") ? "Dativ" : "Akkusativ"} gelir: ${o.pp}.`]);
    if (pv.wrongPrep && !["am", "ans", "ins", "im", "zum", "zur"].includes(prep)) {
      wrongs.push([o.pp.replace(/^\S+/, pv.wrongPrep[0]), pv.wrongPrep[1]]);
    }
    const trForm = tense === "past" ? "past" : tense === "fut" ? "fut" : "pres";
    return {
      tr: joinTr([trNoun(w), when?.tr, o.tr, trVerb(pv.tr, w.trP, trForm)]),
      de: unique(de),
      vocab: [pv.vocab],
      focus: wrongs.length ? [focus("praep-verben", o.pp, wrongs)] : [],
    };
  },
);

// ---------- relative clauses (subject) ----------

const REL_HEADS: { de: string; noun: string; g: "m" | "f" | "n" | "pl"; tr: string }[] = [
  { de: "der Mann", noun: "Mann", g: "m", tr: "adam" },
  { de: "die Frau", noun: "Frau", g: "f", tr: "kadın" },
  { de: "das Kind", noun: "Kind", g: "n", tr: "çocuk" },
  { de: "die Leute", noun: "Leute", g: "pl", tr: "insanlar" },
  { de: "der Student", noun: "Student", g: "m", tr: "öğrenci" },
  { de: "die Kinder", noun: "Kinder", g: "pl", tr: "çocuklar" },
  { de: "das Mädchen", noun: "Mädchen", g: "n", tr: "kız" },
];

const REL_NOM: Record<"m" | "f" | "n" | "pl", string> = { m: "der", f: "die", n: "das", pl: "die" };
const REL_G_TR = { m: "eril", f: "dişil", n: "nötr", pl: "çoğul" } as const;

const REL_PREDS: { sg: string; pl: string; tr: string; trPl: string }[] = [
  { sg: "ist sehr nett", pl: "sind sehr nett", tr: "çok kibar", trPl: "çok kibar" },
  { sg: "wohnt neben uns", pl: "wohnen neben uns", tr: "yanımızda oturuyor", trPl: "yanımızda oturuyor" },
  { sg: "kommt aus der Türkei", pl: "kommen aus der Türkei", tr: "Türkiye'den", trPl: "Türkiye'den" },
  { sg: "arbeitet mit meinem Vater", pl: "arbeiten mit meinem Vater", tr: "babamla çalışıyor", trPl: "babamla çalışıyor" },
  { sg: "ist mein Nachbar", pl: "sind meine Nachbarn", tr: "komşum", trPl: "komşularım" },
];

const relativB1 = openTemplate(
  "b1-acik-ilgi-cumlesi",
  "B1",
  "b1-relativ",
  ["relativ"],
  "İlgi zamiri cinsiyeti isimden, hâli yan cümledeki görevinden alır (burada özne: der / die / das); fiil sona gider.",
  (p) => {
    const h = p.pick(REL_HEADS);
    const pl = h.g === "pl";
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad", "mini") && !(h.noun.startsWith("Kind") && x.adult) && !(h.noun === "Mädchen" && x.adult)));
    const past = p.pick([false, true]);
    const when = timeFor(p, e, past ? WHEN_PAST : WHEN_HABIT);
    const pred = p.pick(REL_PREDS.filter((x) => pl || x.sg !== "ist mein Nachbar" || h.g === "m"));
    const rel = REL_NOM[h.g];
    const who: DeWho = { s: "", p: pl ? "3pl" : "3sg", det: h.g === "m" || h.g === "n" ? "sein" : "ihr" };
    const clauses = (past ? PAST_MAIN.slice(0, 1) : (["pres"] as DeTense[])).flatMap((t) => deEvent(e, who, t, { time: when?.de }));
    const predDe = pl ? pred.pl : pred.sg;
    const de = unique(clauses.flatMap((c) => subOrders(c, rel).map((so) => sentence([`${h.de},`, words(so) + ",", predDe]))));
    const others = unique(Object.values(REL_NOM)).filter((x) => x !== rel);
    const capHead = h.noun;
    return {
      tr: joinTr([when?.tr, trObject(e, pl ? "3pl" : "3sg"), T.presPart(e.tr), h.tr, pl ? pred.trPl : pred.tr]),
      de,
      vocab: [[h.de, h.tr], e.vocab],
      focus: [
        focus(
          "relativ",
          `${capHead}, ${rel}`,
          others.map((o) => [`${capHead}, ${o}`, `${h.de} ${REL_G_TR[h.g]}; ilgi zamiri yan cümlede özne olduğu için: ${rel}.`] as [string, string]),
        ),
        ...clauseFocus("relativ", rel, clauses[0], null),
      ],
    };
  },
);

export const OPEN_B1 = [
  relativB1,
  weilA2,
  wennA2,
  dassA2,
  obwohlB1,
  alsB1,
  bevorB1,
  nachdemB1,
  waehrendB1,
  umZuB1,
  damitB1,
  zuVerbsB1,
  esIstB1,
  konj2B1,
  politeB1,
  plusqAls,
  nachdemPlusq,
  genitivB1,
  praepB1,
];

export type { Generated };
