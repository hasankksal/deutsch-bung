import { present, REFLEXIVE, sentence, V, type Person, type Verb } from "../grammar/de";
import { past, present as trPresent, trSentence, tv, type TrVerb } from "../grammar/tr";
import type { Focus } from "../types";
import { focus, listTemplate, SUBJ, type Subj, type Template } from "./engine";

// ---------- complex sentences: subordinate clause + main clause ----------

interface Sub {
  s: string;
  mid: string;
  fin: string;
}
interface Main {
  s: string;
  fin: string;
  mid?: string;
  end?: string;
}
interface Group {
  subs: Sub[];
  mains: Main[];
}

const subText = (conj: string, x: Sub) => [conj, x.s, x.mid, x.fin].filter(Boolean).join(" ");

/** Both clause orders for every combination, plus the two classic word-order focus spots. */
function complex(conj: string, groups: Group[], rule: string, mainFirst = true): { de: string[]; focus: Focus[] } {
  const de: string[] = [];
  for (const g of groups) {
    for (const sub of g.subs) {
      for (const m of g.mains) {
        de.push(sentence([`${subText(conj, sub)},`, m.fin, m.s, m.mid, m.end]));
        if (mainFirst) de.push(sentence([m.s, m.fin, m.mid, m.end, `, ${subText(conj.toLowerCase(), sub)}`]));
      }
    }
  }
  const sub = groups[0].subs[0];
  const m = groups[0].mains[0];
  const vf = [sub.mid, sub.fin].filter(Boolean).join(" ");
  const wrongV2 = [sub.fin, sub.mid].filter(Boolean).join(" ");
  return {
    de,
    focus: [
      focus(rule, vf, sub.mid ? [[`${sub.s} ${wrongV2}`, `${conj} yan cümle açar, çekimli fiil en sona gider: ${subText(conj, sub)}.`]] : []),
      focus(rule, `${m.fin} ${m.s}`, [
        [`${m.s} ${m.fin}`, `Yan cümle başta olduğu için ana cümle çekimli fiille başlar: …, ${m.fin} ${m.s} …`],
      ]),
    ],
  };
}

const gendered = (build: (s: string) => Group): Group[] => [build("er"), build("sie")];

interface CxItem {
  tr: string;
  conj: string;
  groups: Group[];
  vocab?: [string, string][];
  /** Extra accepted sentences the builder cannot produce (e.g. "freut sich mein Hund") */
  extra?: string[];
  /** Other ways to open the clause, accepted with the clause first ("Immer wenn …, …") */
  conjAlt?: string[];
  /** Correct translations without the clause ("Vor dem Essen …"), accepted but never shown as the model answer */
  also?: string[];
}

function cxTemplate(id: string, topicId: string, rules: string[], hint: string, items: CxItem[]): Template {
  return {
    id,
    level: "B1",
    topicId,
    rules,
    hint,
    make(p) {
      const item = p.pick(items);
      const cx = complex(item.conj, item.groups, rules[0]);
      const alt = (item.conjAlt ?? []).flatMap((c) => complex(c, item.groups, rules[0], false).de);
      return { tr: item.tr, de: [...(item.extra ?? []), ...cx.de, ...alt, ...(item.also ?? [])], vocab: item.vocab, focus: cx.focus };
    },
  };
}

const obwohl = cxTemplate("b1-obwohl", "b1-nebensatz", ["obwohl", "nebensatz"], "obwohl'lu yan cümlede fiil sona gider; yan cümle başta ise ana cümle fiille başlar.", [
  {
    tr: "Hasta olmasına rağmen işe gitti.",
    conj: "Obwohl",
    groups: gendered((s) => ({
      subs: [{ s, mid: "krank", fin: "war" }],
      mains: [
        { fin: "ist", s, mid: "zur Arbeit", end: "gegangen" },
        { fin: "ging", s, mid: "zur Arbeit" },
        { fin: "ist", s, mid: "zur Arbeit", end: "gefahren" },
        { fin: "fuhr", s, mid: "zur Arbeit" },
      ],
    })),
    vocab: [["obwohl", "-e rağmen"], ["krank", "hasta"]],
  },
  {
    tr: "Yorgun olmama rağmen ders çalıştım.",
    conj: "Obwohl",
    groups: [{ subs: [{ s: "ich", mid: "müde", fin: "war" }], mains: [{ fin: "habe", s: "ich", end: "gelernt" }, { fin: "lernte", s: "ich" }] }],
    vocab: [["obwohl", "-e rağmen"], ["müde", "yorgun"]],
  },
  {
    tr: "Yağmur yağmasına rağmen yürüyüşe çıktık.",
    conj: "Obwohl",
    groups: [{ subs: [{ s: "es", mid: "geregnet", fin: "hat" }, { s: "es", mid: "", fin: "regnete" }], mains: [{ fin: "sind", s: "wir", end: "spazieren gegangen" }, { fin: "gingen", s: "wir", end: "spazieren" }] }],
    vocab: [["regnen", "yağmur yağmak"], ["spazieren gehen", "yürüyüşe çıkmak"]],
  },
  {
    tr: "Çok çalışmasına rağmen sınavı geçemedi.",
    conj: "Obwohl",
    groups: gendered((s) => ({
      subs: [{ s, mid: "viel gelernt", fin: "hat" }],
      mains: [
        { fin: "hat", s, mid: "die Prüfung nicht", end: "bestanden" },
        { fin: "konnte", s, mid: "die Prüfung nicht", end: "bestehen" },
        { fin: "bestand", s, mid: "die Prüfung nicht" },
      ],
    })),
    vocab: [["eine Prüfung bestehen", "sınavı geçmek"]],
  },
  {
    tr: "Pahalı olmasına rağmen arabayı aldı.",
    conj: "Obwohl",
    groups: gendered((s) => ({
      subs: [{ s: "das Auto", mid: "teuer", fin: "war" }, { s: "es", mid: "teuer", fin: "war" }],
      mains: [{ fin: "hat", s, mid: "es", end: "gekauft" }, { fin: "kaufte", s, mid: "es" }, { fin: "hat", s, mid: "das Auto", end: "gekauft" }, { fin: "kaufte", s, mid: "das Auto" }],
    })),
    vocab: [["teuer", "pahalı"]],
  },
  {
    tr: "Zamanı olmamasına rağmen bize yardım etti.",
    conj: "Obwohl",
    groups: gendered((s) => ({ subs: [{ s, mid: "keine Zeit", fin: "hatte" }], mains: [{ fin: "hat", s, mid: "uns", end: "geholfen" }, { fin: "half", s, mid: "uns" }] })),
    vocab: [["helfen (+D)", "yardım etmek"]],
  },
  {
    tr: "Hava soğuk olmasına rağmen denize girdik.",
    conj: "Obwohl",
    groups: [
      {
        subs: [{ s: "es", mid: "kalt", fin: "war" }],
        mains: [{ fin: "sind", s: "wir", mid: "im Meer", end: "geschwommen" }, { fin: "sind", s: "wir", end: "schwimmen gegangen" }, { fin: "sind", s: "wir", mid: "ins Meer", end: "gegangen" }],
      },
    ],
    vocab: [["schwimmen", "yüzmek"]],
  },
]);

const alsWenn = cxTemplate("b1-als-wenn", "b1-nebensatz", ["als-wenn", "nebensatz"], "Geçmişte tek sefer: als. Her seferinde / şimdi: wenn.", [
  {
    tr: "Berlin'e geldiğimde hiç Almanca bilmiyordum.",
    conj: "Als",
    groups: [
      {
        subs: [{ s: "ich", mid: "nach Berlin", fin: "kam" }, { s: "ich", mid: "nach Berlin gekommen", fin: "bin" }],
        mains: ["konnte", "sprach"].flatMap((fin) => ["kein Deutsch", "gar kein Deutsch", "überhaupt kein Deutsch"].map((mid) => ({ fin, s: "ich", mid }))),
      },
    ],
    vocab: [["als", "-dığında (geçmişte bir kez)"]],
  },
  {
    tr: "Çocukken çok kitap okurdum.",
    conj: "Als",
    groups: [{ subs: [{ s: "ich", mid: "ein Kind", fin: "war" }, { s: "ich", mid: "klein", fin: "war" }], mains: [{ fin: "habe", s: "ich", mid: "viele Bücher", end: "gelesen" }, { fin: "las", s: "ich", mid: "viele Bücher" }] }],
    also: ["Als Kind habe ich viele Bücher gelesen.", "Als Kind las ich viele Bücher.", "Ich habe als Kind viele Bücher gelesen.", "Ich las als Kind viele Bücher."],
    vocab: [["als ich ein Kind war", "çocukken"]],
  },
  {
    tr: "Eve geldiğimde annem yemek pişiriyordu.",
    conj: "Als",
    groups: [{ subs: [{ s: "ich", mid: "nach Hause", fin: "kam" }, { s: "ich", mid: "nach Hause gekommen", fin: "bin" }], mains: [{ fin: "kochte", s: "meine Mutter" }, { fin: "hat", s: "meine Mutter", end: "gekocht" }] }],
    vocab: [["als", "-dığında (geçmişte bir kez)"]],
  },
  {
    tr: "Onu ilk gördüğümde çok heyecanlandım.",
    conj: "Als",
    groups: [
      { subs: [{ s: "ich", mid: "ihn zum ersten Mal", fin: "sah" }, { s: "ich", mid: "ihn zum ersten Mal gesehen", fin: "habe" }], mains: [{ fin: "war", s: "ich", mid: "sehr aufgeregt" }] },
      { subs: [{ s: "ich", mid: "sie zum ersten Mal", fin: "sah" }, { s: "ich", mid: "sie zum ersten Mal gesehen", fin: "habe" }], mains: [{ fin: "war", s: "ich", mid: "sehr aufgeregt" }] },
    ],
    vocab: [["zum ersten Mal", "ilk kez"], ["aufgeregt", "heyecanlı"]],
  },
  {
    tr: "Ne zaman eve gelsem köpeğim çok seviniyor.",
    conj: "Wenn",
    groups: [{ subs: [{ s: "ich", mid: "nach Hause", fin: "komme" }], mains: [{ fin: "freut", s: "mein Hund", mid: "sich sehr" }] }],
    extra: ["Wenn ich nach Hause komme, freut sich mein Hund sehr."],
    conjAlt: ["Immer wenn", "Jedes Mal, wenn"],
    also: ["Immer wenn ich nach Hause komme, freut sich mein Hund sehr.", "Jedes Mal, wenn ich nach Hause komme, freut sich mein Hund sehr."],
    vocab: [["wenn", "her … -dığında"]],
  },
  {
    tr: "Ne zaman Türkiye'ye gitsem büyükannemi ziyaret ederim.",
    conj: "Wenn",
    groups: [{ subs: [{ s: "ich", mid: "in die Türkei", fin: "fahre" }, { s: "ich", mid: "in die Türkei", fin: "fliege" }], mains: [{ fin: "besuche", s: "ich", mid: "meine Oma" }, { fin: "besuche", s: "ich", mid: "meine Großmutter" }] }],
    conjAlt: ["Immer wenn", "Jedes Mal, wenn"],
    vocab: [["wenn", "her … -dığında"]],
  },
  {
    tr: "Hava güzel olduğunda bisikletle işe giderim.",
    conj: "Wenn",
    groups: [{ subs: [{ s: "das Wetter", mid: "schön", fin: "ist" }], mains: [{ fin: "fahre", s: "ich", mid: "mit dem Fahrrad zur Arbeit" }, { fin: "fahre", s: "ich", mid: "mit dem Rad zur Arbeit" }] }],
    vocab: [["wenn", "-dığında (her seferinde)"]],
  },
]);

const bevorNachdem = cxTemplate("b1-bevor-nachdem", "b1-nebensatz", ["bevor-nachdem", "nebensatz"], "bevor: -meden önce, nachdem: -dikten sonra; ikisinde de fiil sona gider.", [
  {
    tr: "Yatmadan önce dişlerimi fırçalarım.",
    conj: "Bevor",
    groups: [{ subs: [{ s: "ich", mid: "ins Bett", fin: "gehe" }, { s: "ich", mid: "schlafen", fin: "gehe" }], mains: [{ fin: "putze", s: "ich", mid: "mir die Zähne" }] }],
    vocab: [["sich die Zähne putzen", "dişlerini fırçalamak"]],
  },
  {
    tr: "Kahvaltı ettikten sonra işe giderim.",
    conj: "Nachdem",
    groups: [{ subs: [{ s: "ich", mid: "gefrühstückt", fin: "habe" }], mains: [{ fin: "gehe", s: "ich", mid: "zur Arbeit" }, { fin: "fahre", s: "ich", mid: "zur Arbeit" }] }],
    vocab: [["frühstücken", "kahvaltı etmek"]],
  },
  {
    tr: "Yemekten önce ellerimi yıkarım.",
    conj: "Bevor",
    groups: [{ subs: [{ s: "ich", mid: "", fin: "esse" }], mains: [{ fin: "wasche", s: "ich", mid: "mir die Hände" }] }],
    also: ["Vor dem Essen wasche ich mir die Hände.", "Ich wasche mir vor dem Essen die Hände."],
    vocab: [["sich die Hände waschen", "ellerini yıkamak"]],
  },
  {
    tr: "Filmi izledikten sonra yattık.",
    conj: "Nachdem",
    groups: [{ subs: [{ s: "wir", mid: "den Film gesehen", fin: "hatten" }], mains: [{ fin: "gingen", s: "wir", mid: "ins Bett" }, { fin: "gingen", s: "wir", mid: "schlafen" }] }],
    vocab: [["nachdem", "-dikten sonra"]],
  },
  {
    tr: "İşe başlamadan önce bir kahve içerim.",
    conj: "Bevor",
    groups: [{ subs: [{ s: "ich", mid: "mit der Arbeit", fin: "anfange" }, { s: "ich", mid: "mit der Arbeit", fin: "beginne" }], mains: [{ fin: "trinke", s: "ich", mid: "einen Kaffee" }] }],
    vocab: [["mit der Arbeit anfangen", "işe başlamak"]],
  },
]);

const damit = listTemplate("b1-damit", "B1", "b1-nebensatz", ["damit-umzu", "nebensatz"], "Özneler farklıysa damit + fiil sonda; aynıysa um … zu.", [
  {
    tr: "Çocuklar uyuyabilsin diye ışığı kapattım.",
    de: ["Ich habe das Licht ausgemacht, damit die Kinder schlafen können.", "Damit die Kinder schlafen können, habe ich das Licht ausgemacht.", "Ich habe das Licht ausgeschaltet, damit die Kinder schlafen können."],
    vocab: [["das Licht ausmachen", "ışığı kapatmak"]],
    focus: [focus("damit-umzu", "schlafen können", [["können schlafen", "damit'li yan cümlede çekimli fiil en sona gider: damit die Kinder schlafen können."]])],
  },
  {
    tr: "Herkes anlasın diye yavaş konuşuyor.",
    de: ["Er spricht langsam, damit alle ihn verstehen.", "Sie spricht langsam, damit alle sie verstehen.", "Er spricht langsam, damit ihn alle verstehen.", "Sie spricht langsam, damit sie alle verstehen.", "Er spricht langsam, damit alle ihn verstehen können.", "Sie spricht langsam, damit alle sie verstehen können."],
    vocab: [["langsam", "yavaş"]],
    focus: [focus("damit-umzu", "ihn verstehen", [["verstehen ihn", "damit'li yan cümlede çekimli fiil en sona gider."]])],
  },
  {
    tr: "Kaybolmayasın diye sana bir harita veriyorum.",
    de: ["Ich gebe dir eine Karte, damit du dich nicht verläufst.", "Ich gebe dir eine Karte, damit du dich nicht verirrst."],
    vocab: [["sich verlaufen", "kaybolmak (yolunu)"]],
    focus: [focus("damit-umzu", "nicht verläufst", [["verläufst dich nicht", "damit'li yan cümlede çekimli fiil en sona gider: damit du dich nicht verläufst."]])],
  },
  {
    tr: "Geç kalmamak için erken çıktık.",
    de: ["Wir sind früh losgegangen, um nicht zu spät zu kommen.", "Um nicht zu spät zu kommen, sind wir früh losgegangen.", "Wir sind früh losgefahren, um nicht zu spät zu kommen.", "Wir sind früh losgegangen, damit wir nicht zu spät kommen."],
    vocab: [["losgehen", "yola çıkmak"]],
    focus: [focus("damit-umzu", "um nicht zu spät zu kommen", [["für nicht zu spät", "'-mek için' (özne aynı) um … zu ile söylenir: um nicht zu spät zu kommen."]])],
  },
]);

// ---------- relative clauses ----------

type G4 = "m" | "f" | "n" | "pl";
const HEADS: { de: string; art: string; g: G4; tr: string }[] = [
  { de: "Mann", art: "der", g: "m", tr: "adam" },
  { de: "Frau", art: "die", g: "f", tr: "kadın" },
  { de: "Kind", art: "das", g: "n", tr: "çocuk" },
  { de: "Leute", art: "die", g: "pl", tr: "insanlar" },
  { de: "Lehrer", art: "der", g: "m", tr: "öğretmen" },
];
const REL: Record<"nom" | "akk" | "dat", Record<G4, string>> = {
  nom: { m: "der", f: "die", n: "das", pl: "die" },
  akk: { m: "den", f: "die", n: "das", pl: "die" },
  dat: { m: "dem", f: "der", n: "dem", pl: "denen" },
};
const G_TR: Record<G4, string> = { m: "eril", f: "dişil", n: "nötr", pl: "çoğul" };
const REL_TYPES: { tr: string; c: "nom" | "akk" | "dat"; role: string; prep?: string; next: string; tail: (pl: boolean) => [string, string] }[] = [
  { tr: "dün tanıştığım", c: "akk", role: "yan cümlede nesnedir (kennenlernen + Akkusativ)", next: "ich gestern", tail: () => ["kennengelernt habe", "habe kennengelernt"] },
  { tr: "yardım ettiğim", c: "dat", role: "yan cümlede Dativ'dir (helfen + Dativ)", next: "ich", tail: () => ["geholfen habe", "habe geholfen"] },
  { tr: "orada duran", c: "nom", role: "yan cümlede öznedir", next: "", tail: (pl) => ["dort " + (pl ? "stehen" : "steht"), (pl ? "stehen" : "steht") + " dort"] },
  { tr: "yanımızda oturan", c: "nom", role: "yan cümlede öznedir", next: "", tail: (pl) => ["neben uns " + (pl ? "wohnen" : "wohnt"), (pl ? "wohnen" : "wohnt") + " neben uns"] },
  { tr: "her gün gördüğüm", c: "akk", role: "yan cümlede nesnedir (sehen + Akkusativ)", next: "ich jeden Tag", tail: () => ["sehe", "sehe"] },
  { tr: "birlikte çalıştığım", c: "dat", role: "mit'ten sonra geldiği için Dativ'dir", prep: "mit", next: "ich", tail: () => ["zusammenarbeite", "arbeite zusammen"] },
];
/** Turkish predicate, German predicate, other German predicates that fit just as well */
const PREDS: [string, string, ...string[]][] = [
  ["çok sevimli", "sehr nett"],
  ["çok yardımsever", "sehr hilfsbereit"],
  ["çok komik", "sehr lustig", "sehr witzig"],
  ["çok kibar", "sehr freundlich", "sehr höflich"],
  ["çok ilginç", "sehr interessant"],
];

const relativ: Template = {
  id: "b1-ilgi-cumlesi",
  level: "B1",
  topicId: "b1-relativ",
  rules: ["relativ"],
  hint: "İlgi zamiri cinsiyeti isimden, hâli yan cümledeki görevinden alır; fiil sona gider.",
  make(p) {
    const head = p.pick(HEADS);
    const rt = p.pick(REL_TYPES);
    const pred = p.pick(PREDS);
    const pl = head.g === "pl";
    const rel = REL[rt.c][head.g];
    const [tail, wrongTail] = rt.tail(pl);
    const lead = [rt.prep, rel].filter(Boolean).join(" ");
    const clause = [lead, rt.next, tail].filter(Boolean).join(" ");
    const verb = pl ? "sind" : "ist";
    const relSpot = [lead, rt.next.split(" ")[0] || tail.split(" ")[0]].join(" ");
    const others = [...new Set(Object.values(REL).flatMap((x) => Object.values(x)))].filter((x) => x !== rel);
    const why = `${head.de} ${G_TR[head.g]} ve ilgi zamiri ${rt.role}: ${rel}.`;
    return {
      tr: trSentence([rt.tr, head.tr, pred[0]]),
      de: pred.slice(1).map((x) => sentence([`${head.art} ${head.de},`, `${clause},`, verb, x])),
      vocab: [[`${head.art} ${head.de}`, head.tr]],
      focus: [
        focus(
          "relativ",
          relSpot,
          others.map((o) => [relSpot.replace(new RegExp(`\\b${rel}\\b`), o), why] as [string, string]),
        ),
        focus("relativ", tail, wrongTail !== tail ? [[wrongTail, "İlgi cümlesinde çekimli fiil en sona gider."]] : []),
      ],
    };
  },
};

// ---------- passive ----------

const PASSIV_SUBJ: { tr: string; de: string; pl?: boolean; ok: string[] }[] = [
  { tr: "ev", de: "das Haus", ok: ["bauen", "renovieren"] },
  { tr: "okul", de: "die Schule", ok: ["bauen", "renovieren", "eroeffnen", "schliessen"] },
  { tr: "köprü", de: "die Brücke", ok: ["bauen", "renovieren", "eroeffnen", "schliessen"] },
  { tr: "tren istasyonu", de: "der Bahnhof", ok: ["bauen", "renovieren", "eroeffnen", "schliessen"] },
  { tr: "stadyum", de: "das Stadion", ok: ["bauen", "renovieren", "eroeffnen"] },
  { tr: "müze", de: "das Museum", ok: ["bauen", "renovieren", "eroeffnen", "schliessen"] },
  { tr: "evler", de: "die Häuser", pl: true, ok: ["bauen", "renovieren"] },
  { tr: "yol", de: "die Straße", ok: ["bauen", "renovieren", "schliessen"] },
];
const PASSIV_VERBS: Record<string, { tr: TrVerb; de: string; v: [string, string] }> = {
  bauen: { tr: tv("inşa edil"), de: "gebaut", v: ["bauen", "inşa etmek"] },
  renovieren: { tr: tv("yenilen"), de: "renoviert", v: ["renovieren", "yenilemek"] },
  eroeffnen: { tr: tv("açıl"), de: "eröffnet", v: ["eröffnen", "(resmî olarak) açmak"] },
  schliessen: { tr: tv("kapatıl"), de: "geschlossen", v: ["schließen", "kapatmak"] },
};
const PASSIV_TIMES: { tense: "praet" | "praes"; tr: string; de: string; alt?: string[] }[] = [
  { tense: "praet", tr: "1990'da", de: "1990", alt: ["im Jahr 1990"] },
  { tense: "praet", tr: "geçen yıl", de: "letztes Jahr", alt: ["im letzten Jahr", "vergangenes Jahr"] },
  { tense: "praet", tr: "dün", de: "gestern" },
  { tense: "praes", tr: "şu anda", de: "gerade", alt: ["im Moment", "momentan", "zurzeit", "jetzt"] },
  { tense: "praes", tr: "bu yıl", de: "dieses Jahr", alt: ["in diesem Jahr"] },
];

const passiv: Template = {
  id: "b1-passiv",
  level: "B1",
  topicId: "b1-passiv",
  rules: ["passiv"],
  hint: "Edilgen: werden + Partizip II. Geçmiş: wurde / wurden … gebaut.",
  make(p) {
    const subj = p.pick(PASSIV_SUBJ);
    const vk = p.pick(subj.ok);
    const verb = PASSIV_VERBS[vk];
    const t = p.pick(PASSIV_TIMES);
    const aux = t.tense === "praet" ? (subj.pl ? "wurden" : "wurde") : subj.pl ? "werden" : "wird";
    const auxOther = t.tense === "praet" ? (subj.pl ? "wurde" : "wurden") : subj.pl ? "wird" : "werden";
    const trVerb = t.tense === "praet" ? past(verb.tr, "3sg") : trPresent(verb.tr, "3sg");
    const de = [t.de, ...(t.alt ?? [])].flatMap((x) => [sentence([subj.de, aux, x, verb.de]), sentence([x, aux, subj.de, verb.de])]);
    return {
      tr: trSentence([subj.tr, t.tr, trVerb]),
      de,
      vocab: [verb.v],
      focus: [
        focus("passiv", aux, [
          [auxOther, `werden özneye uyar: ${subj.pl ? "çoğul" : "tekil"} özne → ${aux}.`],
          [t.tense === "praet" ? (subj.pl ? "waren" : "war") : subj.pl ? "sind" : "ist", `Eylem anlatan edilgende werden kullanılır: ${aux} … ${verb.de}.`],
          [t.tense === "praet" ? "wird" : "wurde", t.tense === "praet" ? `Geçmiş zaman: ${aux} … ${verb.de}.` : `Şimdiki zaman: ${aux} … ${verb.de}.`],
        ]),
        ...(t.de === "1990" ? [focus("passiv", "1990", [["in 1990", "Almancada yıllar 'in' olmadan yazılır: 1990 ya da im Jahr 1990."]])] : []),
      ],
    };
  },
};

const passivList = listTemplate("b1-passiv-cumleler", "B1", "b1-passiv", ["passiv"], "Edilgen: werden + Partizip II; yapan kişi von + Dativ.", [
  { tr: "Burada Almanca konuşulur.", de: ["Hier wird Deutsch gesprochen."], focus: [focus("passiv", "wird Deutsch gesprochen", [["ist Deutsch gesprochen", "Edilgende werden kullanılır: Hier wird Deutsch gesprochen."], ["spricht man", "'man' ile de söylenebilir ama burada edilgen çatı çalışılıyor: Hier wird Deutsch gesprochen."]])] },
  { tr: "Bu kitap birçok dile çevrildi.", de: ["Dieses Buch wurde in viele Sprachen übersetzt.", "Das Buch wurde in viele Sprachen übersetzt."] },
  { tr: "Toplantı iptal edildi.", de: ["Das Meeting wurde abgesagt.", "Die Besprechung wurde abgesagt.", "Die Sitzung wurde abgesagt."] },
  { tr: "Hırsız polis tarafından yakalandı.", de: ["Der Dieb wurde von der Polizei gefasst.", "Der Dieb wurde von der Polizei festgenommen.", "Der Dieb wurde von der Polizei gefangen."], focus: [focus("passiv", "von der Polizei", [["durch die Polizei", "Yapan kişi/kurum von + Dativ ile verilir: von der Polizei."], ["von die Polizei", "von Dativ ister: von der Polizei."]])] },
  { tr: "Çocuklar okuldan alındı.", de: ["Die Kinder wurden von der Schule abgeholt."], focus: [focus("passiv", "wurden", [["wurde", "Özne çoğul (die Kinder) olduğu için wurden."]])] },
  { tr: "Kapı saat sekizde açılıyor.", de: ["Die Tür wird um acht Uhr geöffnet.", "Um acht Uhr wird die Tür geöffnet.", "Die Tür wird um 8 Uhr geöffnet.", "Um 8 Uhr wird die Tür geöffnet."] },
  { tr: "Yeni bir okul inşa ediliyor.", de: ["Eine neue Schule wird gebaut.", "Es wird eine neue Schule gebaut."] },
  { tr: "Pencereler her hafta temizleniyor.", de: ["Die Fenster werden jede Woche geputzt.", "Die Fenster werden jede Woche gereinigt.", "Jede Woche werden die Fenster geputzt."] },
]);

// ---------- Konjunktiv II ----------

const K2_COND: { id: string; tr: string; s: string; mid: string; fin: string; alt?: { mid: string; fin: string } }[] = [
  { id: "zaman", tr: "daha çok zamanım olsaydı", s: "ich", mid: "mehr Zeit", fin: "hätte" },
  { id: "zengin", tr: "zengin olsaydım", s: "ich", mid: "reich", fin: "wäre" },
  { id: "araba", tr: "bir arabam olsaydı", s: "ich", mid: "ein Auto", fin: "hätte" },
  { id: "almanca", tr: "Almanca bilseydim", s: "ich", mid: "Deutsch", fin: "könnte", alt: { mid: "Deutsch sprechen", fin: "könnte" } },
  { id: "yerinde", tr: "senin yerinde olsaydım", s: "ich", mid: "du", fin: "wäre" },
  { id: "hava", tr: "hava güzel olsaydı", s: "das Wetter", mid: "schön", fin: "wäre" },
];
const K2_CONS: { tr: string; s: string; mid: string; inf: string; ok: string[] }[] = [
  { tr: "dünyayı gezerdim", s: "ich", mid: "um die Welt", inf: "reisen", ok: ["zaman", "zengin"] },
  { tr: "daha çok kitap okurdum", s: "ich", mid: "mehr Bücher", inf: "lesen", ok: ["zaman"] },
  { tr: "her gün spor yapardım", s: "ich", mid: "jeden Tag Sport", inf: "machen", ok: ["zaman"] },
  { tr: "Almanya'da çalışırdım", s: "ich", mid: "in Deutschland", inf: "arbeiten", ok: ["almanca"] },
  { tr: "seni daha sık ziyaret ederdim", s: "ich", mid: "dich öfter", inf: "besuchen", ok: ["araba", "zaman"] },
  { tr: "doktora giderdim", s: "ich", mid: "zum Arzt", inf: "gehen", ok: ["yerinde"] },
  { tr: "parka giderdik", s: "wir", mid: "in den Park", inf: "gehen", ok: ["hava"] },
];

const konj2If: Template = {
  id: "b1-konj2-kosul",
  level: "B1",
  topicId: "b1-konjunktiv",
  rules: ["konjunktiv2"],
  hint: "Wenn … hätte / wäre / könnte, würde … + mastar (sonda).",
  make(p) {
    const cons = p.pick(K2_CONS);
    const cond = p.pick(K2_COND.filter((c) => cons.ok.includes(c.id)));
    const conds = [{ mid: cond.mid, fin: cond.fin }, ...(cond.alt ? [cond.alt] : [])];
    const wuerde = cons.s === "wir" ? "würden" : "würde";
    const de: string[] = [];
    for (const c of conds) {
      const sub = [cond.s, c.mid, c.fin].join(" ");
      de.push(
        sentence([`Wenn ${sub},`, wuerde, cons.s, cons.mid, cons.inf]),
        sentence([cons.s, wuerde, cons.mid, cons.inf, `, wenn ${sub}`]),
        sentence([`${c.fin} ${cond.s} ${c.mid},`, wuerde, cons.s, cons.mid, cons.inf]),
      );
    }
    if (cond.id === "yerinde") de.push(sentence(["An deiner Stelle", wuerde, cons.s, cons.mid, cons.inf]));
    const wasNow = cond.fin === "hätte" ? "hatte" : cond.fin === "wäre" ? "war" : "konnte";
    return {
      tr: trSentence([cond.tr, cons.tr]),
      de,
      vocab: [["würde + Infinitiv", "-ırdı / -ardı"], [cond.fin, cond.fin === "hätte" ? "olsaydı (sahiplik)" : cond.fin === "wäre" ? "olsaydı" : "-ebilseydi"]],
      focus: [
        focus("konjunktiv2", cond.fin, [
          [wasNow, `Gerçek olmayan koşulda Konjunktiv II kullanılır: ${cond.fin} (${wasNow} geçmiş zamandır).`],
          [cond.fin === "hätte" ? "habe" : cond.fin === "wäre" ? "bin" : "kann", `Gerçek olmayan koşulda Konjunktiv II kullanılır: ${cond.fin}.`],
        ]),
        focus("konjunktiv2", `${wuerde} ${cons.s}`, [
          [`${cons.s} ${wuerde}`, `Wenn'li yan cümle başta olduğu için ana cümle çekimli fiille (${wuerde}) başlar.`],
          [`${cons.s === "wir" ? "werden" : "werde"} ${cons.s}`, `${cons.s === "wir" ? "werden" : "werde"} gelecek zamandır; varsayımda ${wuerde} kullanılır.`],
        ]),
        focus("konjunktiv2", cons.inf, [[`${wuerde} ${cons.s} ${cons.inf} ${cons.mid}`, `${wuerde} ile kullanılan mastar cümlenin en sonuna gider.`]]),
      ],
    };
  },
};

const polite = listTemplate("b1-kibar-rica", "B1", "b1-konjunktiv", ["konjunktiv2"], "Kibar rica: Könnten Sie …? Würden Sie …? Ich hätte gern …", [
  { tr: "Bana yardım edebilir misiniz?", de: ["Könnten Sie mir helfen?", "Könnten Sie mir bitte helfen?", "Können Sie mir helfen?", "Können Sie mir bitte helfen?", "Würden Sie mir helfen?", "Würden Sie mir bitte helfen?"], focus: [focus("dativ-verben", "mir", [["mich", "helfen Dativ ister: mir."]])] },
  { tr: "Pencereyi açabilir misin?", de: ["Könntest du das Fenster öffnen?", "Könntest du bitte das Fenster öffnen?", "Könntest du das Fenster aufmachen?", "Kannst du das Fenster öffnen?", "Kannst du das Fenster aufmachen?", "Könntest du bitte das Fenster aufmachen?"] },
  { tr: "Biraz daha yavaş konuşabilir misiniz?", de: ["Könnten Sie bitte etwas langsamer sprechen?", "Könnten Sie etwas langsamer sprechen?", "Können Sie etwas langsamer sprechen?", "Könnten Sie bitte ein bisschen langsamer sprechen?"] },
  { tr: "Bana tuzu uzatabilir misin?", de: ["Könntest du mir das Salz geben?", "Könntest du mir bitte das Salz geben?", "Kannst du mir das Salz geben?", "Kannst du mir bitte das Salz geben?", "Könntest du mir das Salz reichen?"] },
  { tr: "Bir kahve alabilir miyim?", de: ["Ich hätte gern einen Kaffee.", "Könnte ich einen Kaffee haben?", "Kann ich einen Kaffee haben?", "Ich hätte gerne einen Kaffee."], focus: [focus("konjunktiv2", "hätte gern", [["habe gern", "Kibar sipariş: Ich hätte gern … (Konjunktiv II)."]])] },
  { tr: "Size bir soru sorabilir miyim?", de: ["Darf ich Ihnen eine Frage stellen?", "Dürfte ich Ihnen eine Frage stellen?", "Könnte ich Ihnen eine Frage stellen?", "Kann ich Ihnen eine Frage stellen?"], focus: [focus("nvv", "eine Frage stellen", [["eine Frage fragen", "'Soru sormak' = eine Frage stellen."]])] },
]);

// ---------- verbs with prepositions ----------

interface PVObj {
  tr: string;
  de: string;
  wrong: [string, string][];
  only?: Subj[];
}
interface PVerb {
  tr: TrVerb;
  build: (pron: string, p: Person, obj: string) => string[];
  vocab: [string, string];
  objs: PVObj[];
  prep: string;
}

const reflPrep = (v: Verb, prep: string) => (pron: string, p: Person, obj: string) => [sentence([pron, present(v, p), REFLEXIVE[p], prep, obj])];

const PVERBS: PVerb[] = [
  {
    tr: tv("bekle"),
    prep: "auf",
    build: (pron, p, obj) => [sentence([pron, present(V.warten, p), "auf", obj])],
    vocab: ["warten auf (+A)", "beklemek"],
    objs: [
      { tr: "otobüsü", de: "den Bus", wrong: [["auf dem Bus", "warten auf Akkusativ ister: auf den Bus."]] },
      { tr: "seni", de: "dich", wrong: [["auf dir", "warten auf Akkusativ ister: auf dich."]] },
      { tr: "cevabını", de: "deine Antwort", wrong: [["auf deiner Antwort", "warten auf Akkusativ ister: auf deine Antwort."]] },
      { tr: "sonuçları", de: "die Ergebnisse", wrong: [["auf den Ergebnissen", "warten auf Akkusativ ister: auf die Ergebnisse."]] },
    ],
  },
  {
    tr: tv("düşün"),
    prep: "an",
    build: (pron, p, obj) => [sentence([pron, present(V.denken, p), "oft", "an", obj]), sentence(["oft", present(V.denken, p), pron, "an", obj])],
    vocab: ["denken an (+A)", "(birini/bir şeyi) düşünmek"],
    objs: [
      { tr: "sık sık ailemi", de: "meine Familie", wrong: [["an meiner Familie", "denken an Akkusativ ister: an meine Familie."]], only: [SUBJ.ben] },
      { tr: "sık sık seni", de: "dich", wrong: [["an dir", "denken an Akkusativ ister: an dich."]] },
      { tr: "sık sık tatili", de: "den Urlaub", wrong: [["an dem Urlaub", "denken an Akkusativ ister: an den Urlaub."], ["am Urlaub", "denken an Akkusativ ister: an den Urlaub."]] },
    ],
  },
  {
    tr: tv("ilgilen"),
    prep: "für",
    build: reflPrep(V.interessieren, "für"),
    vocab: ["sich interessieren für (+A)", "ile ilgilenmek"],
    objs: [
      { tr: "müzikle", de: "Musik", wrong: [["mit Musik", "Türkçedeki '-le' burada mit olmaz: sich für Musik interessieren."]] },
      { tr: "sanatla", de: "Kunst", wrong: [["mit Kunst", "Türkçedeki '-le' burada mit olmaz: sich für Kunst interessieren."]] },
      { tr: "siyasetle", de: "Politik", wrong: [["mit Politik", "Türkçedeki '-le' burada mit olmaz: sich für Politik interessieren."]] },
      { tr: "futbolla", de: "Fußball", wrong: [["mit Fußball", "Türkçedeki '-le' burada mit olmaz: sich für Fußball interessieren."]] },
    ],
  },
  {
    tr: tv("kork"),
    prep: "vor",
    build: (pron, p, obj) => [sentence([pron, present(V.haben, p), "Angst vor", obj])],
    vocab: ["Angst haben vor (+D)", "-den korkmak"],
    objs: [
      { tr: "köpeklerden", de: "Hunden", wrong: [["vor Hunde", "vor burada Dativ ister: vor Hunden."], ["von Hunden", "Korkmak: Angst haben vor (von değil)."]] },
      { tr: "karanlıktan", de: "der Dunkelheit", wrong: [["vor die Dunkelheit", "vor burada Dativ ister: vor der Dunkelheit."], ["von der Dunkelheit", "Korkmak: Angst haben vor (von değil)."]] },
      { tr: "sınavdan", de: "der Prüfung", wrong: [["vor die Prüfung", "vor burada Dativ ister: vor der Prüfung."], ["von der Prüfung", "Korkmak: Angst haben vor (von değil)."]] },
    ],
  },
  {
    tr: tv("ilgilen"),
    prep: "um",
    build: reflPrep(V.kuemmern, "um"),
    vocab: ["sich kümmern um (+A)", "ile ilgilenmek, bakmak"],
    objs: [
      { tr: "çocuklarla", de: "die Kinder", wrong: [["mit den Kindern", "Birine bakmak: sich um jemanden kümmern (mit değil)."], ["um den Kindern", "um Akkusativ ister: um die Kinder."]] },
      { tr: "köpekle", de: "den Hund", wrong: [["mit dem Hund", "Birine bakmak: sich um jemanden kümmern (mit değil)."], ["um dem Hund", "um Akkusativ ister: um den Hund."]] },
      { tr: "büyükannemle", de: "meine Oma", wrong: [["mit meiner Oma", "Birine bakmak: sich um jemanden kümmern (mit değil)."]], only: [SUBJ.ben] },
    ],
  },
  {
    tr: tv("hatırla"),
    prep: "an",
    build: reflPrep(V.erinnern, "an"),
    vocab: ["sich erinnern an (+A)", "hatırlamak"],
    objs: [
      { tr: "o günü", de: "diesen Tag", wrong: [["an diesem Tag", "sich erinnern an Akkusativ ister: an diesen Tag."]] },
      { tr: "çocukluğumu", de: "meine Kindheit", wrong: [["an meiner Kindheit", "sich erinnern an Akkusativ ister: an meine Kindheit."]], only: [SUBJ.ben] },
      { tr: "ilk Almanca dersimi", de: "meine erste Deutschstunde", wrong: [], only: [SUBJ.ben] },
    ],
  },
  {
    tr: tv("kız"),
    prep: "über",
    build: reflPrep(V.aergern, "über"),
    vocab: ["sich ärgern über (+A)", "-e kızmak"],
    objs: [
      { tr: "gürültüye", de: "den Lärm", wrong: [["über dem Lärm", "sich ärgern über Akkusativ ister: über den Lärm."]] },
      { tr: "kötü havaya", de: "das schlechte Wetter", wrong: [["über dem schlechten Wetter", "sich ärgern über Akkusativ ister: über das schlechte Wetter."]] },
      { tr: "gecikmeye", de: "die Verspätung", wrong: [["über der Verspätung", "sich ärgern über Akkusativ ister: über die Verspätung."]] },
    ],
  },
];

const praepVerben: Template = {
  id: "b1-edatli-fiiller",
  level: "B1",
  topicId: "b1-praepverben",
  rules: ["praep-verben"],
  hint: "Fiili edatıyla birlikte öğren: warten auf + A, denken an + A, Angst haben vor + D …",
  make(p) {
    const v = p.pick(PVERBS);
    const obj = p.pick(v.objs);
    const s = p.pick(obj.only ?? [SUBJ.ben, SUBJ.o, SUBJ.biz]);
    const expect = `${v.prep} ${obj.de}`;
    const wrongPrep: [string, string][] = ["auf", "an", "für", "vor", "um", "über", "mit", "von"]
      .filter((x) => x !== v.prep)
      .map((x) => [`${x} ${obj.de}`, `Bu fiilin edatı ${v.prep}'dir: ${v.vocab[0]}.`]);
    return {
      tr: trSentence([obj.tr, trPresent(v.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) => v.build(pron, q, obj.de)),
      vocab: [v.vocab],
      focus: [focus("praep-verben", expect, [...obj.wrong, ...wrongPrep])],
    };
  },
};

// ---------- zu-infinitive ----------

const umZu = listTemplate("b1-um-zu", "B1", "b1-infinitiv", ["damit-umzu", "zu-infinitiv"], "'-mek için' (özne aynı): um … zu + mastar (sonda).", [
  { tr: "Almanca öğrenmek için her gün film izliyorum.", de: ["Ich sehe jeden Tag Filme, um Deutsch zu lernen.", "Um Deutsch zu lernen, sehe ich jeden Tag Filme.", "Ich schaue jeden Tag Filme, um Deutsch zu lernen.", "Um Deutsch zu lernen, schaue ich jeden Tag Filme.", "Ich sehe mir jeden Tag Filme an, um Deutsch zu lernen.", "Um Deutsch zu lernen, sehe ich mir jeden Tag Filme an."], focus: [focus("damit-umzu", "um Deutsch zu lernen", [["für Deutsch zu lernen", "'-mek için' um … zu ile söylenir (für değil)."], ["um Deutsch lernen", "um'dan sonra mastar zu ile gelir: um Deutsch zu lernen."], ["um zu Deutsch lernen", "zu mastarın hemen önüne gelir: um Deutsch zu lernen."]])] },
  { tr: "Para biriktirmek için bisikletle işe gidiyorum.", de: ["Ich fahre mit dem Fahrrad zur Arbeit, um Geld zu sparen.", "Um Geld zu sparen, fahre ich mit dem Fahrrad zur Arbeit.", "Ich fahre mit dem Rad zur Arbeit, um Geld zu sparen.", "Um Geld zu sparen, fahre ich mit dem Rad zur Arbeit."], focus: [focus("damit-umzu", "um Geld zu sparen", [["für Geld zu sparen", "'-mek için' um … zu ile söylenir."], ["um Geld sparen", "um'dan sonra mastar zu ile gelir: um Geld zu sparen."]])] },
  { tr: "Sağlıklı kalmak için her gün spor yapıyorum.", de: ["Ich mache jeden Tag Sport, um gesund zu bleiben.", "Um gesund zu bleiben, mache ich jeden Tag Sport."], focus: [focus("damit-umzu", "um gesund zu bleiben", [["für gesund zu bleiben", "'-mek için' um … zu ile söylenir."]])] },
  { tr: "Ekmek almak için fırına gittim.", de: ["Ich bin zur Bäckerei gegangen, um Brot zu kaufen.", "Um Brot zu kaufen, bin ich zur Bäckerei gegangen.", "Ich bin zum Bäcker gegangen, um Brot zu kaufen.", "Um Brot zu kaufen, bin ich zum Bäcker gegangen.", "Ich bin in die Bäckerei gegangen, um Brot zu kaufen.", "Um Brot zu kaufen, bin ich in die Bäckerei gegangen."], focus: [focus("damit-umzu", "um Brot zu kaufen", [["für Brot zu kaufen", "'-mek için' um … zu ile söylenir."]])] },
  { tr: "Geç kalmamak için taksiye bindim.", de: ["Ich habe ein Taxi genommen, um nicht zu spät zu kommen.", "Um nicht zu spät zu kommen, habe ich ein Taxi genommen.", "Ich bin mit dem Taxi gefahren, um nicht zu spät zu kommen.", "Um nicht zu spät zu kommen, bin ich mit dem Taxi gefahren."], focus: [focus("damit-umzu", "um nicht zu spät zu kommen", [["für nicht zu spät zu kommen", "'-mek için' um … zu ile söylenir."]])] },
  { tr: "Erken kalkmak için erken yatıyorum.", de: ["Ich gehe früh ins Bett, um früh aufzustehen.", "Um früh aufzustehen, gehe ich früh ins Bett.", "Ich gehe früh schlafen, um früh aufzustehen.", "Um früh aufzustehen, gehe ich früh schlafen."], focus: [focus("zu-infinitiv", "aufzustehen", [["zu aufstehen", "Ayrılabilen fiilde zu ortaya girer: aufzustehen."], ["auf zu stehen", "Ayrılabilen fiilde zu ortaya girer ve bitişik yazılır: aufzustehen."]])] },
  { tr: "Arkadaşımı aramak için telefonumu aldım.", de: ["Ich habe mein Handy genommen, um meinen Freund anzurufen.", "Ich habe mein Handy genommen, um meine Freundin anzurufen.", "Um meinen Freund anzurufen, habe ich mein Handy genommen.", "Um meine Freundin anzurufen, habe ich mein Handy genommen.", "Ich habe mein Telefon genommen, um meinen Freund anzurufen.", "Ich habe mein Telefon genommen, um meine Freundin anzurufen.", "Um meinen Freund anzurufen, habe ich mein Telefon genommen.", "Um meine Freundin anzurufen, habe ich mein Telefon genommen."], focus: [focus("zu-infinitiv", "anzurufen", [["zu anrufen", "Ayrılabilen fiilde zu ortaya girer: anzurufen."]])] },
]);

const ES_ADJ: { tr: string; de: string[] }[] = [
  { tr: "zor", de: ["schwer", "schwierig"] },
  { tr: "kolay", de: ["leicht", "einfach"] },
  { tr: "önemli", de: ["wichtig"] },
  { tr: "pahalı", de: ["teuer"] },
  { tr: "güzel", de: ["schön"] },
  { tr: "sağlıklı", de: ["gesund"] },
];
const ES_ACT: { tr: string; zu: string; bare?: string; alt?: { zu: string; bare?: string }[]; ok: string[]; check?: [string, string, string] }[] = [
  { tr: "Almanca öğrenmek", zu: "Deutsch zu lernen", bare: "Deutsch lernen", ok: ["zor", "kolay", "önemli", "güzel"] },
  { tr: "sabah erken kalkmak", zu: "morgens früh aufzustehen", bare: "morgens früh aufstehen", ok: ["zor", "sağlıklı"], check: ["aufzustehen", "zu aufstehen", "Ayrılabilen fiilde zu ortaya girer: aufzustehen."] },
  { tr: "Berlin'de ev bulmak", zu: "in Berlin eine Wohnung zu finden", bare: "in Berlin eine Wohnung finden", ok: ["zor"] },
  { tr: "her gün spor yapmak", zu: "jeden Tag Sport zu machen", bare: "jeden Tag Sport machen", ok: ["önemli", "sağlıklı", "zor"] },
  { tr: "Münih'te yaşamak", zu: "in München zu wohnen", bare: "in München wohnen", alt: [{ zu: "in München zu leben", bare: "in München leben" }], ok: ["pahalı", "güzel"] },
  { tr: "yeni insanlarla tanışmak", zu: "neue Leute kennenzulernen", bare: "neue Leute kennenlernen", ok: ["güzel", "önemli", "kolay", "zor"], check: ["kennenzulernen", "zu kennenlernen", "Ayrılabilen fiilde zu ortaya girer: kennenzulernen."] },
  { tr: "seni görmek", zu: "dich zu sehen", ok: ["güzel"] },
];

const esIst: Template = {
  id: "b1-es-ist",
  level: "B1",
  topicId: "b1-infinitiv",
  rules: ["zu-infinitiv"],
  hint: "Es ist schwer, … zu + mastar (sonda).",
  make(p) {
    const act = p.pick(ES_ACT);
    const a = p.pick(ES_ADJ.filter((x) => act.ok.includes(x.tr)));
    const forms = [{ zu: act.zu, bare: act.bare }, ...(act.alt ?? [])];
    const de = a.de.flatMap((adj) => forms.flatMap((f) => [`Es ist ${adj}, ${f.zu}.`, ...(f.bare ? [sentence([f.bare, "ist", adj])] : [])]));
    const lastVerb = act.zu.split(" ").slice(-2).join(" ");
    return {
      tr: trSentence([act.tr, a.tr]),
      de,
      vocab: [[a.de[0], a.tr]],
      focus: [
        act.check
          ? focus("zu-infinitiv", act.check[0], [[act.check[1], act.check[2]]])
          : focus("zu-infinitiv", lastVerb, [[lastVerb.replace("zu ", ""), `Bu kalıpta mastar zu ile gelir ve sona gider: …, ${act.zu}.`]]),
      ],
    };
  },
};

const zuVerbs = listTemplate("b1-zu-fiiller", "B1", "b1-infinitiv", ["zu-infinitiv"], "vergessen, beschließen, vorhaben, versuchen + zu + mastar.", [
  { tr: "Yarın gelmeyi unutma!", de: ["Vergiss nicht, morgen zu kommen!"], focus: [focus("zu-infinitiv", "zu kommen", [["morgen kommen", "vergessen'dan sonra zu + mastar gelir: …, morgen zu kommen."]])] },
  { tr: "Sigarayı bırakmaya karar verdim.", de: ["Ich habe beschlossen, mit dem Rauchen aufzuhören.", "Ich habe mich entschieden, mit dem Rauchen aufzuhören.", "Ich habe beschlossen, das Rauchen aufzugeben."], focus: [focus("zu-infinitiv", "aufzuhören", [["zu aufhören", "Ayrılabilen fiilde zu ortaya girer: aufzuhören."]])] },
  { tr: "Almanya'da çalışmayı planlıyorum.", de: ["Ich habe vor, in Deutschland zu arbeiten.", "Ich plane, in Deutschland zu arbeiten."] },
  { tr: "Bugün alışveriş yapmaya vaktim yok.", de: ["Ich habe heute keine Zeit, einkaufen zu gehen.", "Heute habe ich keine Zeit, einkaufen zu gehen.", "Ich habe heute keine Zeit, einzukaufen.", "Heute habe ich keine Zeit, einzukaufen."], focus: [focus("zu-infinitiv", "zu gehen", [["keine Zeit einkaufen gehen", "Zeit haben'dan sonra zu + mastar gelir: …, einkaufen zu gehen."]])] },
  { tr: "Her gün biraz Almanca okumaya çalışıyorum.", de: ["Ich versuche, jeden Tag ein bisschen Deutsch zu lesen.", "Ich versuche jeden Tag, ein bisschen Deutsch zu lesen."] },
  { tr: "Seninle tanışmak güzeldi.", de: ["Es war schön, dich kennenzulernen.", "Schön, dich kennenzulernen."], focus: [focus("zu-infinitiv", "kennenzulernen", [["zu kennenlernen", "Ayrılabilen fiilde zu ortaya girer: kennenzulernen."]])] },
]);

// ---------- Genitiv ----------

const GEN_CAUSES: { tr: string; de: string[]; wrong: [string, string][]; ok: string[] }[] = [
  { tr: "yağmur yüzünden", de: ["wegen des Regens"], wrong: [["wegen dem Regen", "Konuşmada duyulur ama doğrusu Genitiv: wegen des Regens."], ["wegen der Regen", "der Regen eril; Genitiv: des Regens."], ["wegen des Regen", "Eril isim Genitiv'de -s alır: des Regens."]], ok: ["mac", "evde", "gec"] },
  { tr: "kar yüzünden", de: ["wegen des Schnees"], wrong: [["wegen dem Schnee", "Doğrusu Genitiv: wegen des Schnees."], ["wegen des Schnee", "Eril isim Genitiv'de -s alır: des Schnees."]], ok: ["mac", "evde", "gec", "ucak"] },
  { tr: "grev yüzünden", de: ["wegen des Streiks"], wrong: [["wegen dem Streik", "Doğrusu Genitiv: wegen des Streiks."]], ok: ["tren", "gec"] },
  { tr: "trafik yüzünden", de: ["wegen des Verkehrs"], wrong: [["wegen dem Verkehr", "Doğrusu Genitiv: wegen des Verkehrs."]], ok: ["gec"] },
  { tr: "kötü hava yüzünden", de: ["wegen des schlechten Wetters"], wrong: [["wegen dem schlechten Wetter", "Doğrusu Genitiv: wegen des schlechten Wetters."], ["wegen des schlechten Wetter", "Nötr isim Genitiv'de -s alır: des schlechten Wetters."]], ok: ["mac", "evde", "ucak"] },
];
const GEN_CONS: Record<string, { tr: string; fin: string; s: string; mid?: string; end?: string }> = {
  mac: { tr: "maç iptal edildi", fin: "wurde", s: "das Spiel", end: "abgesagt" },
  evde: { tr: "evde kaldık", fin: "sind", s: "wir", mid: "zu Hause", end: "geblieben" },
  gec: { tr: "işe geç kaldım", fin: "bin", s: "ich", mid: "zu spät zur Arbeit", end: "gekommen" },
  tren: { tr: "trenler çalışmıyor", fin: "fahren", s: "die Züge", mid: "nicht" },
  ucak: { tr: "uçak kalkamadı", fin: "konnte", s: "das Flugzeug", mid: "nicht", end: "starten" },
};

const genitiv: Template = {
  id: "b1-wegen",
  level: "B1",
  topicId: "b1-genitiv",
  rules: ["genitiv"],
  hint: "wegen + Genitiv: wegen des Regens, wegen der Krankheit.",
  make(p) {
    const cause = p.pick(GEN_CAUSES);
    const cons = GEN_CONS[p.pick(cause.ok)];
    const de = cause.de.flatMap((c) => [
      sentence([c, cons.fin, cons.s, cons.mid, cons.end]),
      sentence([cons.s, cons.fin, c, cons.mid, cons.end]),
    ]);
    return {
      tr: trSentence([cause.tr, cons.tr]),
      de,
      vocab: [["wegen (+G)", "yüzünden"]],
      focus: [focus("genitiv", cause.de[0], cause.wrong)],
    };
  },
};

const genitivList = listTemplate("b1-trotz-waehrend", "B1", "b1-genitiv", ["genitiv"], "trotz (-e rağmen) ve während (sırasında) de Genitiv ister.", [
  { tr: "Yağmura rağmen yürüyüşe çıktık.", de: ["Trotz des Regens sind wir spazieren gegangen.", "Wir sind trotz des Regens spazieren gegangen."], focus: [focus("genitiv", "trotz des Regens", [["trotz dem Regen", "trotz Genitiv ister: trotz des Regens."]])] },
  { tr: "Soğuğa rağmen denize girdiler.", de: ["Trotz der Kälte sind sie schwimmen gegangen.", "Sie sind trotz der Kälte schwimmen gegangen.", "Trotz der Kälte sind sie im Meer geschwommen."], focus: [focus("genitiv", "trotz der Kälte", [["trotz die Kälte", "trotz Genitiv ister; dişil isimde der: trotz der Kälte."]])] },
  { tr: "Film sırasında uyuyakaldı.", de: ["Während des Films ist er eingeschlafen.", "Er ist während des Films eingeschlafen.", "Während des Films ist sie eingeschlafen.", "Sie ist während des Films eingeschlafen.", "Während des Films schlief er ein.", "Während des Films schlief sie ein."], focus: [focus("genitiv", "während des Films", [["während dem Film", "während Genitiv ister: während des Films."], ["während des Film", "Eril isim Genitiv'de -s alır: des Films."]])] },
  { tr: "Tatil boyunca çok kitap okudum.", de: ["Während der Ferien habe ich viele Bücher gelesen.", "Ich habe während der Ferien viele Bücher gelesen.", "Während des Urlaubs habe ich viele Bücher gelesen.", "Ich habe während des Urlaubs viele Bücher gelesen."] },
  { tr: "Hastalığı yüzünden işe gelemedi.", de: ["Wegen seiner Krankheit konnte er nicht zur Arbeit kommen.", "Wegen ihrer Krankheit konnte sie nicht zur Arbeit kommen.", "Er konnte wegen seiner Krankheit nicht zur Arbeit kommen.", "Sie konnte wegen ihrer Krankheit nicht zur Arbeit kommen."], focus: [focus("genitiv", "Krankheit", [["wegen seine Krankheit", "wegen Genitiv ister; dişil isimde seiner/ihrer: wegen seiner Krankheit."]])] },
]);

// ---------- Plusquamperfekt ----------

const PQ_ARRIVE: { tr: string; s: string; mid: string; fin: string; ok: string[] }[] = [
  { tr: "durağa vardığımda", s: "ich", mid: "an der Haltestelle", fin: "ankam", ok: ["bus"] },
  { tr: "istasyona vardığımda", s: "ich", mid: "am Bahnhof", fin: "ankam", ok: ["zug"] },
  { tr: "sinemaya vardığımızda", s: "wir", mid: "im Kino", fin: "ankamen", ok: ["film"] },
  { tr: "partiye geldiğimde", s: "ich", mid: "auf der Party", fin: "ankam", ok: ["gaeste"] },
  { tr: "eve geldiğimde", s: "ich", mid: "nach Hause", fin: "kam", ok: ["essen", "kinder"] },
];
const PQ_EVENTS: Record<string, { tr: string; fin: string; s: string; end: string; wrongAux: string }> = {
  bus: { tr: "otobüs çoktan kalkmıştı", fin: "war", s: "der Bus", end: "abgefahren", wrongAux: "hatte" },
  zug: { tr: "tren çoktan kalkmıştı", fin: "war", s: "der Zug", end: "abgefahren", wrongAux: "hatte" },
  film: { tr: "film çoktan başlamıştı", fin: "hatte", s: "der Film", end: "angefangen", wrongAux: "war" },
  gaeste: { tr: "misafirlerin çoğu çoktan gitmişti", fin: "waren", s: "die meisten Gäste", end: "gegangen", wrongAux: "hatten" },
  essen: { tr: "ailem çoktan yemek yemişti", fin: "hatte", s: "meine Familie", end: "gegessen", wrongAux: "war" },
  kinder: { tr: "çocuklar çoktan uyumuştu", fin: "waren", s: "die Kinder", end: "eingeschlafen", wrongAux: "hatten" },
};

const plusquam: Template = {
  id: "b1-plusquam",
  level: "B1",
  topicId: "b1-plusquam",
  rules: ["plusquam", "nebensatz"],
  hint: "Daha önceki geçmiş: war / hatte + Partizip II. Als'lı yan cümlede fiil sonda.",
  make(p) {
    const arr = p.pick(PQ_ARRIVE);
    const ev = PQ_EVENTS[p.pick(arr.ok)];
    const sub = `als ${arr.s} ${arr.mid} ${arr.fin}`;
    const de = ["schon", "bereits"].flatMap((adv) => [
      sentence([`${sub},`, ev.fin, ev.s, adv, ev.end]),
      sentence([ev.s, ev.fin, adv, ev.end, `, ${sub}`]),
    ]);
    const perfekt = ev.fin === "war" ? "ist" : ev.fin === "hatte" ? "hat" : ev.fin === "waren" ? "sind" : "haben";
    return {
      tr: trSentence([arr.tr, ev.tr]),
      de,
      vocab: [["schon / bereits", "çoktan"], ["Plusquamperfekt", "-mıştı"]],
      focus: [
        focus("plusquam", `${ev.fin} ${ev.s}`, [
          [`${perfekt} ${ev.s}`, `Geçmişteki bir olaydan daha önce olan için Plusquamperfekt kullanılır: ${ev.fin} … ${ev.end}.`],
          [`${ev.wrongAux} ${ev.s}`, `${ev.end} için yardımcı fiil ${ev.fin === "war" || ev.fin === "waren" ? "sein (war)" : "haben (hatte)"}: ${ev.fin} … ${ev.end}.`],
          [`${ev.s} ${ev.fin}`, "Yan cümle başta olduğu için ana cümle çekimli fiille başlar."],
        ]),
        focus("nebensatz", `${arr.mid} ${arr.fin}`, [[`${arr.fin} ${arr.mid}`, `als'lı yan cümlede çekimli fiil sona gider: ${sub}.`]]),
      ],
    };
  },
};

export const B1: Template[] = [
  obwohl,
  alsWenn,
  bevorNachdem,
  damit,
  relativ,
  passiv,
  passivList,
  konj2If,
  polite,
  praepVerben,
  umZu,
  esIst,
  zuVerbs,
  genitiv,
  genitivList,
  plusquam,
];

