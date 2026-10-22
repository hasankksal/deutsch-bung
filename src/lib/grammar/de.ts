// German morphology for the sentence generator: verb conjugation, articles, adjective endings.

export type Person = "1sg" | "2sg" | "3sg" | "1pl" | "2pl" | "3pl";
export const PERSONS: Person[] = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"];
export const pi = (p: Person) => PERSONS.indexOf(p);

type Table = readonly [string, string, string, string, string, string];

export interface Verb {
  /** Full infinitive including a separable prefix, e.g. "anrufen" */
  inf: string;
  prefix?: string;
  /** Complete present-tense table (without prefix) for irregular verbs */
  table?: Table;
  /** Stem-changing 2sg / 3sg present forms (without prefix) */
  du?: string;
  er?: string;
  part2: string;
  aux: "haben" | "sein";
  praet?: Table;
  konj2?: Table;
  konj1?: Table;
}

export function baseInf(v: Verb): string {
  return v.prefix ? v.inf.slice(v.prefix.length) : v.inf;
}

function regularTable(base: string): Table {
  if (!base.endsWith("en")) throw new Error(`needs an explicit table: ${base}`);
  const stem = base.slice(0, -2);
  const e = /[dt]$/.test(stem) || /[^aeiouäöülrhmn][mn]$/.test(stem) ? "e" : "";
  const sibilant = /(s|ß|x|z)$/.test(stem);
  return [stem + "e", stem + (sibilant ? "t" : e + "st"), stem + e + "t", base, stem + e + "t", base];
}

/** Finite present form without the separable prefix ("rufe" for anrufen). */
export function present(v: Verb, p: Person): string {
  if (v.table) return v.table[pi(p)];
  if (p === "2sg" && v.du) return v.du;
  if (p === "3sg" && v.er) return v.er;
  return regularTable(baseInf(v))[pi(p)];
}

export function praet(v: Verb, p: Person): string {
  if (!v.praet) throw new Error(`no Präteritum table for ${v.inf}`);
  return v.praet[pi(p)];
}

export function konj2(v: Verb, p: Person): string {
  if (!v.konj2) throw new Error(`no Konjunktiv II table for ${v.inf}`);
  return v.konj2[pi(p)];
}

const verb = (inf: string, part2: string, extra: Partial<Verb> = {}): Verb => ({ inf, part2, aux: "haben", ...extra });

export const V = {
  sein: verb("sein", "gewesen", {
    aux: "sein",
    table: ["bin", "bist", "ist", "sind", "seid", "sind"],
    praet: ["war", "warst", "war", "waren", "wart", "waren"],
    konj2: ["wäre", "wärst", "wäre", "wären", "wärt", "wären"],
    konj1: ["sei", "seist", "sei", "seien", "seiet", "seien"],
  }),
  haben: verb("haben", "gehabt", {
    table: ["habe", "hast", "hat", "haben", "habt", "haben"],
    praet: ["hatte", "hattest", "hatte", "hatten", "hattet", "hatten"],
    konj2: ["hätte", "hättest", "hätte", "hätten", "hättet", "hätten"],
    konj1: ["habe", "habest", "habe", "haben", "habet", "haben"],
  }),
  werden: verb("werden", "geworden", {
    aux: "sein",
    table: ["werde", "wirst", "wird", "werden", "werdet", "werden"],
    praet: ["wurde", "wurdest", "wurde", "wurden", "wurdet", "wurden"],
    konj2: ["würde", "würdest", "würde", "würden", "würdet", "würden"],
  }),
  koennen: verb("können", "gekonnt", {
    table: ["kann", "kannst", "kann", "können", "könnt", "können"],
    praet: ["konnte", "konntest", "konnte", "konnten", "konntet", "konnten"],
    konj2: ["könnte", "könntest", "könnte", "könnten", "könntet", "könnten"],
  }),
  muessen: verb("müssen", "gemusst", {
    table: ["muss", "musst", "muss", "müssen", "müsst", "müssen"],
    praet: ["musste", "musstest", "musste", "mussten", "musstet", "mussten"],
    konj2: ["müsste", "müsstest", "müsste", "müssten", "müsstet", "müssten"],
  }),
  wollen: verb("wollen", "gewollt", {
    table: ["will", "willst", "will", "wollen", "wollt", "wollen"],
    praet: ["wollte", "wolltest", "wollte", "wollten", "wolltet", "wollten"],
  }),
  duerfen: verb("dürfen", "gedurft", {
    table: ["darf", "darfst", "darf", "dürfen", "dürft", "dürfen"],
    praet: ["durfte", "durftest", "durfte", "durften", "durftet", "durften"],
  }),
  sollen: verb("sollen", "gesollt", {
    table: ["soll", "sollst", "soll", "sollen", "sollt", "sollen"],
    praet: ["sollte", "solltest", "sollte", "sollten", "solltet", "sollten"],
    konj2: ["sollte", "solltest", "sollte", "sollten", "solltet", "sollten"],
  }),
  moechten: verb("möchten", "gemocht", { table: ["möchte", "möchtest", "möchte", "möchten", "möchtet", "möchten"] }),
  wissen: verb("wissen", "gewusst", { table: ["weiß", "weißt", "weiß", "wissen", "wisst", "wissen"] }),

  fahren: verb("fahren", "gefahren", { aux: "sein", du: "fährst", er: "fährt" }),
  gehen: verb("gehen", "gegangen", { aux: "sein" }),
  kommen: verb("kommen", "gekommen", { aux: "sein" }),
  fliegen: verb("fliegen", "geflogen", { aux: "sein" }),
  laufen: verb("laufen", "gelaufen", { aux: "sein", du: "läufst", er: "läuft" }),
  bleiben: verb("bleiben", "geblieben", { aux: "sein" }),
  reisen: verb("reisen", "gereist", { aux: "sein" }),
  sprechen: verb("sprechen", "gesprochen", { du: "sprichst", er: "spricht" }),
  lesen: verb("lesen", "gelesen", { du: "liest", er: "liest" }),
  essen: verb("essen", "gegessen", { du: "isst", er: "isst" }),
  sehen: verb("sehen", "gesehen", { du: "siehst", er: "sieht" }),
  nehmen: verb("nehmen", "genommen", { du: "nimmst", er: "nimmt" }),
  geben: verb("geben", "gegeben", { du: "gibst", er: "gibt" }),
  helfen: verb("helfen", "geholfen", { du: "hilfst", er: "hilft" }),
  schlafen: verb("schlafen", "geschlafen", { du: "schläfst", er: "schläft" }),
  treffen: verb("treffen", "getroffen", { du: "triffst", er: "trifft" }),
  vergessen: verb("vergessen", "vergessen", { du: "vergisst", er: "vergisst" }),
  gefallen: verb("gefallen", "gefallen", { du: "gefällst", er: "gefällt" }),
  arbeiten: verb("arbeiten", "gearbeitet"),
  lernen: verb("lernen", "gelernt"),
  spielen: verb("spielen", "gespielt"),
  kaufen: verb("kaufen", "gekauft"),
  suchen: verb("suchen", "gesucht"),
  brauchen: verb("brauchen", "gebraucht"),
  machen: verb("machen", "gemacht"),
  kochen: verb("kochen", "gekocht"),
  wohnen: verb("wohnen", "gewohnt"),
  besuchen: verb("besuchen", "besucht"),
  trinken: verb("trinken", "getrunken"),
  schreiben: verb("schreiben", "geschrieben"),
  verstehen: verb("verstehen", "verstanden"),
  bezahlen: verb("bezahlen", "bezahlt"),
  danken: verb("danken", "gedankt"),
  antworten: verb("antworten", "geantwortet"),
  gratulieren: verb("gratulieren", "gratuliert"),
  gehoeren: verb("gehören", "gehört"),
  passen: verb("passen", "gepasst"),
  glauben: verb("glauben", "geglaubt"),
  warten: verb("warten", "gewartet"),
  denken: verb("denken", "gedacht"),
  finden: verb("finden", "gefunden"),
  hoffen: verb("hoffen", "gehofft"),
  sagen: verb("sagen", "gesagt"),
  bauen: verb("bauen", "gebaut"),
  oeffnen: verb("öffnen", "geöffnet"),
  reparieren: verb("reparieren", "repariert"),
  lachen: verb("lachen", "gelacht"),
  hoeren: verb("hören", "gehört"),
  verpassen: verb("verpassen", "verpasst"),
  bestehen: verb("bestehen", "bestanden"),

  anrufen: verb("anrufen", "angerufen", { prefix: "an" }),
  aufstehen: verb("aufstehen", "aufgestanden", { prefix: "auf", aux: "sein" }),
  einkaufen: verb("einkaufen", "eingekauft", { prefix: "ein" }),
  fernsehen: verb("fernsehen", "ferngesehen", { prefix: "fern", du: "siehst", er: "sieht" }),
  aufraeumen: verb("aufräumen", "aufgeräumt", { prefix: "auf" }),
  ankommen: verb("ankommen", "angekommen", { prefix: "an", aux: "sein" }),
  abfahren: verb("abfahren", "abgefahren", { prefix: "ab", aux: "sein", du: "fährst", er: "fährt" }),
  einladen: verb("einladen", "eingeladen", { prefix: "ein", du: "lädst", er: "lädt" }),
  anfangen: verb("anfangen", "angefangen", { prefix: "an", du: "fängst", er: "fängt" }),
  zumachen: verb("zumachen", "zugemacht", { prefix: "zu" }),
  aufmachen: verb("aufmachen", "aufgemacht", { prefix: "auf" }),
  einschlafen: verb("einschlafen", "eingeschlafen", { prefix: "ein", aux: "sein", du: "schläfst", er: "schläft" }),
  mitkommen: verb("mitkommen", "mitgekommen", { prefix: "mit", aux: "sein" }),
  kennenlernen: verb("kennenlernen", "kennengelernt", { prefix: "kennen" }),
  teilnehmen: verb("teilnehmen", "teilgenommen", { prefix: "teil", du: "nimmst", er: "nimmt" }),
  ausruhen: verb("ausruhen", "ausgeruht", { prefix: "aus" }),
  anziehen: verb("anziehen", "angezogen", { prefix: "an" }),

  liegen: verb("liegen", "gelegen"),
  legen: verb("legen", "gelegt"),
  stehen: verb("stehen", "gestanden"),
  stellen: verb("stellen", "gestellt"),
  haengen: verb("hängen", "gehängt"),
  stecken: verb("stecken", "gesteckt"),
  tun: verb("tun", "getan", { table: ["tue", "tust", "tut", "tun", "tut", "tun"] }),
  interessieren: verb("interessieren", "interessiert"),
  kuemmern: verb("kümmern", "gekümmert", { table: ["kümmere", "kümmerst", "kümmert", "kümmern", "kümmert", "kümmern"] }),
  erinnern: verb("erinnern", "erinnert", { table: ["erinnere", "erinnerst", "erinnert", "erinnern", "erinnert", "erinnern"] }),
  aergern: verb("ärgern", "geärgert", { table: ["ärgere", "ärgerst", "ärgert", "ärgern", "ärgert", "ärgern"] }),
  traeumen: verb("träumen", "geträumt"),
  fuehlen: verb("fühlen", "gefühlt"),
  beeilen: verb("beeilen", "beeilt"),
  freuen: verb("freuen", "gefreut"),
  treffenSich: verb("treffen", "getroffen", { du: "triffst", er: "trifft" }),
  schwimmen: verb("schwimmen", "geschwommen", { aux: "sein" }),
  rauchen: verb("rauchen", "geraucht"),
  kennen: verb("kennen", "gekannt"),
  sparen: verb("sparen", "gespart"),
  ueben: verb("üben", "geübt"),
  verdienen: verb("verdienen", "verdient"),
  telefonieren: verb("telefonieren", "telefoniert"),
  putzen: verb("putzen", "geputzt"),
  waschen: verb("waschen", "gewaschen", { du: "wäschst", er: "wäscht" }),
  gefallen2: verb("gefallen", "gefallen", { du: "gefällst", er: "gefällt" }),
  moegen: verb("mögen", "gemocht", { table: ["mag", "magst", "mag", "mögen", "mögt", "mögen"] }),
  wuenschen: verb("wünschen", "gewünscht"),
  ziehen: verb("ziehen", "gezogen", { aux: "sein" }),
  umziehen: verb("umziehen", "umgezogen", { prefix: "um", aux: "sein" }),
  regnen: verb("regnen", "geregnet"),
} satisfies Record<string, Verb>;

/** The form a learner gets by conjugating an irregular verb as if it were regular (fahrt, sprecht…). */
export function regularPresent(v: Verb, p: Person): string | null {
  try {
    return regularTable(baseInf(v))[pi(p)];
  } catch {
    return null;
  }
}

/** All present forms of a verb except the given person's, for "wrong form" lists. */
export function otherPresentForms(v: Verb, p: Person): string[] {
  const right = present(v, p);
  const forms = new Set<string>(PERSONS.map((q) => present(v, q)));
  const reg = regularPresent(v, p);
  if (reg) forms.add(reg);
  forms.delete(right);
  return [...forms];
}

/** zu-infinitive: "zu lernen", separable "anzurufen". */
export function zuInf(v: Verb): string {
  return v.prefix ? v.prefix + "zu" + baseInf(v) : "zu " + v.inf;
}

// ---------- nouns, articles, adjectives ----------

export type Gender = "m" | "f" | "n";
export type Case = "nom" | "akk" | "dat" | "gen";
type G4 = Gender | "pl";
const gi = (g: G4) => ["m", "f", "n", "pl"].indexOf(g);

export interface Noun {
  sg: string;
  pl?: string;
  g: Gender;
  /** Genitive singular for masculine/neuter, default sg + "s" */
  gen?: string;
  /** n-declension form used outside the nominative (der Nachbar → den Nachbarn) */
  weak?: string;
}

export const n = (sg: string, g: Gender, pl?: string, extra: Partial<Noun> = {}): Noun => ({ sg, g, pl, ...extra });

export function nounForm(noun: Noun, c: Case, plural = false): string {
  if (plural) {
    const pl = noun.pl ?? noun.sg;
    return c === "dat" && !/[ns]$/.test(pl) ? pl + "n" : pl;
  }
  if (noun.weak && c !== "nom") return noun.weak;
  if (c === "gen" && noun.g !== "f") return noun.gen ?? noun.sg + "s";
  return noun.sg;
}

const DEF: Record<Case, string[]> = {
  nom: ["der", "die", "das", "die"],
  akk: ["den", "die", "das", "die"],
  dat: ["dem", "der", "dem", "den"],
  gen: ["des", "der", "des", "der"],
};
const DIES_END: Record<Case, string[]> = {
  nom: ["er", "e", "es", "e"],
  akk: ["en", "e", "es", "e"],
  dat: ["em", "er", "em", "en"],
  gen: ["es", "er", "es", "er"],
};
const EIN_END: Record<Case, string[]> = {
  nom: ["", "e", "", "e"],
  akk: ["en", "e", "", "e"],
  dat: ["em", "er", "em", "en"],
  gen: ["es", "er", "es", "er"],
};

export type Det = "def" | "dies" | "ein" | "kein" | "mein" | "dein" | "sein" | "ihr" | "unser" | "euer" | "Ihr" | "none";

export function determiner(det: Det, c: Case, g: G4): string {
  if (det === "none") return "";
  if (det === "def") return DEF[c][gi(g)];
  if (det === "dies") return "dies" + DIES_END[c][gi(g)];
  if (det === "ein" && g === "pl") return "";
  const end = EIN_END[c][gi(g)];
  if (det === "euer") return end ? "eur" + end : "euer";
  return det + end;
}

export interface Adj {
  base: string;
  /** Stem before endings when it differs: teuer → teur, hoch → hoh */
  stem?: string;
}

const ADJ: Record<"def" | "ein" | "none", Record<Case, string[]>> = {
  def: {
    nom: ["e", "e", "e", "en"],
    akk: ["en", "e", "e", "en"],
    dat: ["en", "en", "en", "en"],
    gen: ["en", "en", "en", "en"],
  },
  ein: {
    nom: ["er", "e", "es", "en"],
    akk: ["en", "e", "es", "en"],
    dat: ["en", "en", "en", "en"],
    gen: ["en", "en", "en", "en"],
  },
  none: {
    nom: ["er", "e", "es", "e"],
    akk: ["en", "e", "es", "e"],
    dat: ["em", "er", "em", "en"],
    gen: ["en", "er", "en", "er"],
  },
};

export function adjForm(a: Adj, det: Det, c: Case, g: G4): string {
  const type = det === "none" || (det === "ein" && g === "pl") ? "none" : det === "def" || det === "dies" ? "def" : "ein";
  return (a.stem ?? a.base) + ADJ[type][c][gi(g)];
}

export interface NP {
  det: Det;
  noun: Noun;
  plural?: boolean;
  adj?: Adj;
}

export function np(o: NP, c: Case): string {
  const g: G4 = o.plural ? "pl" : o.noun.g;
  return [determiner(o.det, c, g), o.adj ? adjForm(o.adj, o.det, c, g) : "", nounForm(o.noun, c, o.plural)]
    .filter(Boolean)
    .join(" ");
}

const CONTRACT: Record<string, string> = {
  "in dem": "im",
  "in das": "ins",
  "an dem": "am",
  "an das": "ans",
  "zu dem": "zum",
  "zu der": "zur",
  "bei dem": "beim",
  "von dem": "vom",
};

/** Prepositional phrase with the standard contractions (in dem → im, zu der → zur…). */
export function pp(prep: string, o: NP, c: Case): string {
  const phrase = np(o, c);
  const [first, ...rest] = phrase.split(" ");
  const contracted = CONTRACT[`${prep} ${first}`];
  return contracted ? [contracted, ...rest].join(" ") : `${prep} ${phrase}`;
}

/** Undo the contractions, used to compare answers leniently. */
export function expandContractions(s: string): string {
  return s.replace(/\b(im|ins|am|ans|zum|zur|beim|vom)\b/gi, (m) => {
    const hit = Object.entries(CONTRACT).find(([, v]) => v === m.toLowerCase());
    return hit ? hit[0] : m;
  });
}

export const PRON_NOM: Record<Person, string> = { "1sg": "ich", "2sg": "du", "3sg": "er", "1pl": "wir", "2pl": "ihr", "3pl": "sie" };
export const REFLEXIVE: Record<Person, string> = { "1sg": "mich", "2sg": "dich", "3sg": "sich", "1pl": "uns", "2pl": "euch", "3pl": "sich" };
export const REFLEXIVE_DAT: Record<Person, string> = { "1sg": "mir", "2sg": "dir", "3sg": "sich", "1pl": "uns", "2pl": "euch", "3pl": "sich" };

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Joins words into a sentence: single spaces, capitalized, with final punctuation. */
export function sentence(parts: (string | false | null | undefined)[], end = "."): string {
  const text = parts
    .filter((p): p is string => Boolean(p))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
  return capitalize(text) + end;
}
