import { capitalize, n, np, pp, present, zuInf, type Noun, type Person } from "../grammar/de";
import * as T from "../grammar/tr";
import type { Focus } from "../types";
import { expand } from "./alts";
import { deEvent, deMids, joinTr, mainOrders, reflOf, subOrders, subText, trEvent, trObject, v2Text, verbGroup, type DeClause, type DeTense } from "./clause";
import { focus, type Generated, type Picker } from "./engine";
import { EVENTS, EVERYONE, fitsTime, fitsWho, LX, lv, PEOPLE, WHEN_PAST, type DeWho, type Ev, type LV, type Tag, type When, type Who } from "./lexicon";
import { openTemplate, pronounOf, unique } from "./open-kit";

// Open-ended templates for advanced everyday German (level "GK"): long spoken sentences with
// two or three clauses, Konjunktiv, indirect questions, statt … zu and slang, in endless variations.
// Spoken short forms (hab, wär's, drauf) and filler particles are handled by the grader.

const words = (xs: (string | undefined | null | false)[]) => xs.filter((x): x is string => Boolean(x)).join(" ");
const has = (e: Ev, ...tags: Tag[]) => e.tags.some((t) => tags.includes(t));
const E = (id: string): Ev => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`unknown event ${id}`);
  return e;
};
const W = (id: string): Who => EVERYONE.find((x) => x.id === id)!;
const SEN = W("sen");
const SIZ = W("siz");
const BEN = W("ben");
const BIZ = W("biz");
const O = W("o");
const ICH = BEN.de[0];
const WIR = BIZ.de[0];
const PRONOUN = /^(ich|du|er|sie|es|wir|ihr|Sie)$/;
const DAT_PRON: Record<string, string> = { ich: "mir", du: "dir", er: "ihm", es: "ihm", wir: "uns", ihr: "euch", Sie: "Ihnen" };
const datOf = (d: DeWho) => (d.s === "sie" ? (d.p === "3pl" ? "ihnen" : "ihr") : DAT_PRON[d.s]);
const G_TR = { m: "eril", f: "dişil", n: "nötr" } as const;

/** Turkish subject of a nominalised clause (Ali'nin gelmesi); pronouns only where the ending is ambiguous. */
const trGen = (w: Who) => (!w.pron || w.trP === "2sg" || w.trP === "3sg" ? w.gen : null);
/** Turkish subject of a finite clause: nouns only, pronouns are dropped. */
const trNom = (w: Who) => (w.pron ? null : w.tr);

const subs = (c: DeClause, conj: string) => subOrders(c, conj).map((x) => x.join(" "));
const mains = (c: DeClause, front?: string) => mainOrders(c, front).map((x) => x.join(" "));
/** All sentences of the given patterns ({a|b} alternatives, [x] optional parts). */
const all = (...patterns: string[]) => unique(patterns.flatMap((x) => expand(x)));

function clause(d: DeWho, v: LV, mid: string[], t: DeTense = "pres", modal?: LV): DeClause {
  return { subj: d.s, vg: verbGroup(v, d.p, t, modal), mid: mid.filter(Boolean), noun: !PRONOUN.test(d.s) };
}

function timeFor(p: Picker, e: Ev, pool: When[], optional = true): When | null {
  const fit = pool.filter((w) => fitsTime(e, w));
  return p.pick(optional ? [null, ...fit] : fit);
}

/** "ins Kino zu gehen", "mich auszuruhen", "meine Oma zu besuchen" */
function zuGroups(e: Ev, d: DeWho, time?: string): string[] {
  return deMids(e, d).map((mid) => words([reflOf(e, d.p), time, mid, zuInf(e.v)]));
}

function zuFocus(rule: string, e: Ev, zu: string): Focus {
  const right = zuInf(e.v);
  return focus(
    rule,
    right,
    e.v.prefix
      ? [[`zu ${e.v.inf}`, `Ayrılabilen fiilde zu ön ek ile fiilin arasına girer: ${right}.`]]
      : [[e.v.inf, `Bu kalıpta mastar zu ile gelir ve sona gider: …, ${zu}.`]],
  );
}

/** The finite verb at the end of a subordinate clause (dass, ob, wenn …). */
function endFocus(rule: string, conj: string, c: DeClause): Focus[] {
  const right = subText(c);
  const wrong = v2Text(c);
  if (right === wrong) return [];
  return [focus(rule, right, [[wrong, `${conj} yan cümle açar, çekimli fiil en sona gider: ${conj} ${right}.`]])];
}

function perfFocus(e: Ev, d: DeWho, c: DeClause): Focus[] {
  if (!c.vg.end.length) return [];
  const other = present(e.v.aux === "sein" ? LX.haben : LX.sein, d.p);
  return [focus("perfekt", `${e.v.part2} ${c.vg.fin}`, [[`${e.v.part2} ${other}`, `${e.v.inf} Perfekt'te ${e.v.aux} ile kurulur: … ${e.v.part2} ${c.vg.fin}.`]])];
}

// Everyday verbs the lexicon does not have
const V_GUCKEN = lv("gucken", "geguckt");
const V_ZOCKEN = lv("zocken", "gezockt");
const V_PENNEN = lv("pennen", "gepennt");
const V_CHILLEN = lv("chillen", "gechillt");
const V_RUMHAENGEN = lv("rumhängen", "rumgehangen", { prefix: "rum", praet: "hing" });
const V_RUMLIEGEN = lv("rumliegen", "rumgelegen", { prefix: "rum", praet: "lag" });
const V_RAUSGEHEN = lv("rausgehen", "rausgegangen", { prefix: "raus", sein: true, praet: "ging" });
const V_ANTWORTEN = lv("antworten", "geantwortet");
const V_UNTERBRECHEN = lv("unterbrechen", "unterbrochen", { praet: "unterbrach", du: "unterbrichst", er: "unterbricht" });
const V_AUSRAEUMEN = lv("ausräumen", "ausgeräumt", { prefix: "aus" });
const V_LASSEN = lv("lassen", "gelassen", { praet: "ließ", du: "lässt", er: "lässt" });
const V_ANLASSEN = lv("anlassen", "angelassen", { prefix: "an", praet: "ließ", du: "lässt", er: "lässt" });
const V_TELEFONIEREN = lv("telefonieren", "telefoniert");
const V_FRIEREN = lv("frieren", "gefroren", { praet: "fror" });
const V_MECKERN: LV = { ...lv("meckern", "gemeckert"), table: ["meckere", "meckerst", "meckert", "meckern", "meckert", "meckern"] };

const NEXT: When[] = [
  { de: "morgen", tr: "yarın" },
  { de: "am Wochenende", tr: "hafta sonu" },
  { de: "heute Abend", tr: "bu akşam", part: "evening" },
  { de: "nächste Woche", tr: "gelecek hafta" },
];

const CITIES: [string, string][] = [
  ["Berlin", "Berlin"],
  ["München", "Münih"],
  ["Hamburg", "Hamburg"],
  ["Köln", "Köln"],
  ["Frankfurt", "Frankfurt"],
  ["Wien", "Viyana"],
  ["Zürich", "Zürih"],
  ["Stuttgart", "Stuttgart"],
  ["Leipzig", "Leipzig"],
  ["Dresden", "Dresden"],
];

// ---------- small talk: gossip and indirect questions ----------

/** Things worth gossiping about (no "he had breakfast") */
const NEWS = [
  "berlin", "sinema", "sehir", "hediye", "davet", "ziyaret", "ziyaret-arkadas", "arkadas-bulus", "kek", "aksam-yemegi", "temizlik", "oda-topla",
  "araba-yika", "futbol", "spor", "yuzme", "bisiklet", "dans", "foto", "tatil-plan", "doktor", "almanca", "sinav", "piyano", "gec-kal",
  "otobus-kacir", "taksi", "siparis", "istasyon", "yardim", "ara", "ara-kardes",
].map(E);

const dedikodu = openTemplate(
  "gk-zor-dedikodu",
  "GK",
  "gk-sohbet",
  ["indirekte-frage", "nebensatz"],
  "Duyum: Ich hab gehört, dass … (fiil sonda). Dolaylı soru: Weißt du zufällig, ob … (fiil sonda)?",
  (p) => {
    if (p.pick([true, false])) {
      const w = p.pick([SEN, O, ...PEOPLE]);
      const e = p.pick(NEWS.filter((x) => fitsWho(x, w)));
      const when = timeFor(p, e, WHEN_PAST, false)!;
      const de: string[] = [];
      for (const d of w.de) {
        for (const c of deEvent(e, d, "perf", { time: when.de })) {
          for (const so of subs(c, "dass")) de.push(...all(`{Ich hab|Ich habe} gehört, ${so}. {Stimmt das|Ist das wahr}?`, `{Stimmt es|Ist es wahr}, ${so}?`));
          for (const mo of mains(c, "angeblich")) de.push(...all(`${mo}, {stimmt das|oder}?`));
        }
      }
      const d0 = w.de[0];
      const c0 = deEvent(e, d0, "perf", { time: when.de })[0];
      return {
        tr: joinTr(["duyduğuma göre", trNom(w), when.tr, `${trEvent(e, w.trP, "evid")},`, "doğru mu"], "?"),
        de: unique(de),
        vocab: [["Ich hab gehört, dass …", "duyduğuma göre …"], ["angeblich", "güya, söylenene göre"], e.vocab],
        focus: [...endFocus("nebensatz", "dass", c0), ...perfFocus(e, d0, c0)],
      };
    }
    const w = p.pick([O, ...PEOPLE]);
    const e = p.pick(NEWS.filter((x) => fitsWho(x, w) && !has(x, "bad")));
    const future = p.pick([false, true]);
    const when = timeFor(p, e, future ? NEXT : WHEN_PAST, false)!;
    const clauses = (d: DeWho) =>
      future ? [...deEvent(e, d, "pres", { time: when.de }), ...deEvent(e, d, "fut", { time: when.de })] : deEvent(e, d, "perf", { time: when.de });
    const de: string[] = [];
    for (const d of w.de) {
      for (const c of clauses(d)) for (const so of subs(c, "ob")) de.push(...all(`{Weißt du [zufällig|vielleicht]|Hast du [zufällig] eine Ahnung}, ${so}?`));
    }
    return {
      tr: joinTr([trGen(w), when.tr, trObject(e, w.trP), T.whether(e.tr, w.trP, future ? "fut" : "past"), "biliyor musun acaba"], "?"),
      de: unique(de),
      vocab: [["Weißt du zufällig, ob …?", "… -ip -mediğini biliyor musun acaba?"], e.vocab],
      focus: endFocus("indirekte-frage", "ob", clauses(w.de[0])[0]),
    };
  },
);

// ---------- reactions: disbelief, "no wonder", annoyance ----------

interface Cause {
  v: LV;
  mid: string;
  tr: T.TrVerb;
  trObj: string;
  neg?: boolean;
  adult?: boolean;
  states: string[];
  vocab: [string, string];
}

const CAUSES: Cause[] = [
  { v: V_GUCKEN, mid: "die ganze Nacht Serien", tr: T.tv("dizi izle"), trObj: "bütün gece", states: ["yorgun"], vocab: ["Serien gucken", "dizi izlemek (konuşma)"] },
  { v: V_ZOCKEN, mid: "bis drei Uhr morgens", tr: T.tv("oyun oyna"), trObj: "sabahın üçüne kadar", states: ["yorgun"], vocab: ["zocken", "(bilgisayar) oyun oynamak"] },
  { v: LX.gehen, mid: "jeden Abend feiern", tr: T.tv("partiye git", "partiye gid"), trObj: "her akşam", adult: true, states: ["yorgun", "para"], vocab: ["feiern gehen", "eğlenmeye/partiye gitmek"] },
  { v: LX.fruehstuecken, mid: "nie", tr: T.tv("kahvaltı et", "kahvaltı ed"), trObj: "hiç", neg: true, states: ["ac"], vocab: ["frühstücken", "kahvaltı etmek"] },
  { v: LX.essen, mid: "den ganzen Tag nichts", tr: T.tv("bir şey ye"), trObj: "bütün gün", neg: true, states: ["ac", "kopf"], vocab: ["den ganzen Tag", "bütün gün"] },
  { v: LX.bestellen, mid: "jeden Tag Essen", tr: T.tv("dışarıdan yemek söyle"), trObj: "her gün", adult: true, states: ["para"], vocab: ["Essen bestellen", "dışarıdan yemek söylemek"] },
  { v: LX.kaufen, mid: "ständig neue Klamotten", tr: T.tv("yeni kıyafet al"), trObj: "sürekli", adult: true, states: ["para"], vocab: ["Klamotten", "kıyafetler (konuşma)"] },
  { v: LX.haengen, mid: "den ganzen Tag am Handy", tr: T.tv("telefona bak"), trObj: "bütün gün", states: ["kopf", "yorgun"], vocab: ["am Handy hängen", "telefondan başını kaldırmamak"] },
  { v: LX.trinken, mid: "so wenig Wasser", tr: T.tv("su iç"), trObj: "bu kadar az", states: ["kopf"], vocab: ["so wenig", "bu kadar az"] },
  { v: V_RAUSGEHEN, mid: "im Winter ohne Jacke", tr: T.tv("dışarı çık"), trObj: "kışın montsuz", states: ["kalt"], vocab: ["rausgehen", "dışarı çıkmak (konuşma)"] },
  { v: LX.arbeiten, mid: "jeden Tag bis neun", tr: T.tv("çalış"), trObj: "her gün dokuza kadar", adult: true, states: ["zeit", "yorgun"], vocab: ["bis neun", "dokuza kadar"] },
];

interface KwState {
  de: (d: DeWho) => DeClause[];
  tr: (p: Person) => string;
  vocab: [string, string];
}

const KW: Record<string, KwState> = {
  yorgun: { de: (d) => [clause(d, LX.sein, ["müde"])], tr: (p) => T.copula("yorgun", p), vocab: ["müde", "yorgun"] },
  ac: { de: (d) => [clause(d, LX.haben, ["Hunger"])], tr: (p) => T.copula("aç", p), vocab: ["Hunger haben", "aç olmak"] },
  para: { de: (d) => [clause(d, LX.haben, ["kein Geld"])], tr: (p) => `${T.poss("para", p)} yok`, vocab: ["kein Geld haben", "parası olmamak"] },
  kopf: { de: (d) => [clause(d, LX.haben, ["Kopfschmerzen"])], tr: (p) => `${T.poss("baş", p)} ağrıyor`, vocab: ["Kopfschmerzen haben", "başı ağrımak"] },
  kalt: {
    de: (d) => [
      clause(d, V_FRIEREN, []),
      ...(PRONOUN.test(d.s) ? [{ subj: datOf(d), vg: { fin: "ist", end: [] }, mid: ["kalt"], noun: false }] : []),
    ],
    tr: (p) => T.present(T.tv("üşü"), p),
    vocab: ["frieren / mir ist kalt", "üşümek"],
  },
  zeit: { de: (d) => [clause(d, LX.haben, ["keine Zeit"])], tr: (p) => `${T.poss("zaman", p)} yok`, vocab: ["keine Zeit haben", "zamanı olmamak"] },
};

interface Habit {
  v: LV;
  mid: (d: DeWho) => string;
  tr: (p: Person) => string;
  adult?: boolean;
  vocab: [string, string];
}

/** Verbal noun with possessive ending (gelmesi, gelmemen), after its complements. */
const vn = (obj: string, v: string, p: Person, neg = false) => words([obj, T.poss(T.verbNoun(T.tv(v), neg), p)]);
/** Possessive with a neuter noun in the accusative: sein Handy, dein Geschirr */
const poss = (d: DeWho, noun: string) => `${d.det} ${noun}`;

const HABITS: Habit[] = [
  { v: LX.kommen, mid: () => "immer zu spät", tr: (p) => vn("hep", "geç kal", p), vocab: ["zu spät kommen", "geç kalmak"] },
  { v: LX.hoeren, mid: () => "nachts laut Musik", tr: (p) => vn("gece yüksek sesle", "müzik dinle", p), vocab: ["laut", "yüksek sesle"] },
  { v: V_GUCKEN, mid: (d) => `ständig auf ${poss(d, "Handy")}`, tr: (p) => vn(`sürekli ${T.possCase("telefon", p, "dat")}`, "bak", p), vocab: ["auf das Handy gucken", "telefona bakmak"] },
  { v: V_ANTWORTEN, mid: () => "nie auf meine Nachrichten", tr: (p) => vn("mesajlarıma hiç", "cevap ver", p, true), vocab: ["auf Nachrichten antworten", "mesajlara cevap vermek"] },
  { v: V_UNTERBRECHEN, mid: () => "mich ständig", tr: (p) => vn("sürekli", "sözümü kes", p), vocab: ["jemanden unterbrechen", "birinin sözünü kesmek"] },
  { v: V_AUSRAEUMEN, mid: () => "nie die Spülmaschine", tr: (p) => vn("bulaşık makinesini hiç", "boşalt", p, true), adult: true, vocab: ["die Spülmaschine ausräumen", "bulaşık makinesini boşaltmak"] },
  { v: V_MECKERN, mid: () => "immer über alles", tr: (p) => vn("hep her şeyden", "şikâyet et", p), vocab: ["meckern", "söylenmek, şikâyet etmek"] },
  {
    v: V_LASSEN,
    mid: (d) => `${poss(d, "Geschirr")} immer in der Spüle stehen`,
    tr: (p) => vn(`${T.possCase("bulaşıklar", p, "acc")} hep lavaboda`, "bırak", p),
    vocab: ["etwas stehen lassen", "bir şeyi (öylece) bırakmak"],
  },
  { v: V_ANLASSEN, mid: () => "überall das Licht", tr: (p) => vn("her yerde ışıkları açık", "bırak", p), vocab: ["das Licht anlassen", "ışığı açık bırakmak"] },
  { v: V_TELEFONIEREN, mid: () => "im Zug so laut", tr: (p) => vn("trende bu kadar yüksek sesle", "telefonda konuş", p), adult: true, vocab: ["telefonieren", "telefonla konuşmak"] },
];

const tepki = openTemplate(
  "gk-zor-tepki",
  "GK",
  "gk-tepki",
  ["dass-gefuehl", "nebensatz"],
  "Ich kann nicht glauben, dass … / Es nervt mich, dass … / Kein Wunder, dass …, wenn …: her yan cümlede fiil sonda.",
  (p): Generated => {
    const kind = p.pick(["glaub", "wunder", "wunder", "nerv"] as const);
    if (kind === "glaub") {
      const w = p.pick([SEN, O, ...PEOPLE]);
      const e = p.pick(NEWS.filter((x) => fitsWho(x, w)));
      const neg = !has(e, "bad") && has(e, "contact", "chore", "study") && p.pick([false, true]);
      // the surprise: finally done, again late, or still not done
      const adv = neg ? null : has(e, "bad") ? (["schon wieder", "yine"] as const) : (["endlich", "sonunda"] as const);
      const when = timeFor(p, e, WHEN_PAST);
      const time = words([when?.de, adv?.[0]]) || undefined;
      const de: string[] = [];
      for (const d of w.de) {
        for (const c of deEvent(e, d, "perf", { time, neg })) {
          for (const so of subs(c, "dass")) de.push(...all(`{Ich kann [es] [echt|wirklich] nicht glauben|Ich fass es nicht|Unglaublich}, ${so}!`));
        }
      }
      const c0 = deEvent(e, w.de[0], "perf", { time, neg })[0];
      return {
        tr: joinTr([trGen(w), when?.tr, adv?.[1], trEvent(e, w.trP, "dikDat", neg), "inanamıyorum"], "!"),
        de: unique(de),
        vocab: [["Ich kann nicht glauben, dass …", "… -diğine inanamıyorum"], ["Ich fass es nicht!", "inanamıyorum!, aklım almıyor"], e.vocab],
        focus: [...endFocus("nebensatz", "dass", c0), ...perfFocus(e, w.de[0], c0)],
      };
    }
    if (kind === "wunder") {
      const c = p.pick(CAUSES);
      const st = KW[p.pick(c.states)];
      const w = p.pick([SEN, SEN, SIZ, O, ...PEOPLE].filter((x) => !(c.adult && x.kid)));
      const cause = (d: DeWho) => clause(d, c.v, [c.mid]);
      const de: string[] = [];
      for (const d of w.de) {
        const pron = pronounOf(d);
        for (const b of subs(cause(pron), "wenn")) {
          for (const s of st.de(d)) {
            for (const a of subs(s, "dass")) de.push(...all(`Kein Wunder, ${a}, ${b}!`));
            for (const a of mains(s, "klar")) de.push(...all(`${a}, ${b}!`));
          }
        }
        for (const a of subs(cause(d), "wenn")) {
          for (const s of st.de(pron)) for (const b of subs(s, "dass")) de.push(...all(`${a}, ist es [ja] kein Wunder, ${b}!`, `${a}, ist [doch] klar, ${b}!`));
        }
      }
      return {
        tr: joinTr([trNom(w), c.trObj, T.presCond(c.tr, w.trP, c.neg), "tabii ki", st.tr(w.trP)], "!"),
        de: unique(de),
        vocab: [["Kein Wunder, dass …", "… -mesine şaşmamalı, tabii ki …"], c.vocab, st.vocab],
        focus: endFocus("nebensatz", "wenn", cause(pronounOf(w.de[0]))),
      };
    }
    const h = p.pick(HABITS);
    const w = p.pick([SEN, O, ...PEOPLE].filter((x) => !(h.adult && x.kid)));
    const de: string[] = [];
    for (const d of w.de) {
      for (const so of subs(clause(d, h.v, [h.mid(d)]), "dass")) {
        de.push(...all(`{Es nervt mich [total]|Mich nervt [total]|Es geht mir [total] auf die Nerven|Es regt mich [total] auf}, ${so}.`));
      }
    }
    return {
      tr: joinTr([trGen(w), h.tr(w.trP), "beni çok sinir ediyor"]),
      de: unique(de),
      vocab: [["Es nervt mich, dass …", "… -mesi beni sinir ediyor"], ["jemandem auf die Nerven gehen", "birinin sinirine dokunmak"], h.vocab],
      focus: endFocus("nebensatz", "dass", clause(w.de[0], h.v, [h.mid(w.de[0])])),
    };
  },
);

// ---------- plans and proposals ----------

const PLAN_TIMES: When[] = [
  { de: "heute Abend", tr: "bu akşam", part: "evening" },
  { de: "am Wochenende", tr: "hafta sonu" },
  { de: "morgen", tr: "yarın" },
  { de: "am Samstag", tr: "cumartesi" },
];

const PLAN_FUN = ["sinema", "sehir", "pizza", "futbol", "film", "ziyaret", "ziyaret-arkadas", "davet", "spor", "yuruyus", "arkadas-bulus", "kek", "yuzme", "bisiklet", "foto", "dans", "kahve", "tatil-plan", "berlin", "siparis"];
const OUTDOOR = ["futbol", "yuruyus", "yuzme", "bisiklet", "foto", "sehir", "spor"];

const IF_PLAN: { de: string; tr: string; ids: string[] }[] = [
  { de: "das Wetter morgen schön ist", tr: "yarın hava güzel olursa", ids: OUTDOOR },
  { de: "es morgen nicht regnet", tr: "yarın yağmur yağmazsa", ids: OUTDOOR },
  { de: "du am Wochenende Zeit hast", tr: "hafta sonu vaktin olursa", ids: ["sinema", "sehir", "futbol", "ziyaret-arkadas", "spor", "yuruyus", "arkadas-bulus", "yuzme", "bisiklet", "kek", "davet"] },
  { de: "ich heute früher Feierabend habe", tr: "bugün işten erken çıkarsam", ids: ["sinema", "sehir", "pizza", "kahve", "arkadas-bulus", "yuruyus", "spor"] },
  { de: "es heute Abend regnet", tr: "bu akşam yağmur yağarsa", ids: ["film", "kek", "davet", "siparis", "televizyon"] },
  { de: "wir genug Geld sparen", tr: "yeterince para biriktirirsek", ids: ["berlin", "tatil-plan", "ziyaret"] },
];

const INSTEAD: { a: string; aWrong: string; aTr: string; b: string[]; bTr: string }[] = [
  { a: "ins Kino zu gehen", aWrong: "ins Kino gehen", aTr: "sinemaya gideceğimize", b: ["zu Hause einen Film gucken", "zu Hause einen Film sehen", "zu Hause einen Film schauen"], bTr: "evde film izleyelim" },
  { a: "ein Taxi zu nehmen", aWrong: "ein Taxi nehmen", aTr: "taksiye bineceğimize", b: ["den Bus nehmen", "mit dem Bus fahren"], bTr: "otobüse binelim" },
  { a: "Essen zu bestellen", aWrong: "Essen bestellen", aTr: "yemek sipariş edeceğimize", b: ["selbst kochen", "selber kochen"], bTr: "kendimiz yemek yapalım" },
  { a: "zu Hause zu bleiben", aWrong: "zu Hause bleiben", aTr: "evde kalacağımıza", b: ["im Park spazieren gehen", "einen Spaziergang im Park machen"], bTr: "parkta yürüyüş yapalım" },
  { a: "fernzusehen", aWrong: "zu fernsehen", aTr: "televizyon izleyeceğimize", b: ["ein Brettspiel spielen", "ein Gesellschaftsspiel spielen"], bTr: "bir kutu oyunu oynayalım" },
  { a: "auf den Bus zu warten", aWrong: "auf den Bus warten", aTr: "otobüsü bekleyeceğimize", b: ["zu Fuß gehen", "laufen"], bTr: "yürüyerek gidelim" },
  { a: "mit dem Auto zu fahren", aWrong: "mit dem Auto fahren", aTr: "arabayla gideceğimize", b: ["mit dem Fahrrad fahren", "das Fahrrad nehmen", "Fahrrad fahren"], bTr: "bisikletle gidelim" },
  { a: "die ganze Zeit zu Hause rumzusitzen", aWrong: "die ganze Zeit zu Hause zu rumsitzen", aTr: "bütün gün evde oturacağımıza", b: ["ein bisschen rausgehen", "ein bisschen an die frische Luft gehen"], bTr: "biraz dışarı çıkalım" },
  { a: "schon wieder Pizza zu essen", aWrong: "schon wieder Pizza essen", aTr: "yine pizza yiyeceğimize", b: ["mal was Gesundes kochen", "mal etwas Gesundes kochen"], bTr: "sağlıklı bir şey pişirelim" },
  { a: "im Restaurant zu essen", aWrong: "im Restaurant essen", aTr: "restoranda yiyeceğimize", b: ["ein Picknick im Park machen", "im Park picknicken"], bTr: "parkta piknik yapalım" },
];

const ASK_IDS = ["sinema", "ziyaret", "ziyaret-arkadas", "futbol", "arkadas-bulus", "yuzme", "istasyon", "yardim", "davet", "spor", "sehir", "yuruyus", "bisiklet"];

const plan = openTemplate(
  "gk-zor-plan",
  "GK",
  "gk-plan",
  ["vorschlag", "statt-zu", "indirekte-frage"],
  "Wie wär's, wenn wir …? / Wenn …, könnten wir doch …, oder? / Lass uns lieber …, statt … zu … / Sag mir Bescheid, sobald du weißt, ob …",
  (p): Generated => {
    const kind = p.pick(["wie", "wenn", "statt", "bescheid"] as const);
    if (kind === "wie") {
      const e = E(p.pick(PLAN_FUN));
      const when = timeFor(p, e, PLAN_TIMES);
      const cs = [...deEvent(e, WIR, "pres", { time: when?.de }), ...deEvent(e, WIR, "wuerde", { time: when?.de })];
      const de = [
        ...cs.flatMap((c) => subs(c, "wenn").flatMap((so) => all(`{Wie wär's|Was hältst du davon|Was hältst du denn davon}, ${so}?`))),
        ...zuGroups(e, WIR, when?.de).flatMap((zu) => all(`Was hältst du davon, ${zu}?`)),
      ];
      return {
        tr: joinTr([when?.tr, trObject(e, "1pl"), T.cond(e.tr, "1pl"), "nasıl olur"], "?"),
        de: unique(de),
        vocab: [["Wie wär's, wenn wir …?", "… -sek nasıl olur?"], ["Was hältst du davon, …?", "… ne dersin?"], e.vocab],
        focus: endFocus("vorschlag", "wenn", cs[0]),
      };
    }
    if (kind === "wenn") {
      const cond = p.pick(IF_PLAN);
      const e = E(p.pick(cond.ids));
      const cs = [...deEvent(e, WIR, "k2", { modal: LX.koennen }), ...deEvent(e, WIR, "pres", { modal: LX.koennen })].map((c) => ({ ...c, mid: ["doch", ...c.mid] }));
      const de: string[] = [];
      for (const c of cs) {
        for (const conj of ["wenn", "falls"]) {
          for (const mo of mains(c, `${conj} ${cond.de},`)) de.push(...all(`${mo}, {oder|was meinst du|was hältst du davon|was sagst du dazu}?`));
          for (const mo of mains(c)) de.push(...all(`${mo}, ${conj} ${cond.de}, {oder|was meinst du|was hältst du davon}?`));
        }
      }
      return {
        tr: joinTr([cond.tr, trObject(e, "1pl"), `${T.ability(e.tr, "1pl")},`, "ne dersin"], "?"),
        de: unique(de),
        vocab: [["Wir könnten doch …", "… -ebiliriz (öneri)"], e.vocab],
        focus: [focus("nebensatz", "könnten wir", [["wir könnten", "Yan cümle başta olduğu için ana cümle fiille başlar: Wenn …, könnten wir …"]])],
      };
    }
    if (kind === "statt") {
      const x = p.pick(INSTEAD);
      const t = p.pick([null, ...PLAN_TIMES.slice(0, 3)]);
      const de: string[] = [];
      for (const b of x.b) {
        if (t) {
          de.push(
            ...all(
              `{|Komm, }lass uns {${t.de} lieber|lieber ${t.de}} ${b}, {statt|anstatt} ${x.a}!`,
              `{Statt|Anstatt} ${t.de} ${x.a}, lass uns lieber ${b}!`,
              `{Statt|Anstatt} ${x.a}, lass uns ${t.de} lieber ${b}!`,
            ),
          );
        } else {
          de.push(...all(`{|Komm, }lass uns lieber ${b}, {statt|anstatt} ${x.a}!`, `{Statt|Anstatt} ${x.a}, lass uns lieber ${b}!`));
        }
      }
      return {
        tr: joinTr([t?.tr, x.aTr, x.bTr], "!"),
        de: unique(de),
        vocab: [["statt … zu …", "… -eceğimize, … -mek yerine"], ["lieber", "tercihen, daha iyisi"]],
        focus: [focus("statt-zu", x.a, [[x.aWrong, `statt … zu yapısında mastar zu ile en sona gider (ayrılabilen fiilde zu araya girer): ${x.a}.`]])],
      };
    }
    const e = E(p.pick(ASK_IDS));
    const w = p.pick([SEN, SEN, SIZ]);
    const when = timeFor(p, e, NEXT, false)!;
    const de: string[] = [];
    for (const d of w.de) {
      const know = `${d.s} ${present(LX.wissen, d.p)}`;
      const tell = d.s === "du" ? "{sag|gib} [mir] Bescheid" : d.s === "ihr" ? "{sagt|gebt} [mir] Bescheid" : "{sagen|geben} Sie [mir] Bescheid";
      for (const c of deEvent(e, d, "pres", { time: when.de, modal: LX.koennen })) {
        for (const ob of subs(c, "ob")) de.push(...all(`${tell}, {sobald|wenn} ${know}, ${ob}!`, `{Sobald|Wenn} ${know}, ${ob}, ${tell}!`));
      }
    }
    const c0 = deEvent(e, w.de[0], "pres", { time: when.de, modal: LX.koennen })[0];
    return {
      tr: joinTr([when.tr, trObject(e, w.trP), T.whether(e.tr, w.trP, "able"), "öğrenir öğrenmez bana haber", w.trP === "2pl" ? "verin" : "ver"], "!"),
      de: unique(de),
      vocab: [["Sag mir Bescheid, sobald …", "… -ir -mez bana haber ver"], ["ob", "-ip -mediğini (dolaylı soru)"], e.vocab],
      focus: endFocus("indirekte-frage", "ob", c0),
    };
  },
);

// ---------- café, restaurant, shop ----------

interface Why {
  sub: string;
  v2: string;
  tr: string;
}

const WITHOUT: Record<string, { de: string; tr: string; why: Why[] }> = {
  milch: {
    de: "ohne Milch",
    tr: "sütsüz",
    why: [
      { sub: "ich laktoseintolerant bin", v2: "ich bin laktoseintolerant", tr: "laktoz intoleransım var" },
      { sub: "ich vegan lebe", v2: "ich lebe vegan", tr: "veganım" },
    ],
  },
  zucker: {
    de: "ohne Zucker",
    tr: "şekersiz",
    why: [
      { sub: "ich gerade keinen Zucker esse", v2: "ich esse gerade keinen Zucker", tr: "şu sıralar şeker yemiyorum" },
      { sub: "ich Diabetiker bin", v2: "ich bin Diabetiker", tr: "şeker hastasıyım" },
    ],
  },
  zwiebeln: {
    de: "ohne Zwiebeln",
    tr: "soğansız",
    why: [
      { sub: "ich Zwiebeln nicht vertrage", v2: "ich vertrage Zwiebeln nicht", tr: "soğan bana dokunuyor" },
      { sub: "ich keine Zwiebeln mag", v2: "ich mag keine Zwiebeln", tr: "soğan sevmiyorum" },
    ],
  },
  nuesse: { de: "ohne Nüsse", tr: "fındıksız", why: [{ sub: "ich gegen Nüsse allergisch bin", v2: "ich bin gegen Nüsse allergisch", tr: "fındığa alerjim var" }] },
  fleisch: {
    de: "ohne Fleisch",
    tr: "etsiz",
    why: [
      { sub: "ich kein Fleisch esse", v2: "ich esse kein Fleisch", tr: "et yemiyorum" },
      { sub: "ich Vegetarier bin", v2: "ich bin Vegetarier", tr: "vejetaryenim" },
    ],
  },
  kaese: {
    de: "ohne Käse",
    tr: "peynirsiz",
    why: [
      { sub: "ich keinen Käse mag", v2: "ich mag keinen Käse", tr: "peynir sevmiyorum" },
      { sub: "ich laktoseintolerant bin", v2: "ich bin laktoseintolerant", tr: "laktoz intoleransım var" },
    ],
  },
  eis: { de: "ohne Eis", tr: "buzsuz", why: [{ sub: "ich Halsschmerzen habe", v2: "ich habe Halsschmerzen", tr: "boğazım ağrıyor" }] },
  sosse: { de: "ohne Soße", tr: "sossuz", why: [{ sub: "ich gerade Diät mache", v2: "ich mache gerade Diät", tr: "diyetteyim" }] },
};

const DISHES: { de: Noun; tr: string; size?: boolean; without: string[] }[] = [
  { de: n("Kaffee", "m"), tr: "kahve", size: true, without: ["milch", "zucker"] },
  { de: n("Tee", "m"), tr: "çay", size: true, without: ["zucker"] },
  { de: n("Cappuccino", "m"), tr: "kapuçino", size: true, without: ["zucker"] },
  { de: n("Cola", "f"), tr: "kola", size: true, without: ["eis"] },
  { de: n("Döner", "m"), tr: "döner", without: ["zwiebeln", "sosse"] },
  { de: n("Salat", "m"), tr: "salata", without: ["zwiebeln", "kaese", "nuesse"] },
  { de: n("Pizza", "f"), tr: "pizza", without: ["kaese", "fleisch", "zwiebeln"] },
  { de: n("Burger", "m"), tr: "burger", without: ["zwiebeln", "kaese", "sosse"] },
  { de: n("Sandwich", "n"), tr: "sandviç", without: ["kaese", "fleisch"] },
  { de: n("Müsli", "n"), tr: "müsli", without: ["milch", "nuesse"] },
  { de: n("Kuchen", "m"), tr: "pasta", without: ["nuesse"] },
  { de: n("Smoothie", "m"), tr: "smoothie", size: true, without: ["milch", "zucker"] },
];

const SIZES: [string, string][] = [
  ["groß", "büyük"],
  ["klein", "küçük"],
];

const ASK_FOOD: { de: Noun; trGen: string; props: string[] }[] = [
  { de: n("Suppe", "f"), trGen: "çorbanın", props: ["vegan", "scharf", "hausgemacht"] },
  { de: n("Kuchen", "m"), trGen: "pastanın", props: ["vegan", "glutenfrei", "hausgemacht", "frisch"] },
  { de: n("Brot", "n"), trGen: "ekmeğin", props: ["glutenfrei", "frisch", "vegan"] },
  { de: n("Soße", "f"), trGen: "sosun", props: ["scharf", "vegan", "laktosefrei"] },
  { de: n("Curry", "n"), trGen: "körinin", props: ["scharf", "vegan"] },
  { de: n("Lasagne", "f"), trGen: "lazanyanın", props: ["vegetarisch", "hausgemacht"] },
  { de: n("Salat", "m"), trGen: "salatanın", props: ["vegan", "frisch"] },
  { de: n("Eis", "n"), trGen: "dondurmanın", props: ["laktosefrei", "vegan", "hausgemacht"] },
];

const PROP_TR: Record<string, string> = {
  vegan: "vegan",
  scharf: "acı",
  hausgemacht: "ev yapımı",
  glutenfrei: "glütensiz",
  frisch: "taze",
  laktosefrei: "laktozsuz",
  vegetarisch: "vejetaryen",
};

const ORDERED: { de: Noun; tr: string }[][] = [
  [
    { de: n("Kaffee", "m"), tr: "kahve" },
    { de: n("Tee", "m"), tr: "çay" },
    { de: n("Cappuccino", "m"), tr: "kapuçino" },
    { de: n("Saft", "m"), tr: "meyve suyu" },
    { de: n("Wasser", "n"), tr: "su" },
    { de: n("Cola", "f"), tr: "kola" },
  ],
  [
    { de: n("Salat", "m"), tr: "salata" },
    { de: n("Suppe", "f"), tr: "çorba" },
    { de: n("Pizza", "f"), tr: "pizza" },
    { de: n("Burger", "m"), tr: "burger" },
    { de: n("Sandwich", "n"), tr: "sandviç" },
    { de: n("Döner", "m"), tr: "döner" },
  ],
];

const CLOTHES: { de: Noun; tr: string; pl?: boolean }[] = [
  { de: n("Jacke", "f"), tr: "ceket" },
  { de: n("Pullover", "m"), tr: "kazak" },
  { de: n("Hemd", "n"), tr: "gömlek" },
  { de: n("Hose", "f"), tr: "pantolon" },
  { de: n("Schuhe", "m", "Schuhe"), tr: "ayakkabılar", pl: true },
  { de: n("Kleid", "n"), tr: "elbise" },
  { de: n("Mantel", "m"), tr: "kaban" },
  { de: n("Mütze", "f"), tr: "bere" },
];

const LIKERS: { de: string; wrong: string; tr: string }[] = [
  { de: "meiner Freundin", wrong: "meine Freundin", tr: "kız arkadaşımın" },
  { de: "meinem Vater", wrong: "meinen Vater", tr: "babamın" },
  { de: "meiner Mutter", wrong: "meine Mutter", tr: "annemin" },
  { de: "meinem Bruder", wrong: "meinen Bruder", tr: "erkek kardeşimin" },
];

const kafe = openTemplate(
  "gk-zor-kafe",
  "GK",
  "gk-kafe",
  ["bestellen", "indirekte-frage", "pronomen"],
  "Ich hätte gern …, aber ohne …, weil … (fiil sonda) / Können Sie mir sagen, ob …? / Kann ich … umtauschen, falls sie/er/es …?",
  (p): Generated => {
    const kind = p.pick(["order", "order", "ask", "wrong", "return"] as const);
    if (kind === "order") {
      const dish = p.pick(DISHES);
      const wo = WITHOUT[p.pick(dish.without)];
      const why = p.pick(wo.why);
      const size = dish.size ? p.pick([null, ...SIZES]) : null;
      const np0 = { det: "ein" as const, noun: dish.de, ...(size ? { adj: { base: size[0] } } : {}) };
      const akk = np(np0, "akk");
      const nom = np(np0, "nom");
      const reason = `{weil ${why.sub}|denn ${why.v2}}`;
      return {
        tr: joinTr([size?.[1], "bir", dish.tr, "alabilir miyim, ama", `${wo.tr} olsun,`, "çünkü", why.tr]),
        de: all(`{Ich hätte gern|Ich nehme|Ich möchte} ${akk}, aber [bitte] ${wo.de}, ${reason}.`, `${capitalize(akk)}, aber [bitte] ${wo.de}, ${reason}.`),
        vocab: [["Ich hätte gern …", "… alabilir miyim (sipariş)"], [wo.de, wo.tr]],
        focus: [
          ...(dish.de.g === "m" ? [focus("bestellen", akk, [[nom, `Ich hätte gern / Ich nehme + Akkusativ: eril isimde ${akk} olur.`]])] : []),
          focus("nebensatz", `weil ${why.sub}`, [[`weil ${why.v2}`, `weil yan cümle açar, çekimli fiil en sona gider: weil ${why.sub}.`]]),
        ],
      };
    }
    if (kind === "ask") {
      const f = p.pick(ASK_FOOD);
      const prop = p.pick(f.props);
      const nom = np({ det: "def", noun: f.de }, "nom");
      return {
        tr: joinTr([f.trGen, PROP_TR[prop], T.whether(T.tv("ol"), "3sg", "past"), "söyleyebilir misiniz"], "?"),
        de: all(`{{Können|Könnten} Sie mir [bitte] sagen|Wissen Sie [vielleicht]}, ob ${nom} ${prop} ist?`),
        vocab: [["Können Sie mir sagen, ob …?", "… -ip -mediğini söyleyebilir misiniz?"], [prop, PROP_TR[prop]]],
        focus: [focus("indirekte-frage", `${nom} ${prop} ist`, [[`ist ${nom} ${prop}`, `ob dolaylı soru açar, çekimli fiil en sona gider: ob ${nom} ${prop} ist.`]])],
      };
    }
    if (kind === "wrong") {
      const group = p.pick(ORDERED);
      const a = p.pick(group);
      const b = p.pick(group.filter((x) => x !== a));
      const akkA = np({ det: "ein", noun: a.de }, "akk");
      const einB = np({ det: "ein", noun: b.de }, "akk");
      const keinB = np({ det: "kein", noun: b.de }, "akk");
      const head = "{Entschuldigung|Entschuldigen Sie|Sorry}, ich {hatte|hab}";
      return {
        tr: joinTr(["pardon, ben aslında", b.tr, "değil", a.tr, "sipariş etmiştim"]),
        de: all(
          `${head} eigentlich ${akkA} bestellt, {${keinB}|nicht ${einB}|und ${keinB}|und nicht ${einB}}.`,
          `${head} eigentlich {${keinB}|nicht ${einB}} bestellt, sondern ${akkA}.`,
        ),
        vocab: [["eigentlich", "aslında"], ["Ich hatte … bestellt.", "… sipariş etmiştim."]],
        focus: a.de.g === "m" ? [focus("bestellen", akkA, [[np({ det: "ein", noun: a.de }, "nom"), `bestellen + Akkusativ: eril isimde ${akkA} olur.`]])] : [],
      };
    }
    const item = p.pick(CLOTHES);
    const g = item.pl ? "pl" : item.de.g;
    const pron = { m: "er", f: "sie", n: "es", pl: "sie" }[g];
    const pronAkk = { m: "ihn", f: "sie", n: "es", pl: "sie" }[g];
    const fits = item.pl ? "passen" : "passt";
    const likes = item.pl ? "gefallen" : "gefällt";
    const liker = p.pick([null, ...LIKERS]);
    const [verb, verbTr, verbVocab] = p.pick([
      ["umtauschen", "değiştirebilir miyim", "değiştirmek"],
      ["zurückgeben", "iade edebilir miyim", "iade etmek"],
    ] as const);
    const akk = np({ det: "def", noun: item.de }, "akk");
    const problem = (x: string) => (liker ? `${x} ${liker.de} nicht ${likes}` : `${x} [mir] nicht ${fits}`);
    const de = all(
      `{Kann|Könnte} ich ${item.pl ? "die Schuhe" : akk} ${verb}, {falls|wenn} ${problem(pron)}?`,
      `{Falls|Wenn} ${problem(item.pl ? "die Schuhe" : np({ det: "def", noun: item.de }, "nom"))}, {kann|könnte} ich ${pronAkk} ${verb}?`,
    );
    const others = ["er", "sie", "es"].filter((x) => x !== pron);
    const fx: Focus[] = item.pl
      ? []
      : [focus("pronomen", `falls ${pron}`, others.map((x): [string, string] => [`falls ${x}`, `Zamir ismin cinsiyetine uyar: ${np({ det: "def", noun: item.de }, "nom")} → ${pron}.`]))];
    if (liker) fx.push(focus("gefallen", liker.de, [[liker.wrong, `gefallen Dativ ister (kimin hoşuna?): ${liker.de}.`]]));
    return {
      tr: joinTr([item.tr, liker ? `${liker.tr} hoşuna gitmezse` : "olmazsa", verbTr], "?"),
      de,
      vocab: [[verb, verbVocab], ["falls", "eğer, -se"]],
      focus: fx,
    };
  },
);

// ---------- directions and transport ----------

interface Place {
  de: Noun;
  tr: string;
  /** Turkish compound already ending in a possessive (otobüs durağı → durağına) */
  third?: boolean;
  soft?: string;
}

const PLACES: Place[] = [
  { de: n("Bahnhof", "m"), tr: "istasyon" },
  { de: n("Apotheke", "f"), tr: "eczane" },
  { de: n("Supermarkt", "m"), tr: "süpermarket" },
  { de: n("Post", "f"), tr: "postane" },
  { de: n("Bank", "f"), tr: "banka" },
  { de: n("Bushaltestelle", "f"), tr: "otobüs durağı", third: true },
  { de: n("Krankenhaus", "n"), tr: "hastane" },
  { de: n("Rathaus", "n"), tr: "belediye binası", third: true },
  { de: n("Museum", "n"), tr: "müze" },
  { de: n("Flughafen", "m"), tr: "havaalanı", third: true },
  { de: n("Hotel", "n"), tr: "otel" },
  { de: n("Marktplatz", "m"), tr: "pazar yeri", third: true },
  { de: n("Stadion", "n"), tr: "stadyum" },
  { de: n("Universität", "f"), tr: "üniversite" },
];

const MARKS: Place[] = [
  { de: n("Kirche", "f"), tr: "kilise" },
  { de: n("Ampel", "f"), tr: "trafik ışıkları", third: true },
  { de: n("Kreuzung", "f"), tr: "kavşak", soft: "kavşağ" },
  { de: n("Brücke", "f"), tr: "köprü" },
  { de: n("Park", "m"), tr: "park" },
  { de: n("Tankstelle", "f"), tr: "benzinlik", soft: "benzinliğ" },
  { de: n("Kino", "n"), tr: "sinema" },
  { de: n("Rathaus", "n"), tr: "belediye binası", third: true },
];

const zuOf = (pl: Place) => pp("zu", { det: "def", noun: pl.de }, "dat");

function zumZurFocus(pl: Place): Focus {
  const right = zuOf(pl);
  const wrong = pl.de.g === "f" ? `zum ${pl.de.sg}` : `zur ${pl.de.sg}`;
  return focus("zum-zur", right, [[wrong, `${pl.de.sg} ${G_TR[pl.de.g]} bir isim: ${pl.de.g === "f" ? "zu der → zur" : "zu dem → zum"} (${right}).`]]);
}

const yol = openTemplate(
  "gk-zor-yol",
  "GK",
  "gk-yol",
  ["indirekte-frage", "zum-zur", "sobald-bis"],
  "Können Sie mir sagen, wie ich zum … komme? (fiil sonda) / Gehen Sie geradeaus, bis Sie zur … kommen.",
  (p): Generated => {
    const kind = p.pick(["wie", "gibt", "weg", "weg", "umsteigen", "wann"] as const);
    if (kind === "wie") {
      const pl = p.pick(PLACES);
      const manner = p.pick([null, ["am schnellsten", "en hızlı"], ["am besten", "en kolay"], ["zu Fuß", "yürüyerek"]] as const);
      const zu = zuOf(pl);
      const m = manner ? `${manner[0]} ` : "";
      const head = "[Entschuldigung, |Entschuldigen Sie, ]{{können|könnten} Sie mir [bitte] sagen|wissen Sie}";
      return {
        tr: joinTr(["affedersiniz,", T.kase(pl.tr, "dat", Boolean(pl.third), pl.soft), manner?.[1], "nasıl gideceğimi söyleyebilir misiniz"], "?"),
        de: all(`${head}, wie ich ${m}${zu} komme?`, `${head}, wie man ${m}${zu} kommt?`),
        vocab: [["Können Sie mir sagen, wie …?", "… nasıl …-eceğimi söyleyebilir misiniz?"], [np({ det: "def", noun: pl.de }, "nom"), pl.tr]],
        focus: [
          focus("indirekte-frage", `wie ich ${m}${zu} komme`, [[`wie komme ich ${m}${zu}`, `Dolaylı soruda özne soru kelimesinden hemen sonra gelir, fiil en sona gider: wie ich ${m}${zu} komme.`]]),
          zumZurFocus(pl),
        ],
      };
    }
    if (kind === "gibt") {
      const pl = p.pick(PLACES.filter((x) => !["Bahnhof", "Rathaus", "Flughafen", "Marktplatz", "Stadion", "Universität"].includes(x.de.sg)));
      const akk = np({ det: "ein", noun: pl.de }, "akk");
      const nom = np({ det: "ein", noun: pl.de }, "nom");
      const fx: Focus[] = [focus("indirekte-frage", `es hier in der Nähe ${akk} gibt`, [[`gibt es hier in der Nähe ${akk}`, `ob dolaylı soru açar, çekimli fiil en sona gider: ob es hier in der Nähe ${akk} gibt.`]])];
      if (pl.de.g === "m") fx.push(focus("akkusativ", `${akk} gibt`, [[`${nom} gibt`, `es gibt + Akkusativ: ${akk}.`]]));
      return {
        tr: joinTr(["buralarda bir", pl.tr, T.whether(T.tv("ol"), "3sg", "past"), "biliyor musunuz acaba"], "?"),
        de: all(`Wissen Sie [zufällig|vielleicht], ob es hier in der Nähe ${akk} gibt?`, `Wissen Sie [zufällig|vielleicht], ob hier in der Nähe ${nom} ist?`),
        vocab: [["in der Nähe", "yakınlarda, buralarda"], [np({ det: "def", noun: pl.de }, "nom"), pl.tr]],
        focus: fx,
      };
    }
    if (kind === "weg") {
      const m = p.pick(MARKS);
      const dir = p.pick([
        ["links", "sola"],
        ["rechts", "sağa"],
      ] as const);
      const tgt = p.pick([null, ...PLACES.filter((x) => x.de.sg !== m.de.sg)]);
      const side = p.pick([
        ["linken", "sol"],
        ["rechten", "sağ"],
      ] as const);
      const polite = p.pick([true, false]);
      const zu = zuOf(m);
      const akk = tgt ? np({ det: "def", noun: tgt.de }, "akk") : "";
      const nom = tgt ? capitalize(np({ det: "def", noun: tgt.de }, "nom")) : "";
      const see = polite ? "{dann sehen Sie|und dann sehen Sie|da sehen Sie}" : "{dann siehst du|und dann siehst du|da siehst du}";
      const tail = tgt ? `{, ${see} ${akk}|. ${nom} ist dann} auf der ${side[0]} Seite` : "";
      const de = polite
        ? all(
            `{Gehen|Laufen} Sie [immer] geradeaus, bis Sie ${zu} kommen, {und biegen Sie dann|dann biegen Sie|und dann biegen Sie} ${dir[0]} ab${tail}.`,
            `{Gehen|Laufen} Sie [immer] geradeaus bis ${zu} {und biegen Sie dann|und dann biegen Sie|, dann biegen Sie} ${dir[0]} ab${tail}.`,
          )
        : all(
            `{Geh|Gehe|Lauf} [immer] geradeaus, bis du ${zu} kommst, {und bieg dann|und biege dann|dann biegst du|und dann biegst du} ${dir[0]} ab${tail}.`,
            `{Geh|Gehe|Lauf} [immer] geradeaus bis ${zu} {und bieg dann|und biege dann|, dann biegst du|und dann biegst du} ${dir[0]} ab${tail}.`,
          );
      const parts = [`${T.kase(m.tr, "dat", Boolean(m.third), m.soft)} gelene kadar düz ${polite ? "gidin" : "git"},`, `sonra ${dir[1]} ${polite ? "dönün" : "dön"}`];
      if (tgt) parts.push(`, ${T.kase(tgt.tr, "acc", Boolean(tgt.third), tgt.soft)} ${side[1]} tarafta ${polite ? "göreceksiniz" : "göreceksin"}`);
      return {
        tr: joinTr(parts),
        de,
        vocab: [["bis …", "… -e kadar"], ["abbiegen", "(sağa/sola) dönmek"], [np({ det: "def", noun: m.de }, "nom"), m.tr]],
        focus: [zumZurFocus(m), focus("trennbar", `${dir[0]} ab`, [], "abbiegen ayrılabilen fiildir: ön ek ab cümlenin sonuna gider (… rechts ab).")],
      };
    }
    if (kind === "umsteigen") {
      const [c1, c1Tr] = p.pick(CITIES);
      const [c2, c2Tr] = p.pick(CITIES.filter((x) => x[0] !== c1));
      return {
        tr: joinTr([`${T.kase(c1Tr, "loc")} aktarma yapmam gerekiyor mu,`, "yoksa tren direkt", `${T.kase(c2Tr, "dat")} kadar gidiyor mu`], "?"),
        de: all(`Muss ich in ${c1} umsteigen, oder {fährt|geht} der Zug direkt {bis|nach|bis nach} ${c2}?`),
        vocab: [["umsteigen", "aktarma yapmak"], ["direkt", "doğrudan, aktarmasız"]],
        focus: [focus("modal", `in ${c1} umsteigen`, [[`umsteigen in ${c1}`, "Modal fiilli soruda mastar en sona gider: Muss ich in … umsteigen?"]])],
      };
    }
    const [city, cityTr] = p.pick(CITIES);
    const [veh, vehGen] = p.pick([
      ["Zug", "trenin"],
      ["Bus", "otobüsün"],
    ] as const);
    const polite = p.pick([true, false]);
    const head = polite ? "{Wissen Sie|{Können|Könnten} Sie mir sagen}" : "{Weißt du|Kannst du mir sagen}";
    return {
      tr: joinTr([T.kase(cityTr, "dat"), "bir sonraki", vehGen, "ne zaman kalktığını", polite ? "biliyor musunuz" : "biliyor musun"], "?"),
      de: all(`${head}, wann der nächste ${veh} nach ${city} {fährt|abfährt|geht}?`),
      vocab: [["Wissen Sie, wann …?", "… ne zaman …-dığını biliyor musunuz?"], ["abfahren", "kalkmak (araç)"]],
      focus: [focus("indirekte-frage", `der nächste ${veh} nach ${city} fährt`, [[`fährt der nächste ${veh} nach ${city}`, "Dolaylı soruda (wann …) çekimli fiil en sona gider: wann der nächste … fährt."]])],
    };
  },
);

// ---------- phone and messages ----------

const DABEI_IDS = ["bulasik", "aksam-yemegi", "dus", "temizlik", "kek", "odev", "oda-topla", "piyano", "araba-yika", "bahce", "bavul", "eposta", "sinav", "kitap", "alisveris"];

const CALLERS: { de: string; expect: string; wrong: string; tr: string }[] = [
  { de: "du angerufen hast", expect: "du angerufen hast", wrong: "du hast angerufen", tr: "sen aradığında" },
  { de: "du angerufen hast", expect: "du angerufen hast", wrong: "du hast angerufen", tr: "sen aradığında" },
  { de: "meine Mutter angerufen hat", expect: "meine Mutter angerufen hat", wrong: "meine Mutter hat angerufen", tr: "annem aradığında" },
  { de: "mein Chef angerufen hat", expect: "mein Chef angerufen hat", wrong: "mein Chef hat angerufen", tr: "patronum aradığında" },
  { de: "Ali angerufen hat", expect: "Ali angerufen hat", wrong: "Ali hat angerufen", tr: "Ali aradığında" },
  { de: "{mein Bruder|meine Schwester} angerufen hat", expect: "angerufen hat", wrong: "hat angerufen", tr: "kardeşim aradığında" },
  { de: "{unser Nachbar|unsere Nachbarin} angerufen hat", expect: "angerufen hat", wrong: "hat angerufen", tr: "komşumuz aradığında" },
];

const ARRIVE_AT: { de: string; tr: string; pickUp?: boolean }[] = [
  { de: "zu Hause", tr: "eve" },
  { de: "am Bahnhof", tr: "istasyona", pickUp: true },
  { de: "in Berlin", tr: "Berlin'e" },
  { de: "im Hotel", tr: "otele" },
  { de: "am Flughafen", tr: "havaalanına", pickUp: true },
  { de: "in München", tr: "Münih'e" },
  { de: "in Hamburg", tr: "Hamburg'a" },
];

const RECIPIENTS: { de: string; wrong: string; tr: string; pron: "er" | "sie" }[] = [
  { de: "meiner Mutter", wrong: "meine Mutter", tr: "anneme", pron: "sie" },
  { de: "meinem Vater", wrong: "meinen Vater", tr: "babama", pron: "er" },
  { de: "deinem Bruder", wrong: "deinen Bruder", tr: "erkek kardeşine", pron: "er" },
  { de: "deiner Schwester", wrong: "deine Schwester", tr: "kız kardeşine", pron: "sie" },
  { de: "unserem Chef", wrong: "unseren Chef", tr: "patronumuza", pron: "er" },
  { de: "unserer Nachbarin", wrong: "unsere Nachbarin", tr: "komşumuza", pron: "sie" },
  { de: "Ali", wrong: "", tr: "Ali'ye", pron: "er" },
  { de: "Ayşe", wrong: "", tr: "Ayşe'ye", pron: "sie" },
];

const MESSAGES: { de: (pron: "er" | "sie") => string; tr: string; fx?: [string, string] }[] = [
  { de: () => "dass ich heute nicht kommen kann", tr: "bugün gelemeyeceğimi", fx: ["nicht kommen kann", "kann nicht kommen"] },
  { de: () => "dass ich ein bisschen später komme", tr: "biraz geç kalacağımı" },
  { de: (x) => `dass ich ${x === "er" ? "ihn" : "sie"} heute Abend zurückrufe`, tr: "onu bu akşam geri arayacağımı" },
  { de: (x) => `dass ${x} mich zurückrufen soll`, tr: "beni geri aramasını", fx: ["mich zurückrufen soll", "soll mich zurückrufen"] },
  { de: (x) => `dass ich ${x === "er" ? "seinen" : "ihren"} Schlüssel gefunden {habe|hab}`, tr: "anahtarını bulduğumu" },
  { de: () => "dass das Essen um acht fertig ist", tr: "yemeğin sekizde hazır olacağını" },
  { de: () => "dass ich morgen früher gehen muss", tr: "yarın erken çıkmam gerektiğini", fx: ["früher gehen muss", "muss früher gehen"] },
];

const SOBALD: { de: string; tr: string }[] = [
  { de: "zu Hause bin", tr: "eve varır varmaz" },
  { de: "aus dem Meeting raus bin", tr: "toplantıdan çıkar çıkmaz" },
  { de: "im Zug sitze", tr: "trene biner binmez" },
  { de: "beim Arzt fertig bin", tr: "doktordan çıkar çıkmaz" },
  { de: "Feierabend habe", tr: "işten çıkar çıkmaz" },
  { de: "wieder Netz habe", tr: "telefonum çekmeye başlar başlamaz" },
  { de: "aus der Dusche komme", tr: "duştan çıkar çıkmaz" },
  { de: "mit dem Essen fertig bin", tr: "yemeği bitirir bitirmez" },
];

const telefon = openTemplate(
  "gk-zor-telefon",
  "GK",
  "gk-telefon",
  ["zu-infinitiv", "sobald-bis", "nebensatz"],
  "Ich war gerade dabei, … zu …, als du angerufen hast. / Kannst du ihr ausrichten, dass …? / Ich ruf dich zurück, sobald …",
  (p): Generated => {
    const kind = p.pick(["dabei", "dabei", "schreib", "ausrichten", "sobald"] as const);
    if (kind === "dabei") {
      const e = E(p.pick(DABEI_IDS));
      const caller = p.pick(CALLERS);
      const after = "{deshalb|deswegen|darum|also} {bin ich nicht rangegangen|bin ich nicht ans Telefon gegangen|konnte ich nicht rangehen|konnte ich nicht ans Telefon gehen}";
      const zus = zuGroups(e, ICH);
      const de: string[] = [];
      for (const zu of zus) de.push(...all(`Ich war gerade dabei, ${zu}, als ${caller.de}, ${after}.`, `Als ${caller.de}, war ich gerade dabei, ${zu}, ${after}.`));
      for (const c of deEvent(e, ICH, "perf")) {
        for (const mo of mains({ ...c, mid: ["gerade", ...c.mid] })) de.push(...all(`${mo}, als ${caller.de}, ${after}.`));
      }
      return {
        tr: joinTr([caller.tr, "tam", `${trEvent(e, "1sg", "pastCont")},`, "o yüzden telefonu açamadım"]),
        de: unique(de),
        vocab: [["gerade dabei sein, … zu …", "tam … -mekte olmak"], ["rangehen", "telefonu açmak (konuşma)"], e.vocab],
        focus: [zuFocus("zu-infinitiv", e, zus[0]), focus("nebensatz", caller.expect, [[caller.wrong, `als yan cümle açar, çekimli fiil en sona gider: als ${caller.expect}.`]])],
      };
    }
    if (kind === "schreib") {
      const at = p.pick(ARRIVE_AT);
      const w = p.pick([SEN, SEN, SIZ]);
      const so = p.pick<{ de: (d: DeWho) => string; tr: string }>([
        { de: () => "damit ich mir keine Sorgen {mache|machen muss}", tr: "ki merak etmeyeyim" },
        { de: () => "damit ich weiß, dass alles {okay|in Ordnung} ist", tr: "ki her şeyin yolunda olduğunu bileyim" },
        ...(at.pickUp
          ? [{ de: (d: DeWho) => `damit ich ${d.s === "du" ? "dich" : d.s === "ihr" ? "euch" : "Sie"} abholen kann`, tr: w.trP === "2pl" ? "ki gelip sizi alayım" : "ki gelip seni alayım" }]
          : []),
      ]);
      const de: string[] = [];
      for (const d of w.de) {
        const tell =
          d.s === "du"
            ? "{Schreib mir [kurz]|Gib mir [kurz] Bescheid|Schick mir [kurz] eine Nachricht}"
            : d.s === "ihr"
              ? "{Schreibt mir [kurz]|Gebt mir [kurz] Bescheid}"
              : "{Schreiben Sie mir [kurz]|Geben Sie mir [kurz] Bescheid}";
        const arrived = d.s === "du" ? "{angekommen bist|ankommst}" : d.s === "ihr" ? "{angekommen seid|ankommt}" : "{angekommen sind|ankommen}";
        de.push(...all(`${tell}, {wenn|sobald} ${d.s} ${at.de} ${arrived}, ${so.de(d)}!`));
      }
      const plural = w.trP === "2pl";
      return {
        tr: joinTr([`${at.tr} ${plural ? "vardığınızda" : "vardığında"}`, "bana kısa bir mesaj", plural ? "atın" : "at", so.tr], "!"),
        de: unique(de),
        vocab: [["ankommen", "varmak"], ["damit …", "… ki (amaç)"], ["sich Sorgen machen", "merak etmek, endişelenmek"]],
        focus: plural ? [] : [focus("perfekt", "angekommen bist", [["angekommen hast", "ankommen Perfekt'te sein ile kurulur: … angekommen bist."]])],
      };
    }
    if (kind === "ausrichten") {
      const r = p.pick(RECIPIENTS);
      const m = p.pick(MESSAGES);
      const fx: Focus[] = [];
      if (r.wrong) fx.push(focus("dativ", r.de, [[r.wrong, `ausrichten / sagen + Dativ (kime?): ${r.de}.`]]));
      if (m.fx) fx.push(focus("nebensatz", m.fx[0], [[m.fx[1], `dass'lı yan cümlede çekimli fiil en sona gider: … ${m.fx[0]}.`]]));
      return {
        tr: joinTr([r.tr, m.tr, "söyleyebilir misin"], "?"),
        de: all(`{Kannst|Könntest} du ${r.de} {ausrichten|sagen|Bescheid sagen}, ${m.de(r.pron)}?`),
        vocab: [["jemandem etwas ausrichten", "birine bir şeyi iletmek"]],
        focus: fx,
      };
    }
    const s = p.pick(SOBALD);
    const [main, inverted, mainTr] = p.pick([
      ["ich {ruf|rufe} dich zurück", "{ruf|rufe} ich dich zurück", "seni geri ararım"],
      ["ich melde mich [bei dir]", "melde ich mich [bei dir]", "sana haber veririm"],
      ["ich {schreib|schreibe} dir", "{schreib|schreibe} ich dir", "sana yazarım"],
    ] as const);
    return {
      tr: joinTr([s.tr, mainTr]),
      de: all(`${main}, sobald ich ${s.de}.`, `Sobald ich ${s.de}, ${inverted}.`),
      vocab: [["sobald", "-ir -mez"], ["sich melden", "haber vermek, aramak"]],
      focus: [focus("sobald-bis", `sobald ich ${s.de}`, [])],
    };
  },
);

// ---------- requests, thanks, apologies ----------

const PERMS: { de: string[]; tr: string; sie?: string[]; trSie?: string }[] = [
  { de: ["das Fenster aufmache", "das Fenster öffne"], tr: "pencereyi açsam" },
  { de: ["die Heizung anmache", "die Heizung anstelle"], tr: "kaloriferi açsam" },
  { de: ["das Licht ausmache"], tr: "ışığı kapatsam" },
  { de: ["kurz dein Handy benutze"], sie: ["kurz Ihr Handy benutze"], tr: "telefonunu kısa bir süre kullansam", trSie: "telefonunuzu kısa bir süre kullansam" },
  { de: ["mich kurz hinsetze"], tr: "biraz otursam" },
  { de: ["heute etwas früher gehe", "heute ein bisschen früher gehe"], tr: "bugün biraz erken çıksam" },
  { de: ["morgen etwas später komme", "morgen ein bisschen später komme"], tr: "yarın biraz geç gelsem" },
  { de: ["die Musik etwas leiser mache", "die Musik ein bisschen leiser mache"], tr: "müziğin sesini biraz kıssam" },
  { de: ["einen Freund mitbringe"], tr: "bir arkadaşımı da getirsem" },
  { de: ["das letzte Stück Pizza esse", "das letzte Stück Pizza nehme"], tr: "son pizza dilimini yesem" },
  { de: ["kurz telefoniere"], tr: "kısa bir telefon görüşmesi yapsam" },
  { de: ["mir kurz dein Ladekabel ausleihe"], sie: ["mir kurz Ihr Ladekabel ausleihe"], tr: "şarj kablonu kısa bir süre ödünç alsam", trSie: "şarj kablonuzu kısa bir süre ödünç alsam" },
  { de: ["meine Schuhe anlasse", "die Schuhe anlasse"], tr: "ayakkabılarımı çıkarmasam" },
  { de: ["die Tür offen lasse"], tr: "kapıyı açık bıraksam" },
  { de: ["am Wochenende bei dir übernachte"], sie: ["am Wochenende bei Ihnen übernachte"], tr: "hafta sonu sende kalsam", trSie: "hafta sonu sizde kalsam" },
  { de: ["kurz deinen Laptop benutze"], sie: ["kurz Ihren Laptop benutze"], tr: "bilgisayarını kısa bir süre kullansam", trSie: "bilgisayarınızı kısa bir süre kullansam" },
];

/** "@" is replaced by an optional time from `when`. */
const FAVORS: { zu: string; wrong: string; inf: string; tr: string; when?: [string, string][] }[] = [
  { zu: "mich @ vom Bahnhof abzuholen", wrong: "mich @ vom Bahnhof zu abholen", inf: "mich @ vom Bahnhof abholen", tr: "beni @ istasyondan alsan", when: [["morgen", "yarın"], ["am Samstag", "cumartesi"], ["heute Abend", "bu akşam"]] },
  { zu: "mir @ beim Umzug zu helfen", wrong: "mir @ beim Umzug helfen", inf: "mir @ beim Umzug helfen", tr: "@ taşınırken bana yardım etsen", when: [["am Samstag", "cumartesi"], ["nächste Woche", "gelecek hafta"]] },
  { zu: "kurz auf meine Tasche aufzupassen", wrong: "kurz auf meine Tasche zu aufpassen", inf: "kurz auf meine Tasche aufpassen", tr: "bir dakika çantama göz kulak olsan" },
  { zu: "das Fenster zuzumachen", wrong: "das Fenster zu zumachen", inf: "das Fenster zumachen", tr: "pencereyi kapatsan" },
  { zu: "die Musik etwas leiser zu machen", wrong: "die Musik etwas leiser machen", inf: "die Musik etwas leiser machen", tr: "müziğin sesini biraz kıssan" },
  { zu: "mir @ dein Auto zu leihen", wrong: "mir @ dein Auto leihen", inf: "mir @ dein Auto leihen", tr: "@ arabanı bana ödünç versen", when: [["am Wochenende", "hafta sonu"], ["morgen", "yarın"]] },
  { zu: "@ für mich einzukaufen", wrong: "@ für mich zu einkaufen", inf: "@ für mich einkaufen", tr: "@ benim için alışveriş yapsan", when: [["heute", "bugün"], ["morgen", "yarın"]] },
  { zu: "meine Blumen zu gießen, während ich weg bin", wrong: "meine Blumen gießen, während ich weg bin", inf: "meine Blumen gießen, während ich weg bin", tr: "ben yokken çiçeklerimi sulasan" },
  { zu: "mich @ kurz anzurufen", wrong: "mich @ kurz zu anrufen", inf: "mich @ kurz anrufen", tr: "@ beni bir arasan", when: [["nachher", "birazdan"], ["heute Abend", "bu akşam"]] },
  { zu: "mir @ deine Notizen zu schicken", wrong: "mir @ deine Notizen schicken", inf: "mir @ deine Notizen schicken", tr: "@ notlarını bana göndersen", when: [["heute Abend", "bu akşam"], ["morgen", "yarın"]] },
  { zu: "mich @ zum Flughafen zu fahren", wrong: "mich @ zum Flughafen fahren", inf: "mich @ zum Flughafen fahren", tr: "@ beni havaalanına bıraksan", when: [["morgen früh", "yarın sabah"], ["am Samstag", "cumartesi"]] },
  { zu: "@ auf meine Katze aufzupassen", wrong: "@ auf meine Katze zu aufpassen", inf: "@ auf meine Katze aufpassen", tr: "@ kedime baksan", when: [["am Wochenende", "hafta sonu"], ["nächste Woche", "gelecek hafta"]] },
];

const SORRIES: { dass: string; wrong: string; tr: string; pre: string; inf: string; part2: string; post?: string; trShould: string }[] = [
  { dass: "deinen Geburtstag vergessen habe", wrong: "habe deinen Geburtstag vergessen", tr: "doğum gününü unuttuğum", pre: "dir wenigstens eine Nachricht", inf: "schreiben", part2: "geschrieben", trShould: "en azından sana bir mesaj atmalıydım" },
  { dass: "zu spät gekommen bin", wrong: "bin zu spät gekommen", tr: "geç kaldığım", pre: "dir Bescheid", inf: "sagen", part2: "gesagt", trShould: "sana haber vermeliydim" },
  { dass: "nicht zu deiner Party gekommen bin", wrong: "bin nicht zu deiner Party gekommen", tr: "partine gelmediğim", pre: "dir wenigstens", inf: "sagen", part2: "gesagt", post: ", dass ich nicht kommen kann", trShould: "en azından gelemeyeceğimi söylemeliydim" },
  { dass: "dich angeschrien habe", wrong: "habe dich angeschrien", tr: "sana bağırdığım", pre: "nicht so", inf: "überreagieren", part2: "überreagiert", trShould: "bu kadar abartmamalıydım" },
  { dass: "dein Buch verloren habe", wrong: "habe dein Buch verloren", tr: "kitabını kaybettiğim", pre: "besser darauf", inf: "aufpassen", part2: "aufgepasst", trShould: "ona daha iyi bakmalıydım" },
  { dass: "dich nicht zurückgerufen habe", wrong: "habe dich nicht zurückgerufen", tr: "seni geri aramadığım", pre: "dir wenigstens", inf: "schreiben", part2: "geschrieben", trShould: "en azından sana yazmalıydım" },
  { dass: "so lange nichts von mir habe hören lassen", wrong: "habe so lange nichts von mir hören lassen", tr: "bu kadar uzun süre ses vermediğim", pre: "mich früher", inf: "melden", part2: "gemeldet", trShould: "daha önce aramalıydım" },
  { dass: "deine Nachricht übersehen habe", wrong: "habe deine Nachricht übersehen", tr: "mesajını gözden kaçırdığım", pre: "öfter aufs Handy", inf: "gucken", part2: "geguckt", trShould: "telefonuma daha sık bakmalıydım" },
  { dass: "dich so lange habe warten lassen", wrong: "habe dich so lange warten lassen", tr: "seni bu kadar beklettiğim", pre: "früher", inf: "losfahren", part2: "losgefahren", trShould: "daha erken yola çıkmalıydım" },
  { dass: "dein Geheimnis weitererzählt habe", wrong: "habe dein Geheimnis weitererzählt", tr: "sırrını başkasına anlattığım", pre: "einfach den Mund", inf: "halten", part2: "gehalten", trShould: "çenemi kapalı tutmalıydım" },
  { dass: "deine Tasse kaputt gemacht habe", wrong: "habe deine Tasse kaputt gemacht", tr: "kupanı kırdığım", pre: "vorsichtiger", inf: "sein", part2: "gewesen", trShould: "daha dikkatli olmalıydım" },
  { dass: "gestern so unfreundlich zu dir war", wrong: "war gestern so unfreundlich zu dir", tr: "dün sana bu kadar kaba davrandığım", pre: "nicht so", inf: "reagieren", part2: "reagiert", trShould: "öyle tepki vermemeliydim" },
];

const THANKS: { dass: string; wrong: string; tr: string; cons: string; consTr: string }[] = [
  { dass: "mir beim Umzug geholfen hast", wrong: "hast mir beim Umzug geholfen", tr: "taşınırken bana yardım ettiğin", cons: "{ohne dich hätte ich das nie geschafft|ich hätte das ohne dich nie geschafft|ohne dich hätte ich das nie hingekriegt}", consTr: "sen olmasan bunu asla başaramazdım" },
  { dass: "mich vom Flughafen abgeholt hast", wrong: "hast mich vom Flughafen abgeholt", tr: "beni havaalanından aldığın", cons: "{ohne dich hätte ich ewig auf den Bus warten müssen|ich hätte ohne dich ewig auf den Bus warten müssen}", consTr: "sen olmasan otobüsü saatlerce beklemek zorunda kalırdım" },
  { dass: "mir dein Auto geliehen hast", wrong: "hast mir dein Auto geliehen", tr: "bana arabanı ödünç verdiğin", cons: "{ohne dich wäre ich nie rechtzeitig angekommen|ich wäre ohne dich nie rechtzeitig angekommen}", consTr: "sen olmasan asla zamanında varamazdım" },
  { dass: "für mich eingekauft hast", wrong: "hast für mich eingekauft", tr: "benim için alışveriş yaptığın", cons: "{ohne dich hätte ich heute nichts zu essen gehabt|ich hätte ohne dich heute nichts zu essen gehabt}", consTr: "sen olmasan bugün yiyecek hiçbir şeyim olmazdı" },
  { dass: "mir bei den Hausaufgaben geholfen hast", wrong: "hast mir bei den Hausaufgaben geholfen", tr: "ödevlerimde bana yardım ettiğin", cons: "{ohne dich hätte ich die Aufgabe nie verstanden|ich hätte die Aufgabe ohne dich nie verstanden}", consTr: "sen olmasan o soruyu asla anlayamazdım" },
  { dass: "auf meine Katze aufgepasst hast", wrong: "hast auf meine Katze aufgepasst", tr: "kedime baktığın", cons: "{ohne dich hätte ich nicht in den Urlaub fahren können|ich hätte ohne dich nicht in den Urlaub fahren können}", consTr: "sen olmasan tatile gidemezdim" },
  { dass: "mir zugehört hast", wrong: "hast mir zugehört", tr: "beni dinlediğin", cons: "{ohne dich wäre ich total durchgedreht|ich wäre ohne dich total durchgedreht}", consTr: "sen olmasan kafayı yerdim" },
  { dass: "mich gestern nach Hause gefahren hast", wrong: "hast mich gestern nach Hause gefahren", tr: "dün beni eve bıraktığın", cons: "{ohne dich hätte ich ein Taxi nehmen müssen|ich hätte ohne dich ein Taxi nehmen müssen}", consTr: "sen olmasan taksiye binmek zorunda kalırdım" },
  { dass: "mir deine Notizen geschickt hast", wrong: "hast mir deine Notizen geschickt", tr: "notlarını bana gönderdiğin", cons: "{ohne dich hätte ich die Prüfung nie bestanden|ich hätte die Prüfung ohne dich nie bestanden}", consTr: "sen olmasan sınavı asla geçemezdim" },
  { dass: "mich an den Termin erinnert hast", wrong: "hast mich an den Termin erinnert", tr: "randevuyu bana hatırlattığın", cons: "{ohne dich hätte ich ihn total vergessen|ich hätte ihn ohne dich total vergessen}", consTr: "sen olmasan onu tamamen unuturdum" },
];

const rica = openTemplate(
  "gk-zor-rica",
  "GK",
  "gk-rica",
  ["bitte-mal", "konj2-vergangen", "dass-gefuehl"],
  "Hättest du was dagegen, wenn ich …? / Würde es dir was ausmachen, … zu …? / Tut mir leid, dass …, ich hätte … sollen.",
  (p): Generated => {
    const kind = p.pick(["dagegen", "ausmachen", "sorry", "danke"] as const);
    if (kind === "dagegen") {
      const x = p.pick(PERMS);
      const polite = p.pick([false, false, true]);
      const subsDe = polite ? (x.sie ?? x.de) : x.de;
      const trPerm = polite ? (x.trSie ?? x.tr) : x.tr;
      const head = polite
        ? "{Hätten Sie [et]was dagegen|Haben Sie [et]was dagegen|Macht es Ihnen [et]was aus|Würde es Ihnen [et]was ausmachen|Stört es Sie|Würde es Sie stören}"
        : "{Hättest du [et]was dagegen|Hast du [et]was dagegen|Macht es dir [et]was aus|Würde es dir [et]was ausmachen|Stört es dich|Würde es dich stören}";
      const first = subsDe[0];
      const verb = first.split(" ").pop()!;
      return {
        tr: joinTr([trPerm, polite ? "sizin için sorun olur mu" : "sorun olur mu"], "?"),
        de: unique(subsDe.flatMap((s) => all(`${head}, wenn ich ${s}?`))),
        vocab: [["Hättest du was dagegen, wenn …?", "… -sem sorun olur mu?"]],
        focus: [focus("nebensatz", first, [[`${verb} ${first.split(" ").slice(0, -1).join(" ")}`, `wenn yan cümle açar, çekimli fiil en sona gider: wenn ich ${first}.`]])],
      };
    }
    if (kind === "ausmachen") {
      const x = p.pick(FAVORS);
      const t = x.when ? p.pick([null, ...x.when]) : null;
      const fill = (s: string, i: 0 | 1) => s.replace("@", t ? t[i] : "").replace(/\s+/g, " ").trim();
      const zu = fill(x.zu, 0);
      return {
        tr: joinTr([fill(x.tr, 1), "senin için sorun olur mu"], "?"),
        de: all(`{Würde es dir [et]was ausmachen|Macht es dir [et]was aus|Wär's okay für dich}, ${zu}?`, `{Könntest|Kannst|Würdest} du ${fill(x.inf, 0)}?`),
        vocab: [["Würde es dir was ausmachen, … zu …?", "… -sen senin için sorun olur mu?"]],
        focus: [focus("zu-infinitiv", zu, [[fill(x.wrong, 0), `Bu kalıpta zu + mastar en sona gider (ayrılabilen fiilde zu araya girer): ${zu}.`]])],
      };
    }
    if (kind === "sorry") {
      const s = p.pick(SORRIES);
      const should = `${s.pre} ${s.inf} sollen${s.post ?? ""}`;
      return {
        tr: joinTr([`${s.tr} için çok özür dilerim,`, s.trShould]),
        de: all(`{Tut mir [echt|wirklich] leid|Es tut mir [echt|wirklich] leid|Sorry|Entschuldige}, dass ich ${s.dass}, ich {hätte|hätt} ${should}.`),
        vocab: [["Ich hätte … sollen.", "… -meliydim."], ["Es tut mir leid, dass …", "… -diğim için özür dilerim"]],
        focus: [
          focus("konj2-vergangen", `${s.inf} sollen`, [
            [`sollen ${s.inf}`, `Çift mastarda modal fiil en sona gider: ich hätte … ${s.inf} sollen.`],
            [`${s.part2} sollen`, `hätte … sollen yapısında asıl fiil mastar kalır: ${s.inf} sollen (${s.part2} değil).`],
          ]),
          focus("dass-gefuehl", s.dass, [[s.wrong, `dass'lı yan cümlede çekimli fiil en sona gider: dass ich ${s.dass}.`]]),
        ],
      };
    }
    const t = p.pick(THANKS);
    return {
      tr: joinTr([`${t.tr} için sağ ol,`, t.consTr], "!"),
      de: all(`{Danke|Danke dir|Vielen Dank}, dass du ${t.dass}, ${t.cons}!`),
      vocab: [["Danke, dass du …", "… -diğin için sağ ol"], ["ohne dich …", "sen olmasan …"]],
      focus: [focus("dass-gefuehl", t.dass, [[t.wrong, `dass'lı yan cümlede çekimli fiil en sona gider: dass du ${t.dass}.`]])],
    };
  },
);

// ---------- slang ----------

const DUTY_IDS = ["sinav", "odev", "temizlik", "oda-topla", "bulasik", "alisveris", "almanca", "piyano", "erken-kalk", "aksam-yemegi", "araba-yika", "bahce", "eposta", "bavul"];

const SLACK: { v: LV; mid: string; tr: string; vocab: [string, string] }[] = [
  { v: V_RUMHAENGEN, mid: "den ganzen Tag nur am Handy", tr: "telefonla oyalan", vocab: ["rumhängen", "boş boş takılmak"] },
  { v: V_RUMLIEGEN, mid: "den ganzen Tag nur auf der Couch", tr: "kanepede yatıp dur", vocab: ["rumliegen", "yayılıp yatmak"] },
  { v: V_ZOCKEN, mid: "den ganzen Tag nur", tr: "oyun oyna", vocab: ["zocken", "(bilgisayar) oyun oynamak"] },
  { v: V_PENNEN, mid: "bis mittags", tr: "uyu", vocab: ["pennen", "uyumak (argo)"] },
  { v: V_GUCKEN, mid: "den ganzen Tag nur Serien", tr: "dizi izle", vocab: ["Serien gucken", "dizi izlemek"] },
  { v: V_CHILLEN, mid: "den ganzen Tag nur", tr: "yan gelip yat", vocab: ["chillen", "kafa dinlemek, yan gelip yatmak"] },
];

const SLACK_TR_OBJ: Record<string, string> = {
  "telefonla oyalan": "bütün gün",
  "kanepede yatıp dur": "bütün gün",
  "oyun oyna": "bütün gün",
  uyu: "öğlene kadar",
  "dizi izle": "bütün gün",
  "yan gelip yat": "bütün gün",
};

const BOCK_IDS = ["sinav", "odev", "temizlik", "oda-topla", "bulasik", "alisveris", "spor", "erken-kalk", "aksam-yemegi", "ise-git", "eposta", "piyano", "araba-yika", "bavul", "doktor"];

const MOODS: [string, string][] = [
  ["sauer", "kızgın"],
  ["genervt", "gergin"],
  ["beleidigt", "küs"],
  ["schlecht drauf", "keyifsiz"],
];

const argo = openTemplate(
  "gk-zor-argo",
  "GK",
  "gk-argo",
  ["umgang", "statt-zu", "lust"],
  "null Bock haben, … zu … / Statt … zu …, hängt er nur rum / jemanden versetzen / Ich check nicht, warum …",
  (p): Generated => {
    const kind = p.pick(["bock", "statt", "versetzt", "check"] as const);
    if (kind === "bock") {
      const e = E(p.pick(BOCK_IDS));
      const w = p.pick([BEN, BEN, BIZ, O].filter((x) => fitsWho(e, x)));
      const when = p.pick([null, { de: "heute", tr: "bugün" }]);
      const de: string[] = [];
      for (const d of w.de) {
        const has_ = present(LX.haben, d.p);
        const must = present(LX.muessen, d.p);
        for (const zu of zuGroups(e, d)) {
          de.push(...all(`${capitalize(d.s)} ${has_} ${when ? `${when.de} ` : ""}{null Bock|keinen Bock|überhaupt keine Lust|gar keine Lust}, ${zu}, aber ${d.s} ${must} {wohl|halt|ja}.`));
          if (when) de.push(...all(`${capitalize(d.s)} ${has_} {null Bock|keinen Bock|überhaupt keine Lust|gar keine Lust}, ${when.de} ${zu}, aber ${d.s} ${must} {wohl|halt|ja}.`));
          de.push(...all(`${capitalize(d.s)} ${has_} ${when ? `${when.de} ` : ""}{null Bock|keinen Bock|überhaupt keine Lust}, ${zu}, aber es muss {wohl|halt|ja} sein.`));
        }
      }
      const mecbur = { "1sg": "mecburum", "2sg": "mecbursun", "3sg": "mecbur", "1pl": "mecburuz", "2pl": "mecbursunuz", "3pl": "mecburlar" }[w.trP];
      return {
        tr: joinTr([when?.tr, "hiç", trObject(e, w.trP), T.desire(e.tr, w.trP), "yok ama", mecbur, "herhalde"]),
        de: unique(de),
        vocab: [["null Bock haben", "hiç havasında olmamak (argo)"], ["Es muss wohl sein.", "mecburuz herhalde"], e.vocab],
        focus: [zuFocus("lust", e, zuGroups(e, w.de[0])[0])],
      };
    }
    if (kind === "statt") {
      const s = p.pick(SLACK);
      const w = p.pick([SEN, O, ...PEOPLE.filter((x) => ["kardes", "arkadas", "cocuklar", "ali", "ayse"].includes(x.id))]);
      const duty = E(p.pick(DUTY_IDS.filter((id) => fitsWho(E(id), w))));
      const de: string[] = [];
      for (const d of w.de) {
        const pron = pronounOf(d);
        const slack = (x: DeWho) => clause(x, s.v, [s.mid]);
        for (const zu of zuGroups(duty, d)) for (const mo of mains(slack(d), `{statt|anstatt} ${zu},`)) de.push(...all(`${mo}!`));
        for (const zu of zuGroups(duty, pron)) for (const mo of mains(slack(d))) de.push(...all(`${mo}, {statt|anstatt} ${zu}!`));
      }
      return {
        tr: joinTr([trNom(w), trObject(duty, w.trP), T.partCase(T.futPart(duty.tr, w.trP), w.trP, "dat"), SLACK_TR_OBJ[s.tr], T.present(T.tv(s.tr), w.trP)], "!"),
        de: unique(de),
        vocab: [["statt … zu …", "… -eceğine"], s.vocab, duty.vocab],
        focus: [zuFocus("statt-zu", duty, zuGroups(duty, w.de[0])[0])],
      };
    }
    if (kind === "versetzt") {
      const w = p.pick(PEOPLE.filter((x) => x.trP === "3sg"));
      const when = p.pick([
        ["gestern", "dün"],
        ["heute Morgen", "bu sabah"],
        ["vorhin", "az önce"],
      ] as const);
      const [said, saidTr] = p.pick([
        ["geschrieben", "geleceğini yazmıştı"],
        ["gesagt", "geleceğini söylemişti"],
        ["versprochen", "geleceğine söz vermişti"],
      ] as const);
      const de: string[] = [];
      for (const d of w.de) {
        const x = pronounOf(d).s;
        const S = capitalize(d.s);
        const comes = "{kommt|kommen würde|kommen wird}";
        de.push(
          ...all(
            `${S} hat mich [voll|total|einfach] versetzt, obwohl ${x} mir ${when[0]} noch ${said} {hat|hatte}, dass ${x} ${comes}.`,
            `${S} hat mir ${when[0]} noch ${said}, dass ${x} ${comes}, aber dann hat ${x} mich [voll|total|einfach] versetzt.`,
            `${S} hatte mir ${when[0]} noch ${said}, dass ${x} ${comes}, aber ${x} hat mich [voll|total|einfach] versetzt.`,
          ),
        );
      }
      const x0 = pronounOf(w.de[0]).s;
      return {
        tr: joinTr([w.tr, "daha", when[1], "bana", `${saidTr},`, "ama beni resmen ekti"]),
        de: unique(de),
        vocab: [["jemanden versetzen", "birini ekmek (buluşmaya gelmemek)"], ["obwohl", "-dığı halde"]],
        focus: [focus("nebensatz", `mir ${when[0]} noch ${said} hat`, [[`hat mir ${when[0]} noch ${said}`, `obwohl yan cümle açar, çekimli fiil en sona gider: obwohl ${x0} mir ${when[0]} noch ${said} hat.`]])],
      };
    }
    const w = p.pick([O, ...PEOPLE]);
    const [mood, moodTr] = p.pick(MOODS);
    const de: string[] = [];
    for (const d of w.de) {
      const be = present(LX.sein, d.p);
      de.push(
        ...all(
          `{Ich check [gar|überhaupt] nicht|Ich versteh [echt|überhaupt] nicht|Ich verstehe [echt|überhaupt] nicht|Ich kapier nicht}, warum ${d.s} so ${mood} ${be}, ich {hab|habe} doch {nichts|gar nichts} {gemacht|getan}!`,
        ),
      );
    }
    const be0 = present(LX.sein, w.de[0].p);
    return {
      tr: joinTr([trGen(w), "neden bu kadar", moodTr, T.partCase(T.dik(T.tv("ol"), w.trP), w.trP, "acc"), "hiç anlamıyorum,", "ben bir şey yapmadım ki"], "!"),
      de: unique(de),
      vocab: [["checken", "anlamak, çakmak (argo)"], [mood, moodTr]],
      focus: [focus("indirekte-frage", `${w.de[0].s} so ${mood} ${be0}`, [[`${be0} ${w.de[0].s} so ${mood}`, `warum dolaylı soru açar, çekimli fiil en sona gider: warum ${w.de[0].s} so ${mood} ${be0}.`]])],
    };
  },
);

// ---------- opinions ----------

const CAN_IDS = ["ziyaret", "ziyaret-arkadas", "istasyon", "yardim", "davet", "sinema", "futbol", "arkadas-bulus", "sehir", "berlin", "araba-yika", "alisveris", "hediye", "kek", "aksam-yemegi", "doktor", "eve-git"];

const OPINION_IDS = ["ara", "ziyaret", "doktor", "temizlik", "hediye", "para", "erken-kalk", "yat", "tatil-plan", "davet", "bulasik", "taksi", "otobus", "almanca", "spor"];

const RISKY: { de: string; tr: string; ids: string[] }[] = [
  { de: "bei dem Wetter", tr: "bu havada", ids: ["bisiklet", "yuruyus", "yuzme", "futbol", "sehir", "foto", "araba-yika", "bahce"] },
  { de: "um diese Uhrzeit", tr: "bu saatte", ids: ["sinema", "sehir", "pizza", "kahve", "spor", "yuzme", "alisveris", "temizlik", "kek"] },
  { de: "so kurz vor der Prüfung", tr: "sınava bu kadar az kala", ids: ["sinema", "dans", "futbol", "arkadas-bulus", "berlin", "televizyon", "sehir"] },
  { de: "mitten in der Woche", tr: "hafta ortasında", ids: ["sinema", "dans", "berlin", "arkadas-bulus"] },
];

const fikir = openTemplate(
  "gk-zor-fikir",
  "GK",
  "gk-fikir",
  ["nebensatz", "indirekte-frage", "zu-infinitiv"],
  "Da hast du zwar recht, aber ich finde trotzdem, dass … / Es kommt drauf an, ob … / Ich bin mir nicht sicher, ob es eine gute Idee ist, … zu …",
  (p): Generated => {
    const kind = p.pick(["recht", "idee", "drauf", "okay"] as const);
    if (kind === "recht") {
      const e = E(p.pick(OPINION_IDS));
      const when = timeFor(p, e, [...NEXT, { de: "heute noch", tr: "bugün içinde" }]);
      const de: string[] = [];
      const head = "{Da hast du [zwar|ja] recht|Du hast ja recht|Du hast schon recht|Stimmt schon}, aber";
      for (const modal of [LX.sollen, LX.muessen]) {
        const t: DeTense = modal === LX.sollen ? "k2" : "pres";
        for (const c of deEvent(e, WIR, t, { time: when?.de, modal })) {
          for (const so of subs(c, "dass")) de.push(...all(`${head} {ich finde trotzdem|trotzdem finde ich|ich finde}, ${so}.`));
          for (const mo of mains({ ...c, mid: ["trotzdem", ...c.mid] })) de.push(...all(`${head} ich finde, ${mo}.`));
        }
      }
      return {
        tr: joinTr(["haklısın, ama yine de bence", when?.tr, trEvent(e, "1pl", "nec")]),
        de: unique(de),
        vocab: [["Da hast du zwar recht, aber …", "haklısın ama …"], ["trotzdem", "yine de"], e.vocab],
        focus: endFocus("nebensatz", "dass", deEvent(e, WIR, "k2", { time: when?.de, modal: LX.sollen })[0]),
      };
    }
    if (kind === "idee") {
      const r = p.pick(RISKY);
      const e = E(p.pick(r.ids));
      const de: string[] = [];
      for (const zu of zuGroups(e, WIR)) {
        de.push(...all(`{Ich bin mir nicht sicher|Ich weiß nicht [so recht]}, ob es {so eine|eine} gute Idee ist, ${r.de} ${zu}.`, `{Ich bin mir nicht sicher|Ich weiß nicht [so recht]}, ob das {so eine|eine} gute Idee ist, ${r.de} ${zu}.`));
      }
      return {
        tr: joinTr([r.tr, trObject(e, "1pl"), T.infinitive(e.tr), "iyi bir fikir mi, emin değilim"]),
        de: unique(de),
        vocab: [["Ich bin mir nicht sicher, ob …", "… emin değilim"], [r.de, r.tr], e.vocab],
        focus: [zuFocus("zu-infinitiv", e, zuGroups(e, WIR)[0])],
      };
    }
    if (kind === "drauf") {
      const w = p.pick([O, ...PEOPLE]);
      const e = p.pick(CAN_IDS.map(E).filter((x) => fitsWho(x, w)));
      const when = timeFor(p, e, NEXT);
      const de: string[] = [];
      for (const d of w.de) {
        for (const c of deEvent(e, d, "pres", { time: when?.de, modal: LX.koennen })) {
          for (const so of subs(c, "ob")) de.push(...all(`{Es kommt drauf an|Kommt drauf an|Das hängt davon ab|Es hängt davon ab}, ${so}.`));
        }
      }
      return {
        tr: joinTr([trGen(w), when?.tr, trObject(e, w.trP), T.whether(e.tr, w.trP, "able", "dat"), "bağlı"]),
        de: unique(de),
        vocab: [["Es kommt drauf an, ob …", "… -ip -emeyeceğine bağlı"], ["Das hängt davon ab, …", "… -e bağlı"], e.vocab],
        focus: endFocus("indirekte-frage", "ob", deEvent(e, w.de[0], "pres", { time: when?.de, modal: LX.koennen })[0]),
      };
    }
    const h = p.pick(HABITS);
    const w = p.pick([SEN, O, ...PEOPLE].filter((x) => !(h.adult && x.kid)));
    const de: string[] = [];
    for (const d of w.de) {
      for (const so of subs(clause(d, h.v, [h.mid(d)]), "dass")) de.push(...all(`Ich {finde|find} es [echt|wirklich] nicht {okay|in Ordnung|richtig}, ${so}.`));
    }
    return {
      tr: joinTr(["bence", trGen(w), h.tr(w.trP), "hiç doğru değil"]),
      de: unique(de),
      vocab: [["Ich finde es nicht okay, dass …", "bence … -mesi doğru değil"], h.vocab],
      focus: endFocus("nebensatz", "dass", clause(w.de[0], h.v, [h.mid(w.de[0])])),
    };
  },
);

export const SPOKEN = [dedikodu, tepki, plan, kafe, yol, telefon, rica, argo, fikir];
