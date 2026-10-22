import { adjForm, determiner, n, np, pp, present, REFLEXIVE, REFLEXIVE_DAT, sentence, type Adj, type Case, type Noun } from "../grammar/de";
import * as T from "../grammar/tr";
import type { Focus } from "../types";
import { deEvent, joinTr, mainOrders, trEvent, trObject, trState, verbGroup, type DeClause, type DeTense } from "./clause";
import { focus, type Picker } from "./engine";
import {
  EVENTS,
  EVERYONE,
  fitsTime,
  fitsWho,
  LX,
  PEOPLE,
  PRONOUNS,
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
import { openTemplate, otherWho, unique, whoFor } from "./open-kit";

// Open-ended A1 / A2 templates built from the event lexicon.

const has = (e: Ev, ...tags: Tag[]) => e.tags.some((t) => tags.includes(t));
const words = (xs: (string | undefined | null | false)[]) => xs.filter((x): x is string => Boolean(x)).join(" ");
const trNoun = (w: Who) => (w.pron ? null : w.tr);
const isPron = (s: string) => /^(ich|du|er|sie|es|wir|ihr|Sie)$/.test(s);

function timeFor(p: Picker, e: Ev, pool: When[], optional = true): When | null {
  const fit = pool.filter((w) => fitsTime(e, w));
  return p.pick(optional ? [null, ...fit] : fit);
}

/** Subject-first and time-first orders of a main clause. */
function withTime(e: Ev, d: DeWho, t: DeTense, when: When | null, o: { modal?: LV; neg?: boolean } = {}): string[] {
  const out: string[] = [];
  for (const c of deEvent(e, d, t, { ...o, time: when?.de })) for (const mo of mainOrders(c)) out.push(sentence(mo));
  if (when) for (const c of deEvent(e, d, t, o)) for (const mo of mainOrders(c, when.de)) out.push(sentence(mo));
  return out;
}

const tail = (c: DeClause) => words([c.vg.fin, c.refl, ...c.mid, ...c.vg.end, c.vg.sep]);

// ---------- A1: verb second after a time expression ----------

const zamanA1 = openTemplate(
  "a1-acik-zaman",
  "A1",
  "a1-zeit",
  ["v2"],
  "Zaman ifadesi başa gelince fiil yine 2. sırada, özne fiilden sonra gelir: Heute gehe ich …",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive")));
    const w = whoFor(p, e);
    const when = timeFor(p, e, [...WHEN_NOW, ...WHEN_HABIT], false)!;
    const de = unique(w.de.flatMap((d) => withTime(e, d, "pres", when)));
    const c = deEvent(e, w.de[0], "pres")[0];
    return {
      tr: joinTr([trNoun(w), when.tr, trEvent(e, w.trP, "pres")]),
      de,
      vocab: [e.vocab],
      focus: [
        focus("v2", `${when.de} ${c.vg.fin} ${c.subj}`, [
          [`${when.de} ${c.subj} ${c.vg.fin}`, `Zaman ifadesi başta olunca fiil ikinci sırada kalır, özne fiilden sonra gelir: ${when.de} ${c.vg.fin} ${c.subj} …`],
        ]),
      ],
    };
  },
);

// ---------- A1: separable verbs ----------

const trennbarA1 = openTemplate(
  "a1-acik-ayrilabilen",
  "A1",
  "a1-trennbar",
  ["trennbar"],
  "Ayrılabilen fiilde ön ek cümlenin sonuna gider: Ich rufe meine Mutter an.",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => x.v.prefix));
    const w = whoFor(p, e);
    const when = timeFor(p, e, [...WHEN_NOW, ...WHEN_HABIT]);
    const de = unique(w.de.flatMap((d) => withTime(e, d, "pres", when)));
    const c = deEvent(e, w.de[0], "pres", { time: when?.de })[0];
    const prefix = c.vg.sep!;
    return {
      tr: joinTr([trNoun(w), when?.tr, trEvent(e, w.trP, "pres")]),
      de,
      vocab: [e.vocab],
      focus: [
        focus("trennbar", tail(c), [
          [words([prefix + c.vg.fin, c.refl, ...c.mid]), `Ayrılabilen fiilde ön ek (${prefix}) cümlenin sonuna gider: ${c.subj} ${tail(c)}.`],
        ]),
      ],
    };
  },
);

// ---------- A1: modal verbs ----------

const MODALS: { v: LV[]; tr: (e: Ev, w: Who) => string; vocab: [string, string] }[] = [
  { v: [LX.muessen], tr: (e, w) => trEvent(e, w.trP, "nec"), vocab: ["müssen", "-meli, zorunda olmak"] },
  { v: [LX.koennen], tr: (e, w) => trEvent(e, w.trP, "abil"), vocab: ["können", "-ebilmek"] },
  { v: [LX.wollen, LX.moechten], tr: (e, w) => `${trEvent(e, w.trP, "inf")} ${T.present(T.tv("iste"), w.trP)}`, vocab: ["wollen / möchten", "istemek"] },
];

const modalA1 = openTemplate(
  "a1-acik-modal",
  "A1",
  "a1-modal",
  ["modal"],
  "Modal fiil 2. sırada çekimlenir, asıl fiil mastar hâlinde en sona gider: Ich muss heute arbeiten.",
  (p) => {
    const m = p.pick(MODALS);
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad")));
    const w = whoFor(p, e);
    const when = timeFor(p, e, WHEN_NOW);
    const de = unique(w.de.flatMap((d) => m.v.flatMap((modal) => withTime(e, d, "pres", when, { modal }))));
    const c = deEvent(e, w.de[0], "pres", { modal: m.v[0], time: when?.de })[0];
    const before = words([c.refl, ...c.mid]);
    const focusList: Focus[] = before
      ? [focus("modal", `${before} ${e.v.inf}`, [[`${e.v.inf} ${before}`, `Modal fiille kullanılan mastar cümlenin en sonuna gider: ${c.subj} ${c.vg.fin} ${before} ${e.v.inf}.`]])]
      : [];
    return {
      tr: joinTr([trNoun(w), when?.tr, m.tr(e, w)]),
      de,
      vocab: [m.vocab, e.vocab],
      focus: focusList,
    };
  },
);

// ---------- A1: questions ----------

const QWORDS = [
  { de: "wann", tr: "ne zaman", first: false },
  { de: "warum", tr: "neden", first: true },
];

const frageA1 = openTemplate(
  "a1-acik-soru",
  "A1",
  "a1-fragen",
  ["w-frage", "ja-nein-frage"],
  "W-sorusunda soru kelimesinden hemen sonra fiil gelir; evet/hayır sorusunda fiil başa gelir.",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive")));
    const w = p.pick(EVERYONE.filter((x) => fitsWho(e, x) && x.id !== "ben" && x.id !== "biz"));
    const c0 = deEvent(e, w.de[0], "pres")[0];
    if (p.pick([true, false])) {
      const q = p.pick(QWORDS);
      const de = unique(w.de.flatMap((d) => deEvent(e, d, "pres").flatMap((c) => mainOrders(c, q.de).map((mo) => sentence(mo, "?")))));
      const obj = trObject(e, w.trP);
      const verb = T.present(e.tr, w.trP);
      const tr = q.first ? joinTr([q.tr, trNoun(w), obj, verb], "?") : joinTr([trNoun(w), obj, q.tr, verb], "?");
      return {
        tr,
        de,
        vocab: [[q.de, q.tr], e.vocab],
        focus: [
          focus("w-frage", `${q.de} ${c0.vg.fin} ${c0.subj}`, [
            [`${q.de} ${c0.subj} ${c0.vg.fin}`, `Soru kelimesinden hemen sonra çekimli fiil, sonra özne gelir: ${q.de} ${c0.vg.fin} ${c0.subj} …?`],
          ]),
        ],
      };
    }
    const when = timeFor(p, e, WHEN_NOW);
    const de = unique(
      w.de.flatMap((d) =>
        deEvent(e, d, "pres", { time: when?.de }).map((c) => sentence([c.vg.fin, c.subj, c.refl, ...c.mid, ...c.vg.end, c.vg.sep].filter(Boolean) as string[], "?")),
      ),
    );
    return {
      tr: joinTr([trNoun(w), when?.tr, trEvent(e, w.trP, "presQ")], "?"),
      de,
      vocab: [e.vocab],
      focus: [
        focus("ja-nein-frage", `${c0.vg.fin} ${c0.subj}`, [
          [`${c0.subj} ${c0.vg.fin}`, `Evet/hayır sorusunda çekimli fiil en başa gelir: ${c0.vg.fin} ${c0.subj} …?`],
        ]),
      ],
    };
  },
);

// ---------- A1: negation ----------

const negationA1 = openTemplate(
  "a1-acik-olumsuz",
  "A1",
  "a1-negation",
  ["kein-nicht"],
  "İsimden önce kein (keinen Kaffee); fiil, sıfat ve belirli nesnede nicht (Ich rufe sie nicht an).",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad")));
    const w = whoFor(p, e);
    const when = timeFor(p, e, WHEN_NOW, false);
    const de = unique(w.de.flatMap((d) => withTime(e, d, "pres", when, { neg: true })));
    const focusList: Focus[] = e.kein
      ? [focus("kein-nicht", e.kein, [[`nicht ${e.mid}`, `İsimden önce olumsuzluk kein ile yapılır: ${e.kein}.`]])]
      : [];
    return {
      tr: joinTr([trNoun(w), when?.tr, trEvent(e, w.trP, "pres", true)]),
      de,
      vocab: [e.kein ? ["kein", "hiç … (isimle olumsuzluk)"] : ["nicht", "değil, -me"], e.vocab],
      focus: focusList,
    };
  },
);

// ---------- A1: sein / haben ----------

interface Pred {
  v: LV;
  mid: string;
  /** Also sensible in the past (Gestern war ich müde; not: Gestern hatte ich zwei Kinder) */
  past?: boolean;
  tr: St["tr"];
  vocab: [string, string];
}

const PREDS: Pred[] = [
  { v: LX.sein, mid: "müde", past: true, tr: { k: "cop", word: "yorgun" }, vocab: ["müde", "yorgun"] },
  { v: LX.sein, mid: "krank", past: true, tr: { k: "cop", word: "hasta" }, vocab: ["krank", "hasta"] },
  { v: LX.sein, mid: "glücklich", past: true, tr: { k: "cop", word: "mutlu" }, vocab: ["glücklich", "mutlu"] },
  { v: LX.sein, mid: "traurig", past: true, tr: { k: "cop", word: "üzgün" }, vocab: ["traurig", "üzgün"] },
  { v: LX.sein, mid: "nervös", past: true, tr: { k: "cop", word: "gergin" }, vocab: ["nervös", "gergin"] },
  { v: LX.sein, mid: "zu Hause", past: true, tr: { k: "cop", word: "evde" }, vocab: ["zu Hause", "evde"] },
  { v: LX.sein, mid: "im Büro", past: true, tr: { k: "cop", word: "ofiste" }, vocab: ["im Büro", "ofiste"] },
  { v: LX.sein, mid: "verheiratet", tr: { k: "cop", word: "evli" }, vocab: ["verheiratet", "evli"] },
  { v: LX.sein, mid: "zufrieden", past: true, tr: { k: "cop", word: "memnun" }, vocab: ["zufrieden", "memnun"] },
  { v: LX.sein, mid: "aus der Türkei", tr: { k: "cop", word: "Türkiye'den" }, vocab: ["aus der Türkei", "Türkiye'den"] },
  { v: LX.haben, mid: "Hunger", past: true, tr: { k: "cop", word: "aç" }, vocab: ["Hunger haben", "aç olmak"] },
  { v: LX.haben, mid: "keine Zeit", past: true, tr: { k: "have", noun: "zaman", neg: true }, vocab: ["keine Zeit haben", "zamanı olmamak"] },
  { v: LX.haben, mid: "Zeit", past: true, tr: { k: "have", noun: "zaman" }, vocab: ["Zeit haben", "zamanı olmak"] },
  { v: LX.haben, mid: "ein Auto", tr: { k: "have", noun: "araba", pre: "bir" }, vocab: ["ein Auto", "bir araba"] },
  { v: LX.haben, mid: "einen Bruder", tr: { k: "have", noun: "erkek kardeş", pre: "bir" }, vocab: ["der Bruder", "erkek kardeş"] },
  { v: LX.haben, mid: "eine Schwester", tr: { k: "have", noun: "kız kardeş", pre: "bir" }, vocab: ["die Schwester", "kız kardeş"] },
  { v: LX.haben, mid: "zwei Kinder", tr: { k: "have", noun: "çocuk", soft: "çocuğ", pre: "iki" }, vocab: ["das Kind, -er", "çocuk"] },
  { v: LX.haben, mid: "Fieber", past: true, tr: { k: "have", noun: "ateş" }, vocab: ["Fieber", "ateş"] },
  { v: LX.haben, mid: "frei", past: true, tr: { k: "cop", word: "izinli" }, vocab: ["frei haben", "izinli olmak"] },
];

const seinHabenA1 = openTemplate(
  "a1-acik-sein-haben",
  "A1",
  "a1-sein-haben",
  ["sein", "haben"],
  "Durum, yer, köken: sein (Ich bin müde). Sahip olmak, Hunger, Zeit: haben (Ich habe Zeit).",
  (p) => {
    const pr = p.pick(PREDS);
    const w = p.pick(EVERYONE);
    const past = Boolean(pr.past) && p.pick([false, false, true]);
    const when = pr.past ? p.pick([null, ...(past ? WHEN_PAST : [{ de: "heute", tr: "bugün" }, { de: "jetzt", tr: "şimdi" }]).filter((x) => !x.part)]) : null;
    const st: St = { id: "x", v: pr.v, mid: pr.mid, tr: pr.tr, because: [], despite: [], vocab: pr.vocab };
    const t: DeTense = past ? "praet" : "pres";
    const de: string[] = [];
    for (const d of w.de) {
      const c: DeClause = { subj: d.s, vg: verbGroup(pr.v, d.p, t), mid: [when?.de, pr.mid].filter((x): x is string => Boolean(x)), noun: !isPron(d.s) };
      for (const mo of mainOrders(c)) de.push(sentence(mo));
      if (when) for (const mo of mainOrders({ ...c, mid: [pr.mid] }, when.de)) de.push(sentence(mo));
    }
    const d0 = w.de[0];
    const right = verbGroup(pr.v, d0.p, t).fin;
    const other = verbGroup(pr.v === LX.sein ? LX.haben : LX.sein, d0.p, t).fin;
    const front = w.pron ? null : pr.tr.k === "have" ? w.gen : w.tr;
    return {
      tr: joinTr([front, when?.tr, trState(st, w.trP, past ? "past" : "pres")]),
      de: unique(de),
      vocab: [pr.vocab],
      focus: [
        focus(pr.v === LX.sein ? "sein" : "haben", `${d0.s} ${right}`, [
          [
            `${d0.s} ${other}`,
            pr.v === LX.sein
              ? `Durum, yer ve köken sein ile söylenir: ${d0.s} ${right} ${pr.mid}.`
              : `Bu kalıp haben ile kurulur: ${d0.s} ${right} ${pr.mid}.`,
          ],
        ]),
      ],
    };
  },
);

// ---------- A1: articles in the accusative ----------

interface Thing {
  de: Noun;
  tr: string;
  soft?: string;
}

const THINGS: Thing[] = [
  { de: n("Tisch", "m"), tr: "masa" },
  { de: n("Stuhl", "m"), tr: "sandalye" },
  { de: n("Computer", "m"), tr: "bilgisayar" },
  { de: n("Mantel", "m"), tr: "palto" },
  { de: n("Schrank", "m"), tr: "dolap", soft: "dolab" },
  { de: n("Schlüssel", "m"), tr: "anahtar" },
  { de: n("Lampe", "f"), tr: "lamba" },
  { de: n("Tasche", "f"), tr: "çanta" },
  { de: n("Jacke", "f"), tr: "ceket" },
  { de: n("Uhr", "f"), tr: "saat" },
  { de: n("Wohnung", "f"), tr: "daire" },
  { de: n("Auto", "n"), tr: "araba" },
  { de: n("Fahrrad", "n"), tr: "bisiklet" },
  { de: n("Handy", "n"), tr: "telefon" },
  { de: n("Sofa", "n"), tr: "kanepe" },
  { de: n("Buch", "n"), tr: "kitap", soft: "kitab" },
];

const G_TR = { m: "eril", f: "dişil", n: "nötr" } as const;

/** Turkish sentence body for each verb, subject included. */
const AKK_VERBS: { v: LV; tr: (thing: string, def: boolean, w: Who, x: Thing) => (string | null)[]; vocab: [string, string] }[] = [
  {
    v: LX.kaufen,
    tr: (s, def, w, x) => [trNoun(w), def ? T.kase(s, "acc", false, x.soft) : `bir ${s}`, T.present(T.tv("al"), w.trP)],
    vocab: ["kaufen", "satın almak"],
  },
  {
    v: LX.suchen,
    tr: (s, def, w, x) => [trNoun(w), def ? T.kase(s, "acc", false, x.soft) : `bir ${s}`, T.present(T.tv("ara"), w.trP)],
    vocab: ["suchen", "aramak"],
  },
  {
    v: LX.brauchen,
    tr: (s, def, w, x) => [
      w.pron ? null : w.gen,
      def ? T.kase(s, "dat", false, x.soft) : `bir ${T.kase(s, "dat", false, x.soft)}`,
      `${T.poss("ihtiyaç", w.trP, "ihtiyac")} var`,
    ],
    vocab: ["brauchen", "ihtiyacı olmak"],
  },
];

const akkusativA1 = openTemplate(
  "a1-acik-akkusativ",
  "A1",
  "a1-artikel-akk",
  ["akkusativ", "artikel"],
  "Nesne Akkusativ'dedir: eril isimde der → den, ein → einen; dişil ve nötrde değişmez.",
  (p) => {
    const x = p.pick(THINGS);
    const verb = p.pick(AKK_VERBS);
    const w = p.pick(EVERYONE);
    const def = p.pick([false, false, true]);
    const det = def ? "def" : "ein";
    const obj = np({ det, noun: x.de }, "akk");
    const de = unique(w.de.map((d) => sentence([d.s, present(verb.v, d.p), obj])));
    const nom = np({ det, noun: x.de }, "nom");
    const wrongs: [string, string][] = [];
    if (nom !== obj) wrongs.push([nom, `${x.de.sg} ${G_TR[x.de.g]}; nesne olduğu için Akkusativ: ${obj}.`]);
    for (const g of ["m", "f", "n"] as const) {
      if (g === x.de.g) continue;
      const alt = `${determiner(det, "akk", g)} ${x.de.sg}`.trim();
      if (alt !== obj && alt !== nom) wrongs.push([alt, `${x.de.sg} ${G_TR[x.de.g]} bir isimdir: ${obj}.`]);
    }
    return {
      tr: joinTr(verb.tr(x.tr, def, w, x)),
      de,
      vocab: [[`${np({ det: "def", noun: x.de }, "nom")}`, x.tr], verb.vocab],
      focus: [focus(x.de.g === "m" ? "akkusativ" : "artikel", obj, wrongs.slice(0, 3))],
    };
  },
);

// ---------- A2: Perfekt ----------

const perfektA2 = openTemplate(
  "a2-acik-perfekt",
  "A2",
  "a2-perfekt",
  ["perfekt", "partizip2"],
  "Perfekt: haben / sein (2. sırada) + Partizip II (sonda). Hareket ve durum değişikliğinde sein.",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => !has(x, "bad") || x.id === "otobus-kacir"));
    const w = whoFor(p, e);
    const when = timeFor(p, e, WHEN_PAST, false)!;
    const de = unique(w.de.flatMap((d) => [...withTime(e, d, "perf", when), ...withTime(e, d, "praet", when)]));
    const c = deEvent(e, w.de[0], "perf")[0];
    const otherAux = verbGroup(e.v.aux === "sein" ? LX.haben : LX.sein, w.de[0].p, "pres").fin;
    const before = words([c.refl, ...c.mid]);
    const focusList: Focus[] = [
      focus("perfekt", `${when.de} ${c.vg.fin} ${c.subj}`, [
        [
          `${when.de} ${otherAux} ${c.subj}`,
          e.v.aux === "sein"
            ? `${e.v.inf} hareket ya da durum değişikliği bildirir; Perfekt sein ile kurulur: ${c.vg.fin} … ${e.v.part2}.`
            : `${e.v.inf} Perfekt'i haben ile kurar: ${c.vg.fin} … ${e.v.part2}.`,
        ],
        [`${when.de} ${c.subj} ${c.vg.fin}`, `Zaman ifadesi başta olunca yardımcı fiil ikinci sıraya, özne ondan sonraya gelir: ${when.de} ${c.vg.fin} ${c.subj} …`],
      ]),
    ];
    if (before) {
      focusList.push(focus("partizip2", `${before} ${e.v.part2}`, [[`${e.v.part2} ${before}`, `Partizip II cümlenin en sonuna gider: … ${before} ${e.v.part2}.`]]));
    }
    return {
      tr: joinTr([trNoun(w), when.tr, trEvent(e, w.trP, "past")]),
      de,
      vocab: [[e.v.inf, e.v.part2], e.vocab],
      focus: focusList,
    };
  },
);

// ---------- A2: Präteritum of modal verbs, war / hatte ----------

const PAST_MODALS: { v: LV; neg?: boolean; tr: (e: Ev, w: Who) => string; vocab: [string, string] }[] = [
  { v: LX.muessen, tr: (e, w) => `${trEvent(e, w.trP, "inf")} ${T.copulaPast("zorunda", w.trP)}`, vocab: ["musste", "zorundaydı"] },
  { v: LX.koennen, neg: true, tr: (e, w) => trEvent(e, w.trP, "inabPast"), vocab: ["konnte nicht", "-emedi"] },
  { v: LX.wollen, tr: (e, w) => `${trEvent(e, w.trP, "inf")} ${T.past(T.tv("iste"), w.trP)}`, vocab: ["wollte", "istedi"] },
];

const praeteritumA2 = openTemplate(
  "a2-acik-gecmis-modal",
  "A2",
  "a2-praeteritum",
  ["praeteritum"],
  "Modal fiillerin geçmişi: musste, konnte, wollte (+ mastar sonda).",
  (p) => {
    const m = p.pick(PAST_MODALS);
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad")));
    const w = whoFor(p, e);
    const when = timeFor(p, e, WHEN_PAST, false)!;
    const de = unique(w.de.flatMap((d) => withTime(e, d, "praet", when, { modal: m.v, neg: m.neg })));
    const d0 = w.de[0];
    const right = verbGroup(e.v, d0.p, "praet", m.v).fin;
    const now = verbGroup(e.v, d0.p, "pres", m.v).fin;
    return {
      tr: joinTr([trNoun(w), when.tr, m.tr(e, w)]),
      de,
      vocab: [m.vocab, e.vocab],
      focus: [focus("praeteritum", `${d0.s} ${right}`, [[`${d0.s} ${now}`, `Geçmişte olduğu için modal fiil Präteritum'da çekimlenir: ${now} → ${right}.`]])],
    };
  },
);

// ---------- A2: two-way prepositions ----------

interface Item {
  de: Noun;
  tr: string;
  soft?: string;
  kind: "lay" | "stand" | "hang";
}

const ITEMS: Item[] = [
  { de: n("Buch", "n"), tr: "kitap", soft: "kitab", kind: "lay" },
  { de: n("Handy", "n"), tr: "telefon", kind: "lay" },
  { de: n("Schlüssel", "m"), tr: "anahtar", kind: "lay" },
  { de: n("Brief", "m"), tr: "mektup", soft: "mektub", kind: "lay" },
  { de: n("Flasche", "f"), tr: "şişe", kind: "stand" },
  { de: n("Lampe", "f"), tr: "lamba", kind: "stand" },
  { de: n("Tasche", "f"), tr: "çanta", kind: "stand" },
  { de: n("Glas", "n"), tr: "bardak", soft: "bardağ", kind: "stand" },
  { de: n("Bild", "n"), tr: "resim", soft: "resm", kind: "hang" },
  { de: n("Jacke", "f"), tr: "ceket", kind: "hang" },
  { de: n("Mantel", "m"), tr: "palto", kind: "hang" },
];

interface Place {
  prep: string;
  de: Noun;
  to: string;
  at: string;
  kinds: Item["kind"][];
}

const PLACES: Place[] = [
  { prep: "auf", de: n("Tisch", "m"), to: "masanın üstüne", at: "masanın üstünde", kinds: ["lay", "stand"] },
  { prep: "unter", de: n("Bett", "n"), to: "yatağın altına", at: "yatağın altında", kinds: ["lay"] },
  { prep: "neben", de: n("Tür", "f"), to: "kapının yanına", at: "kapının yanında", kinds: ["lay", "stand", "hang"] },
  { prep: "in", de: n("Schrank", "m"), to: "dolaba", at: "dolapta", kinds: ["lay", "stand", "hang"] },
  { prep: "an", de: n("Wand", "f"), to: "duvara", at: "duvarda", kinds: ["hang"] },
  { prep: "auf", de: n("Stuhl", "m"), to: "sandalyenin üstüne", at: "sandalyenin üstünde", kinds: ["lay", "stand"] },
  { prep: "in", de: n("Regal", "n"), to: "rafa", at: "rafta", kinds: ["lay", "stand"] },
  { prep: "hinter", de: n("Sofa", "n"), to: "kanepenin arkasına", at: "kanepenin arkasında", kinds: ["lay", "stand"] },
];

const PUT: Record<Item["kind"], { put: LV; sit: LV; tr: T.TrVerb }> = {
  lay: { put: LX.legen, sit: LX.liegen, tr: T.tv("koy") },
  stand: { put: LX.stellen, sit: LX.stehen, tr: T.tv("koy") },
  hang: { put: LX.haengen, sit: LX.haengen, tr: T.tv("as") },
};

const wechselA2 = openTemplate(
  "a2-acik-iki-yonlu",
  "A2",
  "a2-wechsel",
  ["wechsel"],
  "wohin? (hareket: legen, stellen, hängen) → Akkusativ; wo? (durum: liegen, stehen, hängen) → Dativ.",
  (p) => {
    const item = p.pick(ITEMS);
    const place = p.pick(PLACES.filter((x) => x.kinds.includes(item.kind)));
    const verbs = PUT[item.kind];
    const thingNom = np({ det: "def", noun: item.de }, "nom");
    const thingAkk = np({ det: "def", noun: item.de }, "akk");
    const to = pp(place.prep, { det: "def", noun: place.de }, "akk");
    const at = pp(place.prep, { det: "def", noun: place.de }, "dat");
    if (p.pick([true, false])) {
      const w = p.pick(EVERYONE);
      const past = p.pick([false, true]);
      const de: string[] = [];
      for (const d of w.de) {
        const vg = verbGroup(verbs.put, d.p, past ? "perf" : "pres");
        const c: DeClause = { subj: d.s, vg, mid: [thingAkk, to], noun: !isPron(d.s) };
        for (const mo of mainOrders(c)) de.push(sentence(mo));
      }
      const d0 = w.de[0];
      const fin = verbGroup(verbs.put, d0.p, "pres").fin;
      const thingTr = T.kase(item.tr, "acc", false, item.soft);
      const focusList: Focus[] = [focus("wechsel", to, [[at, `Hareket var (wohin?): ${verbs.put.inf} + Akkusativ: ${to}.`]])];
      if (!past && item.kind !== "hang") {
        focusList.push(
          focus("wechsel", `${d0.s} ${fin}`, [[`${d0.s} ${present(verbs.sit, d0.p)}`, `Bir yere koymak ${verbs.put.inf} (hareket); bir yerde durmak ${verbs.sit.inf} (durum).`]]),
        );
      }
      return {
        tr: joinTr([trNoun(w), thingTr, place.to, past ? T.past(verbs.tr, w.trP) : T.present(verbs.tr, w.trP)]),
        de: unique(de),
        vocab: [[verbs.put.inf, item.kind === "hang" ? "asmak" : "koymak"], [`${thingNom}`, item.tr]],
        focus: focusList,
      };
    }
    const past = p.pick([false, true]);
    const fin = past ? verbs.sit.praet[2] : present(verbs.sit, "3sg");
    const finSit = item.kind === "hang" && past ? "hing" : fin;
    const de = unique([sentence([thingNom, finSit, at]), sentence([at, finSit, thingNom])]);
    const atText = item.kind === "hang" ? `${place.at} asılı` : place.at;
    const putForm = present(verbs.put, "3sg");
    const focusList: Focus[] = [focus("wechsel", at, [[to, `Durum var (wo?): ${verbs.sit.inf} + Dativ: ${at}.`]])];
    if (!past && item.kind !== "hang") focusList.push(focus("wechsel", `${thingNom} ${fin}`, [[`${thingNom} ${putForm}`, `Bir yerde durmak ${verbs.sit.inf} (durum); bir yere koymak ${verbs.put.inf} (hareket).`]]));
    return {
      tr: joinTr([item.tr, past ? T.copulaPast(atText, "3sg") : atText]),
      de,
      vocab: [[verbs.sit.inf, item.kind === "hang" ? "asılı durmak" : "durmak"], [thingNom, item.tr]],
      focus: focusList,
    };
  },
);

// ---------- A2: adjective endings ----------

const ADJS: { de: Adj; tr: string; for?: Noun["g"][] }[] = [
  { de: { base: "neu" }, tr: "yeni" },
  { de: { base: "alt" }, tr: "eski" },
  { de: { base: "groß" }, tr: "büyük" },
  { de: { base: "klein" }, tr: "küçük" },
  { de: { base: "schön" }, tr: "güzel" },
  { de: { base: "teuer", stem: "teur" }, tr: "pahalı" },
  { de: { base: "billig" }, tr: "ucuz" },
  { de: { base: "rot" }, tr: "kırmızı" },
  { de: { base: "schwarz" }, tr: "siyah" },
  { de: { base: "modern" }, tr: "modern" },
];

const CASE_TR: Record<Case, string> = { nom: "Nominativ", akk: "Akkusativ", dat: "Dativ", gen: "Genitiv" };

const adjektivA2 = openTemplate(
  "a2-acik-sifat",
  "A2",
  "a2-adjektiv",
  ["adjektiv"],
  "Sıfat ekleri artikele, cinsiyete ve hâle göre değişir: ein neuer Tisch, einen neuen Tisch, mit dem neuen Tisch.",
  (p) => {
    const x = p.pick(THINGS);
    const a = p.pick(ADJS);
    const frame = p.pick(["nom-ein", "akk-ein", "dat-def", "nom-def"] as const);
    const w = p.pick(EVERYONE);
    const det = frame.endsWith("ein") ? "ein" : "def";
    const c: Case = frame.startsWith("nom") ? "nom" : frame.startsWith("akk") ? "akk" : "dat";
    const phrase = np({ det, noun: x.de, adj: a.de }, c);
    const opposite: Record<string, string> = { teuer: "billig", billig: "teuer", groß: "klein", klein: "groß" };
    const other = p.pick(ADJS.filter((y) => y !== a && !["rot", "schwarz", "neu", "alt"].includes(y.de.base) && opposite[a.de.base] !== y.de.base));
    let de: string[];
    let tr: string;
    if (frame === "nom-ein") {
      de = [sentence(["das ist", phrase]), sentence(["das hier ist", phrase])];
      tr = joinTr(["bu", a.tr, "bir", x.tr]);
    } else if (frame === "akk-ein") {
      de = w.de.map((d) => sentence([d.s, present(LX.kaufen, d.p), phrase]));
      tr = joinTr([trNoun(w), a.tr, "bir", x.tr, T.present(T.tv("al"), w.trP)]);
    } else if (frame === "dat-def") {
      de = w.de.map((d) => sentence([d.s, present(LX.sein, d.p), "mit", phrase, "zufrieden"]));
      tr = joinTr([trNoun(w), a.tr, T.kase(x.tr, "abl"), T.copula("memnun", w.trP)]);
    } else {
      de = [sentence([phrase, "ist sehr", other.de.base])];
      tr = joinTr([a.tr, x.tr, "çok", other.tr]);
    }
    const right = adjForm(a.de, det, c, x.de.g);
    const stem = a.de.stem ?? a.de.base;
    const wrongs = ["e", "er", "es", "en"]
      .map((end) => stem + end)
      .filter((f) => f !== right)
      .slice(0, 2)
      .map((f) => [phrase.replace(right, f), `${CASE_TR[c]}, ${G_TR[x.de.g]} isim, ${det === "ein" ? "belirsiz artikel (ein-)" : "belirli artikel (der/die/das)"}: ${phrase}.`] as [string, string]);
    return {
      tr,
      de: unique(de),
      vocab: [[a.de.base, a.tr], [np({ det: "def", noun: x.de }, "nom"), x.tr]],
      focus: [focus("adjektiv", phrase, wrongs)],
    };
  },
);

// ---------- A2: comparison ----------

const COMP: { base: string; comp: string; tr: string }[] = [
  { base: "alt", comp: "älter", tr: "büyük" },
  { base: "jung", comp: "jünger", tr: "küçük" },
  { base: "groß", comp: "größer", tr: "uzun" },
  { base: "klein", comp: "kleiner", tr: "kısa" },
  { base: "schnell", comp: "schneller", tr: "hızlı" },
  { base: "fleißig", comp: "fleißiger", tr: "çalışkan" },
  { base: "lustig", comp: "lustiger", tr: "komik" },
  { base: "stark", comp: "stärker", tr: "güçlü" },
  { base: "müde", comp: "müder", tr: "yorgun" },
  { base: "glücklich", comp: "glücklicher", tr: "mutlu" },
];

const TR_ABL: Record<string, string> = { ben: "benden", sen: "senden", o: "ondan", biz: "bizden", siz: "sizden", onlar: "onlardan" };
const trAbl = (w: Who) => (w.pron ? TR_ABL[w.id] : T.kase(w.tr, "abl"));
const trKadar = (w: Who) => (w.pron ? (w.id === "onlar" ? "onlar" : w.gen) : w.tr) + " kadar";

const vergleichA2 = openTemplate(
  "a2-acik-karsilastirma",
  "A2",
  "a2-vergleich",
  ["komparativ"],
  "Karşılaştırma: sıfat + -er + als (größer als); eşitlik: so … wie (so groß wie).",
  (p) => {
    const a = p.pick(COMP);
    const w1 = p.pick([...PRONOUNS.filter((x) => x.id !== "siz"), ...PEOPLE]);
    const w2 = otherWho(p, w1);
    const equal = p.pick([false, false, true]);
    const de: string[] = [];
    for (const d1 of w1.de) {
      for (const d2 of w2.de) {
        const be = present(LX.sein, d1.p);
        de.push(equal ? sentence([d1.s, be, "so", a.base, "wie", d2.s]) : sentence([d1.s, be, a.comp, "als", d2.s]));
      }
    }
    const d2 = w2.de[0];
    const trPred = T.copula(a.tr, w1.trP);
    return {
      tr: equal ? joinTr([w1.tr, trKadar(w2), trPred]) : joinTr([w1.tr, trAbl(w2), "daha", trPred]),
      de: unique(de),
      vocab: [[equal ? `so ${a.base} wie` : `${a.comp} als`, equal ? `… kadar ${a.tr}` : `-den daha ${a.tr}`]],
      focus: equal
        ? [focus("komparativ", `so ${a.base} wie`, [[`so ${a.base} als`, `Eşitlik so … wie ile söylenir: so ${a.base} wie ${d2.s}.`]])]
        : [
            focus("komparativ", `${a.comp} als`, [
              [`${a.comp} wie`, `Karşılaştırmada als kullanılır: ${a.comp} als ${d2.s}.`],
              [`mehr ${a.base} als`, `Almancada 'daha' için sıfata -er eklenir: ${a.comp} (mehr ${a.base} değil).`],
            ]),
          ],
    };
  },
);

// ---------- A2: reflexive verbs ----------

const reflexivA2 = openTemplate(
  "a2-acik-donuslu",
  "A2",
  "a2-reflexiv",
  ["reflexiv"],
  "Dönüşlü zamir özneye uyar: ich → mich, du → dich, er/sie → sich, wir → uns, ihr → euch. (sich die Hände waschen: mir, dir …)",
  (p) => {
    const e = p.pick(EVENTS.filter((x) => x.refl));
    const w = whoFor(p, e);
    const past = p.pick([false, true]);
    const when = timeFor(p, e, past ? WHEN_PAST : [...WHEN_NOW, ...WHEN_HABIT]);
    const de = unique(w.de.flatMap((d) => (past ? [...withTime(e, d, "perf", when), ...withTime(e, d, "praet", when)] : withTime(e, d, "pres", when))));
    const d0 = w.de[0];
    const c = deEvent(e, d0, past ? "perf" : "pres")[0];
    const table = e.refl === "dat" ? REFLEXIVE_DAT : REFLEXIVE;
    const other = e.refl === "dat" ? REFLEXIVE : REFLEXIVE_DAT;
    const wrongs = unique([...Object.values(table), other[d0.p]])
      .filter((r) => r !== c.refl)
      .slice(0, 3)
      .map(
        (r) =>
          [`${d0.s} ${c.vg.fin} ${r}`, e.refl === "dat" && r === other[d0.p] ? `Bu fiilde dönüşlü zamir Dativ'dir (${e.vocab[0]}): ${d0.s} … ${c.refl}.` : `Dönüşlü zamir özneye uyar: ${d0.s} → ${c.refl}.`] as [
            string,
            string,
          ],
      );
    return {
      tr: joinTr([trNoun(w), when?.tr, trEvent(e, w.trP, past ? "past" : "pres")]),
      de,
      vocab: [e.vocab],
      focus: [focus("reflexiv", `${d0.s} ${c.vg.fin} ${c.refl}`, wrongs)],
    };
  },
);

export const OPEN_A = [
  reflexivA2,
  zamanA1,
  trennbarA1,
  modalA1,
  frageA1,
  negationA1,
  seinHabenA1,
  akkusativA1,
  perfektA2,
  praeteritumA2,
  wechselA2,
  adjektivA2,
  vergleichA2,
];

export { THINGS, ITEMS };
