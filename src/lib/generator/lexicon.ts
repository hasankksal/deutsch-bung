import { n, V, type Case, type Det, type Noun, type Person, type Verb } from "../grammar/de";
import { tv, type TrCase, type TrVerb } from "../grammar/tr";

// Building blocks for the open-ended sentence templates (infinite.ts): German verbs with all the
// forms a clause needs, subjects, possessed nouns, everyday events and states, time expressions.

type T6 = readonly [string, string, string, string, string, string];

/** A German verb that always has its Präteritum table. */
export interface LV extends Verb {
  praet: T6;
}

const weakEnds = (b: string): T6 => [b, b + "st", b, b + "n", b + "t", b + "n"];

function strongPraet(s: string): T6 {
  const du = /[dtsßz]$/.test(s) ? "est" : "st";
  const ihr = /[dt]$/.test(s) ? "et" : "t";
  return [s, s + du, s, s + "en", s + ihr, s + "en"];
}

export function lv(
  inf: string,
  part2: string,
  o: { prefix?: string; sein?: boolean; du?: string; er?: string; praet?: string; mixed?: boolean } = {},
): LV {
  const base = o.prefix ? inf.slice(o.prefix.length) : inf;
  const stem = base.slice(0, -2);
  const e = /(d|t|[^aeiouäöülrhmn][mn])$/.test(stem) ? "e" : "";
  const praet = o.praet ? (o.mixed ? weakEnds(o.praet) : strongPraet(o.praet)) : weakEnds(stem + e + "te");
  return {
    inf,
    part2,
    aux: o.sein ? "sein" : "haben",
    praet,
    ...(o.prefix ? { prefix: o.prefix } : {}),
    ...(o.du ? { du: o.du } : {}),
    ...(o.er ? { er: o.er } : {}),
  };
}

const withPraet = (v: Verb, praet?: string): LV => ({ ...v, praet: praet ? weakEnds(praet) : v.praet! });

export const LX = {
  sein: withPraet(V.sein),
  haben: withPraet(V.haben),
  werden: withPraet(V.werden),
  koennen: withPraet(V.koennen),
  muessen: withPraet(V.muessen),
  wollen: withPraet(V.wollen),
  sollen: withPraet(V.sollen),
  duerfen: withPraet(V.duerfen),
  moechten: withPraet(V.moechten, "wollte"),

  gehen: lv("gehen", "gegangen", { sein: true, praet: "ging" }),
  kommen: lv("kommen", "gekommen", { sein: true, praet: "kam" }),
  fahren: lv("fahren", "gefahren", { sein: true, praet: "fuhr", du: "fährst", er: "fährt" }),
  fliegen: lv("fliegen", "geflogen", { sein: true, praet: "flog" }),
  bleiben: lv("bleiben", "geblieben", { sein: true, praet: "blieb" }),
  trinken: lv("trinken", "getrunken", { praet: "trank" }),
  essen: lv("essen", "gegessen", { praet: "aß", du: "isst", er: "isst" }),
  fruehstuecken: lv("frühstücken", "gefrühstückt"),
  kochen: lv("kochen", "gekocht"),
  backen: lv("backen", "gebacken", { praet: "backte", mixed: true }),
  lesen: lv("lesen", "gelesen", { praet: "las", du: "liest", er: "liest" }),
  schreiben: lv("schreiben", "geschrieben", { praet: "schrieb" }),
  lernen: lv("lernen", "gelernt"),
  ueben: lv("üben", "geübt"),
  spielen: lv("spielen", "gespielt"),
  hoeren: lv("hören", "gehört"),
  sehen: lv("sehen", "gesehen", { praet: "sah", du: "siehst", er: "sieht" }),
  fernsehen: lv("fernsehen", "ferngesehen", { prefix: "fern", praet: "sah", du: "siehst", er: "sieht" }),
  anrufen: lv("anrufen", "angerufen", { prefix: "an", praet: "rief" }),
  besuchen: lv("besuchen", "besucht"),
  helfen: lv("helfen", "geholfen", { praet: "half", du: "hilfst", er: "hilft" }),
  einladen: lv("einladen", "eingeladen", { prefix: "ein", praet: "lud", du: "lädst", er: "lädt" }),
  einkaufen: lv("einkaufen", "eingekauft", { prefix: "ein" }),
  kaufen: lv("kaufen", "gekauft"),
  bezahlen: lv("bezahlen", "bezahlt"),
  sparen: lv("sparen", "gespart"),
  bestellen: lv("bestellen", "bestellt"),
  aufstehen: lv("aufstehen", "aufgestanden", { prefix: "auf", sein: true, praet: "stand" }),
  machen: lv("machen", "gemacht"),
  oeffnen: lv("öffnen", "geöffnet"),
  putzen: lv("putzen", "geputzt"),
  aufraeumen: lv("aufräumen", "aufgeräumt", { prefix: "auf" }),
  waschen: lv("waschen", "gewaschen", { praet: "wusch", du: "wäschst", er: "wäscht" }),
  spuelen: lv("spülen", "gespült"),
  treffen: lv("treffen", "getroffen", { praet: "traf", du: "triffst", er: "trifft" }),
  nehmen: lv("nehmen", "genommen", { praet: "nahm", du: "nimmst", er: "nimmt" }),
  verpassen: lv("verpassen", "verpasst"),
  ausmachen: lv("ausmachen", "ausgemacht", { prefix: "aus" }),
  anmachen: lv("anmachen", "angemacht", { prefix: "an" }),
  arbeiten: lv("arbeiten", "gearbeitet"),
  duschen: lv("duschen", "geduscht"),
  anziehen: lv("anziehen", "angezogen", { prefix: "an", praet: "zog" }),
  ausruhen: lv("ausruhen", "ausgeruht", { prefix: "aus" }),
  beeilen: lv("beeilen", "beeilt"),
  tanzen: lv("tanzen", "getanzt"),
  packen: lv("packen", "gepackt"),
  warten: lv("warten", "gewartet"),
  vorbereiten: lv("vorbereiten", "vorbereitet", { prefix: "vor" }),
  schicken: lv("schicken", "geschickt"),
  abholen: lv("abholen", "abgeholt", { prefix: "ab" }),
  mitbringen: lv("mitbringen", "mitgebracht", { prefix: "mit", praet: "brachte", mixed: true }),
  zurueckkommen: lv("zurückkommen", "zurückgekommen", { prefix: "zurück", sein: true, praet: "kam" }),
  ankommen: lv("ankommen", "angekommen", { prefix: "an", sein: true, praet: "kam" }),
  fotografieren: lv("fotografieren", "fotografiert"),
  reparieren: lv("reparieren", "repariert"),
  verkaufen: lv("verkaufen", "verkauft"),
  mieten: lv("mieten", "gemietet"),
  finden: lv("finden", "gefunden", { praet: "fand" }),
  suchen: lv("suchen", "gesucht"),
  vergessen: lv("vergessen", "vergessen", { praet: "vergaß", du: "vergisst", er: "vergisst" }),
  schlafen: lv("schlafen", "geschlafen", { praet: "schlief", du: "schläfst", er: "schläft" }),
  singen: lv("singen", "gesungen", { praet: "sang" }),
  planen: lv("planen", "geplant"),
  einschlafen: lv("einschlafen", "eingeschlafen", { prefix: "ein", sein: true, praet: "schlief", du: "schläfst", er: "schläft" }),
  glauben: lv("glauben", "geglaubt"),
  hoffen: lv("hoffen", "gehofft"),
  denken: lv("denken", "gedacht", { praet: "dachte", mixed: true }),
  sagen: lv("sagen", "gesagt"),
  wissen: withPraet(V.wissen, "wusste"),
  versuchen: lv("versuchen", "versucht"),
  beschliessen: lv("beschließen", "beschlossen", { praet: "beschloss" }),
  vorhaben: { ...withPraet(V.haben), inf: "vorhaben", prefix: "vor", part2: "vorgehabt" },
  sprechen: lv("sprechen", "gesprochen", { praet: "sprach", du: "sprichst", er: "spricht" }),
  traeumen: lv("träumen", "geträumt"),
  freuen: lv("freuen", "gefreut"),
  interessieren: lv("interessieren", "interessiert"),
  kuemmern: withPraet(V.kuemmern, "kümmerte"),
  erinnern: withPraet(V.erinnern, "erinnerte"),
  aergern: withPraet(V.aergern, "ärgerte"),
  gewoehnen: lv("gewöhnen", "gewöhnt"),
  bewerben: lv("bewerben", "beworben", { praet: "bewarb", du: "bewirbst", er: "bewirbt" }),
  verlassen: lv("verlassen", "verlassen", { praet: "verließ", du: "verlässt", er: "verlässt" }),
  bitten: lv("bitten", "gebeten", { praet: "bat" }),
  beschweren: lv("beschweren", "beschwert"),
  konzentrieren: lv("konzentrieren", "konzentriert"),
  lachen: lv("lachen", "gelacht"),
  fragen: lv("fragen", "gefragt"),
  teilnehmen: lv("teilnehmen", "teilgenommen", { prefix: "teil", praet: "nahm", du: "nimmst", er: "nimmt" }),
  anfangen: lv("anfangen", "angefangen", { prefix: "an", praet: "fing", du: "fängst", er: "fängt" }),
  aufhoeren: lv("aufhören", "aufgehört", { prefix: "auf" }),
  setzen: lv("setzen", "gesetzt"),
  erholen: lv("erholen", "erholt"),
  verspaeten: lv("verspäten", "verspätet"),
  entspannen: lv("entspannen", "entspannt"),
  legen: lv("legen", "gelegt"),
  stellen: lv("stellen", "gestellt"),
  haengen: lv("hängen", "gehängt"),
  stecken: lv("stecken", "gesteckt"),
  liegen: lv("liegen", "gelegen", { praet: "lag" }),
  stehen: lv("stehen", "gestanden", { praet: "stand" }),
  brauchen: lv("brauchen", "gebraucht"),
  laufen: lv("laufen", "gelaufen", { sein: true, praet: "lief", du: "läufst", er: "läuft" }),
  moegen: withPraet(V.moegen, "mochte"),
  verstehen: lv("verstehen", "verstanden", { praet: "verstand" }),
  fuehlen: lv("fühlen", "gefühlt"),
  bemuehen: lv("bemühen", "bemüht"),
  schaffen: lv("schaffen", "geschafft"),
  bestehen: lv("bestehen", "bestanden", { praet: "bestand" }),
  ablegen: lv("ablegen", "abgelegt", { prefix: "ab" }),
  leisten: lv("leisten", "geleistet"),
  halten: lv("halten", "gehalten", { praet: "hielt", du: "hältst", er: "hält" }),
  vereinbaren: lv("vereinbaren", "vereinbart"),
  uebernehmen: lv("übernehmen", "übernommen", { praet: "übernahm", du: "übernimmst", er: "übernimmt" }),
  zeigen: lv("zeigen", "gezeigt"),
  beobachten: lv("beobachten", "beobachtet"),
  druecken: lv("drücken", "gedrückt"),
  zudruecken: lv("zudrücken", "zugedrückt", { prefix: "zu" }),
  treten: lv("treten", "getreten", { sein: true, praet: "trat", du: "trittst", er: "tritt" }),
  schieben: lv("schieben", "geschoben", { praet: "schob" }),
  herumreden: lv("herumreden", "herumgeredet", { prefix: "herum" }),
  aufbinden: lv("aufbinden", "aufgebunden", { prefix: "auf", praet: "band" }),
  abreisen: lv("abreisen", "abgereist", { prefix: "ab", sein: true }),
  schweben: lv("schweben", "geschwebt"),
  einschenken: lv("einschenken", "eingeschenkt", { prefix: "ein" }),
  zerbrechen: lv("zerbrechen", "zerbrochen", { praet: "zerbrach", du: "zerbrichst", er: "zerbricht" }),
  giessen: lv("gießen", "gegossen", { praet: "goss" }),
  fallen: lv("fallen", "gefallen", { sein: true, praet: "fiel", du: "fällst", er: "fällt" }),
  brechen: lv("brechen", "gebrochen", { praet: "brach", du: "brichst", er: "bricht" }),
  schlagen: lv("schlagen", "geschlagen", { praet: "schlug", du: "schlägst", er: "schlägt" }),
  wuenschen: lv("wünschen", "gewünscht"),
  irren: lv("irren", "geirrt"),
  luegen: lv("lügen", "gelogen", { praet: "log" }),
  nerven: lv("nerven", "genervt"),
  verschieben: lv("verschieben", "verschoben", { praet: "verschob" }),
  reisen: lv("reisen", "gereist", { sein: true }),
  regnen: lv("regnen", "geregnet"),
  schneien: lv("schneien", "geschneit"),
} satisfies Record<string, LV>;

/** Konjunktiv I, third person singular: er sei, er habe, er komme, er rufe (… an) */
export function konj1(v: LV): string {
  if (v.inf === "sein") return "sei";
  const base = v.prefix ? v.inf.slice(v.prefix.length) : v.inf;
  return base.replace(/e?n$/, "") + "e";
}

// ---------- subjects ----------

export interface DeWho {
  /** Subject as written in the sentence */
  s: string;
  p: Person;
  /** Possessive determiner for things that belong to the subject */
  det: Det;
}

export interface Who {
  id: string;
  /** Turkish nominative: a pronoun (usually dropped) or a noun */
  tr: string;
  /** Turkish genitive, for the subject of a nominalised clause (annemin gelmesi) */
  gen: string;
  pron: boolean;
  /** Turkish person for verb and possessive endings */
  trP: Person;
  de: DeWho[];
  kid?: boolean;
}

export const PRONOUNS: Who[] = [
  { id: "ben", tr: "ben", gen: "benim", pron: true, trP: "1sg", de: [{ s: "ich", p: "1sg", det: "mein" }] },
  { id: "sen", tr: "sen", gen: "senin", pron: true, trP: "2sg", de: [{ s: "du", p: "2sg", det: "dein" }] },
  {
    id: "o",
    tr: "o",
    gen: "onun",
    pron: true,
    trP: "3sg",
    de: [
      { s: "er", p: "3sg", det: "sein" },
      { s: "sie", p: "3sg", det: "ihr" },
    ],
  },
  { id: "biz", tr: "biz", gen: "bizim", pron: true, trP: "1pl", de: [{ s: "wir", p: "1pl", det: "unser" }] },
  {
    id: "siz",
    tr: "siz",
    gen: "sizin",
    pron: true,
    trP: "2pl",
    de: [
      { s: "ihr", p: "2pl", det: "euer" },
      { s: "Sie", p: "3pl", det: "Ihr" },
    ],
  },
  { id: "onlar", tr: "onlar", gen: "onların", pron: true, trP: "3pl", de: [{ s: "sie", p: "3pl", det: "ihr" }] },
];

const person = (id: string, tr: string, gen: string, de: [string, Det][], trP: Person = "3sg", kid = false): Who => ({
  id,
  tr,
  gen,
  pron: false,
  trP,
  de: de.map(([s, det]) => ({ s, p: trP === "3pl" ? "3pl" : "3sg", det })),
  ...(kid ? { kid } : {}),
});

export const PEOPLE: Who[] = [
  person("anne", "annem", "annemin", [["meine Mutter", "ihr"]]),
  person("baba", "babam", "babamın", [["mein Vater", "sein"]]),
  person("kardes", "kardeşim", "kardeşimin", [
    ["mein Bruder", "sein"],
    ["meine Schwester", "ihr"],
  ]),
  person("arkadas", "arkadaşım", "arkadaşımın", [
    ["mein Freund", "sein"],
    ["meine Freundin", "ihr"],
  ]),
  person("komsu", "komşumuz", "komşumuzun", [
    ["unser Nachbar", "sein"],
    ["unsere Nachbarin", "ihr"],
  ]),
  person("ogretmen", "öğretmenimiz", "öğretmenimizin", [
    ["unser Lehrer", "sein"],
    ["unsere Lehrerin", "ihr"],
  ]),
  person("ali", "Ali", "Ali'nin", [["Ali", "sein"]]),
  person("ayse", "Ayşe", "Ayşe'nin", [["Ayşe", "ihr"]]),
  person("cocuklar", "çocuklar", "çocukların", [["die Kinder", "ihr"]], "3pl", true),
  person("ebeveyn", "annemle babam", "annemle babamın", [["meine Eltern", "ihr"]], "3pl"),
];

export const EVERYONE: Who[] = [...PRONOUNS, ...PEOPLE];

// ---------- possessed nouns ----------

export interface Owned {
  de: Noun[];
  tr: string;
  soft?: string;
  plural?: boolean;
}

export const OWN = {
  anne: { de: [n("Mutter", "f")], tr: "anne" },
  baba: { de: [n("Vater", "m")], tr: "baba" },
  kardes: { de: [n("Bruder", "m"), n("Schwester", "f")], tr: "kardeş" },
  arkadas: { de: [n("Freund", "m"), n("Freundin", "f")], tr: "arkadaş" },
  buyukanne: { de: [n("Oma", "f"), n("Großmutter", "f")], tr: "büyükanne" },
  dede: { de: [n("Opa", "m"), n("Großvater", "m")], tr: "dede" },
  aile: { de: [n("Familie", "f")], tr: "aile" },
  oda: { de: [n("Zimmer", "n")], tr: "oda" },
  araba: { de: [n("Auto", "n")], tr: "araba" },
  bisiklet: { de: [n("Fahrrad", "n")], tr: "bisiklet" },
  bavul: { de: [n("Koffer", "m")], tr: "bavul" },
  odev: { de: [n("Hausaufgaben", "f", "Hausaufgaben")], tr: "ödev", plural: true },
  el: { de: [n("Hände", "f", "Hände")], tr: "eller", plural: true },
  dis: { de: [n("Zähne", "m", "Zähne")], tr: "dişler", plural: true },
} satisfies Record<string, Owned>;

// ---------- events and states ----------

export type Tag =
  | "move"
  | "home"
  | "work"
  | "fun"
  | "rest"
  | "food"
  | "chore"
  | "study"
  | "contact"
  | "money"
  | "out"
  | "morning"
  | "evening"
  | "sport"
  | "travel"
  | "fast"
  | "health"
  | "warm"
  | "stay"
  | "cheap"
  | "arrive"
  /** A tiny everyday action, odd as news or a plan (sich setzen, sich beeilen…) */
  | "mini"
  | "bad";

export interface Ev {
  id: string;
  v: LV;
  /** German complements in the middle field; "@" stands for the possessive noun phrase */
  mid?: string;
  own?: { n: Owned; de: Case; tr: TrCase };
  refl?: "akk" | "dat";
  /** Complements when negated with kein ("keinen Kaffee"); otherwise nicht is used */
  kein?: string;
  /** Complements with nicht where the default position is wrong */
  nicht?: string;
  tr: TrVerb;
  /** Turkish complements; "@" stands for the possessed noun */
  trObj?: string;
  /** Turkish complements in a negated sentence (bir kahve → kahve) */
  trNeg?: string;
  tags: Tag[];
  vocab: [string, string];
  /** Not something children do */
  adult?: boolean;
}

const ev = (
  id: string,
  v: LV,
  mid: string,
  tr: TrVerb,
  trObj: string,
  tags: Tag[],
  vocab: [string, string],
  extra: Partial<Ev> = {},
): Ev => ({ id, v, ...(mid ? { mid } : {}), tr, ...(trObj ? { trObj } : {}), tags, vocab, ...extra });

export const EVENTS: Ev[] = [
  ev("eve-git", LX.gehen, "nach Hause", tv("git", "gid"), "eve", ["move", "evening", "stay"], ["nach Hause gehen", "eve gitmek"]),
  ev("eve-gel", LX.kommen, "nach Hause", tv("gel"), "eve", ["move", "evening"], ["nach Hause kommen", "eve gelmek"]),
  ev("ise-git", LX.gehen, "zur Arbeit", tv("git", "gid"), "işe", ["move", "morning", "work"], ["zur Arbeit gehen", "işe gitmek"], { adult: true }),
  ev("okula-git", LX.gehen, "zur Schule", tv("git", "gid"), "okula", ["move", "morning", "study"], ["zur Schule gehen", "okula gitmek"]),
  ev("market", LX.gehen, "in den Supermarkt", tv("git", "gid"), "süpermarkete", ["move", "chore"], ["in den Supermarkt gehen", "süpermarkete gitmek"]),
  ev("sinema", LX.gehen, "ins Kino", tv("git", "gid"), "sinemaya", ["move", "fun", "evening"], ["ins Kino gehen", "sinemaya gitmek"]),
  ev("doktor", LX.gehen, "zum Arzt", tv("git", "gid"), "doktora", ["move", "health"], ["zum Arzt gehen", "doktora gitmek"]),
  ev("berlin", LX.fliegen, "nach Berlin", tv("uç"), "Berlin'e", ["travel"], ["fliegen", "uçmak"], { adult: true }),
  ev("sehir", LX.fahren, "in die Stadt", tv("git", "gid"), "şehre", ["move", "fun"], ["in die Stadt fahren", "şehre gitmek"]),
  ev("kahve", LX.trinken, "einen Kaffee", tv("iç"), "bir kahve", ["food", "morning", "rest"], ["einen Kaffee trinken", "bir kahve içmek"], {
    kein: "keinen Kaffee",
    trNeg: "kahve",
    adult: true,
  }),
  ev("cay", LX.trinken, "Tee", tv("iç"), "çay", ["food", "rest", "warm"], ["Tee trinken", "çay içmek"], { kein: "keinen Tee" }),
  ev("kahvalti", LX.fruehstuecken, "", tv("kahvaltı et", "kahvaltı ed"), "", ["food", "morning"], ["frühstücken", "kahvaltı etmek"]),
  ev("aksam-yemegi", LX.kochen, "das Abendessen", tv("pişir"), "akşam yemeği", ["food", "evening", "chore", "home"], ["das Abendessen kochen", "akşam yemeği pişirmek"], {
    adult: true,
    kein: "kein Abendessen",
  }),
  ev("pizza", LX.essen, "eine Pizza", tv("ye"), "pizza", ["food", "fun", "fast"], ["eine Pizza essen", "pizza yemek"], { kein: "keine Pizza" }),
  ev("kitap", LX.lesen, "ein Buch", tv("oku"), "kitap", ["study", "rest", "home", "evening"], ["ein Buch lesen", "kitap okumak"], { kein: "kein Buch" }),
  ev("gazete", LX.lesen, "die Zeitung", tv("oku"), "gazete", ["morning", "rest"], ["die Zeitung lesen", "gazete okumak"], { adult: true }),
  ev("eposta", LX.schreiben, "eine E-Mail", tv("yaz"), "bir e-posta", ["work", "contact"], ["eine E-Mail schreiben", "bir e-posta yazmak"], {
    kein: "keine E-Mail",
    trNeg: "e-posta",
  }),
  ev("almanca", LX.lernen, "Deutsch", tv("öğren"), "Almanca", ["study"], ["Deutsch lernen", "Almanca öğrenmek"], { kein: "kein Deutsch" }),
  ev("sinav", LX.lernen, "für die Prüfung", tv("çalış"), "sınava", ["study", "home"], ["für die Prüfung lernen", "sınava çalışmak"]),
  ev("futbol", LX.spielen, "Fußball", tv("oyna"), "futbol", ["fun", "sport", "out"], ["Fußball spielen", "futbol oynamak"], { kein: "keinen Fußball" }),
  ev("gitar", LX.spielen, "Gitarre", tv("çal"), "gitar", ["fun", "home"], ["Gitarre spielen", "gitar çalmak"]),
  ev("muzik", LX.hoeren, "Musik", tv("dinle"), "müzik", ["fun", "rest", "home"], ["Musik hören", "müzik dinlemek"], { kein: "keine Musik" }),
  ev("televizyon", LX.fernsehen, "", tv("izle"), "televizyon", ["fun", "rest", "home", "evening", "stay"], ["fernsehen", "televizyon izlemek"]),
  ev("film", LX.sehen, "einen Film", tv("izle"), "bir film", ["fun", "evening", "home", "stay"], ["einen Film sehen", "film izlemek"], {
    kein: "keinen Film",
    trNeg: "film",
  }),
  ev("ara", LX.anrufen, "@", tv("ara"), "@", ["contact"], ["anrufen (+A)", "(telefonla) aramak"], { own: { n: OWN.anne, de: "akk", tr: "acc" } }),
  ev("ara-kardes", LX.anrufen, "@", tv("ara"), "@", ["contact"], ["anrufen (+A)", "(telefonla) aramak"], { own: { n: OWN.kardes, de: "akk", tr: "acc" } }),
  ev("ziyaret", LX.besuchen, "@", tv("ziyaret et", "ziyaret ed"), "@", ["contact", "travel"], ["besuchen", "ziyaret etmek"], {
    own: { n: OWN.buyukanne, de: "akk", tr: "acc" },
  }),
  ev("ziyaret-arkadas", LX.besuchen, "@", tv("ziyaret et", "ziyaret ed"), "@", ["contact", "fun"], ["besuchen", "ziyaret etmek"], {
    own: { n: OWN.arkadas, de: "akk", tr: "acc" },
  }),
  ev("yardim", LX.helfen, "@", tv("yardım et", "yardım ed"), "@", ["contact", "home"], ["helfen (+D)", "yardım etmek"], {
    own: { n: OWN.baba, de: "dat", tr: "dat" },
  }),
  ev("davet", LX.einladen, "@", tv("davet et", "davet ed"), "@", ["contact", "fun", "home"], ["einladen", "davet etmek"], {
    own: { n: OWN.arkadas, de: "akk", tr: "acc" },
  }),
  ev("alisveris", LX.einkaufen, "", tv("alışveriş yap"), "", ["chore"], ["einkaufen", "alışveriş yapmak"]),
  ev("ekmek", LX.kaufen, "Brot", tv("al"), "ekmek", ["chore", "morning"], ["Brot kaufen", "ekmek almak"], { kein: "kein Brot" }),
  ev("hediye", LX.kaufen, "ein Geschenk", tv("al"), "bir hediye", ["money", "contact"], ["ein Geschenk kaufen", "hediye almak"], {
    kein: "kein Geschenk",
    trNeg: "hediye",
  }),
  ev("hesap", LX.bezahlen, "die Rechnung", tv("öde"), "hesabı", ["money"], ["die Rechnung bezahlen", "hesabı ödemek"], { adult: true }),
  ev("para", LX.sparen, "Geld", tv("biriktir"), "para", ["money", "cheap"], ["Geld sparen", "para biriktirmek"], { kein: "kein Geld" }),
  ev("siparis", LX.bestellen, "Essen", tv("sipariş et", "sipariş ed"), "yemek", ["food", "fast", "home", "stay"], ["Essen bestellen", "yemek sipariş etmek"], { kein: "kein Essen" }),
  ev("erken-kalk", LX.aufstehen, "früh", tv("kalk"), "erken", ["morning", "study", "work"], ["früh aufstehen", "erken kalkmak"]),
  ev("yat", LX.gehen, "früh ins Bett", tv("yat"), "erken", ["rest", "evening", "home", "stay", "health"], ["ins Bett gehen", "yatmak"]),
  ev("spor", LX.machen, "Sport", tv("yap"), "spor", ["sport", "fun"], ["Sport machen", "spor yapmak"], { kein: "keinen Sport" }),
  ev("yuruyus", LX.gehen, "im Park spazieren", tv("yürüyüş yap"), "parkta", ["out", "rest", "fun"], ["spazieren gehen", "yürüyüş yapmak"]),
  ev("pencere", LX.oeffnen, "das Fenster", tv("aç"), "pencereyi", ["home", "warm"], ["das Fenster öffnen", "pencereyi açmak"]),
  ev("temizlik", LX.putzen, "die Wohnung", tv("temizle"), "evi", ["chore", "home", "stay"], ["die Wohnung putzen", "evi temizlemek"]),
  ev("oda-topla", LX.aufraeumen, "@", tv("topla"), "@", ["chore", "home", "stay"], ["aufräumen", "toplamak"], {
    own: { n: OWN.oda, de: "akk", tr: "acc" },
  }),
  ev("araba-yika", LX.waschen, "@", tv("yıka"), "@", ["chore", "out"], ["waschen", "yıkamak"], { own: { n: OWN.araba, de: "akk", tr: "acc" }, adult: true }),
  ev("bulasik", LX.spuelen, "das Geschirr", tv("yıka"), "bulaşıkları", ["chore", "evening", "home"], ["das Geschirr spülen", "bulaşık yıkamak"]),
  ev("arkadas-bulus", LX.treffen, "Freunde", tv("buluş"), "arkadaşlarla", ["fun", "out"], ["Freunde treffen", "arkadaşlarla buluşmak"], { kein: "keine Freunde" }),
  ev("otobus", LX.nehmen, "den Bus", tv("bin"), "otobüse", ["move", "cheap"], ["den Bus nehmen", "otobüse binmek"]),
  ev("taksi", LX.nehmen, "ein Taxi", tv("bin"), "taksiye", ["move", "fast"], ["ein Taxi nehmen", "taksiye binmek"], { adult: true, kein: "kein Taxi" }),
  ev("otobus-kacir", LX.verpassen, "den Bus", tv("kaçır"), "otobüsü", ["bad"], ["den Bus verpassen", "otobüsü kaçırmak"]),
  ev("odev", LX.machen, "@", tv("yap"), "@", ["study", "home", "stay"], ["die Hausaufgaben machen", "ödev yapmak"], {
    own: { n: OWN.odev, de: "akk", tr: "acc" },
  }),
  ev("piyano", LX.ueben, "Klavier", tv("piyano çalış"), "", ["study", "home"], ["Klavier üben", "piyano çalışmak"]),
  ev("kek", LX.backen, "einen Kuchen", tv("yap"), "kek", ["food", "fun", "home"], ["einen Kuchen backen", "kek yapmak"], {
    kein: "keinen Kuchen",
  }),
  ev("isik", LX.ausmachen, "das Licht", tv("kapat"), "ışığı", ["evening", "home"], ["das Licht ausmachen", "ışığı kapatmak"]),
  ev("kalorifer", LX.anmachen, "die Heizung", tv("aç"), "kaloriferi", ["home", "warm", "stay"], ["die Heizung anmachen", "kaloriferi açmak"]),
  ev("bahce", LX.arbeiten, "im Garten", tv("çalış"), "bahçede", ["out", "chore"], ["im Garten arbeiten", "bahçede çalışmak"]),
  ev("dus", LX.duschen, "", tv("duş al"), "", ["morning", "home"], ["duschen", "duş almak"]),
  ev("giyin", LX.anziehen, "schnell", tv("giyin"), "çabucak", ["morning", "fast", "mini"], ["sich anziehen", "giyinmek"], { refl: "akk" }),
  ev("dinlen", LX.ausruhen, "", tv("dinlen"), "", ["rest", "home", "stay", "health"], ["sich ausruhen", "dinlenmek"], { refl: "akk" }),
  ev("el-yika", LX.waschen, "die Hände", tv("yıka"), "@", ["home", "food", "mini"], ["sich die Hände waschen", "ellerini yıkamak"], {
    refl: "dat",
    own: { n: OWN.el, de: "akk", tr: "acc" },
    nicht: "die Hände nicht",
  }),
  ev("dis-fircala", LX.putzen, "die Zähne", tv("fırçala"), "@", ["home", "morning", "evening", "mini"], ["sich die Zähne putzen", "dişlerini fırçalamak"], {
    refl: "dat",
    own: { n: OWN.dis, de: "akk", tr: "acc" },
    nicht: "die Zähne nicht",
  }),
  ev("otur", LX.setzen, "auf den Stuhl", tv("otur"), "sandalyeye", ["rest", "home", "mini"], ["sich setzen", "oturmak"], { refl: "akk" }),
  ev("tatil-dinlen", LX.erholen, "im Urlaub", tv("dinlen"), "tatilde", ["rest", "travel"], ["sich erholen", "dinlenmek"], { refl: "akk" }),
  ev("gecik", LX.verspaeten, "", tv("gecik"), "", ["bad", "mini"], ["sich verspäten", "gecikmek"], { refl: "akk" }),
  ev("rahatla", LX.entspannen, "", tv("rahatla"), "", ["rest", "home", "stay"], ["sich entspannen", "rahatlamak"], { refl: "akk" }),
  ev("acele", LX.beeilen, "", tv("acele et", "acele ed"), "", ["fast", "mini"], ["sich beeilen", "acele etmek"], { refl: "akk" }),
  ev("yuzme", LX.gehen, "schwimmen", tv("yüzmeye git", "yüzmeye gid"), "", ["sport", "fun", "out"], ["schwimmen gehen", "yüzmeye gitmek"]),
  ev("bisiklet", LX.fahren, "Fahrrad", tv("bisiklete bin"), "", ["sport", "out", "cheap", "move"], ["Fahrrad fahren", "bisiklete binmek"]),
  ev("foto", LX.machen, "Fotos", tv("fotoğraf çek"), "", ["fun", "travel", "out"], ["Fotos machen", "fotoğraf çekmek"], { kein: "keine Fotos" }),
  ev("dans", LX.tanzen, "", tv("dans et", "dans ed"), "", ["fun"], ["tanzen", "dans etmek"]),
  ev("bavul", LX.packen, "@", tv("hazırla"), "@", ["travel"], ["den Koffer packen", "bavul hazırlamak"], { own: { n: OWN.bavul, de: "akk", tr: "acc" } }),
  ev("bekle", LX.warten, "auf den Bus", tv("bekle"), "otobüsü", ["move", "out"], ["warten auf (+A)", "beklemek"]),
  ev("gec-calis", LX.arbeiten, "lange", tv("çalış"), "geç saate kadar", ["work"], ["lange arbeiten", "geç saate kadar çalışmak"], { adult: true }),
  ev("eve-don", LX.zurueckkommen, "nach Hause", tv("dön"), "eve", ["move", "evening"], ["zurückkommen", "geri dönmek"]),
  ev("istasyon", LX.abholen, "@ vom Bahnhof", tv("al"), "@ istasyondan", ["contact", "move"], ["abholen", "(birini bir yerden) almak"], {
    own: { n: OWN.arkadas, de: "akk", tr: "acc" },
    nicht: "@ nicht vom Bahnhof",
  }),
  ev("uyu", LX.schlafen, "", tv("uyu"), "", ["rest", "home", "evening"], ["schlafen", "uyumak"]),
  ev("uyuyakal", LX.einschlafen, "", tv("uykuya dal"), "", ["rest", "evening"], ["einschlafen", "uykuya dalmak"]),
  ev("evde-kal", LX.bleiben, "zu Hause", tv("kal"), "evde", ["stay", "home", "rest"], ["zu Hause bleiben", "evde kalmak"]),
  ev("gec-kal", LX.kommen, "zu spät", tv("geç kal"), "", ["bad"], ["zu spät kommen", "geç kalmak"]),
  ev("var-istasyon", LX.ankommen, "am Bahnhof", tv("var"), "istasyona", ["arrive"], ["ankommen", "varmak"]),
  ev("var-ofis", LX.ankommen, "im Büro", tv("var"), "ofise", ["arrive"], ["ankommen", "varmak"], { adult: true }),
  ev("var-parti", LX.ankommen, "auf der Party", tv("var"), "partiye", ["arrive"], ["ankommen", "varmak"]),
  ev("var-okul", LX.ankommen, "in der Schule", tv("var"), "okula", ["arrive"], ["ankommen", "varmak"]),
  ev("sarki", LX.singen, "ein Lied", tv("şarkı söyle"), "", ["fun"], ["ein Lied singen", "şarkı söylemek"], { kein: "kein Lied" }),
  ev("tatil-plan", LX.planen, "den Urlaub", tv("planla"), "tatili", ["travel", "fun"], ["den Urlaub planen", "tatili planlamak"], { adult: true }),
];

/** Turkish side of a state: copula (yorgunum), possession (zamanım yok) or a verb (yağmur yağıyor). */
export type TrPred =
  | { k: "cop"; word: string; subj?: string; neg?: boolean }
  | { k: "have"; noun: string; soft?: string; pre?: string; neg?: boolean }
  | { k: "verb"; v: TrVerb; obj?: string; subj?: string };

export interface St {
  id: string;
  v: LV;
  mid: string;
  /** Impersonal states have their own subject (es regnet, das Wetter ist schön) */
  subj?: string;
  tr: TrPred;
  /** Only in the present (it contains "morgen") */
  presentOnly?: boolean;
  /** Natural consequences (weil) and surprising ones (obwohl) */
  because: Tag[];
  despite: Tag[];
  vocab: [string, string];
}

export const STATES: St[] = [
  {
    id: "yorgun",
    v: LX.sein,
    mid: "müde",
    tr: { k: "cop", word: "yorgun" },
    because: ["rest"],
    despite: ["sport", "study", "chore", "work"],
    vocab: ["müde", "yorgun"],
  },
  {
    id: "hasta",
    v: LX.sein,
    mid: "krank",
    tr: { k: "cop", word: "hasta" },
    because: ["health", "stay"],
    despite: ["work", "sport", "out"],
    vocab: ["krank", "hasta"],
  },
  {
    id: "zaman-yok",
    v: LX.haben,
    mid: "keine Zeit",
    tr: { k: "have", noun: "zaman", neg: true },
    because: ["fast"],
    despite: ["contact", "fun", "food"],
    vocab: ["keine Zeit haben", "zamanı olmamak"],
  },
  {
    id: "para-yok",
    v: LX.haben,
    mid: "kein Geld",
    tr: { k: "have", noun: "para", neg: true },
    because: ["cheap", "stay"],
    despite: ["money", "travel"],
    vocab: ["kein Geld haben", "parası olmamak"],
  },
  {
    id: "cok-is",
    v: LX.haben,
    mid: "viel Arbeit",
    tr: { k: "have", noun: "iş", pre: "çok" },
    because: ["work", "fast"],
    despite: ["fun", "rest"],
    vocab: ["viel Arbeit haben", "çok işi olmak"],
  },
  {
    id: "ac",
    v: LX.haben,
    mid: "Hunger",
    tr: { k: "cop", word: "aç" },
    because: ["food"],
    despite: [],
    vocab: ["Hunger haben", "aç olmak"],
  },
  {
    id: "izinli",
    v: LX.haben,
    mid: "frei",
    tr: { k: "cop", word: "izinli" },
    because: ["fun", "rest", "contact"],
    despite: ["work", "chore"],
    vocab: ["frei haben", "izinli olmak"],
  },
  {
    id: "sinav-var",
    v: LX.haben,
    mid: "morgen eine Prüfung",
    tr: { k: "have", noun: "sınav", pre: "yarın bir" },
    presentOnly: true,
    because: ["study", "rest"],
    despite: ["fun"],
    vocab: ["eine Prüfung haben", "sınavı olmak"],
  },
  {
    id: "yagmur",
    v: LX.regnen,
    mid: "",
    subj: "es",
    tr: { k: "verb", v: tv("yağ"), subj: "yağmur" },
    because: ["stay", "fast"],
    despite: ["out", "sport"],
    vocab: ["es regnet", "yağmur yağıyor"],
  },
  {
    id: "soguk",
    v: LX.sein,
    mid: "kalt",
    subj: "es",
    tr: { k: "cop", word: "soğuk", subj: "hava" },
    because: ["warm", "stay"],
    despite: ["out", "sport"],
    vocab: ["kalt", "soğuk"],
  },
  {
    id: "hava-guzel",
    v: LX.sein,
    mid: "schön",
    subj: "das Wetter",
    tr: { k: "cop", word: "güzel", subj: "hava" },
    because: ["out", "sport"],
    despite: ["stay"],
    vocab: ["das Wetter", "hava"],
  },
];

// ---------- time expressions ----------

export interface When {
  de: string;
  tr: string;
  /** morning / evening activities only fit matching times */
  part?: "morning" | "evening";
}

export const WHEN_NOW: When[] = [
  { de: "heute", tr: "bugün" },
  { de: "heute Abend", tr: "bu akşam", part: "evening" },
  { de: "am Wochenende", tr: "hafta sonu" },
  { de: "morgen", tr: "yarın" },
  { de: "jetzt", tr: "şimdi" },
];

export const WHEN_PAST: When[] = [
  { de: "gestern", tr: "dün" },
  { de: "gestern Abend", tr: "dün akşam", part: "evening" },
  { de: "heute Morgen", tr: "bu sabah", part: "morning" },
  { de: "letzte Woche", tr: "geçen hafta" },
  { de: "am Samstag", tr: "cumartesi" },
];

export const WHEN_HABIT: When[] = [
  { de: "jeden Tag", tr: "her gün" },
  { de: "jeden Morgen", tr: "her sabah", part: "morning" },
  { de: "jeden Abend", tr: "her akşam", part: "evening" },
  { de: "am Wochenende", tr: "hafta sonları" },
  { de: "oft", tr: "sık sık" },
];

export function fitsTime(e: Ev, w: When): boolean {
  if (w.part === "morning" && e.tags.includes("evening")) return false;
  if (w.part === "evening" && e.tags.includes("morning")) return false;
  // no "her akşam akşam yemeği"
  const trWords = (e.trObj ?? "").split(" ");
  return !w.tr.split(" ").some((x) => x.length > 3 && trWords.includes(x));
}

export function fitsWho(e: Ev, who: Who): boolean {
  return !(e.adult && who.kid);
}
