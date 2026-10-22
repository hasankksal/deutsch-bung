import {
  adjForm,
  capitalize,
  n,
  np,
  otherPresentForms,
  PERSONS,
  pp,
  praet,
  present,
  REFLEXIVE,
  sentence,
  V,
  type Case,
  type Det,
  type Noun,
  type NP,
  type Person,
  type Verb,
} from "../grammar/de";
import {
  copula,
  copulaPast,
  inabilityPast,
  past,
  present as trPresent,
  trCapitalize,
  trSentence,
  tv,
  type TrVerb,
} from "../grammar/tr";
import { focus, listTemplate, SUBJ, v2, type Subj, type Template } from "./engine";

const conjWhy = (v: Verb) =>
  `${v.inf} çekimi: ich ${present(v, "1sg")}, du ${present(v, "2sg")}, er/sie ${present(v, "3sg")}, wir ${present(v, "1pl")}.`;
const conjFocus = (rule: string, v: Verb, p: Person) =>
  focus(rule, present(v, p), otherPresentForms(v, p).map((f) => [f, conjWhy(v)] as [string, string]));

const PAST_TIMES: [string, string][] = [
  ["dün", "gestern"],
  ["dün akşam", "gestern Abend"],
  ["geçen hafta", "letzte Woche"],
  ["bu sabah", "heute Morgen"],
  ["hafta sonu", "am Wochenende"],
  ["önceki gün", "vorgestern"],
];

// ---------- Perfekt with haben ----------

interface PerfItem {
  v: Verb;
  tr: TrVerb;
  vocab: [string, string];
  wrong: string[];
  /** alt: other participles; also: other objects that translate the Turkish one just as well */
  objs: { tr: string; de: string; also?: string[]; only?: Subj[]; alt?: string[] }[];
}

const PERF_HABEN: PerfItem[] = [
  { v: V.sehen, tr: tv("izle"), vocab: ["sehen → gesehen", "görmek, izlemek"], wrong: ["geseht", "gesieht", "gesehnt"], objs: [{ tr: "bir film", de: "einen Film", alt: ["angeschaut"] }, { tr: "haberleri", de: "die Nachrichten", alt: ["angeschaut"] }] },
  { v: V.kaufen, tr: tv("al"), vocab: ["kaufen → gekauft", "satın almak"], wrong: ["gekaufen", "gekauf", "kaufte"], objs: [{ tr: "ekmek", de: "Brot" }, { tr: "yeni bir telefon", de: "ein neues Handy", also: ["ein neues Telefon"] }, { tr: "bir hediye", de: "ein Geschenk" }] },
  { v: V.lernen, tr: tv("çalış"), vocab: ["lernen → gelernt", "öğrenmek, ders çalışmak"], wrong: ["gelernen", "gelernd"], objs: [{ tr: "sınav için", de: "für die Prüfung" }] },
  { v: V.lesen, tr: tv("oku"), vocab: ["lesen → gelesen", "okumak"], wrong: ["geliest", "gelest", "gelesst"], objs: [{ tr: "bir kitap", de: "ein Buch" }, { tr: "gazeteyi", de: "die Zeitung" }] },
  { v: V.schreiben, tr: tv("yaz"), vocab: ["schreiben → geschrieben", "yazmak"], wrong: ["geschreibt", "geschriebt", "geschreiben"], objs: [{ tr: "bir e-posta", de: "eine E-Mail", also: ["eine Mail"] }, { tr: "bir mektup", de: "einen Brief" }] },
  { v: V.trinken, tr: tv("iç"), vocab: ["trinken → getrunken", "içmek"], wrong: ["getrinkt", "getrinken", "getrunkt"], objs: [{ tr: "çok kahve", de: "viel Kaffee" }] },
  { v: V.essen, tr: tv("ye"), vocab: ["essen → gegessen", "yemek"], wrong: ["geesst", "geessen", "gegesst", "geisst"], objs: [{ tr: "bir pizza", de: "eine Pizza" }, { tr: "çok tatlı", de: "viel Süßes", also: ["viele Süßigkeiten"] }] },
  { v: V.kochen, tr: tv("pişir"), vocab: ["kochen → gekocht", "pişirmek"], wrong: ["gekochen"], objs: [{ tr: "çorba", de: "Suppe", also: ["eine Suppe"] }, { tr: "makarna", de: "Nudeln", also: ["Pasta"] }] },
  { v: V.machen, tr: tv("yap"), vocab: ["machen → gemacht", "yapmak"], wrong: ["gemachen", "gemach"], objs: [{ tr: "ödevlerimi", de: "meine Hausaufgaben", only: [SUBJ.ben] }, { tr: "spor", de: "Sport" }] },
  { v: V.spielen, tr: tv("oyna"), vocab: ["spielen → gespielt", "oynamak"], wrong: ["gespielen"], objs: [{ tr: "futbol", de: "Fußball" }, { tr: "satranç", de: "Schach" }] },
  { v: V.arbeiten, tr: tv("çalış"), vocab: ["arbeiten → gearbeitet", "çalışmak"], wrong: ["gearbeiten", "gearbeit"], objs: [{ tr: "çok", de: "viel", alt: ["gelernt"] }] },
  { v: V.anrufen, tr: tv("ara"), vocab: ["anrufen → angerufen", "(telefonla) aramak"], wrong: ["geanruft", "angeruft", "geanrufen"], objs: [{ tr: "doktoru", de: "den Arzt" }, { tr: "patronu", de: "den Chef" }] },
  { v: V.vergessen, tr: tv("unut"), vocab: ["vergessen → vergessen", "unutmak"], wrong: ["vergesst", "gevergessen", "vergessent"], objs: [{ tr: "şemsiyemi", de: "meinen Regenschirm", also: ["meinen Schirm"], only: [SUBJ.ben] }, { tr: "şifreyi", de: "das Passwort" }] },
  { v: V.bezahlen, tr: tv("öde"), vocab: ["bezahlen → bezahlt", "ödemek"], wrong: ["gebezahlt", "bezahlen"], objs: [{ tr: "hesabı", de: "die Rechnung" }] },
  { v: V.besuchen, tr: tv("ziyaret et", "ziyaret ed"), vocab: ["besuchen → besucht", "ziyaret etmek"], wrong: ["gebesucht"], objs: [{ tr: "müzeyi", de: "das Museum" }, { tr: "arkadaşlarımızı", de: "unsere Freunde", only: [SUBJ.biz] }] },
  { v: V.einkaufen, tr: tv("alışveriş yap"), vocab: ["einkaufen → eingekauft", "alışveriş yapmak"], wrong: ["geeinkauft", "einkauft", "eingekaufen"], objs: [{ tr: "", de: "" }] },
];

const perfektHaben: Template = {
  id: "a2-perfekt-haben",
  level: "A2",
  topicId: "a2-perfekt",
  rules: ["perfekt", "partizip2"],
  hint: "Perfekt: haben 2. sırada, Partizip II en sonda.",
  make(p) {
    const item = p.pick(PERF_HABEN);
    const obj = p.pick(item.objs);
    const s = p.pick(obj.only ?? [SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const t = p.pick(PAST_TIMES);
    const parts = [item.v.part2, ...(obj.alt ?? [])];
    const fin = present(V.haben, s.de[0].p);
    return {
      tr: trSentence([t[0], obj.tr, past(item.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) =>
        [obj.de, ...(obj.also ?? [])].flatMap((mid) =>
          parts.flatMap((part) => v2({ subj: pron, fin: present(V.haben, q), adv: t[1], mid, end: part })),
        ),
      ),
      vocab: [item.vocab, [t[1], t[0]]],
      focus: [
        focus(
          "perfekt",
          fin,
          PERSONS.map((q) => [present(V.sein, q), `${item.v.inf} Perfekt'te haben alır: … ${fin} … ${item.v.part2}.`] as [string, string]),
        ),
        focus("partizip2", item.v.part2, item.wrong.map((w) => [w, `${item.v.inf} fiilinin Partizip II'si: ${item.v.part2}.`] as [string, string]), `Perfekt'te Partizip II (${item.v.part2}) cümlenin en sonuna gelir.`),
        conjFocus("perfekt", V.haben, s.de[0].p),
      ],
    };
  },
};

// ---------- Perfekt with sein ----------

const WRONG_P2: Record<string, string[]> = {
  gehen: ["gegeht", "gegehen", "gegangt"],
  fahren: ["gefahrt", "gefährt"],
  fliegen: ["gefliegt", "gefliegen"],
  reisen: ["gereisen"],
  kommen: ["gekommt", "gekamen"],
  aufstehen: ["aufgesteht", "aufgestehen", "geaufstanden"],
  bleiben: ["gebleibt", "gebleiben"],
  einschlafen: ["eingeschlaft", "eingeschläft", "geeinschlafen"],
  laufen: ["gelauft", "geläuft"],
  ziehen: ["geziehen", "geziegt"],
  umziehen: ["umgeziehen", "geumzogen"],
};

const PERF_SEIN: { trPre: string; tr: TrVerb; de: string; verbs: Verb[]; vocab: [string, string] }[] = [
  { trPre: "Berlin'e", tr: tv("git", "gid"), de: "nach Berlin", verbs: [V.fahren, V.fliegen, V.reisen], vocab: ["fahren → ist gefahren", "(taşıtla) gitmek"] },
  { trPre: "Türkiye'ye", tr: tv("git", "gid"), de: "in die Türkei", verbs: [V.fliegen, V.fahren, V.reisen], vocab: ["fliegen → ist geflogen", "uçakla gitmek"] },
  { trPre: "sinemaya", tr: tv("git", "gid"), de: "ins Kino", verbs: [V.gehen], vocab: ["gehen → ist gegangen", "gitmek"] },
  { trPre: "doktora", tr: tv("git", "gid"), de: "zum Arzt", verbs: [V.gehen], vocab: ["gehen → ist gegangen", "gitmek"] },
  { trPre: "eve", tr: tv("git", "gid"), de: "nach Hause", verbs: [V.gehen, V.fahren], vocab: ["nach Hause", "eve"] },
  { trPre: "çok erken", tr: tv("kalk"), de: "sehr früh", verbs: [V.aufstehen], vocab: ["aufstehen → ist aufgestanden", "kalkmak"] },
  { trPre: "evde", tr: tv("kal"), de: "zu Hause", verbs: [V.bleiben], vocab: ["bleiben → ist geblieben", "kalmak"] },
  { trPre: "televizyonun önünde", tr: tv("uyuyakal"), de: "vor dem Fernseher", verbs: [V.einschlafen], vocab: ["einschlafen → ist eingeschlafen", "uyuyakalmak"] },
  { trPre: "geç", tr: tv("kal"), de: "zu spät", verbs: [V.kommen], vocab: ["zu spät kommen", "geç kalmak"] },
  { trPre: "parkta", tr: tv("koş"), de: "im Park", verbs: [V.laufen], vocab: ["laufen → ist gelaufen", "koşmak"] },
  { trPre: "Münih'e", tr: tv("taşın"), de: "nach München", verbs: [V.umziehen, V.ziehen], vocab: ["umziehen → ist umgezogen", "taşınmak"] },
];

const perfektSein: Template = {
  id: "a2-perfekt-sein",
  level: "A2",
  topicId: "a2-perfekt",
  rules: ["perfekt", "partizip2"],
  hint: "Hareket ve durum değişikliği bildiren fiiller Perfekt'te sein alır: Ich bin … gefahren.",
  make(p) {
    const item = p.pick(PERF_SEIN);
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const t = p.pick(PAST_TIMES);
    const fin = present(V.sein, s.de[0].p);
    const main = item.verbs[0];
    return {
      tr: trSentence([t[0], item.trPre, past(item.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) =>
        item.verbs.flatMap((v) => v2({ subj: pron, fin: present(V.sein, q), adv: t[1], mid: item.de, end: v.part2 })),
      ),
      vocab: [item.vocab, [t[1], t[0]]],
      focus: [
        focus(
          "perfekt",
          fin,
          PERSONS.map(
            (q) => [present(V.haben, q), `${main.inf} hareket ya da durum değişikliği bildirir, Perfekt'te sein alır: … ${fin} … ${main.part2}.`] as [string, string],
          ),
        ),
        ...item.verbs.map((v) =>
          focus("partizip2", v.part2, (WRONG_P2[v.inf] ?? []).map((w) => [w, `${v.inf} fiilinin Partizip II'si: ${v.part2}.`] as [string, string]), `Perfekt'te Partizip II (${v.part2}) cümlenin en sonuna gelir.`),
        ),
      ],
    };
  },
};

// ---------- Dativ verbs ----------

interface Target {
  np: NP;
  alt?: NP;
  trDat: string;
  trAkk: string;
  v: [string, string];
}

const TARGETS: Target[] = [
  { np: { det: "mein", noun: n("Vater", "m", "Väter") }, trDat: "babama", trAkk: "babamı", v: ["der Vater, Väter", "baba"] },
  { np: { det: "mein", noun: n("Mutter", "f", "Mütter") }, trDat: "anneme", trAkk: "annemi", v: ["die Mutter, Mütter", "anne"] },
  { np: { det: "mein", noun: n("Bruder", "m", "Brüder") }, trDat: "erkek kardeşime", trAkk: "erkek kardeşimi", v: ["der Bruder, Brüder", "erkek kardeş"] },
  { np: { det: "mein", noun: n("Schwester", "f", "Schwestern") }, trDat: "kız kardeşime", trAkk: "kız kardeşimi", v: ["die Schwester, -n", "kız kardeş"] },
  {
    np: { det: "unser", noun: n("Nachbar", "m", "Nachbarn", { weak: "Nachbarn" }) },
    alt: { det: "unser", noun: n("Nachbarin", "f", "Nachbarinnen") },
    trDat: "komşumuza",
    trAkk: "komşumuzu",
    v: ["der Nachbar, -n / die Nachbarin", "komşu"],
  },
  {
    np: { det: "mein", noun: n("Lehrer", "m", "Lehrer") },
    alt: { det: "mein", noun: n("Lehrerin", "f", "Lehrerinnen") },
    trDat: "öğretmenime",
    trAkk: "öğretmenimi",
    v: ["der Lehrer / die Lehrerin", "öğretmen"],
  },
  { np: { det: "def", noun: n("Kind", "n", "Kinder"), plural: true }, trDat: "çocuklara", trAkk: "çocukları", v: ["das Kind, -er", "çocuk"] },
  {
    np: { det: "mein", noun: n("Freund", "m", "Freunde"), plural: true },
    alt: { det: "mein", noun: n("Freundin", "f", "Freundinnen"), plural: true },
    trDat: "arkadaşlarıma",
    trAkk: "arkadaşlarımı",
    v: ["der Freund, -e / die Freundin, -nen", "arkadaş"],
  },
  {
    np: { det: "mein", noun: n("Kollege", "m", "Kollegen", { weak: "Kollegen" }) },
    alt: { det: "mein", noun: n("Kollegin", "f", "Kolleginnen") },
    trDat: "iş arkadaşıma",
    trAkk: "iş arkadaşımı",
    v: ["der Kollege, -n / die Kollegin", "iş arkadaşı"],
  },
  { np: { det: "ein", adj: { base: "alt" }, noun: n("Frau", "f", "Frauen") }, trDat: "yaşlı bir kadına", trAkk: "yaşlı bir kadını", v: ["alt", "yaşlı"] },
  { np: { det: "def", noun: n("Tourist", "m", "Touristen", { weak: "Touristen" }), plural: true }, trDat: "turistlere", trAkk: "turistleri", v: ["der Tourist, -en", "turist"] },
];

const DAT_VERBS: { de: Verb; tr: TrVerb; trCase: "dat" | "akk"; vocab: [string, string] }[] = [
  { de: V.helfen, tr: tv("yardım et", "yardım ed"), trCase: "dat", vocab: ["helfen (+D)", "yardım etmek"] },
  { de: V.danken, tr: tv("teşekkür et", "teşekkür ed"), trCase: "dat", vocab: ["danken (+D)", "teşekkür etmek"] },
  { de: V.antworten, tr: tv("cevap ver"), trCase: "dat", vocab: ["antworten (+D)", "cevap vermek"] },
  { de: V.gratulieren, tr: tv("tebrik et", "tebrik ed"), trCase: "akk", vocab: ["gratulieren (+D)", "tebrik etmek"] },
];

const dativVerben: Template = {
  id: "a2-dativ-fiiller",
  level: "A2",
  topicId: "a2-dativ",
  rules: ["dativ-verben", "dativ"],
  hint: "helfen, danken, antworten, gratulieren Dativ ister: meinem Vater, meiner Mutter, den Kindern.",
  make(p) {
    const verb = p.pick(DAT_VERBS);
    const target = p.pick(TARGETS);
    const tense = p.pick(["praes", "perf"] as const);
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const time =
      tense === "praes"
        ? p.pick<[string, string]>([["sık sık", "oft"], ["her zaman", "immer"], ["", ""]])
        : p.pick<[string, string]>([["dün", "gestern"], ["geçen hafta", "letzte Woche"], ["", ""]]);
    const nps = [target.np, ...(target.alt ? [target.alt] : [])];
    const dats = nps.map((x) => np(x, "dat"));
    const trObj = verb.trCase === "dat" ? target.trDat : target.trAkk;
    const trVerb = tense === "praes" ? trPresent(verb.tr, s.trP) : past(verb.tr, s.trP);
    const de = s.de.flatMap(({ pron, p: q }) =>
      dats.flatMap((d) =>
        tense === "praes"
          ? v2({ subj: pron, fin: present(verb.de, q), adv: time[1] || undefined, mid: d, advLate: true })
          : v2({ subj: pron, fin: present(V.haben, q), adv: time[1] || undefined, mid: d, end: verb.de.part2, advLate: true }),
      ),
    );
    const wrong: [string, string][] = nps.flatMap((x) => [
      [np(x, "akk"), `Bu Akkusativ. ${verb.de.inf} Dativ ister: ${np(x, "dat")}.`] as [string, string],
      [np(x, "nom"), `Bu yalın hâl (Nominativ). ${verb.de.inf} Dativ ister: ${np(x, "dat")}.`] as [string, string],
    ]);
    return {
      tr: trSentence([time[0], trObj, trVerb]),
      de,
      vocab: [verb.vocab, target.v],
      focus: [
        ...dats.map((d) => focus("dativ-verben", d, wrong)),
        ...(tense === "praes" ? [conjFocus("praesens", verb.de, s.de[0].p)] : []),
      ],
    };
  },
};

// ---------- gefallen / gehören / passen ----------

const LIKERS: { tr: string; de: string[]; akk: string; nom: string }[] = [
  { tr: "hoşuma", de: ["mir"], akk: "mich", nom: "ich" },
  { tr: "babamın hoşuna", de: ["meinem Vater"], akk: "meinen Vater", nom: "mein Vater" },
  { tr: "annemin hoşuna", de: ["meiner Mutter"], akk: "meine Mutter", nom: "meine Mutter" },
  { tr: "çocukların hoşuna", de: ["den Kindern"], akk: "die Kinder", nom: "die Kinder" },
  { tr: "hoşumuza", de: ["uns"], akk: "uns", nom: "wir" },
  { tr: "arkadaşımın hoşuna", de: ["meinem Freund", "meiner Freundin"], akk: "meinen Freund", nom: "mein Freund" },
];

const LIKED: { tr: string; de: string[]; pl: boolean; v?: [string, string] }[] = [
  { tr: "bu şehir", de: ["diese Stadt", "die Stadt"], pl: false, v: ["die Stadt, Städte", "şehir"] },
  { tr: "bu film", de: ["dieser Film", "der Film"], pl: false, v: ["der Film, -e", "film"] },
  { tr: "yeni ev", de: ["das neue Haus"], pl: false, v: ["das Haus, Häuser", "ev"] },
  { tr: "bu restoran", de: ["dieses Restaurant", "das Restaurant"], pl: false, v: ["das Restaurant, -s", "restoran"] },
  { tr: "bu müzik", de: ["diese Musik", "die Musik"], pl: false, v: ["die Musik", "müzik"] },
  { tr: "bu ayakkabılar", de: ["diese Schuhe", "die Schuhe"], pl: true, v: ["der Schuh, -e", "ayakkabı"] },
  { tr: "hediyen", de: ["dein Geschenk"], pl: false, v: ["das Geschenk, -e", "hediye"] },
  { tr: "Berlin", de: ["Berlin"], pl: false },
];

const gefallen: Template = {
  id: "a2-gefallen",
  level: "A2",
  topicId: "a2-dativ",
  rules: ["gefallen", "dativ"],
  hint: "Beğenilen şey özne, beğenen kişi Dativ: Die Stadt gefällt mir.",
  make(p) {
    const liked = p.pick(LIKED);
    const liker = p.pick(LIKERS);
    const tense = p.pick(["praes", "past"] as const);
    const much = p.pick([true, false]);
    const fin = liked.pl ? "gefallen" : "gefällt";
    const other = liked.pl ? "gefällt" : "gefallen";
    const de: string[] = [];
    for (const thing of liked.de) {
      for (const who of liker.de) {
        const sehr = much ? ["sehr gut", "sehr"] : [""];
        for (const x of sehr) {
          if (tense === "praes") {
            de.push(sentence([thing, fin, who, x]), sentence([who, fin, thing, x]));
          } else {
            const aux = liked.pl ? "haben" : "hat";
            const pr = liked.pl ? "gefielen" : "gefiel";
            de.push(sentence([thing, aux, who, x, "gefallen"]), sentence([thing, pr, who, x]), sentence([who, aux, thing, x, "gefallen"]));
          }
        }
      }
    }
    return {
      tr: trSentence([liked.tr, much && "çok", liker.tr, tense === "praes" ? "gidiyor" : "gitti"]),
      de,
      vocab: [["gefallen (+D)", "hoşuna gitmek"], ...(liked.v ? [liked.v] : [])],
      focus: [
        ...liker.de.map((who) =>
          focus("gefallen", who, [
            [liker.akk, `Beğenen kişi Dativ olur: ${who} (${liker.akk} Akkusativ'dir).`],
            [liker.nom, `gefallen'da beğenen kişi özne değildir, Dativ olur: ${who}.`],
          ]),
        ),
        focus("gefallen", tense === "praes" ? fin : liked.pl ? "haben" : "hat", [
          [other, `Fiil beğenilen şeye (özneye) uyar: tekilse gefällt, çoğulsa gefallen.`],
          ...(tense === "praes" ? [["gefalle", `gefallen'da özne beğenilen şeydir: ${capitalize(liked.de[0])} ${fin} mir. ('Ich gefalle' 'ben hoşa gidiyorum' demek olur.)`] as [string, string]] : []),
        ]),
      ],
    };
  },
};

const OWN_THINGS: { tr: string; de: string[]; pl: boolean }[] = [
  { tr: "bu araba", de: ["dieses Auto", "das Auto"], pl: false },
  { tr: "bu çanta", de: ["diese Tasche", "die Tasche"], pl: false },
  { tr: "bu bisiklet", de: ["dieses Fahrrad", "das Fahrrad"], pl: false },
  { tr: "bu anahtarlar", de: ["diese Schlüssel", "die Schlüssel"], pl: true },
  { tr: "bu kitap", de: ["dieses Buch", "das Buch"], pl: false },
];

const OWNERS_DAT: { tr: string; de: string[]; akk: string }[] = [
  { tr: "babama", de: ["meinem Vater"], akk: "meinen Vater" },
  { tr: "bana", de: ["mir"], akk: "mich" },
  { tr: "kız kardeşime", de: ["meiner Schwester"], akk: "meine Schwester" },
  { tr: "komşumuza", de: ["unserem Nachbarn", "unserer Nachbarin"], akk: "unseren Nachbarn" },
  { tr: "öğretmene", de: ["dem Lehrer", "der Lehrerin"], akk: "den Lehrer" },
];

const CLOTHES: { tr: string; de: string[]; pl: boolean }[] = [
  { tr: "bu ceket", de: ["diese Jacke", "die Jacke"], pl: false },
  { tr: "bu pantolon", de: ["diese Hose", "die Hose"], pl: false },
  { tr: "bu ayakkabılar", de: ["diese Schuhe", "die Schuhe"], pl: true },
  { tr: "bu elbise", de: ["dieses Kleid", "das Kleid"], pl: false },
];

const WEARERS: { tr: string; de: string[]; akk: string }[] = [
  { tr: "bana", de: ["mir"], akk: "mich" },
  { tr: "sana", de: ["dir"], akk: "dich" },
  { tr: "ona", de: ["ihm", "ihr"], akk: "ihn" },
];

const gehoerenPassen: Template = {
  id: "a2-gehoeren-passen",
  level: "A2",
  topicId: "a2-dativ",
  rules: ["gefallen", "dativ"],
  hint: "gehören ve passen de Dativ ister: Das Auto gehört mir. Die Jacke passt mir nicht.",
  make(p) {
    const kind = p.pick(["gehoeren", "passen"] as const);
    if (kind === "gehoeren") {
      const thing = p.pick(OWN_THINGS);
      const owner = p.pick(OWNERS_DAT);
      const fin = thing.pl ? "gehören" : "gehört";
      return {
        tr: trSentence([thing.tr, owner.tr, "ait"]),
        de: thing.de.flatMap((t) => owner.de.map((o) => sentence([t, fin, o]))),
        vocab: [["gehören (+D)", "ait olmak"]],
        focus: owner.de.map((o) => focus("gefallen", o, [[owner.akk, `gehören Dativ ister: ${o} (${owner.akk} Akkusativ'dir).`]])),
      };
    }
    const thing = p.pick(CLOTHES);
    const who = p.pick(WEARERS);
    const fin = thing.pl ? "passen" : "passt";
    return {
      tr: trSentence([thing.tr, who.tr, "olmuyor"]),
      de: thing.de.flatMap((t) => who.de.map((o) => sentence([t, fin, o, "nicht"]))),
      vocab: [["passen (+D)", "(giysi) olmak, uymak"]],
      focus: who.de.map((o) => focus("gefallen", o, [[who.akk, `passen Dativ ister: ${o} (${who.akk} Akkusativ'dir).`]])),
    };
  },
};

// ---------- mit + Dativ ----------

/** also: another accepted wording with its own typical mistakes */
const COMPANIONS: { tr: string; de: string[]; wrong: string[]; also?: { de: string; wrong: string[] }[] }[] = [
  { tr: "erkek kardeşimle", de: ["mit meinem Bruder"], wrong: ["mit meinen Bruder", "mit mein Bruder"] },
  { tr: "kız kardeşimle", de: ["mit meiner Schwester"], wrong: ["mit meine Schwester"] },
  { tr: "ailemle", de: ["mit meiner Familie"], wrong: ["mit meine Familie"] },
  { tr: "arkadaşlarımla", de: ["mit meinen Freunden"], wrong: ["mit meine Freunde", "mit meinen Freunde"] },
  {
    tr: "iş arkadaşlarımla",
    de: ["mit meinen Kollegen"],
    wrong: ["mit meine Kollegen"],
    also: [{ de: "mit meinen Arbeitskollegen", wrong: ["mit meine Arbeitskollegen"] }],
  },
  { tr: "çocuklarla", de: ["mit den Kindern"], wrong: ["mit die Kinder", "mit den Kinder"] },
  { tr: "komşumuzla", de: ["mit unserem Nachbarn", "mit unserer Nachbarin"], wrong: ["mit unseren Nachbarn", "mit unser Nachbar", "mit unsere Nachbarin"] },
];

const OUTINGS: { tr: string; de: string[]; v: Verb }[] = [
  { tr: "sinemaya", de: ["ins Kino"], v: V.gehen },
  { tr: "parka", de: ["in den Park"], v: V.gehen },
  { tr: "denize", de: ["ans Meer"], v: V.fahren },
  { tr: "Münih'e", de: ["nach München"], v: V.fahren },
  { tr: "bir konsere", de: ["zu einem Konzert", "in ein Konzert", "ins Konzert"], v: V.gehen },
  { tr: "kafeye", de: ["ins Café", "in ein Café"], v: V.gehen },
  { tr: "yüzmeye", de: ["schwimmen"], v: V.gehen },
];

const OUT_TIMES: [string, string][] = [
  ["cumartesi günü", "am Samstag"],
  ["yarın", "morgen"],
  ["bu akşam", "heute Abend"],
  ["hafta sonu", "am Wochenende"],
];

const mitDativ: Template = {
  id: "a2-mit",
  level: "A2",
  topicId: "a2-dativ",
  rules: ["dativ-praep", "dativ"],
  hint: "Türkçedeki '-le' Almancada mit + Dativ olur: mit meinem Bruder, mit meiner Familie.",
  make(p) {
    const comp = p.pick(COMPANIONS);
    const out = p.pick(OUTINGS);
    const t = p.pick(OUT_TIMES);
    const fin = present(out.v, "1sg");
    return {
      tr: trSentence([t[0], comp.tr, out.tr, trPresent(tv("git", "gid"), "1sg")]),
      de: [...comp.de, ...(comp.also ?? []).map((a) => a.de)].flatMap((c) =>
        out.de.flatMap((d) => v2({ subj: "ich", fin, adv: t[1], mid: `${c} ${d}` })),
      ),
      vocab: [["mit (+D)", "ile"]],
      focus: [...comp.de.map((c) => ({ de: c, wrong: comp.wrong })), ...(comp.also ?? [])].map((c) =>
        focus("dativ-praep", c.de, c.wrong.map((w) => [w, `mit her zaman Dativ ister: ${c.de}.`] as [string, string])),
      ),
    };
  },
};

// ---------- two-way prepositions ----------

interface WechselObj {
  trWo: string;
  trWohin: string;
  thing: string;
  pl?: boolean;
  prep: string;
  place: NP;
  wo: Verb[];
  wohin: Verb[];
  vocab: [string, string];
}

const WECHSEL_OBJ: WechselObj[] = [
  { trWo: "kitap masanın üstünde", trWohin: "kitabı masanın üstüne koydum", thing: "das Buch", prep: "auf", place: { det: "def", noun: n("Tisch", "m") }, wo: [V.liegen, V.sein], wohin: [V.legen, V.tun], vocab: ["der Tisch, -e", "masa"] },
  { trWo: "anahtarlar çantamda", trWohin: "anahtarları çantama koydum", thing: "die Schlüssel", pl: true, prep: "in", place: { det: "mein", noun: n("Tasche", "f") }, wo: [V.sein, V.liegen], wohin: [V.stecken, V.legen, V.tun], vocab: ["die Tasche, -n", "çanta"] },
  { trWo: "lamba masanın yanında duruyor", trWohin: "lambayı masanın yanına koydum", thing: "die Lampe", prep: "neben", place: { det: "def", noun: n("Tisch", "m") }, wo: [V.stehen], wohin: [V.stellen], vocab: ["neben", "yanında / yanına"] },
  { trWo: "resim duvarda asılı", trWohin: "resmi duvara astım", thing: "das Bild", prep: "an", place: { det: "def", noun: n("Wand", "f") }, wo: [V.haengen], wohin: [V.haengen], vocab: ["die Wand, Wände", "duvar"] },
  { trWo: "şişe buzdolabında", trWohin: "şişeyi buzdolabına koydum", thing: "die Flasche", prep: "in", place: { det: "def", noun: n("Kühlschrank", "m") }, wo: [V.stehen, V.sein], wohin: [V.stellen, V.tun], vocab: ["der Kühlschrank", "buzdolabı"] },
  { trWo: "kitaplar rafta", trWohin: "kitapları rafa koydum", thing: "die Bücher", pl: true, prep: "in", place: { det: "def", noun: n("Regal", "n") }, wo: [V.stehen, V.sein], wohin: [V.stellen], vocab: ["das Regal, -e", "raf"] },
  { trWo: "ceket dolapta asılı", trWohin: "ceketi dolaba astım", thing: "die Jacke", prep: "in", place: { det: "def", noun: n("Schrank", "m") }, wo: [V.haengen], wohin: [V.haengen], vocab: ["der Schrank, Schränke", "dolap"] },
];

const WECHSEL_GO: { place: Noun; trLoc: string; trDat: string; alsoTo?: string[] }[] = [
  { place: n("Park", "m"), trLoc: "parkta", trDat: "parka" },
  { place: n("Schule", "f"), trLoc: "okulda", trDat: "okula", alsoTo: ["zur Schule"] },
  { place: n("Küche", "f"), trLoc: "mutfakta", trDat: "mutfağa" },
  { place: n("Garten", "m"), trLoc: "bahçede", trDat: "bahçeye" },
  { place: n("Kino", "n"), trLoc: "sinemada", trDat: "sinemaya" },
  { place: n("Stadt", "f"), trLoc: "şehirde", trDat: "şehre" },
  { place: n("Büro", "n"), trLoc: "ofiste", trDat: "ofise", alsoTo: ["zur Arbeit"] },
];

const woWhy = (dat: string) => `Nerede? (durum) sorusunda Dativ kullanılır: ${dat}.`;
const wohinWhy = (akk: string) => `Nereye? (hareket) sorusunda Akkusativ kullanılır: ${akk}.`;

const wechsel: Template = {
  id: "a2-iki-yonlu",
  level: "A2",
  topicId: "a2-wechsel",
  rules: ["wechsel"],
  hint: "Nerede? → Dativ (auf dem Tisch), nereye? → Akkusativ (auf den Tisch).",
  make(p) {
    const kind = p.pick(["obj", "obj", "go"] as const);
    const dir = p.pick(["wo", "wohin"] as const);
    if (kind === "obj") {
      const item = p.pick(WECHSEL_OBJ);
      const dat = pp(item.prep, item.place, "dat");
      const akk = pp(item.prep, item.place, "akk");
      if (dir === "wo") {
        const who: Person = item.pl ? "3pl" : "3sg";
        return {
          tr: trSentence([item.trWo]),
          de: item.wo.map((v) => sentence([item.thing, present(v, who), dat])),
          vocab: [item.vocab, ["liegen / stehen / hängen", "durmak, bulunmak"]],
          focus: [
            focus("wechsel", dat, [[akk, woWhy(dat)]]),
            focus("wechsel", present(item.wo[0], who), [
              [present(V.legen, who), "Durum anlatırken liegen, hareket anlatırken legen kullanılır."],
              [present(V.stellen, who), "Durum anlatırken stehen, hareket anlatırken stellen kullanılır."],
            ]),
          ],
        };
      }
      return {
        tr: trSentence([item.trWohin]),
        de: item.wohin.map((v) => sentence(["ich", "habe", item.thing, akk, v.part2])),
        vocab: [item.vocab, ["legen / stellen / hängen", "koymak, asmak"]],
        focus: [
          focus("wechsel", akk, [[dat, wohinWhy(akk)]]),
          focus("wechsel", item.wohin[0].part2, [
            ["gelegen", "Bir yere koymak (hareket) legen'dir: gelegt. 'gelegen' liegen'in Partizip'idir."],
            ["gestanden", "Bir yere koymak (hareket) stellen'dir: gestellt. 'gestanden' stehen'in Partizip'idir."],
          ]),
        ],
      };
    }
    const item = p.pick(WECHSEL_GO);
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const dat = pp("in", { det: "def", noun: item.place }, "dat");
    const akk = pp("in", { det: "def", noun: item.place }, "akk");
    if (dir === "wo") {
      return {
        tr: trSentence([s.trP === "3sg" && "o", copula(item.trLoc, s.trP)]),
        de: s.de.map(({ pron, p: q }) => sentence([pron, present(V.sein, q), dat])),
        focus: [focus("wechsel", dat, [[akk, woWhy(dat)]])],
      };
    }
    return {
      tr: trSentence([item.trDat, trPresent(tv("git", "gid"), s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) => [akk, ...(item.alsoTo ?? [])].map((to) => sentence([pron, present(V.gehen, q), to]))),
      focus: [focus("wechsel", akk, [[dat, wohinWhy(akk)]])],
    };
  },
};

// ---------- weil / denn ----------

type Who = { pron: string; p: Person };

const WEIL_MAINS: { id: string; tr: [string, string]; de: (w: Who) => string[] }[] = [
  { id: "gelemem", tr: ["bugün gelemiyorum", "bugün gelemiyor"], de: (w) => v2({ subj: w.pron, fin: present(V.koennen, w.p), adv: "heute", mid: "nicht", end: "kommen", punct: "" }) },
  { id: "evde", tr: ["evde kalıyorum", "evde kalıyor"], de: (w) => v2({ subj: w.pron, fin: present(V.bleiben, w.p), mid: "zu Hause", punct: "" }) },
  { id: "erken", tr: ["erken yatıyorum", "erken yatıyor"], de: (w) => ["früh ins Bett", "früh schlafen"].flatMap((mid) => v2({ subj: w.pron, fin: present(V.gehen, w.p), mid, punct: "" })) },
  { id: "parti", tr: ["partiye gitmiyorum", "partiye gitmiyor"], de: (w) => ["nicht zur Party", "nicht auf die Party"].flatMap((mid) => v2({ subj: w.pron, fin: present(V.gehen, w.p), mid, punct: "" })) },
  {
    id: "gec",
    tr: ["geç kaldım", "geç kaldı"],
    de: (w) => [
      ...v2({ subj: w.pron, fin: present(V.sein, w.p), mid: "zu spät", end: "gekommen", punct: "" }),
      ...v2({ subj: w.pron, fin: present(V.haben, w.p), mid: REFLEXIVE[w.p], end: "verspätet", punct: "" }),
    ],
  },
  {
    id: "taksi",
    tr: ["taksiye bindim", "taksiye bindi"],
    de: (w) => [
      ...v2({ subj: w.pron, fin: present(V.haben, w.p), mid: "ein Taxi", end: "genommen", punct: "" }),
      ...v2({ subj: w.pron, fin: present(V.sein, w.p), mid: "mit dem Taxi", end: "gefahren", punct: "" }),
    ],
  },
];

const WEIL_REASONS: { tr: [string, string]; weil: (w: Who) => string; denn: (w: Who) => string; ok: string[] }[] = [
  { tr: ["hastayım", "hasta"], weil: (w) => `${w.pron} krank ${present(V.sein, w.p)}`, denn: (w) => `${w.pron} ${present(V.sein, w.p)} krank`, ok: ["gelemem", "evde", "parti"] },
  { tr: ["çok yorgunum", "çok yorgun"], weil: (w) => `${w.pron} sehr müde ${present(V.sein, w.p)}`, denn: (w) => `${w.pron} ${present(V.sein, w.p)} sehr müde`, ok: ["gelemem", "evde", "erken", "parti"] },
  { tr: ["çalışmam gerekiyor", "çalışması gerekiyor"], weil: (w) => `${w.pron} arbeiten ${present(V.muessen, w.p)}`, denn: (w) => `${w.pron} ${present(V.muessen, w.p)} arbeiten`, ok: ["gelemem", "evde"] },
  { tr: ["zamanım yok", "zamanı yok"], weil: (w) => `${w.pron} keine Zeit ${present(V.haben, w.p)}`, denn: (w) => `${w.pron} ${present(V.haben, w.p)} keine Zeit`, ok: ["gelemem", "parti"] },
  { tr: ["yarın sınavım var", "yarın sınavı var"], weil: (w) => `${w.pron} morgen eine Prüfung ${present(V.haben, w.p)}`, denn: (w) => `${w.pron} ${present(V.haben, w.p)} morgen eine Prüfung`, ok: ["erken", "parti"] },
  { tr: ["otobüsü kaçırdım", "otobüsü kaçırdı"], weil: (w) => `${w.pron} den Bus verpasst ${present(V.haben, w.p)}`, denn: (w) => `${w.pron} ${present(V.haben, w.p)} den Bus verpasst`, ok: ["gec", "taksi"] },
  { tr: ["acelem vardı", "acelesi vardı"], weil: (w) => `${w.pron} es eilig ${praet(V.haben, w.p)}`, denn: (w) => `${w.pron} ${praet(V.haben, w.p)} es eilig`, ok: ["taksi"] },
];

const weil: Template = {
  id: "a2-weil",
  level: "A2",
  topicId: "a2-nebensatz",
  rules: ["nebensatz", "weil-denn"],
  hint: "weil'den sonra çekimli fiil en sona gider: …, weil ich krank bin.",
  make(p) {
    const main = p.pick(WEIL_MAINS);
    const reason = p.pick(WEIL_REASONS.filter((r) => r.ok.includes(main.id)));
    const i = p.pick([0, 0, 1] as const);
    const whos: Who[] = i === 0 ? [{ pron: "ich", p: "1sg" }] : [{ pron: "er", p: "3sg" }, { pron: "sie", p: "3sg" }];
    const de = whos.flatMap((w) =>
      main.de(w).flatMap((m) => [`${m}, weil ${reason.weil(w)}.`, `${m}, denn ${reason.denn(w)}.`]),
    );
    return {
      tr: `${trCapitalize(main.tr[i])} çünkü ${reason.tr[i]}.`,
      de,
      vocab: [["weil", "çünkü (fiil sona gider)"]],
      focus: whos.map((w) =>
        focus("nebensatz", reason.weil(w), [
          [`weil ${reason.denn(w)}`, `weil'den sonra çekimli fiil en sona gider: weil ${reason.weil(w)} (ya da: denn ${reason.denn(w)}).`],
        ]),
      ),
    };
  },
};

// ---------- dass ----------

const DASS_MATRIX: { id: string; tr: string; de: string[]; noV2?: boolean }[] = [
  { id: "think", tr: "düşünüyorum", de: ["Ich denke", "Ich glaube", "Ich finde"] },
  { id: "know", tr: "biliyorum", de: ["Ich weiß"], noV2: true },
  { id: "hope", tr: "umuyorum", de: ["Ich hoffe"] },
  { id: "say", tr: "söylüyor", de: ["Er sagt", "Sie sagt"] },
];

const DASS_CONTENT: { tr: string; vf: string[]; v2: string[]; ok: string[] }[] = [
  { tr: "Almancanın zor olduğunu", vf: ["Deutsch schwer ist", "Deutsch schwierig ist"], v2: ["Deutsch ist schwer", "Deutsch ist schwierig"], ok: ["think", "say"] },
  { tr: "senin haklı olduğunu", vf: ["du recht hast"], v2: ["du hast recht"], ok: ["think", "know", "say"] },
  { tr: "yakında geleceğini", vf: ["du bald kommst", "du bald kommen wirst"], v2: ["du kommst bald", "du wirst bald kommen"], ok: ["hope", "know"] },
  { tr: "onun Berlin'de yaşadığını", vf: ["er in Berlin wohnt", "sie in Berlin wohnt", "er in Berlin lebt", "sie in Berlin lebt"], v2: ["er wohnt in Berlin", "sie wohnt in Berlin", "er lebt in Berlin", "sie lebt in Berlin"], ok: ["know", "think"] },
  { tr: "filmin çok güzel olduğunu", vf: ["der Film sehr gut ist", "der Film sehr schön ist"], v2: ["der Film ist sehr gut", "der Film ist sehr schön"], ok: ["think", "say"] },
  {
    tr: "yarın havanın güzel olacağını",
    vf: ["das Wetter morgen schön ist", "das Wetter morgen schön wird", "das Wetter morgen schön sein wird"],
    v2: ["das Wetter ist morgen schön", "das Wetter wird morgen schön", "das Wetter wird morgen schön sein"],
    ok: ["hope", "think"],
  },
  { tr: "treni kaçırdığımızı", vf: ["wir den Zug verpasst haben"], v2: ["wir haben den Zug verpasst"], ok: ["think", "know"] },
  { tr: "her şeyin yolunda olduğunu", vf: ["alles in Ordnung ist"], v2: ["alles ist in Ordnung"], ok: ["hope", "think", "say"] },
];

const dass: Template = {
  id: "a2-dass",
  level: "A2",
  topicId: "a2-nebensatz",
  rules: ["nebensatz"],
  hint: "Türkçedeki '-dığını' dass ile kurulur ve fiil sona gider: …, dass du recht hast.",
  make(p) {
    const content = p.pick(DASS_CONTENT);
    const matrix = p.pick(DASS_MATRIX.filter((m) => content.ok.includes(m.id)));
    const de = matrix.de.flatMap((m) => [
      ...content.vf.map((c) => `${m}, dass ${c}.`),
      ...(matrix.noV2 ? [] : content.v2.map((c) => `${m}, ${c}.`)),
    ]);
    return {
      tr: trSentence([content.tr, matrix.tr]),
      de,
      vocab: [["dass", "-dığı(nı) (bağlaç)"]],
      focus: [
        focus(
          "nebensatz",
          content.vf[0],
          content.v2.map((c, i) => [`dass ${c}`, `dass'tan sonra çekimli fiil en sona gider: dass ${content.vf[i] ?? content.vf[0]}.`] as [string, string]),
        ),
      ],
    };
  },
};

// ---------- wenn ----------

const WENN_CONDS: { tr: string; vf: string; v2: string; ok: string[] }[] = [
  { tr: "zamanım olursa", vf: "ich Zeit habe", v2: "ich habe Zeit", ok: ["ara", "yardim", "sinema"] },
  { tr: "hava güzel olursa", vf: "das Wetter schön ist", v2: "das Wetter ist schön", ok: ["park", "bisiklet"] },
  { tr: "yorgunsam", vf: "ich müde bin", v2: "ich bin müde", ok: ["yat"] },
  { tr: "param olursa", vf: "ich Geld habe", v2: "ich habe Geld", ok: ["bisikletAl", "tatil"] },
  { tr: "yağmur yağarsa", vf: "es regnet", v2: "es regnet", ok: ["evde", "otobus"] },
];

const WENN_CONS: { id: string; tr: string; main: { fin: string; subj: string; mid: string; end?: string }[] }[] = [
  { id: "ara", tr: "seni ararım", main: [{ fin: "rufe", subj: "ich", mid: "dich", end: "an" }] },
  { id: "yardim", tr: "sana yardım ederim", main: [{ fin: "helfe", subj: "ich", mid: "dir" }] },
  { id: "sinema", tr: "sinemaya giderim", main: [{ fin: "gehe", subj: "ich", mid: "ins Kino" }] },
  { id: "park", tr: "parkta yürüyüş yaparız", main: [{ fin: "gehen", subj: "wir", mid: "im Park", end: "spazieren" }, { fin: "machen", subj: "wir", mid: "einen Spaziergang im Park" }] },
  { id: "bisiklet", tr: "bisiklete bineriz", main: [{ fin: "fahren", subj: "wir", mid: "Fahrrad" }, { fin: "fahren", subj: "wir", mid: "Rad" }] },
  { id: "yat", tr: "erken yatarım", main: [{ fin: "gehe", subj: "ich", mid: "früh ins Bett" }, { fin: "gehe", subj: "ich", mid: "früh schlafen" }] },
  { id: "bisikletAl", tr: "yeni bir bisiklet alırım", main: [{ fin: "kaufe", subj: "ich", mid: "ein neues Fahrrad" }] },
  { id: "tatil", tr: "tatile giderim", main: [{ fin: "fahre", subj: "ich", mid: "in den Urlaub" }, { fin: "fahre", subj: "ich", mid: "in Urlaub" }, { fin: "mache", subj: "ich", mid: "Urlaub" }] },
  { id: "evde", tr: "evde kalırız", main: [{ fin: "bleiben", subj: "wir", mid: "zu Hause" }] },
  { id: "otobus", tr: "otobüsle giderim", main: [{ fin: "fahre", subj: "ich", mid: "mit dem Bus" }, { fin: "nehme", subj: "ich", mid: "den Bus" }] },
];

const wenn: Template = {
  id: "a2-wenn",
  level: "A2",
  topicId: "a2-nebensatz",
  rules: ["nebensatz"],
  hint: "Wenn'li yan cümlede fiil sona gider; yan cümle başta ise ana cümle fiille başlar.",
  make(p) {
    const cond = p.pick(WENN_CONDS);
    const cons = p.pick(WENN_CONS.filter((c) => cond.ok.includes(c.id)));
    const de = cons.main.flatMap((m) => [
      sentence([`Wenn ${cond.vf},`, m.fin, m.subj, m.mid, m.end]),
      sentence([m.subj, m.fin, m.mid, m.end, `, wenn ${cond.vf}`]),
    ]);
    const m = cons.main[0];
    return {
      tr: trSentence([cond.tr, cons.tr]),
      de,
      vocab: [["wenn", "-ırsa, -dığında"]],
      focus: [
        focus("nebensatz", `${m.fin} ${m.subj}`, [
          [`${cond.vf}, ${m.subj} ${m.fin}`, `Yan cümle başa gelince ana cümle çekimli fiille başlar: Wenn ${cond.vf}, ${m.fin} ${m.subj} …`],
        ]),
        focus("nebensatz", cond.vf, [[`wenn ${cond.v2}`, `wenn'den sonra çekimli fiil sona gider: wenn ${cond.vf}.`]]),
      ],
    };
  },
};

// ---------- reflexive verbs ----------

const EVENTS: { tr: string; pps: string[]; v: [string, string]; only?: Subj[] }[] = [
  { tr: "hafta sonunu", pps: ["auf das Wochenende", "aufs Wochenende"], v: ["das Wochenende", "hafta sonu"] },
  { tr: "tatili", pps: ["auf die Ferien", "auf den Urlaub"], v: ["die Ferien / der Urlaub", "tatil"] },
  { tr: "partiyi", pps: ["auf die Party"], v: ["die Party, -s", "parti"] },
  { tr: "konseri", pps: ["auf das Konzert", "aufs Konzert"], v: ["das Konzert, -e", "konser"] },
  { tr: "yazı", pps: ["auf den Sommer"], v: ["der Sommer", "yaz"] },
  { tr: "doğum günümü", pps: ["auf meinen Geburtstag"], v: ["der Geburtstag, -e", "doğum günü"], only: [SUBJ.ben] },
];

const TR_SELF: Record<Person, string> = {
  "1sg": "kendimi",
  "2sg": "kendini",
  "3sg": "kendini",
  "1pl": "kendimizi",
  "2pl": "kendinizi",
  "3pl": "kendilerini",
};

const FEELINGS: { tr: string; de: string; neg?: boolean }[] = [
  { tr: "iyi", de: "gut" },
  { tr: "çok iyi", de: "sehr gut" },
  { tr: "yorgun", de: "müde" },
  { tr: "kötü", de: "schlecht" },
  { tr: "iyi", de: "nicht gut", neg: true },
];

const reflWhy = "Dönüşlü zamir özneye uyar: ich → mich, du → dich, er/sie → sich, wir → uns, ihr → euch, sie → sich.";
const reflFocus = (fin: string, p: Person) =>
  focus(
    "reflexiv",
    `${fin} ${REFLEXIVE[p]}`,
    PERSONS.filter((q) => REFLEXIVE[q] !== REFLEXIVE[p]).map((q) => [`${fin} ${REFLEXIVE[q]}`, reflWhy] as [string, string]),
  );

const reflexiv: Template = {
  id: "a2-donuslu",
  level: "A2",
  topicId: "a2-reflexiv",
  rules: ["reflexiv", "freuen-auf-ueber"],
  hint: "Dönüşlü zamir özneye uyar: Ich freue mich, wir freuen uns.",
  make(p) {
    const kind = p.pick(["freuen", "freuen", "fuehlen", "beeilen", "treffen"] as const);
    if (kind === "freuen") {
      const ev = p.pick(EVENTS);
      const s = p.pick(ev.only ?? [SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
      const fin = present(V.freuen, s.de[0].p);
      return {
        tr: trSentence([ev.tr, "dört gözle", trPresent(tv("bekle"), s.trP)]),
        de: s.de.flatMap(({ pron, p: q }) =>
          ev.pps.flatMap((x) => [sentence([pron, present(V.freuen, q), REFLEXIVE[q], x]), sentence([pron, present(V.freuen, q), REFLEXIVE[q], "schon", x])]),
        ),
        vocab: [["sich freuen auf (+A)", "dört gözle beklemek"], ev.v],
        focus: [
          reflFocus(fin, s.de[0].p),
          focus("freuen-auf-ueber", ev.pps[0], [
            [ev.pps[0].replace(/^auf/, "für"), "Gelecekteki bir şeyi beklerken sich freuen auf kullanılır (für değil)."],
            [ev.pps[0].replace(/^auf/, "über"), "über olmuş bir şeye sevinmek içindir; gelecekteki şey için auf kullanılır."],
          ]),
        ],
      };
    }
    if (kind === "fuehlen") {
      const f = p.pick(FEELINGS);
      const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz]);
      const today = p.pick([null, ["bugün", "heute"] as [string, string]]);
      const trVerb = trPresent(tv("hisset", "hissed"), s.trP, f.neg);
      return {
        tr: trSentence([today?.[0], TR_SELF[s.trP], f.tr, trVerb]),
        de: s.de.flatMap(({ pron, p: q }) => {
          const fin = present(V.fuehlen, q);
          const out = [sentence([pron, fin, REFLEXIVE[q], today?.[1], f.de])];
          if (today) out.push(sentence([today[1], fin, pron, REFLEXIVE[q], f.de]));
          return out;
        }),
        vocab: [["sich fühlen", "kendini … hissetmek"]],
        focus: [reflFocus(present(V.fuehlen, s.de[0].p), s.de[0].p)],
      };
    }
    if (kind === "beeilen") {
      const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.biz, SUBJ.onlar]);
      const necessity = { "1sg": "acele etmeliyim", "2sg": "acele etmelisin", "3sg": "acele etmeli", "1pl": "acele etmeliyiz", "2pl": "acele etmelisiniz", "3pl": "acele etmeliler" }[s.trP];
      return {
        tr: trSentence([necessity]),
        de: s.de.map(({ pron, p: q }) => sentence([pron, present(V.muessen, q), REFLEXIVE[q], "beeilen"])),
        vocab: [["sich beeilen", "acele etmek"]],
        focus: [
          focus(
            "reflexiv",
            `${REFLEXIVE[s.de[0].p]} beeilen`,
            PERSONS.filter((q) => REFLEXIVE[q] !== REFLEXIVE[s.de[0].p]).map((q) => [`${REFLEXIVE[q]} beeilen`, reflWhy] as [string, string]),
          ),
        ],
      };
    }
    const s = p.pick([SUBJ.ben, SUBJ.biz, SUBJ.onlar]);
    const when = p.pick<[string, string]>([["cumartesi günü", "am Samstag"], ["bu akşam", "heute Abend"], ["yarın", "morgen"]]);
    return {
      tr: trSentence([when[0], "arkadaşlarla", trPresent(tv("buluş"), s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) => {
        const fin = present(V.treffen, q);
        return [
          sentence([pron, fin, REFLEXIVE[q], when[1], "mit Freunden"]),
          sentence([when[1], fin, pron, REFLEXIVE[q], "mit Freunden"]),
          sentence([pron, fin, when[1], "Freunde"]),
          sentence([when[1], fin, pron, "Freunde"]),
        ];
      }),
      vocab: [["sich treffen mit (+D)", "-le buluşmak"]],
      focus: [reflFocus(present(V.treffen, s.de[0].p), s.de[0].p)],
    };
  },
};

// ---------- comparison ----------

const CMP_SUBJ: { tr: string; de: string[] }[] = [
  { tr: "erkek kardeşim", de: ["mein Bruder"] },
  { tr: "kız kardeşim", de: ["meine Schwester"] },
  { tr: "babam", de: ["mein Vater"] },
  { tr: "arkadaşım", de: ["mein Freund", "meine Freundin"] },
  { tr: "kuzenim", de: ["mein Cousin", "meine Cousine"] },
];

const CMP_REF: { tr: string; de: string; akk?: string }[] = [
  { tr: "benden", de: "ich", akk: "mich" },
  { tr: "senden", de: "du", akk: "dich" },
  { tr: "annemden", de: "meine Mutter" },
  { tr: "bizden", de: "wir", akk: "uns" },
];

const CMP_ADJ: { tr: string; de: string; base: string; wrong: string[] }[] = [
  { tr: "uzun", de: "größer", base: "groß", wrong: ["großer", "groser", "mehr groß", "länger"] },
  { tr: "büyük", de: "älter", base: "alt", wrong: ["alter", "mehr alt", "größer"] },
  { tr: "küçük", de: "jünger", base: "jung", wrong: ["junger", "mehr jung", "kleiner"] },
  { tr: "sabırlı", de: "geduldiger", base: "geduldig", wrong: ["mehr geduldig"] },
  { tr: "çalışkan", de: "fleißiger", base: "fleißig", wrong: ["mehr fleißig"] },
];

const komparativ: Template = {
  id: "a2-karsilastirma",
  level: "A2",
  topicId: "a2-vergleich",
  rules: ["komparativ"],
  hint: "Sıfat + -er + als: größer als ich, älter als meine Mutter.",
  make(p) {
    const s = p.pick(CMP_SUBJ);
    const adj = p.pick(CMP_ADJ);
    // Only a father can plausibly be older than "my mother".
    const ref = p.pick(CMP_REF.filter((r) => !(r.tr === "annemden" && adj.base === "alt" && s.tr !== "babam")));
    const ageNote = adj.base === "alt" || adj.base === "jung" ? " (yaş için alt/jung kullanılır)" : adj.base === "groß" ? " (insan boyu için groß kullanılır)" : "";
    return {
      tr: trSentence([s.tr, ref.tr, "daha", adj.tr]),
      de: s.de.map((x) => sentence([x, "ist", adj.de, "als", ref.de])),
      vocab: [[`${adj.base} → ${adj.de}`, `${adj.tr} → daha ${adj.tr}`]],
      focus: [
        focus("komparativ", adj.de, adj.wrong.map((w) => [w, `Karşılaştırma: ${adj.base} → ${adj.de}${ageNote}.`] as [string, string])),
        focus("komparativ", `als ${ref.de}`, [
          ...(ref.akk ? [[`als ${ref.akk}`, `als'tan sonra özne hâli (Nominativ) gelir: als ${ref.de}.`] as [string, string]] : []),
          [`wie ${ref.de}`, "Karşılaştırmada als kullanılır; wie sadece eşitlikte (so … wie) kullanılır."],
        ]),
      ],
    };
  },
};

const comparisons = listTemplate("a2-karsilastirma-cumleler", "A2", "a2-vergleich", ["komparativ"], "Karşılaştırmada -er + als, eşitlikte so … wie, en üstünlükte am …-sten.", [
  { tr: "Berlin, Münih'ten daha büyük.", de: ["Berlin ist größer als München."], focus: [focus("komparativ", "größer", [["großer", "groß → größer (umlaut alır)."], ["mehr groß", "Almancada 'mehr' ile değil -er ekiyle karşılaştırılır: größer."]])] },
  { tr: "Tren otobüsten daha hızlı.", de: ["Der Zug ist schneller als der Bus."], focus: [focus("komparativ", "als der Bus", [["wie der Bus", "Karşılaştırmada als kullanılır."]])] },
  { tr: "Çay kahveden daha sağlıklı.", de: ["Tee ist gesünder als Kaffee."], focus: [focus("komparativ", "gesünder", [["gesunder", "gesund → gesünder (umlaut alır)."]])] },
  { tr: "Kış yazdan daha soğuk.", de: ["Der Winter ist kälter als der Sommer."], focus: [focus("komparativ", "kälter", [["kalter", "kalt → kälter (umlaut alır)."]])] },
  { tr: "Bugün hava dünden daha sıcak.", de: ["Heute ist es wärmer als gestern.", "Das Wetter ist heute wärmer als gestern.", "Es ist heute wärmer als gestern."], focus: [focus("komparativ", "wärmer", [["warmer", "warm → wärmer (umlaut alır)."]])] },
  { tr: "Bu ceket ötekinden daha ucuz.", de: ["Diese Jacke ist billiger als die andere.", "Diese Jacke ist günstiger als die andere."] },
  { tr: "Uçak trenden daha pahalı.", de: ["Das Flugzeug ist teurer als der Zug.", "Fliegen ist teurer als Zugfahren."], focus: [focus("komparativ", "teurer", [["teuerer", "teuer → teurer (e düşer)."]])] },
  { tr: "Almanca İngilizceden daha zor.", de: ["Deutsch ist schwerer als Englisch.", "Deutsch ist schwieriger als Englisch."] },
  { tr: "Senin Almancan benimkinden daha iyi.", de: ["Dein Deutsch ist besser als meins.", "Dein Deutsch ist besser als mein Deutsch."], focus: [focus("komparativ", "besser", [["guter", "gut düzensizdir: gut → besser."], ["mehr gut", "gut düzensizdir: gut → besser."]])] },
  { tr: "Kardeşim benden daha iyi Almanca konuşuyor.", de: ["Mein Bruder spricht besser Deutsch als ich.", "Meine Schwester spricht besser Deutsch als ich.", "Mein Bruder spricht Deutsch besser als ich.", "Meine Schwester spricht Deutsch besser als ich."], focus: [focus("komparativ", "als ich", [["als mich", "als'tan sonra özne hâli gelir: als ich."]])] },
  { tr: "Kardeşim benim kadar uzun.", de: ["Mein Bruder ist so groß wie ich.", "Meine Schwester ist so groß wie ich."], focus: [focus("komparativ", "so groß wie", [["so groß als", "Eşitlikte so … wie kullanılır."], ["größer als", "'… kadar' eşitliktir: so groß wie."]])] },
  { tr: "Ailede en uzun benim.", de: ["In meiner Familie bin ich am größten.", "Ich bin am größten in meiner Familie.", "Ich bin der Größte in meiner Familie.", "Ich bin die Größte in meiner Familie."], focus: [focus("komparativ", "am größten", [["am größer", "En üstünlük: am + -sten: am größten."], ["am meisten groß", "En üstünlük: am größten."]])] },
  { tr: "Kahveyi çaydan daha çok seviyorum.", de: ["Ich trinke lieber Kaffee als Tee.", "Ich mag Kaffee lieber als Tee.", "Ich mag Kaffee mehr als Tee."], focus: [focus("komparativ", "lieber", [["mehr gern", "gern düzensizdir: gern → lieber."], ["gerner", "gern düzensizdir: gern → lieber."]])] },
]);

// ---------- Präteritum ----------

const STATES_PAST: { tr: string; de: string }[] = [
  { tr: "çok yorgun", de: "sehr müde" },
  { tr: "hasta", de: "krank" },
  { tr: "çok mutlu", de: "sehr glücklich" },
  { tr: "evde", de: "zu Hause" },
  { tr: "Berlin'de", de: "in Berlin" },
  { tr: "çok meşgul", de: "sehr beschäftigt" },
];

const PAST_TIMES2: [string, string][] = [
  ["dün", "gestern"],
  ["geçen hafta", "letzte Woche"],
  ["geçen yıl", "letztes Jahr"],
  ["dün akşam", "gestern Abend"],
];

const praetWar: Template = {
  id: "a2-war",
  level: "A2",
  topicId: "a2-praeteritum",
  rules: ["praeteritum"],
  hint: "sein'ın geçmişi: ich war, du warst, er war, wir waren.",
  make(p) {
    const st = p.pick(STATES_PAST);
    const t = p.pick(PAST_TIMES2);
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const fin = praet(V.sein, s.de[0].p);
    return {
      tr: trSentence([t[0], copulaPast(st.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) => [
        ...v2({ subj: pron, fin: praet(V.sein, q), adv: t[1], mid: st.de }),
        ...v2({ subj: pron, fin: present(V.sein, q), adv: t[1], mid: st.de, end: "gewesen" }),
      ]),
      vocab: [[t[1], t[0]]],
      focus: [
        focus("praeteritum", fin, [
          ...PERSONS.map((q) => [present(V.sein, q), `Geçmiş zaman: ${fin} (ich war, du warst, er war, wir waren).`] as [string, string]),
          ...PERSONS.map((q) => [V.sein.konj2![PERSONS.indexOf(q)], "wäre Konjunktiv II'dir ('olsaydı'); geçmiş zaman için war kullanılır."] as [string, string]),
          ...PERSONS.filter((q) => praet(V.sein, q) !== fin).map((q) => [praet(V.sein, q), `war çekimi: ich war, du warst, er/sie war, wir waren. Burada: ${fin}.`] as [string, string]),
        ]),
      ],
    };
  },
};

const HATTE_ITEMS: { tr: [string, string, string | null]; de: string; alt?: string[]; adv: [string, string]; v: [string, string] }[] = [
  { tr: ["zamanım yoktu", "zamanı yoktu", "zamanımız yoktu"], de: "keine Zeit", adv: ["dün", "gestern"], v: ["die Zeit", "zaman"] },
  { tr: ["bir köpeğim vardı", "bir köpeği vardı", "bir köpeğimiz vardı"], de: "einen Hund", adv: ["eskiden", "früher"], v: ["der Hund, -e", "köpek"] },
  { tr: ["çok işim vardı", "çok işi vardı", "çok işimiz vardı"], de: "viel Arbeit", alt: ["viel zu tun"], adv: ["geçen hafta", "letzte Woche"], v: ["die Arbeit", "iş"] },
  { tr: ["baş ağrım vardı", "baş ağrısı vardı", null], de: "Kopfschmerzen", adv: ["dün akşam", "gestern Abend"], v: ["die Kopfschmerzen (Pl.)", "baş ağrısı"] },
];

const MODAL_PAST: { tr: (p: Person) => string; v: Verb; adv?: string; mid: string; alt?: string[]; end: string }[] = [
  { tr: (p) => `dün ${inabilityPast(tv("gel"), p)}`, v: V.koennen, adv: "gestern", mid: "nicht", end: "kommen" },
  { tr: (p) => `erken kalkmak zorunda ${past(tv("kal"), p)}`, v: V.muessen, mid: "früh", end: "aufstehen" },
  { tr: (p) => `sinemaya gitmek ${past(tv("iste"), p)}`, v: V.wollen, mid: "ins Kino", end: "gehen" },
  { tr: (p) => `dün çalışmak zorunda ${past(tv("kal"), p)}`, v: V.muessen, adv: "gestern", mid: "", end: "arbeiten" },
  {
    tr: (p) => `toplantıya ${inabilityPast(tv("katıl"), p)}`,
    v: V.koennen,
    mid: "nicht an der Besprechung",
    alt: ["an der Besprechung nicht", "nicht an der Sitzung", "an der Sitzung nicht", "nicht am Meeting", "am Meeting nicht"],
    end: "teilnehmen",
  },
];

const praetHatteModal: Template = {
  id: "a2-hatte-modal",
  level: "A2",
  topicId: "a2-praeteritum",
  rules: ["praeteritum"],
  hint: "Geçmiş: hatte, konnte, musste, wollte (umlaut yok).",
  make(p) {
    const kind = p.pick(["hatte", "modal"] as const);
    const owner = p.pick(OWNER_SUBJ);
    if (kind === "hatte") {
      const item = p.pick(HATTE_ITEMS.filter((h) => h.tr[owner.i]));
      const fin = praet(V.haben, owner.s.de[0].p);
      return {
        tr: trSentence([item.adv[0], item.tr[owner.i]]),
        de: owner.s.de.flatMap(({ pron, p: q }) =>
          [item.de, ...(item.alt ?? [])].flatMap((mid) => v2({ subj: pron, fin: praet(V.haben, q), adv: item.adv[1], mid })),
        ),
        vocab: [item.v, ["hatte", "vardı (haben, geçmiş)"]],
        focus: [
          focus("praeteritum", fin, [
            ...PERSONS.map((q) => [present(V.haben, q), `Geçmiş zaman: ${fin} (ich hatte, du hattest, er hatte, wir hatten).`] as [string, string]),
            ...PERSONS.map((q) => [V.haben.konj2![PERSONS.indexOf(q)], "hätte Konjunktiv II'dir ('olsaydı'); geçmiş için hatte kullanılır."] as [string, string]),
          ]),
        ],
      };
    }
    const m = p.pick(MODAL_PAST);
    const fin = praet(m.v, owner.s.de[0].p);
    return {
      tr: trSentence([m.tr(owner.s.trP)]),
      de: owner.s.de.flatMap(({ pron, p: q }) =>
        [m.mid, ...(m.alt ?? [])].flatMap((mid) => v2({ subj: pron, fin: praet(m.v, q), adv: m.adv, mid, end: m.end })),
      ),
      vocab: [[`${m.v.inf} → ${praet(m.v, "1sg")}`, "geçmiş"]],
      focus: [
        focus("praeteritum", fin, [
          ...(m.v.konj2 ? PERSONS.map((q) => [m.v.konj2![PERSONS.indexOf(q)], `Präteritum'da umlaut yok: ${fin}. '${m.v.konj2![PERSONS.indexOf(q)]}' Konjunktiv II'dir ('-ebilirdi / -meliydi').`] as [string, string]) : []),
          ...PERSONS.map((q) => [present(m.v, q), `Geçmiş zaman: ${fin}.`] as [string, string]),
        ]),
      ],
    };
  },
};

const OWNER_SUBJ: { i: 0 | 1 | 2; s: Subj }[] = [
  { i: 0, s: SUBJ.ben },
  { i: 1, s: SUBJ.o },
  { i: 2, s: SUBJ.biz },
];

// ---------- adjective endings ----------

const ADJ_TR: Record<string, string> = {
  neu: "yeni",
  rot: "kırmızı",
  alt: "eski",
  schnell: "hızlı",
  warm: "kalın",
  schwarz: "siyah",
  groß: "büyük",
  klein: "küçük",
  hell: "aydınlık",
  blau: "mavi",
  rund: "yuvarlak",
  teuer: "pahalı",
  schön: "güzel",
  süß: "sevimli",
  laut: "gürültücü",
  schwer: "ağır",
};
const ADJ_STEM: Record<string, string> = { teuer: "teur" };
const adj = (base: string) => ({ base, stem: ADJ_STEM[base] });
/** Other adjectives that translate the Turkish one just as well (kalın ceket → eine dicke Jacke). */
const ADJ_ALT: Record<string, string[]> = { warm: ["dick"] };

const ADJ_ITEMS: { noun: Noun; tr: string; trPoss: string; trWith?: string; trIn?: string; adjs: string[]; preds: string[] }[] = [
  { noun: n("Auto", "n", "Autos"), tr: "araba", trPoss: "arabam", trWith: "arabamla", adjs: ["neu", "rot", "alt"], preds: ["schnell", "teuer", "schön"] },
  { noun: n("Jacke", "f", "Jacken"), tr: "ceket", trPoss: "ceketim", adjs: ["neu", "rot", "warm", "schwarz"], preds: ["teuer", "schön"] },
  { noun: n("Hund", "m", "Hunde"), tr: "köpek", trPoss: "köpeğim", adjs: ["groß", "klein", "schwarz"], preds: ["süß", "laut"] },
  { noun: n("Wohnung", "f", "Wohnungen"), tr: "daire", trPoss: "dairem", trIn: "dairede", adjs: ["klein", "groß", "hell"], preds: ["teuer", "schön"] },
  { noun: n("Fahrrad", "n", "Fahrräder"), tr: "bisiklet", trPoss: "bisikletim", trWith: "bisikletimle", adjs: ["neu", "alt", "blau"], preds: ["schnell", "teuer"] },
  { noun: n("Tisch", "m", "Tische"), tr: "masa", trPoss: "masam", adjs: ["groß", "rund", "alt"], preds: ["schwer", "schön"] },
  { noun: n("Haus", "n", "Häuser"), tr: "ev", trPoss: "evim", trIn: "evde", adjs: ["klein", "groß", "alt"], preds: ["schön", "teuer"] },
];

const GENDER_TR = { m: "eril", f: "dişil", n: "nötr", pl: "çoğul" } as const;
const CASE_TR: Record<Case, string> = { nom: "Nominativ", akk: "Akkusativ", dat: "Dativ", gen: "Genitiv" };
const DET_TR: Partial<Record<Det, string>> = { def: "der/die/das", ein: "ein", mein: "mein" };

function adjFocus(base: string, det: Det, c: Case, noun: Noun) {
  const a = adj(base);
  const form = adjForm(a, det, c, noun.g);
  const stem = a.stem ?? a.base;
  const phrase = np({ det, adj: a, noun }, c);
  const why = `${DET_TR[det] ?? det} + ${GENDER_TR[noun.g]} + ${CASE_TR[c]} → ${form}: ${phrase}.`;
  return focus(
    "adjektiv",
    form,
    [a.base, stem + "e", stem + "en", stem + "er", stem + "es", stem + "em"].map((w) => [w, why] as [string, string]),
  );
}

const adjektiv: Template = {
  id: "a2-sifat",
  level: "A2",
  topicId: "a2-adjektiv",
  rules: ["adjektiv"],
  hint: "Sıfat; artikele, cinsiyete ve hâle göre ek alır: ein neues Auto, der neue Lehrer, mit meinem neuen Auto.",
  make(p) {
    const item = p.pick(ADJ_ITEMS);
    const a = p.pick(item.adjs);
    const frames = ["akk", "nom", ...(item.trWith ? ["mit"] : []), ...(item.trIn ? ["in"] : [])] as const;
    const frame = p.pick(frames);
    const aTr = ADJ_TR[a];
    const nps = (det: Det, c: Case) => [a, ...(ADJ_ALT[a] ?? [])].map((x) => np({ det, adj: adj(x), noun: item.noun }, c));
    if (frame === "akk") {
      const verbKind = p.pick(["suchen", "kaufen", "haben"] as const);
      const tr =
        verbKind === "suchen"
          ? trSentence([aTr, "bir", item.tr, "arıyorum"])
          : verbKind === "kaufen"
            ? trSentence([aTr, "bir", item.tr, "aldım"])
            : trSentence([aTr, "bir", item.trPoss, "var"]);
      const de = nps("ein", "akk").map((obj) =>
        verbKind === "suchen"
          ? sentence(["ich", "suche", obj])
          : verbKind === "kaufen"
            ? sentence(["ich", "habe", obj, "gekauft"])
            : sentence(["ich", "habe", obj]),
      );
      return { tr, de, vocab: [[a, aTr]], focus: [adjFocus(a, "ein", "akk", item.noun)] };
    }
    if (frame === "nom") {
      const pred = p.pick(item.preds.filter((x) => x !== a));
      return {
        tr: trSentence([aTr, item.tr, "çok", ADJ_TR[pred]]),
        de: nps("def", "nom").map((subj) => sentence([subj, "ist", "sehr", pred])),
        vocab: [[a, aTr], [pred, ADJ_TR[pred]]],
        focus: [adjFocus(a, "def", "nom", item.noun)],
      };
    }
    if (frame === "mit") {
      return {
        tr: trSentence([aTr, item.trWith, "işe gidiyorum"]),
        de: nps("mein", "dat").map((phrase) => sentence(["ich", "fahre", `mit ${phrase}`, "zur Arbeit"])),
        vocab: [[a, aTr], ["mit (+D)", "ile"]],
        focus: [adjFocus(a, "mein", "dat", item.noun)],
      };
    }
    return {
      tr: trSentence([aTr, "bir", item.trIn, "oturuyoruz"]),
      de: nps("ein", "dat").map((phrase) => sentence(["wir", "wohnen", `in ${phrase}`])),
      vocab: [[a, aTr], ["wohnen", "oturmak, yaşamak"]],
      focus: [adjFocus(a, "ein", "dat", item.noun)],
    };
  },
};

export const A2: Template[] = [
  perfektHaben,
  perfektSein,
  dativVerben,
  gefallen,
  gehoerenPassen,
  mitDativ,
  wechsel,
  weil,
  dass,
  wenn,
  reflexiv,
  komparativ,
  comparisons,
  praetWar,
  praetHatteModal,
  adjektiv,
];
