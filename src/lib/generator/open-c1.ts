import { capitalize, konj2, n, pi, present, type Noun, type Person } from "../grammar/de";
import * as T from "../grammar/tr";
import { expand } from "./alts";
import { deMids, joinTr, mainOrders, reflOf, subOrders, subText, trEvent, trObject, v2Text, verbGroup, type DeClause } from "./clause";
import { focus, type Generated } from "./engine";
import { EVENTS, EVERYONE, fitsWho, LX, lv, PEOPLE, type DeWho, type Ev, type LV, type Who } from "./lexicon";
import { openTemplate, pronounOf, unique } from "./open-kit";

// Hard C1 templates: double infinitives inside subordinate clauses, mixed-time Konjunktiv II,
// "als ob", extended participial attributes, advanced connectors, passive substitutes and
// modal verbs of assumption. Every template combines people, events and frames endlessly.

const words = (xs: (string | undefined | null | false)[]) => xs.filter((x): x is string => Boolean(x)).join(" ");
const E = (id: string): Ev => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`unknown event ${id}`);
  return e;
};
const W = (id: string): Who => EVERYONE.find((x) => x.id === id)!;
const SEN = W("sen");
const BEN = W("ben");
const O = W("o");
/** Third person singular subjects: "o" and people */
const THIRD: Who[] = [O, ...PEOPLE.filter((w) => w.trP === "3sg")];
const PRONOUN = /^(ich|du|er|sie|es|wir|ihr|Sie)$/;

const trGen = (w: Who) => (!w.pron || w.trP === "2sg" || w.trP === "3sg" ? w.gen : null);
const trNom = (w: Who) => (w.pron ? null : w.tr);
const all = (...patterns: string[]) => unique(patterns.flatMap((x) => expand(x)));
const subs = (c: DeClause, conj: string) => subOrders(c, conj).map((x) => x.join(" "));
const mains = (c: DeClause, front?: string) => mainOrders(c, front).map((x) => x.join(" "));
const auxOf = (v: LV) => (v.aux === "sein" ? LX.sein : LX.haben);
/** "would not" in Turkish: olmazdım, üşümezdin, beklemezdik */
const wouldNot = (stem: string, p: Person) => {
  const m = stem + "m" + T.h2(stem);
  return T.aoristPast(T.tv(m, undefined, m + "z"), p);
};
const ORDER_WHY = "Yan cümle başta olduğu için ana cümle çekimli fiille başlar";

function clause(d: DeWho, v: LV, mid: string[], t: Parameters<typeof verbGroup>[2] = "pres"): DeClause {
  return { subj: d.s, vg: verbGroup(v, d.p, t), mid: mid.filter(Boolean), noun: !PRONOUN.test(d.s) };
}

// verbs the lexicon does not have
const V_AUSGEBEN = lv("ausgeben", "ausgegeben", { prefix: "aus", praet: "gab", du: "gibst", er: "gibt" });
const V_LOSFAHREN = lv("losfahren", "losgefahren", { prefix: "los", sein: true, praet: "fuhr", du: "fährst", er: "fährt" });
const V_MITNEHMEN = lv("mitnehmen", "mitgenommen", { prefix: "mit", praet: "nahm", du: "nimmst", er: "nimmt" });
const V_MITKOMMEN = lv("mitkommen", "mitgekommen", { prefix: "mit", sein: true, praet: "kam" });
const V_LEIHEN = lv("leihen", "geliehen", { praet: "lieh" });
const V_GUCKEN = lv("gucken", "geguckt");
const V_REDEN = lv("reden", "geredet");
const V_SCHAUEN = lv("schauen", "geschaut");
const V_TUN: LV = { ...lv("tun", "getan", { praet: "tat" }), table: ["tue", "tust", "tut", "tun", "tut", "tun"] };
const V_AUSSEHEN = lv("aussehen", "ausgesehen", { prefix: "aus", praet: "sah", du: "siehst", er: "sieht" });
const WUESSTE = ["wüsste", "wüsstest", "wüsste", "wüssten", "wüsstet", "wüssten"] as const;

// ---------- 1. double infinitive in a subordinate clause: …, dass er es hätte wissen müssen ----------

const SHOULD_IDS = ["ara", "ziyaret", "doktor", "sinav", "hesap", "para", "taksi", "bavul", "yardim", "hediye", "tatil-plan", "eposta", "otobus"];
const SHOULD_WHEN: [string, string][] = [
  ["früher", "daha önce"],
  ["rechtzeitig", "zamanında"],
  ["gestern", "dün"],
  ["schon letzte Woche", "daha geçen hafta"],
];
const COULD_IDS = ["istasyon", "yardim", "ziyaret-arkadas", "sinema", "kek", "aksam-yemegi", "alisveris", "davet"];

/** The verb cluster at the end of the clause: "hätte anrufen sollen" (finite verb before both infinitives). */
function cluster(e: Ev, d: DeWho, adv: string, modal: string): string[] {
  const out: string[] = [];
  const hatte = konj2(LX.haben, d.p);
  for (const mid of deMids(e, d)) {
    const refl = reflOf(e, d.p);
    out.push(words([refl, adv, mid, hatte, e.v.inf, modal]));
    if (mid) out.push(words([refl, mid, adv, hatte, e.v.inf, modal]));
  }
  return out;
}

const doppelInf = openTemplate(
  "c1-zor-doppelinf",
  "C1",
  "c1-konjunktiv",
  ["doppelinfinitiv", "konj2-vergangen"],
  "Yan cümlede çift mastar: çekimli fiil (hätte) iki mastarın ÖNÜNE gelir: …, dass er sie früher hätte anrufen sollen.",
  (p): Generated => {
    if (p.pick([true, true, false])) {
      const e = E(p.pick(SHOULD_IDS));
      const [adv, advTr] = p.pick(SHOULD_WHEN);
      const w = p.pick([BEN, BEN, ...THIRD].filter((x) => fitsWho(e, x)));
      const frame = p.pick(["know", "admit"] as const);
      const de: string[] = [];
      for (const d of w.de) {
        const pron = pronounOf(d);
        for (const modal of ["sollen", "müssen"]) {
          for (const tail of cluster(e, pron, adv, modal)) {
            const dass = `dass ${pron.s} ${tail}`;
            if (d.s === "ich") {
              de.push(...all(frame === "know" ? `{Ich weiß|Mir ist klar}, ${dass}.` : `{Ich gebe zu|Ich muss zugeben}, ${dass}.`));
            } else {
              de.push(
                ...all(frame === "know" ? `${capitalize(d.s)} weiß genau, ${dass}.` : `${capitalize(d.s)} {hat zugegeben|gab zu|hat eingesehen}, ${dass}.`),
              );
            }
          }
        }
      }
      const vn = `${T.poss(T.verbNoun(e.tr), w.trP)} gerektiğini`;
      const trMain = w.id === "ben" ? (frame === "know" ? "biliyorum" : "kabul ediyorum") : frame === "know" ? "çok iyi biliyor" : "kabul etti";
      const d0 = pronounOf(w.de[0]);
      return {
        tr: joinTr([trNom(w) && `${trNom(w)},`, advTr, trObject(e, w.trP), vn, trMain]),
        de: unique(de),
        vocab: [["hätte … sollen / müssen", "-mesi gerekirdi"], [adv, advTr], e.vocab],
        focus: [
          focus("doppelinfinitiv", `${konj2(LX.haben, d0.p)} ${e.v.inf} sollen`, [
            [`${e.v.inf} sollen ${konj2(LX.haben, d0.p)}`, "Çift mastarlı yan cümlede çekimli fiil (hätte) en sona değil, iki mastarın önüne gelir: … hätte " + `${e.v.inf} sollen.`],
            [`${konj2(LX.haben, d0.p)} ${e.v.part2} sollen`, `Modal fiille Partizip II değil mastar kullanılır: hätte ${e.v.inf} sollen.`],
          ]),
        ],
      };
    }
    // "… hätte kommen können, wenn wir ihn gefragt hätten"
    const e = E(p.pick(COULD_IDS));
    const w = p.pick(THIRD.filter((x) => fitsWho(e, x)));
    const de: string[] = [];
    for (const d of w.de) {
      const pron = pronounOf(d);
      const akk = pron.s === "er" ? "ihn" : "sie";
      for (const mid of deMids(e, pron)) {
        const v2 = words([pron.s, "hätte", reflOf(e, pron.p), "gestern", mid, e.v.inf, "können"]);
        const sub = words(["dass", pron.s, reflOf(e, pron.p), "gestern", mid, "hätte", e.v.inf, "können"]);
        for (const head of [`${capitalize(d.s)} sagt`, `${capitalize(d.s)} meint`]) {
          de.push(...all(`${head}, {${v2}|${sub}}, wenn wir ${akk} gefragt hätten.`, `${head}, wenn wir ${akk} gefragt hätten, {hätte ${pron.s} ${words([reflOf(e, pron.p), "gestern", mid, e.v.inf, "können"])}|${sub}}.`));
        }
      }
    }
    const abil = T.ability(e.tr, "3sg").slice(0, -2);
    const could = T.partCase(T.futPart(T.tv(abil), "3sg"), "3sg", "acc");
    return {
      tr: joinTr([`${w.pron ? "O" : w.tr},`, "ona sorsaydık", "dün", trObject(e, "3sg"), could, "söylüyor"]),
      de: unique(de),
      vocab: [["hätte … können", "-ebilirdi"], ["wenn wir ihn gefragt hätten", "ona sorsaydık"], e.vocab],
      focus: [focus("doppelinfinitiv", `${e.v.inf} können`, [[`können ${e.v.inf}`, `Çift mastarda modal fiil en sona gider: hätte … ${e.v.inf} können.`]])],
    };
  },
);

// ---------- 2. mixed-time conditionals: wenn ich gestern …, wäre ich jetzt … ----------

interface Cond {
  v: LV;
  mid: (d: DeWho) => string;
  tr: T.TrVerb;
  trObj: (p: Person) => string;
  neg?: boolean;
  results: string[];
  vocab: [string, string];
}

const CONDS: Cond[] = [
  { v: LX.arbeiten, mid: () => "gestern Abend nicht so lange", tr: T.tv("çalış"), trObj: () => "dün akşam o kadar uzun", neg: true, results: ["muede"], vocab: ["so lange", "o kadar uzun"] },
  { v: LX.gehen, mid: () => "gestern früher ins Bett", tr: T.tv("yat"), trObj: () => "dün daha erken", results: ["muede"], vocab: ["ins Bett gehen", "yatmak"] },
  { v: V_AUSGEBEN, mid: () => "nicht das ganze Geld für Klamotten", tr: T.tv("harca"), trObj: () => "bütün parayı kıyafetlere", neg: true, results: ["geld"], vocab: ["Geld ausgeben", "para harcamak"] },
  { v: LX.sparen, mid: () => "mehr", tr: T.tv("para biriktir"), trObj: () => "daha çok", results: ["geld"], vocab: ["sparen", "para biriktirmek"] },
  { v: V_MITNEHMEN, mid: (d) => `${d.det}e Jacke`, tr: T.tv("al"), trObj: (p) => `${T.possCase("mont", p, "acc")} ${T.possCase("yan", p, "dat")}`, results: ["kalt"], vocab: ["mitnehmen", "yanına almak"] },
  { v: V_MITNEHMEN, mid: () => "einen Regenschirm", tr: T.tv("al"), trObj: (p) => `${T.possCase("yan", p, "dat")} şemsiye`, results: ["nass"], vocab: ["der Regenschirm", "şemsiye"] },
  { v: LX.trinken, mid: () => "mehr Wasser", tr: T.tv("su iç"), trObj: () => "daha çok", results: ["kopf"], vocab: ["mehr Wasser", "daha çok su"] },
  { v: LX.lernen, mid: () => "besser für die Prüfung", tr: T.tv("çalış"), trObj: () => "sınava daha iyi", results: ["angst"], vocab: ["für die Prüfung lernen", "sınava çalışmak"] },
  { v: LX.anfangen, mid: () => "früher mit dem Lernen", tr: T.tv("çalışmaya başla"), trObj: () => "daha erken", results: ["stress", "angst"], vocab: ["mit etwas anfangen", "bir şeye başlamak"] },
  { v: LX.machen, mid: () => "mehr Sport", tr: T.tv("spor yap"), trObj: () => "daha çok", results: ["fit"], vocab: ["Sport machen", "spor yapmak"] },
  { v: LX.essen, mid: () => "nicht so viel Kuchen", tr: T.tv("kek ye"), trObj: () => "o kadar çok", neg: true, results: ["schlecht"], vocab: ["so viel", "o kadar çok"] },
  { v: LX.hoeren, mid: (d) => `auf ${d.det}e Eltern`, tr: T.tv("dinle"), trObj: (p) => T.possCase("aile", p, "acc"), results: ["lage"], vocab: ["auf jemanden hören", "birini dinlemek"] },
  { v: V_LOSFAHREN, mid: () => "rechtzeitig", tr: T.tv("yola çık"), trObj: () => "zamanında", results: ["stau"], vocab: ["losfahren", "yola çıkmak"] },
];

interface Result {
  /** finite verb (Konjunktiv II) and the rest of the clause; dative results replace the subject */
  de: (d: DeWho) => { fin: string; subj: string; rest: string[] };
  tr: (p: Person) => string;
  persons: string[];
}

const DAT_OF: Record<string, string> = { ich: "mir", du: "dir", wir: "uns", er: "ihm", sie: "ihr" };
const ME_YOU_US = ["ben", "sen", "biz"];
const ANYONE = ["ben", "sen", "biz", "o", "anne", "baba", "kardes", "arkadas", "ali", "ayse"];

const RESULTS: Record<string, Result> = {
  muede: { de: (d) => ({ fin: konj2(LX.sein, d.p), subj: d.s, rest: ["jetzt nicht so müde"] }), tr: (p) => `şimdi bu kadar yorgun ${wouldNot("ol", p)}`, persons: ANYONE },
  geld: { de: (d) => ({ fin: konj2(LX.haben, d.p), subj: d.s, rest: ["jetzt genug Geld für die Reise"] }), tr: (p) => `şimdi yolculuk için yeterli ${T.poss("para", p)} olurdu`, persons: ANYONE },
  kalt: { de: (d) => ({ fin: "wäre", subj: DAT_OF[d.s], rest: ["jetzt nicht so kalt"] }), tr: (p) => `şimdi bu kadar ${wouldNot("üşü", p)}`, persons: ["ben", "sen", "o"] },
  nass: { de: (d) => ({ fin: konj2(LX.sein, d.p), subj: d.s, rest: ["jetzt nicht so nass"] }), tr: (p) => `şimdi bu kadar ıslak ${wouldNot("ol", p)}`, persons: ANYONE },
  kopf: { de: (d) => ({ fin: konj2(LX.haben, d.p), subj: d.s, rest: ["jetzt keine Kopfschmerzen"] }), tr: (p) => `şimdi ${T.poss("baş", p)} ağrımazdı`, persons: ME_YOU_US },
  angst: { de: (d) => ({ fin: konj2(LX.haben, d.p), subj: d.s, rest: ["jetzt keine Angst vor den Ergebnissen"] }), tr: (p) => `şimdi sonuçlardan ${wouldNot("kork", p)}`, persons: ANYONE },
  stress: { de: (d) => ({ fin: konj2(LX.sein, d.p), subj: d.s, rest: ["jetzt nicht so gestresst"] }), tr: (p) => `şimdi bu kadar stresli ${wouldNot("ol", p)}`, persons: ANYONE },
  fit: { de: (d) => ({ fin: konj2(LX.sein, d.p), subj: d.s, rest: ["jetzt fitter"] }), tr: (p) => `şimdi daha formda ${T.aoristPast(T.tv("ol"), p)}`, persons: ANYONE },
  schlecht: { de: (d) => ({ fin: "wäre", subj: DAT_OF[d.s], rest: ["jetzt nicht so schlecht"] }), tr: (p) => `şimdi ${T.poss("mide", p)} bu kadar bulanmazdı`, persons: ["ben", "sen", "o"] },
  lage: { de: (d) => ({ fin: konj2(LX.sein, d.p), subj: d.s, rest: ["jetzt nicht in dieser Lage"] }), tr: (p) => `şimdi bu durumda ${wouldNot("ol", p)}`, persons: ["ben", "sen"] },
  stau: { de: (d) => ({ fin: konj2(LX.werden, d.p), subj: d.s, rest: ["jetzt nicht im Stau", "stehen"] }), tr: (p) => `şimdi trafikte ${wouldNot("bekle", p)}`, persons: ["biz"] },
};

const irrealMix = openTemplate(
  "c1-zor-irreal",
  "C1",
  "c1-konjunktiv",
  ["konj2-vergangen", "konjunktiv2"],
  "Karışık zaman: geçmişteki koşul (hätte/wäre + Partizip II), şimdiki sonuç (wäre/hätte/würde): Wenn ich gestern …, wäre ich jetzt …",
  (p): Generated => {
    const c = p.pick(CONDS);
    const res = RESULTS[p.pick(c.results)];
    const w = W(p.pick(res.persons));
    const de: string[] = [];
    for (const d of w.de) {
      // the person is named in the first clause and referred to with a pronoun in the second
      const pron = pronounOf(d);
      const aux = konj2(auxOf(c.v), d.p);
      const sub = (x: DeWho) => words(["wenn", x.s, c.mid(x), c.v.part2, aux]);
      const inv = words([aux, d.s, c.mid(d), c.v.part2]);
      const r1 = res.de(pron);
      const r2 = res.de(d);
      de.push(
        ...all(
          `{${sub(d)}|${capitalize(inv)}}, [dann ]${words([r1.fin, r1.subj, ...r1.rest])}.`,
          `${capitalize(words([r2.subj, r2.fin, ...r2.rest]))}, ${sub(pron)}.`,
        ),
      );
    }
    const d = w.de[0];
    const aux = konj2(auxOf(c.v), d.p);
    const r = res.de(pronounOf(d));
    const wrongAux = auxOf(c.v).praet[pi(d.p)];
    return {
      tr: joinTr([trNom(w), c.trObj(w.trP), `${T.condPast(c.tr, w.trP, c.neg)},`, res.tr(w.trP)]),
      de: unique(de),
      vocab: [["wenn …, wäre / hätte … jetzt", "-seydi, şimdi … -rdı"], c.vocab],
      focus: [
        focus("konj2-vergangen", `${c.v.part2} ${aux}`, [[`${c.v.part2} ${wrongAux}`, `Gerçekleşmemiş geçmiş koşul Plusquamperfekt değil, Konjunktiv II ile kurulur: ${c.v.part2} ${aux}.`]]),
        focus("nebensatz", `${r.fin} ${r.subj}`, [[`${r.subj} ${r.fin}`, `${ORDER_WHY}: …, ${r.fin} ${r.subj} …`]]),
      ],
    };
  },
);

// ---------- 3. als ob + Konjunktiv II ----------

type AlsFrame = "tun" | "aussehen" | "gucken" | "reden";

interface Als {
  /** "als ob …" and "als …" versions for a pronoun */
  de: (pron: DeWho) => [string, string];
  tr: (p: Person) => string;
  frames: AlsFrame[];
}

function k2Past(pron: DeWho, mid: string, part2: string, aux: "haben" | "sein"): [string, string] {
  const fin = konj2(aux === "sein" ? LX.sein : LX.haben, pron.p);
  return [words(["als ob", pron.s, mid, part2, fin]), words(["als", fin, pron.s, mid, part2])];
}

const ALS: Als[] = [
  { de: (d) => k2Past(d, "die Rechnung schon", "bezahlt", "haben"), tr: (p) => `hesabı çoktan ${T.evidential(T.tv("öde"), p)}`, frames: ["tun"] },
  { de: (d) => k2Past(d, "die ganze Nacht nicht", "geschlafen", "haben"), tr: (p) => `bütün gece ${T.evidential(T.tv("uyu"), p, true)}`, frames: ["aussehen"] },
  { de: (d) => k2Past(d, "einen Geist", "gesehen", "haben"), tr: (p) => `hayalet ${T.evidential(T.tv("gör"), p)}`, frames: ["gucken", "aussehen"] },
  { de: (d) => k2Past(d, "im Lotto", "gewonnen", "haben"), tr: (p) => `piyangoyu ${T.evidential(T.tv("kazan"), p)}`, frames: ["tun", "reden"] },
  { de: (d) => k2Past(d, "die Prüfung schon", "bestanden", "haben"), tr: (p) => `sınavı çoktan ${T.evidential(T.tv("geç"), p)}`, frames: ["tun"] },
  { de: (d) => k2Past(d, "nichts davon", "gewusst", "haben"), tr: (p) => `bundan hiç ${T.poss("haber", p)} yokmuş`, frames: ["tun"] },
  { de: (d) => k2Past(d, "gerade erst", "aufgestanden", "sein"), tr: (p) => `daha yeni ${T.evidential(T.tv("kalk"), p)}`, frames: ["aussehen"] },
  { de: (d) => [words(["als ob", d.s, "alles", WUESSTE[pi(d.p)]]), words(["als", WUESSTE[pi(d.p)], d.s, "alles"])], tr: (p) => `her şeyi ${T.presentEvid(T.tv("bil"), p)}`, frames: ["reden"] },
  { de: (d) => [words(["als ob", d.s, "der Chef", konj2(LX.sein, d.p)]), words(["als", konj2(LX.sein, d.p), d.s, "der Chef"])], tr: (p) => T.copulaEvid("patron", p), frames: ["tun", "reden"] },
  { de: () => ["als ob nichts passiert wäre", "als wäre nichts passiert"], tr: () => "hiçbir şey olmamış", frames: ["tun"] },
  { de: (d) => k2Past(d, "seit Tagen nichts", "gegessen", "haben"), tr: (p) => `günlerdir hiçbir şey ${T.evidential(T.tv("ye"), p, true)}`, frames: ["aussehen", "tun"] },
  { de: (d) => k2Past(d, "mich noch nie", "gesehen", "haben"), tr: (p) => `beni hiç ${T.evidential(T.tv("gör"), p, true)}`, frames: ["tun", "gucken"] },
  { de: (d) => k2Past(d, "die ganze Arbeit allein", "gemacht", "haben"), tr: (p) => `bütün işi tek başına ${T.evidential(T.tv("yap"), p)}`, frames: ["tun", "reden"] },
  { de: (d) => k2Past(d, "gerade einen Marathon", "gelaufen", "sein"), tr: (p) => `maraton ${T.evidential(T.tv("koş"), p)}`, frames: ["aussehen"] },
];

const ALS_FRAME: Record<AlsFrame, { de: (d: DeWho) => string; tr: T.TrVerb; vocab: [string, string] }> = {
  tun: { de: (d) => `${d.s} ${present(V_TUN, d.p)} so,`, tr: T.tv("davran"), vocab: ["so tun, als ob …", "… -mış gibi davranmak"] },
  aussehen: { de: (d) => `${d.s} ${present(V_AUSSEHEN, d.p)} aus,`, tr: T.tv("görün"), vocab: ["aussehen, als ob …", "… -mış gibi görünmek"] },
  gucken: { de: (d) => `${d.s} {${present(V_GUCKEN, d.p)}|${present(V_SCHAUEN, d.p)}},`, tr: T.tv("bak"), vocab: ["gucken, als ob …", "… -mış gibi bakmak"] },
  reden: { de: (d) => `${d.s} {${present(V_REDEN, d.p)}|${present(LX.sprechen, d.p)}},`, tr: T.tv("konuş"), vocab: ["reden, als ob …", "… -mış gibi konuşmak"] },
};

const alsOb = openTemplate(
  "c1-zor-als-ob",
  "C1",
  "c1-konjunktiv",
  ["als-ob", "konj2-vergangen"],
  "als ob / als + Konjunktiv II: Er tut so, als ob er nichts gewusst hätte / als hätte er nichts gewusst.",
  (p): Generated => {
    const item = p.pick(ALS);
    const frame = p.pick(item.frames);
    const w = p.pick([SEN, ...THIRD]);
    const f = ALS_FRAME[frame];
    const de: string[] = [];
    for (const d of w.de) {
      const pron = pronounOf(d);
      const [alsob, als] = item.de(pron);
      const head = f.de(d).replace(/^(\S+)/, (m) => capitalize(m));
      de.push(...all(`${head} {${alsob}|${als}}.`));
    }
    const [alsob0] = item.de(pronounOf(w.de[0]));
    const fin0 = alsob0.split(" ").pop()!;
    const indicative: Record<string, string> = { hätte: "hat", hättest: "hast", wäre: "ist", wärst: "bist", wüsste: "weiß", wüsstest: "weißt" };
    const fx = indicative[fin0]
      ? [focus("als-ob", alsob0, [[alsob0.replace(new RegExp(`${fin0}$`), indicative[fin0]), `als ob'dan sonra Konjunktiv II gelir: … ${fin0} (${indicative[fin0]} değil).`]])]
      : [];
    return {
      tr: joinTr([trNom(w), item.tr(w.trP), "gibi", T.present(f.tr, w.trP)]),
      de: unique(de),
      vocab: [f.vocab],
      focus: fx,
    };
  },
);

// ---------- 4. extended participial attributes: das von meinem Bruder gestern gekaufte Auto ----------

interface PObj {
  de: Noun;
  pl?: boolean;
  tr: string;
  verbs: { part2: string; tr: T.TrVerb }[];
  preds: [string, string][];
}

const P_OBJECTS: PObj[] = [
  { de: n("Auto", "n"), tr: "araba", verbs: [{ part2: "gekauft", tr: T.tv("al") }, { part2: "repariert", tr: T.tv("tamir et", "tamir ed") }], preds: [["ist schon wieder kaputt", "yine bozuldu"], ["verbraucht viel zu viel Benzin", "çok fazla benzin yakıyor"]] },
  { de: n("Wohnung", "f"), tr: "daire", verbs: [{ part2: "gemietet", tr: T.tv("kirala") }, { part2: "renoviert", tr: T.tv("yenile") }], preds: [["ist viel zu teuer", "çok pahalı"], ["liegt direkt am Bahnhof", "tam istasyonun yanında"]] },
  { de: n("Kuchen", "m"), tr: "kek", verbs: [{ part2: "gebacken", tr: T.tv("yap") }], preds: [["schmeckt fantastisch", "harika olmuş"], ["war in fünf Minuten weg", "beş dakikada bitti"]] },
  { de: n("Buch", "n"), tr: "kitap", verbs: [{ part2: "empfohlen", tr: T.tv("tavsiye et", "tavsiye ed") }, { part2: "geschrieben", tr: T.tv("yaz") }], preds: [["ist unglaublich spannend", "inanılmaz sürükleyici"], ["liegt immer noch ungelesen auf meinem Tisch", "hâlâ okunmadan masamda duruyor"]] },
  { de: n("Computer", "m"), tr: "bilgisayar", verbs: [{ part2: "repariert", tr: T.tv("tamir et", "tamir ed") }, { part2: "gekauft", tr: T.tv("al") }], preds: [["funktioniert schon wieder nicht", "yine çalışmıyor"]] },
  { de: n("Brief", "m"), tr: "mektup", verbs: [{ part2: "geschrieben", tr: T.tv("yaz") }, { part2: "geschickt", tr: T.tv("gönder") }], preds: [["ist nie angekommen", "hiç ulaşmadı"]] },
  { de: n("Jacke", "f"), tr: "ceket", verbs: [{ part2: "gekauft", tr: T.tv("al") }], preds: [["passt mir überhaupt nicht", "bana hiç olmuyor"]] },
  { de: n("Essen", "n"), tr: "yemek", verbs: [{ part2: "gekocht", tr: T.tv("pişir") }, { part2: "bestellt", tr: T.tv("sipariş et", "sipariş ed") }], preds: [["war total kalt", "buz gibiydi"], ["hat allen geschmeckt", "herkesin hoşuna gitti"]] },
  { de: n("Fotos", "n", "Fotos"), pl: true, tr: "fotoğraflar", verbs: [{ part2: "gemacht", tr: T.tv("çek") }], preds: [["sind wirklich wunderschön", "gerçekten çok güzel"], ["sind leider alle verwackelt", "maalesef hepsi bulanık"]] },
];

const AGENTS: { dat: string; nom: string; tr: string; pl?: boolean }[] = [
  { dat: "meinem Bruder", nom: "mein Bruder", tr: "kardeşimin" },
  { dat: "meiner Mutter", nom: "meine Mutter", tr: "annemin" },
  { dat: "unserem Nachbarn", nom: "unser Nachbar", tr: "komşumuzun" },
  { dat: "Ali", nom: "Ali", tr: "Ali'nin" },
  { dat: "meiner Chefin", nom: "meine Chefin", tr: "patronumun" },
  { dat: "meinen Eltern", nom: "meine Eltern", tr: "annemle babamın", pl: true },
];

const P_TIMES: ([string, string] | null)[] = [null, ["gestern", "dün"], ["letzte Woche", "geçen hafta"], ["vor zwei Tagen", "iki gün önce"]];

const partizip = openTemplate(
  "c1-zor-partizip",
  "C1",
  "c1-komplex",
  ["partizip-attr", "relativ"],
  "Uzun sıfat-fiil öbeği: artikel + (von wem, wann) + Partizip II + ek + isim: das von meinem Bruder gestern gekaufte Auto. İlgi cümlesi de olur.",
  (p): Generated => {
    const o = p.pick(P_OBJECTS);
    const verb = p.pick(o.verbs);
    const agent = p.pick(AGENTS);
    const time = p.pick(P_TIMES);
    const [pred, predTr] = p.pick(o.preds);
    const g = o.pl ? "pl" : o.de.g;
    const det = { m: "der", f: "die", n: "das", pl: "die" }[g];
    const rel = { m: "den", f: "die", n: "das", pl: "die" }[g];
    const noun = o.pl ? o.de.pl! : o.de.sg;
    const attr = `${verb.part2}${o.pl ? "en" : "e"}`;
    const t = time ? `${time[0]} ` : "";
    const has = agent.pl ? "haben" : "hat";
    const de = all(
      `${capitalize(det)} {von ${agent.dat} ${t}|${t}von ${agent.dat} }${attr} ${noun} ${pred}.`,
      `${capitalize(det)} ${noun}, ${rel} ${agent.nom} ${t}${verb.part2} ${has}, ${pred}.`,
    );
    const person: Person = agent.pl ? "3pl" : "3sg";
    return {
      tr: joinTr([agent.tr, time?.[1], T.dik(verb.tr, person), o.tr, predTr]),
      de,
      vocab: [[`${det} ${attr} ${noun}`, `… -dığı ${o.tr}`], [`${det} ${noun}`, o.tr]],
      focus: [
        focus("partizip-attr", `${attr} ${noun}`, [
          [`${verb.part2} ${noun}`, `İsimden önce sıfat gibi kullanılan Partizip II çekim eki alır: ${det} … ${attr} ${noun}.`],
          [`${verb.part2}${o.pl ? "e" : "es"} ${noun}`, `Belirli artikelden (${det}) sonra ek ${o.pl ? "-en" : "-e"} olur: ${attr} ${noun}.`],
        ]),
      ],
    };
  },
);

// ---------- 5. advanced connectors: es sei denn, ohne dass, indem, zumal ----------

const UNLESS_MAIN: { de: string; tr: string }[] = [
  { de: "Ich komme morgen nicht", tr: "yarın gelmeyeceğim" },
  { de: "Wir fahren am Wochenende nicht nach Berlin", tr: "hafta sonu Berlin'e gitmeyeceğiz" },
  { de: "Ich unterschreibe den Vertrag nicht", tr: "sözleşmeyi imzalamayacağım" },
  { de: "Ich gehe heute Abend nicht weg", tr: "bu akşam dışarı çıkmayacağım" },
  { de: "Wir verkaufen das Haus nicht", tr: "evi satmayacağız" },
];

const UNLESS_COND: { de: (d: DeWho) => DeClause; tr: (p: Person) => string }[] = [
  { de: (d) => clause(d, LX.abholen, ["mich vom Bahnhof"]), tr: () => `beni istasyondan ${T.madikca(T.tv("al"))}` },
  { de: (d) => clause(d, V_LEIHEN, [`mir ${d.det} Auto`]), tr: (p) => `bana ${T.possCase("araba", p, "acc")} ödünç ${T.madikca(T.tv("ver"))}` },
  { de: (d) => clause(d, LX.sagen, ["mir rechtzeitig Bescheid"]), tr: () => `bana zamanında haber ${T.madikca(T.tv("ver"))}` },
  { de: (d) => clause(d, V_MITKOMMEN, []), tr: () => `benimle ${T.madikca(T.tv("gel"))}` },
  { de: (d) => clause(d, LX.uebernehmen, ["die Kosten"]), tr: () => `masrafları ${T.madikca(T.tv("karşıla"))}` },
];

const SNEAK: { de: (d: DeWho) => DeClause; tr: (p: Person) => string }[] = [
  { de: (d) => clause(d, LX.verlassen, ["die Party"], "perf"), tr: (p) => `partiden ${T.past(T.tv("çık"), p)}` },
  { de: (d) => clause(d, LX.essen, ["das letzte Stück Kuchen"], "perf"), tr: (p) => `son kek dilimini ${T.past(T.tv("ye"), p)}` },
  { de: (d) => clause(d, LX.bezahlen, ["die ganze Rechnung"], "perf"), tr: (p) => `bütün hesabı ${T.past(T.tv("öde"), p)}` },
  { de: (d) => clause(d, LX.verlassen, ["das Büro früher"], "perf"), tr: (p) => `ofisten erken ${T.past(T.tv("çık"), p)}` },
  { de: (d) => clause(d, LX.lesen, ["meine Nachrichten"], "perf"), tr: (p) => `mesajlarımı ${T.past(T.tv("oku"), p)}` },
];

const INDEM: { benefit: { man: string; du: string; manV2: string; duV2: string; tr: string }; ways: { man: string; du: string; tr: string }[] }[] = [
  {
    benefit: { man: "kann man viel Geld sparen", du: "kannst du viel Geld sparen", manV2: "Man kann viel Geld sparen", duV2: "Du kannst viel Geld sparen", tr: "çok para biriktirebilirsin" },
    ways: [
      { man: "selbst kocht", du: "selbst kochst", tr: "kendin yemek yaparak" },
      { man: "mit dem Fahrrad zur Arbeit fährt", du: "mit dem Fahrrad zur Arbeit fährst", tr: "işe bisikletle giderek" },
      { man: "gebrauchte Sachen kauft", du: "gebrauchte Sachen kaufst", tr: "ikinci el eşya alarak" },
    ],
  },
  {
    benefit: { man: "bleibt man fit", du: "bleibst du fit", manV2: "Man bleibt fit", duV2: "Du bleibst fit", tr: "formda kalırsın" },
    ways: [
      { man: "jeden Tag zu Fuß geht", du: "jeden Tag zu Fuß gehst", tr: "her gün yürüyerek" },
      { man: "die Treppe statt des Aufzugs nimmt", du: "die Treppe statt des Aufzugs nimmst", tr: "asansör yerine merdiveni kullanarak" },
    ],
  },
  {
    benefit: { man: "lernt man schneller Deutsch", du: "lernst du schneller Deutsch", manV2: "Man lernt schneller Deutsch", duV2: "Du lernst schneller Deutsch", tr: "Almancayı daha hızlı öğrenirsin" },
    ways: [
      { man: "jeden Tag deutsche Serien guckt", du: "jeden Tag deutsche Serien guckst", tr: "her gün Almanca dizi izleyerek" },
      { man: "so viel wie möglich mit Deutschen spricht", du: "so viel wie möglich mit Deutschen sprichst", tr: "mümkün olduğunca Almanlarla konuşarak" },
    ],
  },
];

const ZUMAL_MAIN: { de: string; tr: string }[] = [
  { de: "Ich bleibe heute zu Hause", tr: "bugün evde kalıyorum" },
  { de: "Ich lehne das Angebot ab", tr: "teklifi reddediyorum" },
  { de: "Ich komme heute nicht mit", tr: "bugün sizinle gelmiyorum" },
  { de: "Wir verschieben die Reise", tr: "yolculuğu erteliyoruz" },
];

const ZUMAL_WHY: { sub: string; v2: string; tr: string }[] = [
  { sub: "es draußen in Strömen regnet", v2: "es regnet draußen in Strömen", tr: "dışarıda bardaktan boşanırcasına yağmur yağıyor" },
  { sub: "ich morgen früh aufstehen muss", v2: "ich muss morgen früh aufstehen", tr: "yarın erken kalkmam gerekiyor" },
  { sub: "ich sowieso kein Geld habe", v2: "ich habe sowieso kein Geld", tr: "zaten hiç param yok" },
  { sub: "ich mich nicht besonders wohl fühle", v2: "ich fühle mich nicht besonders wohl", tr: "kendimi pek iyi hissetmiyorum" },
];

const konnektor = openTemplate(
  "c1-zor-konnektor",
  "C1",
  "c1-konnektoren",
  ["konnektoren-c1", "nebensatz"],
  "es sei denn (+ ana cümle sırası), ohne dass, indem (-erek), zumal (hele ki): her biri yan cümle kurar; es sei denn'den sonra fiil 2. sırada kalır.",
  (p): Generated => {
    const kind = p.pick(["unless", "unless", "ohne", "indem", "zumal"] as const);
    if (kind === "unless") {
      const main = p.pick(UNLESS_MAIN);
      const cond = p.pick(UNLESS_COND);
      const w = p.pick(THIRD.filter((x) => !x.pron));
      const de: string[] = [];
      for (const d of w.de) {
        const c = cond.de(d);
        for (const v2 of mains(c)) de.push(...all(`${main.de}, es sei denn, ${v2}.`));
        for (const so of subs(c, "dass")) de.push(...all(`${main.de}, es sei denn, ${so}.`));
      }
      const c0 = cond.de(w.de[0]);
      return {
        tr: joinTr([w.tr, cond.tr(w.trP), main.tr]),
        de: unique(de),
        vocab: [["es sei denn, …", "… -medikçe, meğer ki"]],
        focus: [focus("konnektoren-c1", `es sei denn, ${v2Text(c0)}`, [[`es sei denn, ${subText(c0)}`, `es sei denn'den sonra ya fiil 2. sırada kalır (es sei denn, ${v2Text(c0)}) ya da dass gelir ve fiil sona gider.`]])],
      };
    }
    if (kind === "ohne") {
      const s = p.pick(SNEAK);
      const w = p.pick(THIRD);
      const de: string[] = [];
      const noticed = "{es jemand gemerkt hat|es jemand bemerkt hat|jemand etwas gemerkt hat|es einer gemerkt hat}";
      for (const d of w.de) {
        const c = s.de(d);
        for (const mo of mains(c)) de.push(...all(`${mo}, ohne dass ${noticed}.`));
        for (const mo of mains(c, `ohne dass ${noticed},`)) de.push(...all(`${mo}.`));
      }
      return {
        tr: joinTr([trNom(w) && `${trNom(w)},`, "kimse fark etmeden", s.tr(w.trP)]),
        de: unique(de),
        vocab: [["ohne dass …", "… -meden (başkası için)"], ["merken", "fark etmek"]],
        focus: [focus("konnektoren-c1", "ohne dass es jemand gemerkt hat", [["ohne dass es jemand hat gemerkt", "ohne dass yan cümle açar, çekimli fiil (hat) en sona gider: ohne dass es jemand gemerkt hat."]])],
      };
    }
    if (kind === "indem") {
      const b = p.pick(INDEM);
      const way = p.pick(b.ways);
      const de = all(
        `${b.benefit.manV2}, indem man ${way.man}.`,
        `${b.benefit.duV2}, indem du ${way.du}.`,
        `Indem man ${way.man}, ${b.benefit.man}.`,
        `Indem du ${way.du}, ${b.benefit.du}.`,
      );
      return {
        tr: joinTr([way.tr, b.benefit.tr]),
        de,
        vocab: [["indem …", "… -erek (yöntem)"]],
        focus: [focus("konnektoren-c1", `indem man ${way.man}`, [[`indem man ${way.man.split(" ").pop()} ${way.man.split(" ").slice(0, -1).join(" ")}`, "indem yan cümle açar, çekimli fiil en sona gider."]])],
      };
    }
    const main = p.pick(ZUMAL_MAIN);
    const why = p.pick(ZUMAL_WHY);
    return {
      tr: joinTr([`${main.tr},`, "hele ki", why.tr]),
      de: all(`${main.de}, {zumal ${why.sub}|vor allem weil ${why.sub}|vor allem, weil ${why.sub}}.`),
      vocab: [["zumal", "hele ki, üstelik"]],
      focus: [focus("konnektoren-c1", `zumal ${why.sub}`, [[`zumal ${why.v2}`, `zumal yan cümle açar, çekimli fiil en sona gider: zumal ${why.sub}.`]])],
    };
  },
);

// ---------- 6. passive substitutes: lässt sich …, ist … zu …, -bar ----------

type Mode = "easy" | "cannot" | "hardly" | "must" | "online";

const P_ITEMS: { nom: string; inf: string; zu: string; part2: string; bar?: string; tr: string; trGen: string; v: T.TrVerb; modes: Mode[] }[] = [
  { nom: "das Problem", inf: "lösen", zu: "zu lösen", part2: "gelöst", bar: "lösbar", tr: "bu sorun", trGen: "sorunun", v: T.tv("çözül"), modes: ["easy", "cannot", "must"] },
  { nom: "der Fehler", inf: "beheben", zu: "zu beheben", part2: "behoben", bar: "behebbar", tr: "bu hata", trGen: "hatanın", v: T.tv("düzeltil"), modes: ["easy", "cannot", "must"] },
  { nom: "der Schaden", inf: "reparieren", zu: "zu reparieren", part2: "repariert", bar: "reparierbar", tr: "bu hasar", trGen: "hasarın", v: T.tv("onarıl"), modes: ["easy", "cannot", "hardly"] },
  { nom: "die Rechnung", inf: "bezahlen", zu: "zu bezahlen", part2: "bezahlt", tr: "bu fatura", trGen: "faturanın", v: T.tv("öden"), modes: ["must", "online"] },
  { nom: "das Formular", inf: "ausfüllen", zu: "auszufüllen", part2: "ausgefüllt", tr: "bu form", trGen: "formun", v: T.tv("doldurul"), modes: ["must", "online"] },
  { nom: "die Tür", inf: "öffnen", zu: "zu öffnen", part2: "geöffnet", tr: "bu kapı", trGen: "kapının", v: T.tv("açıl"), modes: ["cannot"] },
  { nom: "der Text", inf: "übersetzen", zu: "zu übersetzen", part2: "übersetzt", bar: "übersetzbar", tr: "bu metin", trGen: "metnin", v: T.tv("çevril"), modes: ["hardly", "easy", "must"] },
  { nom: "die Entscheidung", inf: "rückgängig machen", zu: "rückgängig zu machen", part2: "rückgängig gemacht", tr: "bu karar", trGen: "kararın", v: T.tv("geri alın"), modes: ["cannot"] },
  { nom: "der Termin", inf: "verschieben", zu: "zu verschieben", part2: "verschoben", tr: "bu randevu", trGen: "randevunun", v: T.tv("ertelen"), modes: ["easy", "cannot", "must"] },
  { nom: "der Antrag", inf: "stellen", zu: "zu stellen", part2: "gestellt", tr: "bu başvuru", trGen: "başvurunun", v: T.tv("yapıl"), modes: ["online", "must"] },
  { nom: "die Heizung", inf: "reparieren", zu: "zu reparieren", part2: "repariert", bar: "reparierbar", tr: "bu kalorifer", trGen: "kaloriferin", v: T.tv("tamir edil"), modes: ["easy", "cannot", "must"] },
  { nom: "die Frage", inf: "beantworten", zu: "zu beantworten", part2: "beantwortet", bar: "beantwortbar", tr: "bu soru", trGen: "sorunun", v: T.tv("cevaplan"), modes: ["easy", "hardly", "must"] },
  { nom: "der Vertrag", inf: "kündigen", zu: "zu kündigen", part2: "gekündigt", bar: "kündbar", tr: "bu sözleşme", trGen: "sözleşmenin", v: T.tv("feshedil"), modes: ["easy", "online", "must"] },
  { nom: "das Fenster", inf: "öffnen", zu: "zu öffnen", part2: "geöffnet", tr: "bu pencere", trGen: "pencerenin", v: T.tv("açıl"), modes: ["cannot", "easy"] },
  { nom: "der Fleck", inf: "entfernen", zu: "zu entfernen", part2: "entfernt", bar: "entfernbar", tr: "bu leke", trGen: "lekenin", v: T.tv("çıkarıl"), modes: ["easy", "cannot", "hardly"] },
];

const MUST_WHEN: [string, string][] = [
  ["bis Freitag", "cumaya kadar"],
  ["bis Ende des Monats", "ay sonuna kadar"],
  ["innerhalb von zwei Wochen", "iki hafta içinde"],
  ["sofort", "hemen"],
];

const passiversatz = openTemplate(
  "c1-zor-passiversatz",
  "C1",
  "c1-passiversatz",
  ["passiversatz", "passiv-modal"],
  "Edilgen yerine: X lässt sich leicht lösen = X ist leicht zu lösen = X kann leicht gelöst werden = X ist leicht lösbar. Zorunluluk: X ist bis Freitag zu bezahlen.",
  (p): Generated => {
    const it = p.pick(P_ITEMS);
    const mode = p.pick(it.modes);
    const Nom = capitalize(it.nom);
    const able = T.ability(it.v, "3sg");
    const cannot = T.aorist(T.tv(able.slice(0, -5)), "3sg", true);
    if (mode === "must") {
      const [t, tTr] = p.pick(MUST_WHEN);
      return {
        tr: joinTr([it.trGen, tTr, T.poss(T.verbNoun(it.v), "3sg"), "gerekiyor"]),
        de: all(`${Nom} ist ${t} ${it.zu}.`, `${Nom} muss ${t} ${it.part2} werden.`),
        vocab: [["sein + zu + Infinitiv", "-mesi gerekiyor (resmî)"], [it.nom, it.tr.replace("bu ", "")]],
        focus: [
          focus("passiversatz", it.zu, [
            [it.zu === `zu ${it.inf}` ? it.inf : `zu ${it.inf}`, `sein + zu + mastar: ${it.zu} (ayrılabilen fiilde zu araya girer).`],
          ]),
        ],
      };
    }
    const easy = p.pick([
      ["leicht", "kolayca"],
      ["problemlos", "sorunsuzca"],
      ["schnell", "hızlıca"],
    ] as const);
    const cannot2 = p.pick([
      ["nicht", ""],
      ["nicht mehr", "artık"],
    ] as const);
    const adv = { easy, cannot: it.nom === "die Entscheidung" ? (["nicht mehr", "artık"] as const) : cannot2, hardly: ["kaum", "neredeyse"], online: ["auch online", "internetten de"] }[mode] as readonly [string, string];
    const de =
      mode === "online"
        ? all(`${Nom} lässt sich ${adv[0]} ${it.inf}.`, `${Nom} kann ${adv[0]} ${it.part2} werden.`)
        : all(
            `${Nom} lässt sich ${adv[0]} ${it.inf}.`,
            `${Nom} ist ${adv[0]} ${it.zu}.`,
            `${Nom} kann ${adv[0]} ${it.part2} werden.`,
            ...(it.bar ? [`${Nom} ist ${adv[0]} ${it.bar}.`] : []),
          );
    const trPred = mode === "easy" || mode === "online" ? able : cannot;
    return {
      tr: joinTr([it.tr, adv[1], trPred]),
      de,
      vocab: [["sich lassen + Infinitiv", "-ebilir (edilgen anlam)"], [it.nom, it.tr.replace("bu ", "")]],
      focus: [focus("passiversatz", `lässt sich ${adv[0]} ${it.inf}`, [[`lässt ${adv[0]} ${it.inf}`, "Bu yapıda dönüşlü zamir şart: X lässt sich … + mastar (= edilebilir)."]])],
    };
  },
);

// ---------- 7. assumptions: muss … verpasst haben, dürfte, wird … haben ----------

const GUESS_IDS = ["otobus-kacir", "uyuyakal", "eve-git", "gec-calis", "sinema", "doktor", "gec-kal", "arkadas-bulus", "ara", "evde-kal"];
const LATE = ["otobus-kacir", "uyuyakal", "gec-calis", "doktor"];

const vermutung = openTemplate(
  "c1-zor-vermutung",
  "C1",
  "c1-vermutung",
  ["vermutung", "perfekt"],
  "Geçmişe dair tahmin: modal + Partizip II + haben/sein: Er muss den Bus verpasst haben (-miş olmalı), Er könnte … haben (-miş olabilir), Er wird … haben (-mıştır).",
  (p): Generated => {
    const e = E(p.pick(GUESS_IDS));
    const w = p.pick(THIRD.filter((x) => fitsWho(e, x)));
    const mode = p.pick(["must", "must", "may", "probably", "cannot"] as const);
    const auxInf = e.v.aux === "sein" ? "sein" : "haben";
    const late = LATE.includes(e.id) && mode === "must" && p.pick([true, false]);
    const reason = mode === "must" && !late && p.pick([true, false]);
    const de: string[] = [];
    for (const d of w.de) {
      const pron = pronounOf(d);
      for (const mid of deMids(e, d)) {
        const tail = (who: DeWho) => words([reflOf(e, who.p), mid, e.v.part2, auxInf]);
        const v2 = (modal: string, who: DeWho) => words([who.s, modal, tail(who)]);
        if (mode === "must") {
          if (late) de.push(...all(`${capitalize(v2("muss", d))}, sonst wäre ${pron.s} {längst|schon längst} {hier|da}.`));
          else if (reason)
            de.push(
              ...all(
                `{Da|Weil} ${d.s} nicht ans Telefon geht, muss ${pron.s} ${tail(pron)}.`,
                `${capitalize(v2("muss", d))}, {da|weil} ${pron.s} nicht ans Telefon geht.`,
              ),
            );
          else de.push(...all(`${capitalize(v2("muss", d))}.`));
        } else if (mode === "may") {
          de.push(...all(`${capitalize(v2("könnte", d))}.`, `${capitalize(v2("kann", d))}.`, `{Vielleicht|Möglicherweise} ${present(auxOf(e.v), d.p)} ${d.s} ${words([reflOf(e, d.p), mid, e.v.part2])}.`));
        } else if (mode === "probably") {
          de.push(...all(`${capitalize(v2("dürfte", d))}.`, `${capitalize(v2("wird", d))}.`, `${capitalize(d.s)} wird wohl ${tail(d)}.`, `Wahrscheinlich ${present(auxOf(e.v), d.p)} ${d.s} ${words([reflOf(e, d.p), mid, e.v.part2])}.`));
        }
      }
      if (mode === "cannot") {
        // "nicht" goes where negation normally stands (den Bus nicht / nicht nach Hause)
        for (const negMid of deMids(e, d, true)) de.push(...all(`${capitalize(d.s)} kann ${words([reflOf(e, d.p), negMid])} ${e.v.part2} ${auxInf}.`));
        for (const mid of deMids(e, d)) de.push(...all(`${capitalize(d.s)} kann unmöglich ${words([reflOf(e, d.p), mid, e.v.part2, auxInf])}.`));
      }
    }
    const evid = trEvent(e, "3sg", "evid");
    const h = T.h4(evid);
    const tr =
      mode === "must"
        ? late
          ? joinTr([trNom(w), `${evid} olmalı,`, "yoksa çoktan burada olurdu"])
          : reason
            ? joinTr(["telefonu açmadığına göre", trNom(w), evid, "olmalı"])
            : joinTr([trNom(w), evid, "olmalı"])
        : mode === "may"
          ? joinTr([trNom(w), evid, "olabilir"])
          : mode === "probably"
            ? joinTr([trNom(w), "büyük ihtimalle", `${evid}t${h}r`])
            : joinTr([trNom(w), evid, "olamaz"]);
    const other = auxInf === "sein" ? "haben" : "sein";
    return {
      tr,
      de: unique(de),
      vocab: [[mode === "must" ? "muss … gemacht haben" : mode === "may" ? "könnte … gemacht haben" : mode === "probably" ? "dürfte / wird … gemacht haben" : "kann nicht … gemacht haben", mode === "must" ? "-miş olmalı" : mode === "may" ? "-miş olabilir" : mode === "probably" ? "büyük ihtimalle -mıştır" : "-miş olamaz"], e.vocab],
      focus: [
        focus("vermutung", `${e.v.part2} ${auxInf}`, [
          [`${e.v.part2} ${other}`, `${e.v.inf} Perfekt'i ${auxInf} ile kurar; tahminde de öyle: … ${e.v.part2} ${auxInf}.`],
          [`${e.v.inf} ${auxInf}`, `Geçmişe dair tahminde Partizip II gerekir: … ${e.v.part2} ${auxInf}.`],
        ]),
      ],
    };
  },
);

// ---------- 8. idioms inside complex sentences ----------

const NEWS: { de: (d: DeWho) => string; tr: (p: Person) => string }[] = [
  { de: (d) => `${d.s} nach Kanada ausgewandert ${present(LX.sein, d.p)}`, tr: (p) => `Kanada'ya ${T.partCase(T.dik(T.tv("göç et", "göç ed"), p), p, "acc")}` },
  { de: (d) => `${d.s} heimlich geheiratet ${present(LX.haben, d.p)}`, tr: (p) => `gizlice ${T.partCase(T.dik(T.tv("evlen"), p), p, "acc")}` },
  { de: (d) => `${d.s} ${d.det === "ihr" ? "ihren" : `${d.det}en`} Job gekündigt ${present(LX.haben, d.p)}`, tr: (p) => `işinden ${T.partCase(T.dik(T.tv("istifa et", "istifa ed"), p), p, "acc")}` },
  { de: (d) => `${d.s} ${d.det} Haus verkauft ${present(LX.haben, d.p)}`, tr: (p) => `${T.possCase("ev", p, "acc")} ${T.partCase(T.dik(T.tv("sat"), p), p, "acc")}` },
  { de: (d) => `${d.s} im Lotto gewonnen ${present(LX.haben, d.p)}`, tr: (p) => `piyangoyu ${T.partCase(T.dik(T.tv("kazan"), p), p, "acc")}` },
];

const GOOD: { perf: (d: DeWho) => string; pres: string; tr: (p: Person) => string; trWish: string }[] = [
  { perf: (d) => `${d.s} die Prüfung bestanden ${present(LX.haben, d.p)}`, pres: "die Prüfung bestehst", tr: (p) => `sınavı ${T.partCase(T.dik(T.tv("geç"), p), p, "acc")}`, trWish: "sınavı geçmen" },
  { perf: (d) => `${d.s} gut angekommen ${present(LX.sein, d.p)}`, pres: "gut ankommst", tr: (p) => `sağ salim ${T.partCase(T.dik(T.tv("var"), p), p, "acc")}`, trWish: "sağ salim varman" },
  { perf: (d) => `${d.s} die Stelle bekommen ${present(LX.haben, d.p)}`, pres: "die Stelle bekommst", tr: (p) => `işe ${T.partCase(T.dik(T.tv("kabul edil"), p), p, "acc")}`, trWish: "işe kabul edilmen" },
  { perf: (d) => `${d.s} die Operation gut überstanden ${present(LX.haben, d.p)}`, pres: "die Operation gut überstehst", tr: (p) => `ameliyatı iyi ${T.partCase(T.dik(T.tv("atlat"), p), p, "acc")}`, trWish: "ameliyatı iyi atlatman" },
];

const BOASTS: { de: (pron: DeWho) => string; tr: string }[] = [
  { de: (d) => `${d.s} schon dreimal in Amerika gewesen ${present(LX.sein, d.p)}`, tr: "üç kez Amerika'da bulunduğunu" },
  { de: (d) => `${d.s} den Bürgermeister persönlich kennt`, tr: "belediye başkanını şahsen tanıdığını" },
  { de: (d) => `${d.s} fünf Sprachen fließend spricht`, tr: "beş dili akıcı konuştuğunu" },
  { de: (d) => `${d.s} früher Profifußballer gewesen ${present(LX.sein, d.p)}`, tr: "eskiden profesyonel futbolcu olduğunu" },
];

const ASKED: { akk: string; tr: string; g: "m" | "f" }[] = [
  { akk: "meinen Chef", tr: "patronuma", g: "m" },
  { akk: "Ayşe", tr: "Ayşe'ye", g: "f" },
  { akk: "unsere Nachbarin", tr: "komşumuza", g: "f" },
  { akk: "meinen Onkel", tr: "amcama", g: "m" },
  { akk: "die neue Kollegin", tr: "yeni iş arkadaşımıza", g: "f" },
];

const TOPICS_ASK: { de: (g: "m" | "f") => string; tr: string }[] = [
  { de: (g) => `nach ${g === "m" ? "seinem" : "ihrem"} Alter`, tr: "yaşını" },
  { de: (g) => `nach ${g === "m" ? "seinem" : "ihrem"} Gehalt`, tr: "maaşını" },
  { de: (g) => `nach ${g === "m" ? "seiner Ex-Freundin" : "ihrem Ex-Freund"}`, tr: "eski sevgilisini" },
];

const deyim = openTemplate(
  "c1-zor-deyim",
  "C1",
  "c1-redewendungen",
  ["redewendung", "nebensatz"],
  "Deyimler uzun cümle içinde: aus allen Wolken fallen, ein Stein fällt vom Herzen, die Daumen drücken, einen Bären aufbinden, ins Fettnäpfchen treten.",
  (p): Generated => {
    const kind = p.pick(["wolken", "stein", "daumen", "baer", "fett"] as const);
    if (kind === "wolken") {
      const x = p.pick(THIRD.filter((w) => !w.pron));
      const y = p.pick(THIRD.filter((w) => w.id !== x.id));
      const news = p.pick(NEWS);
      const de: string[] = [];
      for (const dx of x.de) {
        const px = pronounOf(dx);
        for (const dy of y.de) {
          const dass = `dass ${news.de(dy)}`;
          de.push(
            ...all(
              `${capitalize(dx.s)} ist aus allen Wolken gefallen, als ${px.s} {erfahren hat|gehört hat}, ${dass}.`,
              `Als ${dx.s} {erfahren hat|erfuhr}, ${dass}, ist ${px.s} aus allen Wolken gefallen.`,
              `Als ${dx.s} erfuhr, ${dass}, fiel ${px.s} aus allen Wolken.`,
            ),
          );
        }
      }
      return {
        tr: joinTr([`${x.tr},`, trGen(y), news.tr(y.trP), "öğrendiğinde şok oldu"]),
        de: unique(de),
        vocab: [["aus allen Wolken fallen", "şok olmak, donakalmak"], ["erfahren", "öğrenmek, haber almak"]],
        focus: [focus("nebensatz", "ist aus allen Wolken gefallen", [["hat aus allen Wolken gefallen", "fallen Perfekt'te sein ile kurulur: ist aus allen Wolken gefallen."]])],
      };
    }
    if (kind === "stein") {
      const y = p.pick(THIRD);
      const g = p.pick(GOOD);
      const de: string[] = [];
      for (const dy of y.de) {
        const dass = `dass ${g.perf(dy)}`;
        de.push(
          ...all(
            `Mir ist ein Stein vom Herzen gefallen, als ich gehört habe, ${dass}.`,
            `Als ich gehört habe, ${dass}, ist mir ein Stein vom Herzen gefallen.`,
            `Als ich hörte, ${dass}, fiel mir ein Stein vom Herzen.`,
          ),
        );
      }
      return {
        tr: joinTr([trGen(y), g.tr(y.trP), "duyunca içim rahatladı"]),
        de: unique(de),
        vocab: [["Mir fällt ein Stein vom Herzen.", "içim rahatladı"]],
        focus: [focus("redewendung", "Mir ist ein Stein vom Herzen gefallen", [["Ich bin ein Stein vom Herzen gefallen", "Bu deyimde kişi Dativ'dir: Mir ist ein Stein vom Herzen gefallen."]])],
      };
    }
    if (kind === "daumen") {
      const g = p.pick(GOOD);
      return {
        tr: joinTr([g.trWish, "için sana şans diliyorum"]),
        de: all(`Ich drücke dir die Daumen, dass du ${g.pres}.`, `Ich drück dir die Daumen, dass du ${g.pres}.`),
        vocab: [["jemandem die Daumen drücken", "birine şans dilemek"]],
        focus: [focus("redewendung", "drücke dir die Daumen", [["drücke dich die Daumen", "drücken + Dativ: jemandem (dir) die Daumen drücken."]])],
      };
    }
    if (kind === "baer") {
      const x = p.pick(THIRD.filter((w) => !w.pron));
      const b = p.pick(BOASTS);
      const de: string[] = [];
      for (const dx of x.de) {
        const px = pronounOf(dx);
        de.push(
          ...all(
            `${capitalize(dx.s)} hat mir einen Bären aufgebunden, als ${px.s} {behauptet hat|erzählt hat}, dass ${b.de(px)}.`,
            `Als ${dx.s} behauptet hat, dass ${b.de(px)}, hat ${px.s} mir einen Bären aufgebunden.`,
          ),
        );
      }
      return {
        tr: joinTr([`${x.tr},`, b.tr, "iddia ettiğinde bana resmen palavra attı"]),
        de: unique(de),
        vocab: [["jemandem einen Bären aufbinden", "birine palavra atmak"], ["behaupten", "iddia etmek"]],
        focus: [focus("redewendung", "einen Bären aufgebunden", [["einen Bären aufbindet", "Perfekt'te Partizip II: hat mir einen Bären aufgebunden."]])],
      };
    }
    const x = p.pick(THIRD.filter((w) => !w.pron));
    const asked = p.pick(ASKED);
    const topic = p.pick(TOPICS_ASK);
    const de: string[] = [];
    for (const dx of x.de) {
      const px = pronounOf(dx);
      de.push(
        ...all(
          `${capitalize(dx.s)} ist [voll|total] ins Fettnäpfchen getreten, als ${px.s} ${asked.akk} ${topic.de(asked.g)} gefragt hat.`,
          `Als ${dx.s} ${asked.akk} ${topic.de(asked.g)} gefragt hat, ist ${px.s} [voll|total] ins Fettnäpfchen getreten.`,
        ),
      );
    }
    return {
      tr: joinTr([`${x.tr},`, asked.tr, topic.tr, "sorduğunda resmen pot kırdı"]),
      de: unique(de),
      vocab: [["ins Fettnäpfchen treten", "pot kırmak"], ["jemanden nach etwas fragen", "birine bir şeyi sormak"]],
      focus: [focus("redewendung", asked.akk, asked.g === "m" ? [[asked.akk.replace(/en /, "em "), "fragen Akkusativ ister: jemanden (meinen Chef) nach etwas fragen."]] : [])],
    };
  },
);

// ---------- 9. modal particles in complex sentences ----------

const REPROACH: { pre?: string; mid: string; inf: string; tr: string; v: T.TrVerb }[] = [
  { pre: "mir", mid: "Bescheid", inf: "sagen", tr: "bana haber", v: T.tv("ver") },
  { mid: "kurz", inf: "anrufen", tr: "bir telefon", v: T.tv("et", "ed") },
  { pre: "mir", mid: "eine Nachricht", inf: "schreiben", tr: "bana bir mesaj", v: T.tv("at") },
  { mid: "das Geschirr", inf: "spülen", tr: "bulaşıkları", v: T.tv("yıka") },
  { mid: "die Tür", inf: "abschließen", tr: "kapıyı", v: T.tv("kilitle") },
  { pre: "dich", mid: "", inf: "entschuldigen", tr: "özür", v: T.tv("dile") },
  { mid: "den Müll", inf: "rausbringen", tr: "çöpü", v: T.tv("çıkar") },
  { mid: "vorher", inf: "fragen", tr: "önceden", v: T.tv("sor") },
  { mid: "die Heizung", inf: "ausmachen", tr: "kaloriferi", v: T.tv("kapat") },
  { mid: "einen Regenschirm", inf: "mitnehmen", tr: "bir şemsiye", v: T.tv("al") },
  { pre: "mir", mid: "eine Postkarte", inf: "schicken", tr: "bana bir kartpostal", v: T.tv("gönder") },
];

const TOLD: { mid: (pl: boolean) => string; inf: string; tr: (pl: boolean) => string; v: T.TrVerb; neg?: boolean }[] = [
  { mid: () => "früh", inf: "aufstehen", tr: () => "erken", v: T.tv("kalk") },
  { mid: () => "eine Jacke", inf: "anziehen", tr: () => "ceket", v: T.tv("giy") },
  { mid: () => "für die Prüfung", inf: "lernen", tr: () => "sınava", v: T.tv("çalış") },
  { mid: () => "den Schirm", inf: "mitnehmen", tr: (pl) => (pl ? "şemsiyeyi yanınıza" : "şemsiyeyi yanına"), v: T.tv("al") },
  { mid: () => "nicht so viel Geld", inf: "ausgeben", tr: () => "bu kadar çok para", v: T.tv("harca"), neg: true },
  { mid: () => "den Müll", inf: "rausbringen", tr: () => "çöpü", v: T.tv("çıkar") },
  { mid: () => "mich", inf: "anrufen", tr: () => "beni", v: T.tv("ara") },
  { mid: () => "nicht so spät", inf: "nach Hause kommen", tr: () => "eve bu kadar geç", v: T.tv("gel"), neg: true },
  { mid: () => "die Tür", inf: "abschließen", tr: () => "kapıyı", v: T.tv("kilitle") },
  { mid: (pl) => (pl ? "eure Handys" : "dein Handy"), inf: "aufladen", tr: (pl) => (pl ? "telefonlarınızı" : "telefonunu"), v: T.tv("şarj et", "şarj ed") },
];

const HALT_PEOPLE: { akk: string; trAcc: string; trDat: string }[] = [
  { akk: "deine Mutter", trAcc: "anneni", trDat: "annene" },
  { akk: "deinen Bruder", trAcc: "kardeşini", trDat: "kardeşine" },
  { akk: "deinen Chef", trAcc: "patronunu", trDat: "patronuna" },
  { akk: "deine Schwester", trAcc: "kız kardeşini", trDat: "kız kardeşine" },
  { akk: "den Arzt", trAcc: "doktoru", trDat: "doktora" },
];

const partikel = openTemplate(
  "c1-zor-partikel",
  "C1",
  "c1-partikeln",
  ["partikeln", "konj2-vergangen"],
  "Sitem ve öğütte parçacıklar: Du hättest ja wenigstens … können! / Ich hab dir doch gesagt, dass … / Frag halt deinen Bruder, wenn …",
  (p): Generated => {
    const kind = p.pick(["bari", "bari", "doch", "halt"] as const);
    if (kind === "bari") {
      const r = p.pick(REPROACH);
      const pl = p.pick([false, false, true]);
      const tail = words([r.mid, r.inf, "können"]);
      const subj = pl ? "Ihr hättet" : "Du hättest";
      const pre = r.pre === "dich" && pl ? "euch" : r.pre;
      const de = pre
        ? all(`${subj} ${pre} {ja wenigstens|doch wenigstens|wenigstens} ${tail}!`)
        : all(`${subj} {ja wenigstens|doch wenigstens|wenigstens} ${tail}!`, ...(/^(das|die|den) /.test(r.mid) ? [`${subj} ${r.mid} {ja wenigstens|doch wenigstens} ${r.inf} können!`] : []));
      return {
        tr: joinTr(["bari", r.tr, T.abilityPast(r.v, pl ? "2pl" : "2sg")], "!"),
        de,
        vocab: [["Du hättest ja wenigstens … können!", "bari … -ebilirdin!"], ["ja / doch", "sitem tonu katar"]],
        focus: [
          focus("konj2-vergangen", `${r.inf} können`, [
            [`können ${r.inf}`, `Çift mastarda modal fiil en sona gider: … ${r.inf} können.`],
            [`${r.inf} gekonnt`, `hätte + iki mastar: … ${r.inf} können (gekonnt değil).`],
          ]),
        ],
      };
    }
    if (kind === "doch") {
      const t = p.pick(TOLD);
      const pl = p.pick([false, false, true]);
      const person: Person = pl ? "2pl" : "2sg";
      const vn = T.possCase(T.verbNoun(t.v, t.neg), person, "acc");
      const obj = t.tr(pl);
      const what = words([t.mid(pl), t.inf]);
      const [dir, du, sollst] = pl ? ["euch", "ihr", "sollt"] : ["dir", "du", "sollst"];
      return {
        tr: joinTr([pl ? "size" : "sana", obj, vn, "söylemiştim ya"], "!"),
        de: all(`Ich {habe|hab} ${dir} doch gesagt, {dass ${du} ${what} ${sollst}|${du} ${sollst} ${what}}!`),
        vocab: [["Ich hab dir doch gesagt, …", "sana … söylemiştim ya"], ["doch", "(sitem) ya, işte"]],
        focus: [focus("nebensatz", `${what} ${sollst}`, [[`${sollst} ${what}`, `dass'lı yan cümlede çekimli fiil (${sollst}) en sona gider: dass ${du} ${what} ${sollst}.`]])],
      };
    }
    const who = p.pick(HALT_PEOPLE);
    if (p.pick([true, false])) {
      return {
        tr: joinTr(["bu kadar endişeleniyorsan", who.trAcc, "ara işte"], "!"),
        de: all(
          `{Dann |}ruf halt ${who.akk} an, wenn du dir solche Sorgen machst!`,
          `Ruf doch einfach ${who.akk} an, wenn du dir solche Sorgen machst!`,
          `Wenn du dir solche Sorgen machst, ruf halt ${who.akk} an!`,
          `Wenn du dir solche Sorgen machst, dann ruf doch einfach ${who.akk} an!`,
        ),
        vocab: [["halt", "(öğüt) işte, artık"], ["sich Sorgen machen", "endişelenmek"]],
        focus: [focus("trennbar", `${who.akk} an`, [], "anrufen ayrılabilen fiildir: emir cümlesinde an sona gider (Ruf … an!).")],
      };
    }
    return {
      tr: joinTr(["bilmiyorsan", who.trDat, "sor işte"], "!"),
      de: all(`{Dann |}frag halt ${who.akk}, wenn du es nicht weißt!`, `Frag doch einfach ${who.akk}, wenn du es nicht weißt!`, `Wenn du es nicht weißt, frag halt ${who.akk}!`),
      vocab: [["halt", "(öğüt) işte, artık"], ["jemanden fragen", "birine sormak (Akkusativ)"]],
      focus: who.akk.startsWith("deinen") ? [focus("akkusativ", who.akk, [[who.akk.replace("deinen", "deinem"), "fragen Akkusativ ister: jemanden fragen (deinen Bruder)."]])] : [],
    };
  },
);

export const OPEN_C1 = [doppelInf, irrealMix, alsOb, partizip, konnektor, passiversatz, vermutung, deyim, partikel];

