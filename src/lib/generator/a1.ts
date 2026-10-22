import { capitalize, n, np, otherPresentForms, PERSONS, present, REFLEXIVE, sentence, V, type Noun, type Person, type Verb } from "../grammar/de";
import {
  ability,
  copula,
  inabilityPresent,
  infinitive,
  necessity,
  present as trPresent,
  presentQ,
  trSentence,
  tv,
  type TrVerb,
} from "../grammar/tr";
import { focus, SUBJ, v2, type Subj, type Template } from "./engine";

const conjWhy = (v: Verb) =>
  `${v.inf} çekimi: ich ${present(v, "1sg")}, du ${present(v, "2sg")}, er/sie ${present(v, "3sg")}, wir ${present(v, "1pl")}.`;
const conjFocus = (rule: string, v: Verb, p: Person) =>
  focus(rule, present(v, p), otherPresentForms(v, p).map((f) => [f, conjWhy(v)] as [string, string]));

/** "sich treffen mit …": the reflexive pronoun stays right after the verb, or after the subject when the adverb comes first. */
const reflClause = (pron: string, fin: string, refl: string, adv: string | undefined, rest: string) => [
  sentence([pron, fin, refl, adv, rest]),
  ...(adv ? [sentence([adv, fin, pron, refl, rest])] : []),
];

// Synonyms accepted next to the verb a template practices (das Fenster schließen / zumachen).
const schliessen: Verb = { inf: "schließen", part2: "geschlossen", aux: "haben" };
const beginnen: Verb = { inf: "beginnen", part2: "begonnen", aux: "haben" };

// ---------- sein: age ----------

const AGES: [string, string, string][] = [
  ["on iki", "zwölf", "12"],
  ["on altı", "sechzehn", "16"],
  ["on sekiz", "achtzehn", "18"],
  ["yirmi", "zwanzig", "20"],
  ["yirmi iki", "zweiundzwanzig", "22"],
  ["yirmi beş", "fünfundzwanzig", "25"],
  ["otuz", "dreißig", "30"],
  ["otuz üç", "dreiunddreißig", "33"],
  ["kırk", "vierzig", "40"],
  ["kırk yedi", "siebenundvierzig", "47"],
];

const AGE_PEOPLE: { tr: string; p: Person; de: string[] }[] = [
  { tr: "", p: "1sg", de: ["ich"] },
  { tr: "", p: "2sg", de: ["du"] },
  { tr: "kız kardeşim", p: "3sg", de: ["meine Schwester"] },
  { tr: "erkek kardeşim", p: "3sg", de: ["mein Bruder"] },
  { tr: "babam", p: "3sg", de: ["mein Vater"] },
  { tr: "annem", p: "3sg", de: ["meine Mutter"] },
  { tr: "öğretmenimiz", p: "3sg", de: ["unser Lehrer", "unsere Lehrerin"] },
  { tr: "kuzenim", p: "3sg", de: ["mein Cousin", "meine Cousine"] },
];

const age: Template = {
  id: "a1-yas",
  level: "A1",
  topicId: "a1-sein-haben",
  rules: ["sein"],
  hint: "Yaş söylerken sein kullanılır: … ist … Jahre alt.",
  make(p) {
    const who = p.pick(AGE_PEOPLE);
    const a = p.pick(AGES);
    const fin = present(V.sein, who.p);
    return {
      tr: trSentence([who.tr, a[0], copula("yaşında", who.p)]),
      de: who.de.flatMap((s) => [a[1], a[2]].map((num) => sentence([s, fin, num, "Jahre alt"]))),
      vocab: [
        ["… Jahre alt sein", "… yaşında olmak"],
        [a[1], a[0]],
      ],
      focus: [
        focus("sein", fin, [
          ...["habe", "hast", "hat", "haben", "habt"].map(
            (f) => [f, "Yaş söylerken haben değil sein kullanılır: … ist … Jahre alt."] as [string, string],
          ),
          ...otherPresentForms(V.sein, who.p).map((f) => [f, conjWhy(V.sein)] as [string, string]),
        ]),
        focus("sein", "Jahre alt", [["Jahre", "Yaş kalıbı 'Jahre alt' ile biter: … fünfundzwanzig Jahre alt."]], "Yaş kalıbı 'Jahre alt' ile biter: … fünfundzwanzig Jahre alt."),
      ],
    };
  },
};

// ---------- haben: possession ----------

interface Owned {
  noun: Noun;
  tr: [string, string, string | null];
  v: [string, string];
  adv?: [string, string];
}

const OWNED: Owned[] = [
  { noun: n("Hund", "m", "Hunde"), tr: ["köpeğim", "köpeği", "köpeğimiz"], v: ["der Hund, -e", "köpek"] },
  { noun: n("Katze", "f", "Katzen"), tr: ["kedim", "kedisi", "kedimiz"], v: ["die Katze, -n", "kedi"] },
  { noun: n("Auto", "n", "Autos"), tr: ["arabam", "arabası", "arabamız"], v: ["das Auto, -s", "araba"] },
  { noun: n("Fahrrad", "n", "Fahrräder"), tr: ["bisikletim", "bisikleti", "bisikletimiz"], v: ["das Fahrrad, Fahrräder", "bisiklet"] },
  { noun: n("Garten", "m", "Gärten"), tr: ["bahçem", "bahçesi", "bahçemiz"], v: ["der Garten, Gärten", "bahçe"] },
  { noun: n("Computer", "m", "Computer"), tr: ["bilgisayarım", "bilgisayarı", "bilgisayarımız"], v: ["der Computer, -", "bilgisayar"] },
  { noun: n("Wohnung", "f", "Wohnungen"), tr: ["dairem", "dairesi", "dairemiz"], v: ["die Wohnung, -en", "daire"] },
  { noun: n("Bruder", "m", "Brüder"), tr: ["erkek kardeşim", "erkek kardeşi", null], v: ["der Bruder, Brüder", "erkek kardeş"] },
  { noun: n("Schwester", "f", "Schwestern"), tr: ["kız kardeşim", "kız kardeşi", null], v: ["die Schwester, -n", "kız kardeş"] },
  { noun: n("Termin", "m", "Termine"), tr: ["randevum", "randevusu", "randevumuz"], v: ["der Termin, -e", "randevu"], adv: ["yarın", "morgen"] },
  { noun: n("Idee", "f", "Ideen"), tr: ["fikrim", "fikri", "fikrimiz"], v: ["die Idee, -n", "fikir"] },
  { noun: n("Frage", "f", "Fragen"), tr: ["sorum", "sorusu", "sorumuz"], v: ["die Frage, -n", "soru"] },
];

const OWNERS: { i: 0 | 1 | 2; trPre: string; s: Subj }[] = [
  { i: 0, trPre: "", s: SUBJ.ben },
  { i: 1, trPre: "onun", s: SUBJ.o },
  { i: 2, trPre: "", s: SUBJ.biz },
];

const possession: Template = {
  id: "a1-var",
  level: "A1",
  topicId: "a1-sein-haben",
  rules: ["haben", "akkusativ"],
  hint: "'… var' (sahiplik) haben ile kurulur, eril nesnede ein → einen olur.",
  make(p) {
    const owner = p.pick(OWNERS);
    const item = p.pick(OWNED.filter((o) => o.tr[owner.i]));
    const obj = np({ det: "ein", noun: item.noun }, "akk");
    const objNom = np({ det: "ein", noun: item.noun }, "nom");
    const fins = owner.s.de.map(({ p: pp }) => present(V.haben, pp));
    return {
      tr: trSentence([item.adv?.[0], owner.trPre, "bir", item.tr[owner.i], "var"]),
      de: owner.s.de.flatMap(({ pron, p: pp }) => v2({ subj: pron, fin: present(V.haben, pp), adv: item.adv?.[1], mid: obj })),
      vocab: [item.v, ["haben", "sahip olmak, … var"]],
      focus: [
        focus("haben", fins[0], [
          ...otherPresentForms(V.haben, owner.s.de[0].p).map((f) => [f, conjWhy(V.haben)] as [string, string]),
          ["gibt", "Sahiplik anlatan '…m var' haben ile kurulur: Ich habe … ('es gibt' bir yerde bir şey bulunduğunu anlatır)."],
        ]),
        focus("akkusativ", obj, [[objNom, "Sahip olunan şey nesnedir (Akkusativ); eril isimde ein → einen olur."]]),
        focus("eksik-artikel", obj, [[item.noun.sg, `Türkçede 'bir' düşebilir ama Almancada artikel gerekir: ${obj}.`]]),
      ],
    };
  },
};

// ---------- Präsens: fahren with a vehicle ----------

const VEHICLES: { tr: string; noun: Noun; alt?: Noun[] }[] = [
  { tr: "otobüsle", noun: n("Bus", "m", "Busse") },
  { tr: "trenle", noun: n("Zug", "m", "Züge"), alt: [n("Bahn", "f", "Bahnen")] },
  { tr: "arabayla", noun: n("Auto", "n", "Autos") },
  { tr: "bisikletle", noun: n("Fahrrad", "n", "Fahrräder"), alt: [n("Rad", "n", "Räder")] },
  { tr: "metroyla", noun: n("U-Bahn", "f", "U-Bahnen") },
  { tr: "tramvayla", noun: n("Straßenbahn", "f", "Straßenbahnen") },
];

const DESTINATIONS: [string, string[]][] = [
  ["işe", ["zur Arbeit"]],
  ["okula", ["zur Schule", "in die Schule"]],
  ["üniversiteye", ["zur Uni", "zur Universität", "an die Uni", "an die Universität"]],
  ["şehir merkezine", ["in die Stadt", "ins Zentrum", "in die Innenstadt", "ins Stadtzentrum"]],
  ["eve", ["nach Hause"]],
  ["süpermarkete", ["zum Supermarkt", "in den Supermarkt"]],
];

const PRESENT_TIMES: [string, string][] = [
  ["her sabah", "jeden Morgen"],
  ["her gün", "jeden Tag"],
  ["sabahları", "morgens"],
  ["bugün", "heute"],
  ["yarın", "morgen"],
  ["hafta sonu", "am Wochenende"],
];

const fahren: Template = {
  id: "a1-tasitla",
  level: "A1",
  topicId: "a1-praesens",
  rules: ["praesens", "fahren-gehen", "dativ-praep"],
  hint: "Taşıtla gitmek: fahren (du fährst, er fährt). mit her zaman Dativ ister.",
  make(p) {
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const veh = p.pick(VEHICLES);
    const dest = p.pick(DESTINATIONS);
    const t = p.pick(PRESENT_TIMES);
    const nouns = [veh.noun, ...(veh.alt ?? [])];
    const mit = (noun: Noun, c: "dat" | "akk" | "nom" = "dat") => `mit ${np({ det: "def", noun }, c)}`;
    const pp = s.de[0].p;
    const fin = present(V.fahren, pp);
    return {
      tr: trSentence([t[0], veh.tr, dest[0], trPresent(tv("git", "gid"), s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) =>
        nouns.flatMap((noun) => dest[1].flatMap((d) => v2({ subj: pron, fin: present(V.fahren, q), adv: t[1], mid: `${mit(noun)} ${d}` }))),
      ),
      vocab: [
        ["fahren (fährt)", "(taşıtla) gitmek"],
        [`${np({ det: "def", noun: veh.noun }, "nom")}`, veh.tr.replace(/(y?la|y?le)$/, "")],
        [dest[1][0], dest[0]],
      ],
      focus: [
        focus(
          "fahren-gehen",
          fin,
          PERSONS.map((q) => [present(V.gehen, q), "Taşıtla gidiliyorsa gehen değil fahren kullanılır: mit dem Bus fahren."] as [string, string]),
        ),
        conjFocus("praesens", V.fahren, pp),
        ...nouns.map((noun) =>
          focus("dativ-praep", mit(noun), [
            [mit(noun, "akk"), `mit her zaman Dativ ister: ${mit(noun)}.`],
            [mit(noun, "nom"), `mit her zaman Dativ ister: ${mit(noun)}.`],
          ]),
        ),
      ],
    };
  },
};

// ---------- Präsens: stem-changing verbs ----------

interface StrongItem {
  v: Verb;
  tr: TrVerb;
  vocab: [string, string];
  /** refl: also accepted as a reflexive phrase (sich treffen + refl) */
  opts: { tr: string; adv?: string; mid: string[]; refl?: string }[];
}

const STRONG: StrongItem[] = [
  {
    v: V.sprechen,
    tr: tv("konuş"),
    vocab: ["sprechen (spricht)", "konuşmak"],
    opts: [
      { tr: "çok iyi Almanca", mid: ["sehr gut Deutsch", "Deutsch sehr gut"] },
      { tr: "biraz Türkçe", mid: ["ein bisschen Türkisch", "ein wenig Türkisch", "etwas Türkisch"] },
      { tr: "üç dil", mid: ["drei Sprachen"] },
    ],
  },
  {
    v: V.lesen,
    tr: tv("oku"),
    vocab: ["lesen (liest)", "okumak"],
    opts: [
      { tr: "her akşam kitap", adv: "jeden Abend", mid: ["ein Buch", "Bücher"] },
      { tr: "her sabah gazete", adv: "jeden Morgen", mid: ["Zeitung", "die Zeitung"] },
    ],
  },
  {
    v: V.essen,
    tr: tv("ye"),
    vocab: ["essen (isst)", "yemek"],
    opts: [
      { tr: "çok sebze", mid: ["viel Gemüse"] },
      { tr: "akşamları sadece salata", adv: "abends", mid: ["nur Salat", "nur einen Salat"] },
      { tr: "her gün meyve", adv: "jeden Tag", mid: ["Obst"] },
    ],
  },
  {
    v: V.schlafen,
    tr: tv("uyu"),
    vocab: ["schlafen (schläft)", "uyumak"],
    opts: [
      { tr: "hafta sonu çok uzun", adv: "am Wochenende", mid: ["sehr lange"] },
      { tr: "her gece sekiz saat", adv: "jede Nacht", mid: ["acht Stunden"] },
    ],
  },
  {
    v: V.nehmen,
    tr: tv("bin"),
    vocab: ["nehmen (nimmt)", "almak; (taşıta) binmek"],
    opts: [
      { tr: "her zaman taksiye", adv: "immer", mid: ["ein Taxi"] },
      { tr: "sabahları otobüse", adv: "morgens", mid: ["den Bus"] },
    ],
  },
  { v: V.laufen, tr: tv("koş"), vocab: ["laufen (läuft)", "koşmak"], opts: [{ tr: "her sabah parkta", adv: "jeden Morgen", mid: ["im Park"] }] },
  { v: V.vergessen, tr: tv("unut"), vocab: ["vergessen (vergisst)", "unutmak"], opts: [{ tr: "her zaman şifreyi", adv: "immer", mid: ["das Passwort"] }] },
  { v: V.waschen, tr: tv("yıka"), vocab: ["waschen (wäscht)", "yıkamak"], opts: [{ tr: "her hafta arabayı", adv: "jede Woche", mid: ["das Auto"] }] },
  { v: V.treffen, tr: tv("buluş"), vocab: ["treffen (trifft)", "buluşmak"], opts: [{ tr: "cuma günleri arkadaşlarla", adv: "freitags", mid: ["Freunde"], refl: "mit Freunden" }] },
];

const strong: Template = {
  id: "a1-duzensiz",
  level: "A1",
  topicId: "a1-praesens",
  rules: ["praesens"],
  hint: "Bazı fiillerde du ve er/sie için kök değişir: sprechen → spricht, lesen → liest, essen → isst.",
  make(p) {
    const item = p.pick(STRONG);
    const opt = p.pick(item.opts);
    const s = p.pick([SUBJ.sen, SUBJ.o, SUBJ.o, SUBJ.sen, SUBJ.ben, SUBJ.biz]);
    return {
      tr: trSentence([opt.tr, trPresent(item.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) => [
        ...opt.mid.flatMap((m) => v2({ subj: pron, fin: present(item.v, q), adv: opt.adv, mid: m })),
        ...(opt.refl ? reflClause(pron, present(item.v, q), REFLEXIVE[q], opt.adv, opt.refl) : []),
      ]),
      vocab: [item.vocab],
      focus: [conjFocus("praesens", item.v, s.de[0].p)],
    };
  },
};

// ---------- Akkusativ ----------

interface Thing {
  noun: Noun;
  /** other nouns that translate the Turkish word just as well */
  alt?: Noun[];
  tr: [string, string, string];
  v: [string, string];
}

const THINGS: Thing[] = [
  { noun: n("Schlüssel", "m", "Schlüssel"), tr: ["anahtarımı", "anahtarını", "anahtarını"], v: ["der Schlüssel, -", "anahtar"] },
  { noun: n("Regenschirm", "m", "Regenschirme"), alt: [n("Schirm", "m", "Schirme")], tr: ["şemsiyemi", "şemsiyeni", "şemsiyesini"], v: ["der Regenschirm, -e", "şemsiye"] },
  { noun: n("Pullover", "m", "Pullover"), tr: ["kazağımı", "kazağını", "kazağını"], v: ["der Pullover, -", "kazak"] },
  { noun: n("Mantel", "m", "Mäntel"), tr: ["paltomu", "paltonu", "paltosunu"], v: ["der Mantel, Mäntel", "palto"] },
  { noun: n("Ausweis", "m", "Ausweise"), alt: [n("Personalausweis", "m", "Personalausweise")], tr: ["kimliğimi", "kimliğini", "kimliğini"], v: ["der Ausweis, -e", "kimlik"] },
  { noun: n("Tasche", "f", "Taschen"), tr: ["çantamı", "çantanı", "çantasını"], v: ["die Tasche, -n", "çanta"] },
  { noun: n("Brille", "f", "Brillen"), tr: ["gözlüğümü", "gözlüğünü", "gözlüğünü"], v: ["die Brille, -n", "gözlük"] },
  { noun: n("Jacke", "f", "Jacken"), tr: ["ceketimi", "ceketini", "ceketini"], v: ["die Jacke, -n", "ceket"] },
  { noun: n("Handy", "n", "Handys"), alt: [n("Telefon", "n", "Telefone")], tr: ["telefonumu", "telefonunu", "telefonunu"], v: ["das Handy, -s", "cep telefonu"] },
  {
    noun: n("Portemonnaie", "n", "Portemonnaies"),
    alt: [n("Geldbörse", "f", "Geldbörsen"), n("Geldbeutel", "m", "Geldbeutel"), n("Brieftasche", "f", "Brieftaschen")],
    tr: ["cüzdanımı", "cüzdanını", "cüzdanını"],
    v: ["das Portemonnaie, -s", "cüzdan"],
  },
  { noun: n("Buch", "n", "Bücher"), tr: ["kitabımı", "kitabını", "kitabını"], v: ["das Buch, Bücher", "kitap"] },
];

const SEEKERS: { i: 0 | 1 | 2; de: { pron: string; p: Person; det: "mein" | "dein" | "sein" | "ihr" }[]; trP: Person }[] = [
  { i: 0, trP: "1sg", de: [{ pron: "ich", p: "1sg", det: "mein" }] },
  { i: 1, trP: "2sg", de: [{ pron: "du", p: "2sg", det: "dein" }] },
  {
    i: 2,
    trP: "3sg",
    de: [
      { pron: "er", p: "3sg", det: "sein" },
      { pron: "sie", p: "3sg", det: "ihr" },
    ],
  },
];

const akkSearch: Template = {
  id: "a1-akk-ariyorum",
  level: "A1",
  topicId: "a1-artikel-akk",
  rules: ["akkusativ", "artikel"],
  hint: "Aranan şey nesnedir (Akkusativ): eril isimde mein → meinen.",
  make(p) {
    const who = p.pick(SEEKERS);
    const thing = p.pick(THINGS);
    const neg = p.pick([false, true]);
    const verb = neg ? V.finden : V.suchen;
    const trVerb = neg ? inabilityPresent(tv("bul"), who.trP) : trPresent(tv("ara"), who.trP);
    const nouns = [thing.noun, ...(thing.alt ?? [])];
    return {
      tr: trSentence([thing.tr[who.i], trVerb]),
      de: who.de.flatMap((d) => nouns.map((noun) => sentence([d.pron, present(verb, d.p), np({ det: d.det, noun }, "akk"), neg && "nicht"]))),
      vocab: [thing.v, neg ? ["finden", "bulmak"] : ["suchen", "aramak"]],
      focus: who.de.flatMap((d) =>
        nouns.map((noun) =>
          focus("akkusativ", np({ det: d.det, noun }, "akk"), [
            [np({ det: d.det, noun }, "nom"), `Nesne olan eril isim Akkusativ'e girer: ${d.det} → ${d.det}en.`],
          ]),
        ),
      ),
    };
  },
};

const NEEDED: { noun: Noun; alt?: Noun[]; tr: string; v: [string, string] }[] = [
  { noun: n("Regenschirm", "m", "Regenschirme"), alt: [n("Schirm", "m", "Schirme")], tr: "bir şemsiye", v: ["der Regenschirm, -e", "şemsiye"] },
  { noun: n("Stuhl", "m", "Stühle"), tr: "bir sandalye", v: ["der Stuhl, Stühle", "sandalye"] },
  { noun: n("Kühlschrank", "m", "Kühlschränke"), tr: "bir buzdolabı", v: ["der Kühlschrank, -schränke", "buzdolabı"] },
  { noun: n("Arzt", "m", "Ärzte"), tr: "bir doktor", v: ["der Arzt, Ärzte", "doktor"] },
  { noun: n("Lampe", "f", "Lampen"), tr: "bir lamba", v: ["die Lampe, -n", "lamba"] },
  { noun: n("Fahrkarte", "f", "Fahrkarten"), alt: [n("Ticket", "n", "Tickets")], tr: "bir bilet", v: ["die Fahrkarte, -n", "(tren/otobüs) bileti"] },
  { noun: n("Pause", "f", "Pausen"), tr: "bir mola", v: ["die Pause, -n", "mola"] },
  { noun: n("Taxi", "n", "Taxis"), tr: "bir taksi", v: ["das Taxi, -s", "taksi"] },
  { noun: n("Zimmer", "n", "Zimmer"), tr: "bir oda", v: ["das Zimmer, -", "oda"] },
  { noun: n("Handy", "n", "Handys"), alt: [n("Telefon", "n", "Telefone")], tr: "yeni bir telefon", v: ["das Handy, -s", "cep telefonu"] },
];

const NEEDERS: { tr: string; s: Subj }[] = [
  { tr: "bana", s: SUBJ.ben },
  { tr: "sana", s: SUBJ.sen },
  { tr: "ona", s: SUBJ.o },
  { tr: "bize", s: SUBJ.biz },
];

const akkNeed: Template = {
  id: "a1-akk-lazim",
  level: "A1",
  topicId: "a1-artikel-akk",
  rules: ["akkusativ", "eksik-artikel"],
  hint: "'… lazım' → brauchen + Akkusativ: Ich brauche einen …",
  make(p) {
    const who = p.pick(NEEDERS);
    const item = p.pick(NEEDED);
    const isNew = item.tr.startsWith("yeni");
    const phrase = (noun: Noun, c: "akk" | "nom") => np({ det: "ein", adj: isNew ? { base: "neu" } : undefined, noun }, c);
    const nouns = [item.noun, ...(item.alt ?? [])];
    return {
      tr: trSentence([who.tr, item.tr, "lazım"]),
      de: who.s.de.flatMap(({ pron, p: q }) => nouns.map((noun) => sentence([pron, present(V.brauchen, q), phrase(noun, "akk")]))),
      vocab: [item.v, ["brauchen", "ihtiyacı olmak, … lazım"]],
      focus: nouns.flatMap((noun) => [
        focus("akkusativ", phrase(noun, "akk"), [[phrase(noun, "nom"), "brauchen'ın nesnesi Akkusativ'dir; eril isimde ein → einen olur."]]),
        focus("eksik-artikel", phrase(noun, "akk"), [[noun.sg, `Türkçede 'bir' düşebilir ama Almancada artikel gerekir: ${phrase(noun, "akk")}.`]]),
      ]),
    };
  },
};

// ---------- questions ----------

interface WQ {
  trPre?: string;
  trQ: string;
  tr: TrVerb;
  deQ: string;
  /** other question words with the same meaning (warum / wieso) */
  qAlt?: string[];
  v: Verb;
  alt?: Verb;
  deEnd?: string;
}

const W_QUESTIONS: WQ[] = [
  { trQ: "nerede", tr: tv("otur"), deQ: "wo", v: V.wohnen },
  { trQ: "ne zaman", tr: tv("gel"), deQ: "wann", v: V.kommen },
  { trQ: "nereden", tr: tv("gel"), deQ: "woher", v: V.kommen },
  { trQ: "nereye", tr: tv("git", "gid"), deQ: "wohin", v: V.gehen, alt: V.fahren },
  { trQ: "ne", tr: tv("iç"), deQ: "was", v: V.trinken },
  { trQ: "ne", tr: tv("oku"), deQ: "was", v: V.lesen },
  { trQ: "neden", tr: tv("gül"), deQ: "warum", qAlt: ["wieso"], v: V.lachen },
  { trQ: "kiminle", tr: tv("konuş"), deQ: "mit wem", v: V.sprechen },
  { trPre: "hafta sonu", trQ: "ne", tr: tv("yap"), deQ: "was", v: V.machen, deEnd: "am Wochenende" },
  { trPre: "sabahları", trQ: "ne zaman", tr: tv("kalk"), deQ: "wann", v: V.aufstehen, deEnd: "morgens" },
  { trPre: "Berlin'de", trQ: "ne kadar", tr: tv("kal"), deQ: "wie lange", v: V.bleiben, deEnd: "in Berlin" },
];

const wQuestion: Template = {
  id: "a1-soru-kelimesi",
  level: "A1",
  topicId: "a1-fragen",
  rules: ["w-frage"],
  hint: "Soru kelimesi başa, çekimli fiil hemen arkasına: Wo wohnst du?",
  make(p) {
    const q = p.pick(W_QUESTIONS);
    const s = p.pick([SUBJ.sen, SUBJ.sen, SUBJ.siz, SUBJ.o]);
    const verbs = q.alt ? [q.v, q.alt] : [q.v];
    const de = s.de.flatMap(({ pron, p: pp }) =>
      [q.deQ, ...(q.qAlt ?? [])].flatMap((w) => verbs.map((v) => sentence([w, present(v, pp), pron, q.deEnd, v.prefix], "?"))),
    );
    const { pron, p: pp } = s.de[0];
    const fin = present(q.v, pp);
    return {
      tr: trSentence([q.trPre, q.trQ, trPresent(q.tr, s.trP)], "?"),
      de,
      vocab: [[q.deQ, q.trQ]],
      focus: [
        focus("w-frage", `${fin} ${pron}`, [
          [`${pron} ${fin}`, `Soru kelimesinden hemen sonra çekimli fiil gelir, özne arkasından: ${capitalize(q.deQ)} ${fin} ${pron} …?`],
        ]),
        conjFocus("praesens", q.v, pp),
      ],
    };
  },
};

interface YN {
  trObj: string;
  tr: TrVerb;
  v: Verb;
  deMid: string;
  /** other accepted endings in place of the separable prefix (mit → mit uns) */
  altEnd?: string[];
}

const YES_NO: YN[] = [
  { trObj: "Almanca", tr: tv("konuş"), v: V.sprechen, deMid: "Deutsch" },
  { trObj: "yarın", tr: tv("gel"), v: V.kommen, deMid: "morgen" },
  { trObj: "bugün", tr: tv("çalış"), v: V.arbeiten, deMid: "heute" },
  { trObj: "Berlin'de", tr: tv("otur"), v: V.wohnen, deMid: "in Berlin" },
  { trObj: "futbol", tr: tv("oyna"), v: V.spielen, deMid: "Fußball" },
  { trObj: "beni", tr: tv("anla"), v: V.verstehen, deMid: "mich" },
  { trObj: "kahve", tr: tv("iç"), v: V.trinken, deMid: "Kaffee" },
  { trObj: "sigara", tr: tv("iç"), v: V.rauchen, deMid: "" },
  { trObj: "bu akşam bizimle", tr: tv("gel"), v: V.mitkommen, deMid: "heute Abend", altEnd: ["mit uns"] },
];

const yesNo: Template = {
  id: "a1-evet-hayir",
  level: "A1",
  topicId: "a1-fragen",
  rules: ["ja-nein-frage"],
  hint: "Evet/hayır sorusunda çekimli fiil başa gelir: Sprichst du Deutsch?",
  make(p) {
    const q = p.pick(YES_NO);
    const s = p.pick([SUBJ.sen, SUBJ.siz, SUBJ.o]);
    const { pron, p: pp } = s.de[0];
    const fin = present(q.v, pp);
    return {
      tr: trSentence([q.trObj, presentQ(q.tr, s.trP)], "?"),
      de: s.de.flatMap(({ pron: pr, p: x }) =>
        [q.v.prefix, ...(q.altEnd ?? [])].map((end) => sentence([present(q.v, x), pr, q.deMid, end], "?")),
      ),
      focus: [
        focus("ja-nein-frage", `${fin} ${pron}`, [[`${pron} ${fin}`, `Evet/hayır sorusunda çekimli fiil başa gelir: ${capitalize(fin)} ${pron} …?`]]),
        conjFocus("praesens", q.v, pp),
      ],
    };
  },
};

// ---------- negation ----------

const LACKING: { noun: Noun; plural?: boolean; tr: [string, string, string]; v: [string, string]; adv?: [string, string] }[] = [
  ...OWNED.filter((o) => o.tr[2]).map((o) => ({ noun: o.noun, tr: o.tr as [string, string, string], v: o.v })),
  { noun: n("Zeit", "f"), tr: ["zamanım", "zamanı", "zamanımız"], v: ["die Zeit", "zaman"], adv: ["bugün", "heute"] },
  { noun: n("Geld", "n"), tr: ["param", "parası", "paramız"], v: ["das Geld", "para"] },
  { noun: n("Kind", "n", "Kinder"), plural: true, tr: ["çocuğum", "çocuğu", "çocuğumuz"], v: ["das Kind, -er", "çocuk"] },
];

const kein: Template = {
  id: "a1-kein",
  level: "A1",
  topicId: "a1-negation",
  rules: ["kein-nicht"],
  hint: "İsim olumsuz olunca kein kullanılır: kein Auto, keine Zeit, keinen Hund.",
  make(p) {
    const owner = p.pick(OWNERS);
    const item = p.pick(LACKING);
    const obj = np({ det: "kein", noun: item.noun, plural: item.plural }, "akk");
    const nom = np({ det: "kein", noun: item.noun, plural: item.plural }, "nom");
    const einAkk = item.plural ? "" : np({ det: "ein", noun: item.noun }, "akk");
    return {
      tr: trSentence([item.adv?.[0], owner.trPre, item.tr[owner.i], "yok"]),
      de: owner.s.de.flatMap(({ pron, p: q }) => v2({ subj: pron, fin: present(V.haben, q), adv: item.adv?.[1], mid: obj })),
      vocab: [item.v, ["kein, keine, keinen", "hiç … yok"]],
      focus: [
        focus("kein-nicht", obj, [
          ...(einAkk ? [[`nicht ${einAkk}`, `İsmi olumsuz yaparken 'nicht ein' değil kein kullanılır: ${obj}.`] as [string, string]] : []),
          [`nicht ${item.plural ? item.noun.pl : item.noun.sg}`, `İsmi olumsuz yaparken nicht değil kein kullanılır: ${obj}.`],
          [nom, "Nesne olan eril isimde kein → keinen olur (Akkusativ)."],
        ]),
      ],
    };
  },
};

/** Turkish adjective, German adjective, other German adjectives that fit just as well */
const STATES: [string, string, ...string[]][] = [
  ["yorgun", "müde"],
  ["aç", "hungrig"],
  ["hasta", "krank"],
  ["meşgul", "beschäftigt"],
  ["evli", "verheiratet"],
  ["hazır", "fertig", "bereit"],
  ["mutlu", "glücklich"],
  ["sinirli", "nervös", "wütend", "sauer"],
];

const nichtAdj: Template = {
  id: "a1-nicht-sifat",
  level: "A1",
  topicId: "a1-negation",
  rules: ["kein-nicht", "sein"],
  hint: "Sıfat nicht ile olumsuz yapılır: Ich bin nicht müde.",
  make(p) {
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const st = p.pick(STATES);
    const today = p.pick([null, ["bugün", "heute"] as [string, string]]);
    return {
      tr: trSentence([s.trP === "3sg" && "o", today?.[0], st[0], copula("değil", s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) =>
        st.slice(1).flatMap((a) => v2({ subj: pron, fin: present(V.sein, q), adv: today?.[1], mid: `nicht ${a}` })),
      ),
      vocab: [[st[1], st[0]]],
      focus: [
        focus("kein-nicht", `nicht ${st[1]}`, [
          [`kein ${st[1]}`, `Sıfatlar nicht ile olumsuz yapılır: nicht ${st[1]}.`],
          [`keine ${st[1]}`, `Sıfatlar nicht ile olumsuz yapılır: nicht ${st[1]}.`],
        ]),
        conjFocus("sein", V.sein, s.de[0].p),
      ],
    };
  },
};

const NEG_VERBS: { tr: TrVerb; trPre: string; v: Verb; adv?: string; mid?: string[]; end?: string; kein?: string; vocab: [string, string] }[] = [
  { tr: tv("çalış"), trPre: "bugün", v: V.arbeiten, adv: "heute", end: "nicht", vocab: ["arbeiten", "çalışmak"] },
  { tr: tv("anla"), trPre: "bu kelimeyi", v: V.verstehen, mid: ["dieses Wort"], end: "nicht", vocab: ["verstehen", "anlamak"] },
  { tr: tv("iç"), trPre: "sigara", v: V.rauchen, end: "nicht", vocab: ["rauchen", "sigara içmek"] },
  { tr: tv("ye"), trPre: "et", v: V.essen, mid: ["kein Fleisch"], kein: "kein Fleisch", vocab: ["das Fleisch", "et"] },
  { tr: tv("iç"), trPre: "alkol", v: V.trinken, mid: ["keinen Alkohol"], kein: "keinen Alkohol", vocab: ["der Alkohol", "alkol"] },
  { tr: tv("tanı"), trPre: "onu", v: V.kennen, mid: ["ihn", "sie"], end: "nicht", vocab: ["kennen", "tanımak"] },
  { tr: tv("otur"), trPre: "burada", v: V.wohnen, mid: ["nicht hier", "hier nicht"], vocab: ["wohnen", "oturmak"] },
];

const nichtVerb: Template = {
  id: "a1-nicht-fiil",
  level: "A1",
  topicId: "a1-negation",
  rules: ["kein-nicht"],
  hint: "Fiil nicht ile olumsuz yapılır (genelde sonda); artikelsiz isim kein ile.",
  make(p) {
    const item = p.pick(NEG_VERBS);
    const s = p.pick([SUBJ.ben, SUBJ.o, SUBJ.biz]);
    const de = s.de.flatMap(({ pron, p: q }) =>
      (item.mid ?? [""]).flatMap((m) => v2({ subj: pron, fin: present(item.v, q), adv: item.adv, mid: m, end: item.end })),
    );
    return {
      tr: trSentence([item.trPre, trPresent(item.tr, s.trP, true)]),
      de,
      vocab: [item.vocab],
      focus: item.kein
        ? [
            focus("kein-nicht", item.kein, [
              [`nicht ${item.kein.split(" ")[1]}`, `Artikelsiz isim kein ile olumsuz yapılır: ${item.kein}.`],
              [`${item.kein.split(" ")[1]} nicht`, `Artikelsiz isim kein ile olumsuz yapılır: ${item.kein}.`],
            ]),
          ]
        : [focus("kein-nicht", "nicht", [["kein", "Fiil, zamir ve belirli nesne nicht ile olumsuz yapılır."]])],
    };
  },
};

// ---------- modal verbs ----------

const MODAL_ACTS: { trPre: string; tr: TrVerb; adv?: string; mid: string; alt?: string[]; inf: string; only?: string[]; vocab: [string, string] }[] = [
  { trPre: "Almanca", tr: tv("öğren"), mid: "Deutsch", inf: "lernen", vocab: ["lernen", "öğrenmek"] },
  { trPre: "yarın erken", tr: tv("kalk"), adv: "morgen", mid: "früh", inf: "aufstehen", vocab: ["aufstehen", "kalkmak"] },
  { trPre: "doktora", tr: tv("git", "gid"), mid: "zum Arzt", inf: "gehen", vocab: ["zum Arzt gehen", "doktora gitmek"] },
  { trPre: "bugün", tr: tv("çalış"), adv: "heute", mid: "", inf: "arbeiten", vocab: ["arbeiten", "çalışmak"] },
  { trPre: "biraz", tr: tv("uyu"), mid: "ein bisschen", alt: ["etwas", "ein wenig"], inf: "schlafen", vocab: ["schlafen", "uyumak"] },
  { trPre: "doktoru", tr: tv("ara"), mid: "den Arzt", inf: "anrufen", vocab: ["anrufen", "(telefonla) aramak"] },
  { trPre: "çok iyi", tr: tv("yüz"), mid: "sehr gut", inf: "schwimmen", only: ["koennen"], vocab: ["schwimmen", "yüzmek"] },
  { trPre: "evde", tr: tv("kal"), mid: "zu Hause", inf: "bleiben", vocab: ["zu Hause bleiben", "evde kalmak"] },
  { trPre: "bir bilet", tr: tv("al"), mid: "eine Fahrkarte", alt: ["ein Ticket"], inf: "kaufen", vocab: ["die Fahrkarte, -n", "bilet"] },
  { trPre: "bisiklet", tr: tv("sür"), mid: "Fahrrad", alt: ["Rad"], inf: "fahren", only: ["koennen", "wollen"], vocab: ["Fahrrad fahren", "bisiklet sürmek"] },
  { trPre: "bu akşam pizza", tr: tv("ye"), adv: "heute Abend", mid: "Pizza", inf: "essen", vocab: ["essen", "yemek"] },
];

const MODALS: { key: string; verbs: Verb[]; tr: (v: TrVerb, p: Person) => string }[] = [
  { key: "muessen", verbs: [V.muessen], tr: necessity },
  { key: "koennen", verbs: [V.koennen], tr: ability },
  { key: "wollen", verbs: [V.wollen, V.moechten], tr: (v, p) => `${infinitive(v)} ${trPresent(tv("iste"), p)}` },
];

const modal: Template = {
  id: "a1-modal",
  level: "A1",
  topicId: "a1-modal",
  rules: ["modal"],
  hint: "Modal fiil 2. sırada, asıl fiil mastar hâlinde en sonda; zu yok.",
  make(p) {
    const act = p.pick(MODAL_ACTS);
    const m = p.pick(MODALS.filter((x) => !act.only || act.only.includes(x.key)));
    const s = p.pick([SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const { p: pp } = s.de[0];
    const fin = present(m.verbs[0], pp);
    return {
      tr: trSentence([act.trPre, m.tr(act.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) =>
        m.verbs.flatMap((mv) => [act.mid, ...(act.alt ?? [])].flatMap((mid) => v2({ subj: pron, fin: present(mv, q), adv: act.adv, mid, end: act.inf }))),
      ),
      vocab: [act.vocab, [m.verbs[0].inf, m.key === "muessen" ? "-meli, zorunda olmak" : m.key === "koennen" ? "-ebilmek" : "istemek"]],
      focus: [
        conjFocus("modal", m.verbs[0], pp),
        focus("modal", act.inf, [[`zu ${act.inf}`, `Modal fiilden sonra zu kullanılmaz: … ${fin} … ${act.inf}.`]], `Modal fiille asıl fiil mastar hâlinde en sona gelir: … ${fin} … ${act.inf}.`),
      ],
    };
  },
};

// ---------- separable verbs ----------

interface SepItem {
  v: Verb;
  tr: TrVerb;
  vocab: [string, string];
  /** other verbs that say the same, accepted too (schließen next to zumachen) */
  alts?: { v: Verb; end?: string }[];
  opts: { trPre: string; adv?: string; advAlt?: string[]; mid?: string; advLate?: boolean; only?: Subj[] }[];
}

const SEPARABLE: SepItem[] = [
  {
    v: V.aufstehen,
    tr: tv("kalk"),
    vocab: ["aufstehen", "kalkmak"],
    opts: [
      { trPre: "saat yedide", adv: "um sieben Uhr", advAlt: ["um 7 Uhr"] },
      { trPre: "her sabah erken", adv: "jeden Morgen", mid: "früh" },
      { trPre: "hafta sonu geç", adv: "am Wochenende", mid: "spät" },
    ],
  },
  {
    v: V.einkaufen,
    tr: tv("alışveriş yap"),
    vocab: ["einkaufen", "alışveriş yapmak"],
    alts: [{ v: V.gehen, end: "einkaufen" }],
    opts: [
      { trPre: "cumartesi günü", adv: "am Samstag" },
      { trPre: "her cuma", adv: "jeden Freitag", advAlt: ["freitags"] },
      { trPre: "bugün", adv: "heute" },
    ],
  },
  {
    v: V.fernsehen,
    tr: tv("televizyon izle"),
    vocab: ["fernsehen (sieht fern)", "televizyon izlemek"],
    opts: [
      { trPre: "akşamları", adv: "abends" },
      { trPre: "her akşam", adv: "jeden Abend" },
    ],
  },
  {
    v: V.anrufen,
    tr: tv("ara"),
    vocab: ["anrufen", "(telefonla) aramak"],
    opts: [
      { trPre: "bu akşam doktoru", adv: "heute Abend", mid: "den Arzt", advLate: true },
      { trPre: "yarın patronu", adv: "morgen", mid: "den Chef", advLate: true },
    ],
  },
  {
    v: V.aufraeumen,
    tr: tv("topla"),
    vocab: ["aufräumen", "toplamak, düzenlemek"],
    opts: [
      { trPre: "bugün mutfağı", adv: "heute", mid: "die Küche", advLate: true },
      { trPre: "her hafta salonu", adv: "jede Woche", mid: "das Wohnzimmer", advLate: true },
    ],
  },
  { v: V.zumachen, tr: tv("kapat"), vocab: ["zumachen", "kapatmak"], alts: [{ v: schliessen }], opts: [{ trPre: "pencereyi", mid: "das Fenster" }, { trPre: "kapıyı", mid: "die Tür" }] },
  { v: V.aufmachen, tr: tv("aç"), vocab: ["aufmachen", "açmak"], alts: [{ v: V.oeffnen }], opts: [{ trPre: "pencereyi", mid: "das Fenster" }, { trPre: "kapıyı", mid: "die Tür" }] },
  {
    v: V.einladen,
    tr: tv("davet et", "davet ed"),
    vocab: ["einladen (lädt ein)", "davet etmek"],
    opts: [{ trPre: "arkadaşlarımı doğum günüme", mid: "meine Freunde zu meinem Geburtstag", only: [SUBJ.ben] }],
  },
];

const separable: Template = {
  id: "a1-ayrilabilen",
  level: "A1",
  topicId: "a1-trennbar",
  rules: ["trennbar", "praesens"],
  hint: "Ayrılabilen fiilde ön ek cümlenin sonuna gider: Ich stehe um 7 Uhr auf.",
  make(p) {
    const item = p.pick(SEPARABLE);
    const opt = p.pick(item.opts);
    const s = p.pick(opt.only ?? [SUBJ.ben, SUBJ.sen, SUBJ.o, SUBJ.biz]);
    const { p: pp } = s.de[0];
    const fin = present(item.v, pp);
    const prefix = item.v.prefix ?? "";
    const sepWhy = `Ayrılabilen fiilde ön ek ayrılır ve en sona gider: … ${fin} … ${prefix}.`;
    return {
      tr: trSentence([opt.trPre, trPresent(item.tr, s.trP)]),
      de: s.de.flatMap(({ pron, p: q }) =>
        [opt.adv, ...(opt.advAlt ?? [])].flatMap((adv) => [
          ...v2({ subj: pron, fin: present(item.v, q), adv, mid: opt.mid, end: prefix, advLate: opt.advLate }),
          ...(item.alts ?? []).flatMap((a) => v2({ subj: pron, fin: present(a.v, q), adv, mid: opt.mid, end: a.end, advLate: opt.advLate })),
        ]),
      ),
      vocab: [item.vocab],
      focus: [
        focus("trennbar", prefix, [[`${prefix}${fin}`, sepWhy]], `Ayrılabilen fiilin ön eki (${prefix}) cümlenin en sonuna gelir.`),
        focus("trennbar", fin, [[`${prefix}${fin}`, sepWhy]]),
        conjFocus("praesens", item.v, pp),
        // A synonym ("Ich schließe …") can be the closest accepted sentence; the unsplit "zumache" still gets the rule.
        ...(item.alts ?? []).map((a) => focus("trennbar", present(a.v, pp), [[`${prefix}${fin}`, sepWhy]])),
      ],
    };
  },
};

const SEP_THINGS: {
  tr: string;
  trVerb: TrVerb;
  de: string[];
  v: Verb;
  /** a verb without prefix that is just as correct (beginnen next to anfangen) */
  alt?: Verb;
  /** Turkish time, German time, the same written with digits */
  when: [string, string, ...string[]];
  vocab: [string, string];
}[] = [
  { tr: "film", trVerb: tv("başla"), de: ["der Film"], v: V.anfangen, alt: beginnen, when: ["saat sekizde", "um acht Uhr", "um 8 Uhr"], vocab: ["anfangen (fängt an)", "başlamak"] },
  { tr: "ders", trVerb: tv("başla"), de: ["der Unterricht", "der Kurs"], v: V.anfangen, alt: beginnen, when: ["saat dokuzda", "um neun Uhr", "um 9 Uhr"], vocab: ["anfangen (fängt an)", "başlamak"] },
  { tr: "tren", trVerb: tv("var"), de: ["der Zug"], v: V.ankommen, when: ["saat beşte", "um fünf Uhr", "um 5 Uhr"], vocab: ["ankommen", "varmak"] },
  { tr: "otobüs", trVerb: tv("kalk"), de: ["der Bus"], v: V.abfahren, alt: V.fahren, when: ["on dakika sonra", "in zehn Minuten", "in 10 Minuten"], vocab: ["abfahren (fährt ab)", "kalkmak (araç)"] },
  {
    tr: "toplantı",
    trVerb: tv("başla"),
    de: ["das Meeting", "die Besprechung", "die Sitzung"],
    v: V.anfangen,
    alt: beginnen,
    when: ["saat onda", "um zehn Uhr", "um 10 Uhr"],
    vocab: ["anfangen (fängt an)", "başlamak"],
  },
];

const separableThings: Template = {
  id: "a1-ayrilabilen-saat",
  level: "A1",
  topicId: "a1-trennbar",
  rules: ["trennbar"],
  hint: "Çekimli kök 2. sırada, ön ek en sonda: Der Film fängt um acht Uhr an.",
  make(p) {
    const item = p.pick(SEP_THINGS);
    const fin = present(item.v, "3sg");
    const prefix = item.v.prefix ?? "";
    const sepWhy = `Ön ek ayrılır ve en sona gider: … ${fin} … ${prefix}.`;
    return {
      tr: trSentence([item.tr, item.when[0], trPresent(item.trVerb, "3sg")]),
      de: item.de.flatMap((subj) =>
        item.when.slice(1).flatMap((adv) => [
          ...v2({ subj, fin, adv, end: prefix }),
          ...(item.alt ? v2({ subj, fin: present(item.alt, "3sg"), adv }) : []),
        ]),
      ),
      vocab: [item.vocab],
      focus: [
        focus("trennbar", prefix, [[`${prefix}${fin}`, sepWhy]], `Ayrılabilen fiilin ön eki (${prefix}) cümlenin en sonuna gelir.`),
        focus("praesens", fin, otherPresentForms(item.v, "3sg").map((f) => [f, conjWhy(item.v)] as [string, string])),
        // "Der Film anfängt …" is closest to "Der Film beginnt …"; it still gets the separable-verb rule.
        ...(item.alt ? [focus("trennbar", present(item.alt, "3sg"), [[`${prefix}${fin}`, sepWhy]])] : []),
      ],
    };
  },
};

// ---------- verb second ----------

const ACTIVITIES: { trPre: string; tr: TrVerb; v: Verb; rest: string[]; refl?: string; only?: Subj[] }[] = [
  { trPre: "sinemaya", tr: tv("git", "gid"), v: V.gehen, rest: ["ins Kino"] },
  { trPre: "evde", tr: tv("kal"), v: V.bleiben, rest: ["zu Hause"] },
  { trPre: "futbol", tr: tv("oyna"), v: V.spielen, rest: ["Fußball"] },
  { trPre: "Almanca kursuna", tr: tv("git", "gid"), v: V.gehen, rest: ["zum Deutschkurs", "in den Deutschkurs"] },
  { trPre: "erken", tr: tv("yat"), v: V.gehen, rest: ["früh ins Bett", "früh schlafen"] },
  { trPre: "yemek", tr: tv("pişir"), v: V.kochen, rest: [""] },
  { trPre: "parkta", tr: tv("koş"), v: V.laufen, rest: ["im Park"] },
  { trPre: "büyükannemi", tr: tv("ziyaret et", "ziyaret ed"), v: V.besuchen, rest: ["meine Oma", "meine Großmutter"], only: [SUBJ.ben] },
  { trPre: "arkadaşlarla", tr: tv("buluş"), v: V.treffen, rest: ["Freunde"], refl: "mit Freunden" },
];

/** Turkish time, German time, other German forms with the same meaning */
const WHEN: [string, string, ...string[]][] = [
  ["yarın", "morgen"],
  ["bu akşam", "heute Abend"],
  ["cumartesi günü", "am Samstag"],
  ["hafta sonu", "am Wochenende"],
  ["pazartesi günü", "am Montag"],
  ["bugün", "heute"],
  ["akşamları", "abends"],
  ["her pazar", "jeden Sonntag", "sonntags"],
];

const verbSecond: Template = {
  id: "a1-fiil-ikinci",
  level: "A1",
  topicId: "a1-zeit",
  rules: ["v2"],
  hint: "Cümle zamanla başlarsa çekimli fiil yine 2. sırada, özne arkasında: Morgen gehe ich …",
  make(p) {
    const act = p.pick(ACTIVITIES);
    const when = p.pick(WHEN);
    const s = p.pick(act.only ?? [SUBJ.ben, SUBJ.o, SUBJ.biz, SUBJ.onlar]);
    const { pron, p: pp } = s.de[0];
    const fin = present(act.v, pp);
    return {
      tr: trSentence([when[0], act.trPre, trPresent(act.tr, s.trP)]),
      de: s.de.flatMap(({ pron: pr, p: q }) =>
        when.slice(1).flatMap((w) => [
          ...act.rest.flatMap((r) => v2({ subj: pr, fin: present(act.v, q), adv: w, mid: r, frontFirst: true })),
          ...(act.refl ? reflClause(pr, present(act.v, q), REFLEXIVE[q], w, act.refl) : []),
        ]),
      ),
      vocab: [[when[1], when[0]]],
      focus: [
        focus("v2", `${fin} ${pron}`, [
          [`${when[1]} ${pron} ${fin}`, `Cümle zaman ifadesiyle başlayınca çekimli fiil yine 2. sırada kalır, özne fiilin arkasına geçer: ${capitalize(when[1])} ${fin} ${pron} …`],
        ]),
        conjFocus("praesens", act.v, pp),
      ],
    };
  },
};

export const A1: Template[] = [
  age,
  possession,
  fahren,
  strong,
  akkSearch,
  akkNeed,
  wQuestion,
  yesNo,
  kein,
  nichtAdj,
  nichtVerb,
  modal,
  separable,
  separableThings,
  verbSecond,
];
