import { adjForm, determiner, n, nounForm, present, pp, REFLEXIVE, sentence, type Case, type Noun } from "../grammar/de";
import * as T from "../grammar/tr";
import type { Focus } from "../types";
import { deEvent, deMids, deState, joinTr, mainOrders, reflOf, subOrders, trEvent, trState, verbGroup, type DeClause, type DeTense } from "./clause";
import { focus, type Picker } from "./engine";
import {
  EVENTS,
  EVERYONE,
  fitsTime,
  fitsWho,
  LX,
  PEOPLE,
  PRONOUNS,
  STATES,
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
import { combine, openTemplate, pronounOf, unique, whoFor } from "./open-kit";

// Open-ended B2 and C1 templates.

const has = (e: Ev, ...tags: Tag[]) => e.tags.some((t) => tags.includes(t));
const words = (xs: (string | undefined | null | false)[]) => xs.filter((x): x is string => Boolean(x)).join(" ");
const trNoun = (w: Who) => (w.pron ? null : w.tr);
const E = (id: string): Ev => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`unknown event ${id}`);
  return e;
};

function timeFor(p: Picker, e: Ev, pool: When[], optional = true): When | null {
  const fit = pool.filter((w) => fitsTime(e, w));
  return p.pick(optional ? [null, ...fit] : fit);
}

const THIRD = PRONOUNS.filter((w) => w.id === "o");
/** Subjects for reported speech: third person singular */
const REPORTERS: Who[] = [...THIRD, ...PEOPLE.filter((w) => w.trP === "3sg")];

// ---------- B2: Konjunktiv I (reported speech) ----------

const konj1B2 = openTemplate(
  "b2-acik-konj1",
  "B2",
  "b2-konj1",
  ["konj1"],
  "Dolaylı anlatım: er sei, er habe, er komme; geçmiş: er habe … gemacht / er sei … gegangen; gelecek: er werde … kommen.",
  (p) => {
    const r = p.pick(REPORTERS);
    const tense = p.pick(["pres", "past", "fut"] as const);
    const sayT = p.pick(["pres", "praet", "perf"] as DeTense[]);
    const useState = tense !== "fut" && p.pick([true, false]);
    const st = useState ? p.pick(STATES.filter((s) => !s.subj && !(tense !== "pres" && s.presentOnly))) : null;
    const e = useState ? null : p.pick(EVENTS.filter((x) => !has(x, "arrive", "mini") && fitsWho(x, r)));
    const when = e ? timeFor(p, e, tense === "past" ? WHEN_PAST : tense === "fut" ? [{ de: "morgen", tr: "yarın" }, { de: "am Wochenende", tr: "hafta sonu" }] : WHEN_NOW.filter((w) => w.de !== "morgen")) : null;
    const de: string[] = [];
    let k1 = "";
    let ind = "";
    for (const d of r.de) {
      const pron = pronounOf(d);
      const say = verbGroup(LX.sagen, d.p, sayT);
      const head = words([d.s, say.fin, ...say.end]);
      let clauses: DeClause[];
      if (st) {
        clauses = [deState(st, pron, tense === "past" ? "k1perf" : "k1")];
      } else {
        clauses = deEvent(e!, pron, tense === "past" ? "k1perf" : "k1", { time: when?.de });
        if (tense === "fut") clauses = clauses.map((c) => ({ ...c, vg: { fin: "werde", end: [e!.v.inf] } }));
      }
      for (const c of clauses) {
        for (const mo of mainOrders(c)) de.push(sentence([head + ",", ...mo]));
        for (const so of subOrders(c, "dass")) de.push(sentence([head + ",", ...so]));
      }
      if (!k1) {
        k1 = clauses[0].vg.fin;
        const v = st ? st.v : e!.v;
        ind = tense === "fut" ? "wird" : tense === "past" ? present(v.aux === "sein" ? LX.sein : LX.haben, "3sg") : present(v, "3sg");
      }
    }
    const sayTr = sayT === "pres" ? T.present(T.tv("söyle"), "3sg") : T.past(T.tv("söyle"), "3sg");
    const statement = st ? trState(st, "3sg", tense === "fut" ? "futAcc" : "dikAcc") : trEvent(e!, "3sg", tense === "fut" ? "futAcc" : "dikAcc");
    const front = st && st.tr.k === "have" && !r.pron ? r.gen : trNoun(r);
    const focusList: Focus[] =
      k1 && ind && k1 !== ind ? [focus("konj1", `${pronounOf(r.de[0]).s} ${k1}`, [[`${pronounOf(r.de[0]).s} ${ind}`, `Dolaylı anlatımda (haber dili) Konjunktiv I kullanılır: ${k1} (${ind} değil).`]])] : [];
    return {
      tr: joinTr([front, when?.tr, statement, sayTr]),
      de: unique(de),
      vocab: [["Konjunktiv I", "dolaylı anlatım (… -dığını söyledi)"], st ? st.vocab : e!.vocab],
      focus: focusList,
    };
  },
);

// ---------- B2: passive with modal verbs, Zustandspassiv ----------

interface PObj {
  de: Noun;
  tr: string;
  verbs: string[];
}

const P_OBJS: PObj[] = [
  { de: n("Auto", "n"), tr: "araba", verbs: ["reparieren", "waschen", "verkaufen"] },
  { de: n("Fenster", "n"), tr: "pencere", verbs: ["oeffnen", "schliessen", "putzen"] },
  { de: n("Brief", "m"), tr: "mektup", verbs: ["schicken", "schreiben"] },
  { de: n("Rechnung", "f"), tr: "fatura", verbs: ["bezahlen"] },
  { de: n("Wohnung", "f"), tr: "daire", verbs: ["putzen", "renovieren", "vermieten"] },
  { de: n("Problem", "n"), tr: "sorun", verbs: ["loesen"] },
  { de: n("Paket", "n"), tr: "paket", verbs: ["schicken", "oeffnen"] },
  { de: n("Formular", "n"), tr: "form", verbs: ["ausfuellen"] },
  { de: n("Tür", "f"), tr: "kapı", verbs: ["schliessen", "oeffnen", "reparieren"] },
  { de: n("Computer", "m"), tr: "bilgisayar", verbs: ["reparieren"] },
  { de: n("Termin", "m"), tr: "randevu", verbs: ["absagen", "verschieben"] },
  { de: n("Projekt", "n"), tr: "proje", verbs: ["beenden"] },
  { de: n("Essen", "n"), tr: "yemek", verbs: ["kochen", "bestellen"] },
];

const P_VERBS: Record<string, { de: string; tr: T.TrVerb; state?: string }> = {
  reparieren: { de: "repariert", tr: T.tv("tamir edil") },
  waschen: { de: "gewaschen", tr: T.tv("yıkan") },
  verkaufen: { de: "verkauft", tr: T.tv("satıl") },
  oeffnen: { de: "geöffnet", tr: T.tv("açıl"), state: "açık" },
  schliessen: { de: "geschlossen", tr: T.tv("kapatıl"), state: "kapalı" },
  putzen: { de: "geputzt", tr: T.tv("temizlen") },
  schicken: { de: "geschickt", tr: T.tv("gönderil") },
  schreiben: { de: "geschrieben", tr: T.tv("yazıl") },
  bezahlen: { de: "bezahlt", tr: T.tv("öden") },
  renovieren: { de: "renoviert", tr: T.tv("yenilen") },
  vermieten: { de: "vermietet", tr: T.tv("kiraya veril") },
  loesen: { de: "gelöst", tr: T.tv("çözül") },
  ausfuellen: { de: "ausgefüllt", tr: T.tv("doldurul") },
  absagen: { de: "abgesagt", tr: T.tv("iptal edil") },
  verschieben: { de: "verschoben", tr: T.tv("ertelen") },
  beenden: { de: "beendet", tr: T.tv("bitiril") },
  kochen: { de: "gekocht", tr: T.tv("pişiril") },
  bestellen: { de: "bestellt", tr: T.tv("sipariş edil") },
};

const P_MODALS: { v: LV; neg?: boolean; tr: (v: T.TrVerb, past: boolean) => string; vocab: [string, string] }[] = [
  { v: LX.muessen, tr: (v, past) => `${T.infinitive(v)} ${past ? "zorundaydı" : "zorunda"}`, vocab: ["muss … werden", "-mek zorunda"] },
  { v: LX.koennen, tr: (v, past) => (past ? T.past(T.tv(T.ability(v, "3sg").slice(0, -2)), "3sg") : T.ability(v, "3sg")), vocab: ["kann … werden", "-ebilir"] },
  { v: LX.sollen, tr: (v, past) => (past ? T.necessityPast(v, "3sg") : T.necessity(v, "3sg")), vocab: ["soll … werden", "-meli"] },
  {
    v: LX.duerfen,
    neg: true,
    tr: (v, past) => {
      const nv = T.tv(v.stem + "m" + T.h2(v.stem));
      return past ? T.necessityPast(nv, "3sg") : T.necessity(nv, "3sg");
    },
    vocab: ["darf nicht … werden", "-memeli"],
  },
];

const P_TIMES: When[] = [
  { de: "heute", tr: "bugün" },
  { de: "sofort", tr: "hemen" },
  { de: "bis morgen", tr: "yarına kadar" },
  { de: "nächste Woche", tr: "gelecek hafta" },
];

const passivModalB2 = openTemplate(
  "b2-acik-modal-edilgen",
  "B2",
  "b2-passiv-modal",
  ["passiv-modal", "zustandspassiv"],
  "Modal fiilli edilgen: muss / kann / soll + Partizip II + werden (sonda). Durum: ist + Partizip II.",
  (p) => {
    const o = p.pick(P_OBJS);
    const vk = p.pick(o.verbs);
    const pv = P_VERBS[vk];
    const subj = `${determiner("def", "nom", o.de.g)} ${o.de.sg}`;
    if (p.pick([true, true, false])) {
      const m = p.pick(P_MODALS);
      const past = p.pick([false, true]);
      const when = past ? null : p.pick([null, ...P_TIMES]);
      const fin = past ? m.v.praet[2] : present(m.v, "3sg");
      const tail = words([m.neg ? "nicht" : null, pv.de, "werden"]);
      const de = unique([
        sentence([subj, fin, when?.de, tail]),
        ...(when ? [sentence([when.de, fin, subj, tail])] : []),
      ]);
      return {
        tr: joinTr([o.tr, when?.tr, m.tr(pv.tr, past)]),
        de,
        vocab: [m.vocab, [pv.de, T.infinitive(pv.tr)]],
        focus: [
          focus("passiv-modal", `${pv.de} werden`, [
            [`werden ${pv.de}`, `Modal fiilli edilgende sıra: … ${pv.de} werden (Partizip II, sonra werden).`],
            [`${pv.de} sein`, `Bir işin yapılması gerekiyorsa werden kullanılır: ${fin} … ${pv.de} werden. (sein bir durumu anlatır.)`],
          ]),
        ],
      };
    }
    const past = p.pick([false, true]);
    const be = past ? "war" : "ist";
    const trState = pv.state ?? T.evidential(pv.tr, "3sg");
    return {
      tr: joinTr([o.tr, past ? T.copulaPast(trState, "3sg") : trState]),
      de: [sentence([subj, be, pv.de])],
      vocab: [["Zustandspassiv", "durum edilgeni (ist … gemacht)"], [pv.de, T.infinitive(pv.tr)]],
      focus: [focus("zustandspassiv", `${be} ${pv.de}`, [[`${past ? "wurde" : "wird"} ${pv.de}`, `Sonuç / durum anlatılıyor: ${be} ${pv.de} (Zustandspassiv). wird ${pv.de} ise yapılmakta olan işi anlatır.`]])],
    };
  },
);

// ---------- B1: passive (present, past, Perfekt) ----------

const AGENTS: { de: string; tr: string }[] = [
  { de: "von meinem Vater", tr: "babam tarafından" },
  { de: "von meiner Mutter", tr: "annem tarafından" },
  { de: "von meinem Bruder", tr: "erkek kardeşim tarafından" },
  { de: "von den Nachbarn", tr: "komşular tarafından" },
];

const passivB1 = openTemplate(
  "b1-acik-edilgen",
  "B1",
  "b1-passiv",
  ["passiv"],
  "Edilgen: wird + Partizip II; geçmiş: wurde … ; Perfekt: ist … worden. Yapan kişi: von + Dativ.",
  (p) => {
    const o = p.pick(P_OBJS);
    const pv = P_VERBS[p.pick(o.verbs)];
    const past = p.pick([false, true]);
    const agent = p.pick([null, null, ...AGENTS]);
    const when = past ? p.pick([null, ...WHEN_PAST.filter((w) => !w.part)]) : p.pick([null, { de: "heute", tr: "bugün" }, { de: "gerade", tr: "şu anda" }]);
    const subj = `${determiner("def", "nom", o.de.g)} ${o.de.sg}`;
    const mid = words([when?.de, agent?.de]);
    const de = past
      ? unique([
          sentence([subj, "wurde", mid, pv.de]),
          sentence([subj, "ist", mid, pv.de, "worden"]),
          ...(when ? [sentence([when.de, "wurde", subj, agent?.de, pv.de]), sentence([when.de, "ist", subj, agent?.de, pv.de, "worden"])] : []),
        ])
      : unique([sentence([subj, "wird", mid, pv.de]), ...(when ? [sentence([when.de, "wird", subj, agent?.de, pv.de])] : [])]);
    const focusList: Focus[] = past
      ? [
          focus("passiv", `${pv.de} worden`, [[`${pv.de} geworden`, `Edilgen Perfekt'te werden'in ortacı worden olur (geworden değil): ist … ${pv.de} worden.`]]),
          focus("passiv", `${subj} wurde`, [[`${subj} war`, `Yapılan bir işi anlatan geçmiş edilgende wurde kullanılır: wurde … ${pv.de}.`]]),
        ]
      : [focus("passiv", `${subj} wird`, [[`${subj} ist`, `Yapılmakta olan iş: wird + Partizip II (ist … ${pv.de} bir durumu anlatır).`]])];
    return {
      tr: joinTr([o.tr, when?.tr, agent?.tr, past ? T.past(pv.tr, "3sg") : T.present(pv.tr, "3sg")]),
      de,
      vocab: [[pv.de, T.infinitive(pv.tr)], ["von + Dativ", "tarafından"]],
      focus: focusList,
    };
  },
);

// ---------- B2: participles as adjectives ----------

const P1_PEOPLE: { de: Noun; pl?: boolean; tr: string; soft?: string }[] = [
  { de: n("Kinder", "n", "Kinder"), pl: true, tr: "çocuklar" },
  { de: n("Mann", "m"), tr: "adam" },
  { de: n("Frau", "f"), tr: "kadın" },
  { de: n("Leute", "f", "Leute"), pl: true, tr: "insanlar" },
  { de: n("Hund", "m"), tr: "köpek", soft: "köpeğ" },
  { de: n("Studenten", "m", "Studenten"), pl: true, tr: "öğrenciler" },
];

const P1_VERBS: { de: string; tr: string }[] = [
  { de: "spielend", tr: "oynayan" },
  { de: "lachend", tr: "gülen" },
  { de: "wartend", tr: "bekleyen" },
  { de: "schlafend", tr: "uyuyan" },
  { de: "singend", tr: "şarkı söyleyen" },
  { de: "laufend", tr: "koşan" },
];

const P1_SEE: { v: LV; tr: T.TrVerb; vocab: [string, string] }[] = [
  { v: LX.sehen, tr: T.tv("gör"), vocab: ["sehen", "görmek"] },
  { v: LX.beobachten, tr: T.tv("izle"), vocab: ["beobachten", "izlemek, gözlemlemek"] },
  { v: LX.fotografieren, tr: T.tv("fotoğrafla"), vocab: ["fotografieren", "fotoğrafını çekmek"] },
];

const P2_THINGS: { de: Noun; tr: string; verb: { de: string; tr: string; dik: T.TrVerb }; preds: [string, string][] }[] = [
  { de: n("Buch", "n"), tr: "kitap", verb: { de: "gekauft", tr: "alınan", dik: T.tv("al") }, preds: [["sehr interessant", "çok ilginç"], ["zu teuer", "çok pahalı"]] },
  { de: n("Auto", "n"), tr: "araba", verb: { de: "repariert", tr: "tamir edilen", dik: T.tv("tamir et", "tamir ed") }, preds: [["wieder kaputt", "yine bozuk"], ["sehr schnell", "çok hızlı"]] },
  { de: n("Kuchen", "m"), tr: "kek", verb: { de: "gebacken", tr: "yapılan", dik: T.tv("yap") }, preds: [["sehr lecker", "çok lezzetli"], ["zu süß", "çok tatlı"]] },
  { de: n("Brief", "m"), tr: "mektup", verb: { de: "geschrieben", tr: "yazılan", dik: T.tv("yaz") }, preds: [["sehr lang", "çok uzun"], ["sehr schön", "çok güzel"]] },
  { de: n("Wohnung", "f"), tr: "daire", verb: { de: "renoviert", tr: "yenilenen", dik: T.tv("yenile") }, preds: [["sehr hell", "çok aydınlık"], ["zu teuer", "çok pahalı"]] },
  { de: n("Essen", "n"), tr: "yemek", verb: { de: "bestellt", tr: "sipariş edilen", dik: T.tv("sipariş et", "sipariş ed") }, preds: [["kalt", "soğuk"], ["sehr lecker", "çok lezzetli"]] },
];

const P2_WHEN: When[] = [
  { de: "gestern", tr: "dün" },
  { de: "letzte Woche", tr: "geçen hafta" },
];

const partizipB2 = openTemplate(
  "b2-acik-sifat-fiil",
  "B2",
  "b2-partizip",
  ["partizip-attr"],
  "Sıfat-fiil isimden önce sıfat gibi çekimlenir: die spielenden Kinder, das gestern gekaufte Buch.",
  (p) => {
    if (p.pick([true, false])) {
      const x = p.pick(P1_PEOPLE);
      const pv = p.pick(P1_VERBS.filter((v) => !(x.de.sg === "Hund" && v.de === "singend")));
      const see = p.pick(P1_SEE);
      const w = p.pick(EVERYONE);
      const g = x.pl ? "pl" : x.de.g;
      const adj = adjForm({ base: pv.de }, "def", "akk", g);
      const obj = `${determiner("def", "akk", g)} ${adj} ${nounForm(x.de, "akk", x.pl)}`;
      const de = unique(w.de.map((d) => sentence([d.s, present(see.v, d.p), obj])));
      const objTr = x.pl ? T.kase(x.tr, "acc") : T.kase(x.tr, "acc", false, x.soft);
      return {
        tr: joinTr([trNoun(w), pv.tr, objTr, T.present(see.tr, w.trP)]),
        de,
        vocab: [[`${pv.de}`, pv.tr], see.vocab],
        focus: [
          focus("partizip-attr", `${adj} ${nounForm(x.de, "akk", x.pl)}`, [
            [`${pv.de} ${nounForm(x.de, "akk", x.pl)}`, `Partizip I isimden önce sıfat gibi ek alır: ${obj}.`],
            [`${pv.de.replace(/d$/, "")} ${nounForm(x.de, "akk", x.pl)}`, `-an / -en sıfat-fiili Almancada mastar + d ile yapılır: ${pv.de} → ${adj}.`],
          ]),
        ],
      };
    }
    const x = p.pick(P2_THINGS);
    const pred = p.pick(x.preds);
    const agent = p.pick([null, null, PEOPLE.find((w) => w.id === "anne")!, PEOPLE.find((w) => w.id === "baba")!]);
    const when = agent ? null : p.pick(P2_WHEN);
    const adj = adjForm({ base: x.verb.de }, "def", "nom", x.de.g);
    const art = determiner("def", "nom", x.de.g);
    const agentDe = agent ? (agent.id === "anne" ? "von meiner Mutter" : "von meinem Vater") : null;
    const np = words([art, when?.de, agentDe, adj, x.de.sg]);
    const relPron = determiner("def", x.de.g === "m" ? "akk" : "nom", x.de.g);
    const relDe = agent
      ? `${art} ${x.de.sg}, ${relPron} ${agent.de[0].s} ${x.verb.de} hat`
      : `${art} ${x.de.sg}, ${determiner("def", "nom", x.de.g)} ${when!.de} ${x.verb.de} wurde`;
    const de = unique([sentence([np, "ist", pred[0]]), sentence([relDe + ",", "ist", pred[0]])]);
    const trNp = agent ? `${agent.gen} ${T.dik(x.verb.dik, "3sg")} ${x.tr}` : `${when!.tr} ${x.verb.tr} ${x.tr}`;
    return {
      tr: joinTr([trNp, pred[1]]),
      de,
      vocab: [[x.verb.de, x.verb.tr], [`${art} ${x.de.sg}`, x.tr]],
      focus: [
        focus("partizip-attr", `${adj} ${x.de.sg}`, [
          [`${x.verb.de} ${x.de.sg}`, `Partizip II isimden önce sıfat gibi ek alır: ${np}.`],
          [`${x.verb.de}en ${x.de.sg}`, `Belirli artikel, Nominativ, tekil: ${adj} (-e).`],
        ]),
      ],
    };
  },
);

// ---------- B2: noun-verb collocations ----------

interface Nvv {
  v: LV;
  mid: string;
  tr: T.TrVerb;
  trObj: string;
  vocab: [string, string];
  /** A verb Turkish speakers often use instead, and why it is wrong */
  wrong?: [LV, string];
}

const NVVS: Nvv[] = [
  { v: LX.treffen, mid: "eine wichtige Entscheidung", tr: T.tv("karar ver"), trObj: "önemli bir", vocab: ["eine Entscheidung treffen", "karar vermek"], wrong: [LX.machen, "Karar vermek: eine Entscheidung treffen (machen değil)."] },
  { v: LX.stellen, mid: "dem Lehrer eine Frage", tr: T.tv("sor"), trObj: "öğretmene bir soru", vocab: ["eine Frage stellen", "soru sormak"], wrong: [LX.fragen, "Soru sormak: eine Frage stellen (eine Frage fragen değil)."] },
  { v: LX.machen, mid: "einen Vorschlag", tr: T.tv("bulun"), trObj: "bir öneride", vocab: ["einen Vorschlag machen", "öneride bulunmak"] },
  { v: LX.machen, mid: "eine kurze Pause", tr: T.tv("ver"), trObj: "kısa bir mola", vocab: ["eine Pause machen", "mola vermek"], wrong: [LX.nehmen, "Mola vermek: eine Pause machen (nehmen değil)."] },
  { v: LX.machen, mid: "einen großen Fehler", tr: T.tv("yap"), trObj: "büyük bir hata", vocab: ["einen Fehler machen", "hata yapmak"] },
  { v: LX.ablegen, mid: "eine Prüfung", tr: T.tv("gir"), trObj: "bir sınava", vocab: ["eine Prüfung ablegen", "sınava girmek"] },
  { v: LX.stellen, mid: "einen Antrag", tr: T.tv("bulun"), trObj: "bir başvuruda", vocab: ["einen Antrag stellen", "başvuruda bulunmak"], wrong: [LX.machen, "Başvuruda bulunmak: einen Antrag stellen (machen değil)."] },
  { v: LX.halten, mid: "eine kurze Rede", tr: T.tv("yap"), trObj: "kısa bir konuşma", vocab: ["eine Rede halten", "konuşma yapmak"], wrong: [LX.machen, "Konuşma yapmak: eine Rede halten (machen değil)."] },
  { v: LX.vereinbaren, mid: "einen Termin beim Arzt", tr: T.tv("al"), trObj: "doktordan randevu", vocab: ["einen Termin vereinbaren", "randevu almak"] },
  { v: LX.finden, mid: "eine Lösung", tr: T.tv("bul"), trObj: "bir çözüm", vocab: ["eine Lösung finden", "çözüm bulmak"] },
  { v: LX.uebernehmen, mid: "die Verantwortung", tr: T.tv("al"), trObj: "sorumluluğu", vocab: ["die Verantwortung übernehmen", "sorumluluk almak"], wrong: [LX.nehmen, "Sorumluluk almak: Verantwortung übernehmen (nehmen değil)."] },
  { v: LX.zeigen, mid: "großes Interesse an dem Projekt", tr: T.tv("göster"), trObj: "projeye büyük ilgi", vocab: ["Interesse zeigen an (+D)", "ilgi göstermek"] },
  { v: LX.leisten, mid: "einen wichtigen Beitrag", tr: T.tv("bulun"), trObj: "önemli bir katkıda", vocab: ["einen Beitrag leisten", "katkıda bulunmak"], wrong: [LX.machen, "Katkıda bulunmak: einen Beitrag leisten (machen değil)."] },
  { v: LX.leisten, mid: "Erste Hilfe", tr: T.tv("yap"), trObj: "ilk yardım", vocab: ["Erste Hilfe leisten", "ilk yardım yapmak"], wrong: [LX.machen, "İlk yardım yapmak: Erste Hilfe leisten."] },
  { v: LX.machen, mid: "eine Ausnahme", tr: T.tv("yap"), trObj: "bir istisna", vocab: ["eine Ausnahme machen", "istisna yapmak"] },
];

const nvvB2 = openTemplate(
  "b2-acik-isim-fiil",
  "B2",
  "b2-nvv",
  ["nvv"],
  "İsim-fiil kalıplarını birlikte öğren: eine Entscheidung treffen, eine Frage stellen, eine Rede halten …",
  (p) => {
    const x = p.pick(NVVS);
    const w = p.pick(EVERYONE);
    const tense = p.pick(["pres", "perf", "fut"] as const);
    const when = p.pick([null, ...(tense === "perf" ? WHEN_PAST : tense === "fut" ? [{ de: "morgen", tr: "yarın" }, { de: "nächste Woche", tr: "gelecek hafta" }] : [{ de: "heute", tr: "bugün" }]).filter((y) => !y.part)]);
    const ev: Ev = { id: "nvv", v: x.v, mid: x.mid, tr: x.tr, trObj: x.trObj, tags: [], vocab: x.vocab };
    const t: DeTense = tense;
    const de: string[] = [];
    for (const d of w.de) {
      for (const c of deEvent(ev, d, t, { time: when?.de })) for (const mo of mainOrders(c)) de.push(sentence(mo));
      if (when) for (const c of deEvent(ev, d, t)) for (const mo of mainOrders(c, when.de)) de.push(sentence(mo));
    }
    const d0 = w.de[0];
    const c0 = deEvent(ev, d0, t)[0];
    const verbWord = tense === "pres" ? c0.vg.fin : c0.vg.end[0];
    let wrongWord = "";
    if (x.wrong) {
      const wc = verbGroup(x.wrong[0], d0.p, t);
      wrongWord = tense === "pres" ? wc.fin : wc.end[0];
    }
    const trForm = tense === "perf" ? "past" : tense === "fut" ? "fut" : "pres";
    return {
      tr: joinTr([trNoun(w), when?.tr, trEvent(ev, w.trP, trForm)]),
      de: unique(de),
      vocab: [x.vocab],
      focus: x.wrong && wrongWord && wrongWord !== verbWord && !(c0.vg.sep) ? [focus("nvv", verbWord, [[wrongWord, x.wrong[1]]])] : [],
    };
  },
);

// ---------- B2: two-part connectors ----------

const KON_VERBS: { v: LV; tr: T.TrVerb; acc?: boolean; objs: [string, string][] }[] = [
  { v: LX.trinken, tr: T.tv("iç"), objs: [["Kaffee", "kahve"], ["Tee", "çay"], ["Wasser", "su"], ["Saft", "meyve suyu"], ["Milch", "süt"]] },
  { v: LX.essen, tr: T.tv("ye"), objs: [["Fleisch", "et"], ["Fisch", "balık"], ["Gemüse", "sebze"], ["Obst", "meyve"], ["Reis", "pilav"]] },
  { v: LX.sprechen, tr: T.tv("konuş"), objs: [["Deutsch", "Almanca"], ["Englisch", "İngilizce"], ["Türkisch", "Türkçe"], ["Französisch", "Fransızca"], ["Spanisch", "İspanyolca"]] },
  { v: LX.spielen, tr: T.tv("oyna"), objs: [["Fußball", "futbol"], ["Tennis", "tenis"], ["Basketball", "basketbol"], ["Schach", "satranç"]] },
  { v: LX.lernen, tr: T.tv("öğren"), objs: [["Deutsch", "Almanca"], ["Englisch", "İngilizce"], ["Gitarre", "gitar"], ["Mathe", "matematik"]] },
  { v: LX.hoeren, tr: T.tv("dinle"), objs: [["Rock", "rock"], ["Jazz", "caz"], ["Popmusik", "pop müzik"], ["klassische Musik", "klasik müzik"]] },
  { v: LX.moegen, tr: T.tv("sev"), acc: true, objs: [["Hunde", "köpekleri"], ["Katzen", "kedileri"], ["Pferde", "atları"], ["Vögel", "kuşları"]] },
];

const daClitic = (word: string) => `${word} d${T.h2(word)}`;

const konnektorB2 = openTemplate(
  "b2-acik-baglaclar",
  "B2",
  "b2-konnektoren",
  ["konnektoren2"],
  "İki parçalı bağlaçlar: sowohl … als auch (hem … hem), weder … noch (ne … ne), entweder … oder (ya … ya), nicht nur … sondern auch.",
  (p) => {
    const kv = p.pick(KON_VERBS);
    const a = p.pick(kv.objs);
    const b = p.pick(kv.objs.filter((x) => x !== a));
    const w = p.pick(EVERYONE);
    const kind = p.pick(["sowohl", "weder", "entweder", "nichtnur"] as const);
    const de = unique(
      w.de.map((d) => {
        const head = [d.s, present(kv.v, d.p)];
        if (kind === "sowohl") return sentence([...head, "sowohl", a[0], "als auch", b[0]]);
        if (kind === "weder") return sentence([...head, "weder", a[0], "noch", b[0]]);
        if (kind === "entweder") return sentence([...head, "entweder", a[0], "oder", b[0]]);
        return sentence([...head, "nicht nur", a[0] + ",", "sondern auch", b[0]]);
      }),
    );
    const verb = T.present(kv.tr, w.trP);
    const tr =
      kind === "sowohl"
        ? joinTr([trNoun(w), "hem", a[1], "hem", b[1], verb])
        : kind === "weder"
          ? joinTr([trNoun(w), "ne", a[1], "ne", b[1], verb])
          : kind === "entweder"
            ? joinTr([trNoun(w), "ya", a[1], "ya da", b[1], verb])
            : joinTr([trNoun(w), `sadece ${a[1]} değil,`, daClitic(b[1]), verb]);
    const f: Record<typeof kind, Focus> = {
      sowohl: focus("konnektoren2", "als auch", [["und auch", "sowohl … als auch birlikte kullanılır (und auch değil)."]]),
      weder: focus("konnektoren2", "noch", [["oder", "weder … noch birlikte kullanılır: weder … noch (oder değil)."]]),
      entweder: focus("konnektoren2", "oder", [["noch", "entweder … oder birlikte kullanılır: entweder … oder."]]),
      nichtnur: focus("konnektoren2", "sondern auch", [["aber auch", "nicht nur … sondern auch (aber değil)."]]),
    };
    return {
      tr,
      de,
      vocab: [
        kind === "sowohl" ? ["sowohl … als auch", "hem … hem"] : kind === "weder" ? ["weder … noch", "ne … ne"] : kind === "entweder" ? ["entweder … oder", "ya … ya da"] : ["nicht nur … sondern auch", "sadece … değil, … de"],
      ],
      focus: [f[kind]],
    };
  },
);

const JE: { a: { v: LV; mid?: string; refl?: boolean; tr: T.TrVerb; trMore: string }; b: { v: LV; comp: string; mid?: string; refl?: boolean; tr: T.TrVerb; trComp: string } }[] = [
  { a: { v: LX.lernen, tr: T.tv("çalış"), trMore: "çok" }, b: { v: LX.verstehen, comp: "besser", mid: "die Grammatik", tr: T.tv("anla"), trComp: "dilbilgisini o kadar iyi" } },
  { a: { v: LX.ueben, tr: T.tv("pratik yap"), trMore: "çok" }, b: { v: LX.sprechen, comp: "besser", mid: "Deutsch", tr: T.tv("konuş"), trComp: "o kadar iyi Almanca" } },
  { a: { v: LX.schlafen, tr: T.tv("uyu"), trMore: "çok" }, b: { v: LX.fuehlen, comp: "besser", refl: true, tr: T.tv("hisset", "hissed", "hisseder"), trComp: "kendimi o kadar iyi" } },
  { a: { v: LX.arbeiten, tr: T.tv("çalış"), trMore: "çok" }, b: { v: LX.sein, comp: "müder", tr: T.tv("yorgun ol"), trComp: "o kadar" } },
  { a: { v: LX.lesen, tr: T.tv("oku"), trMore: "çok" }, b: { v: LX.lernen, comp: "mehr", tr: T.tv("öğren"), trComp: "o kadar çok şey" } },
  { a: { v: LX.ueben, tr: T.tv("pratik yap"), trMore: "çok" }, b: { v: LX.spielen, comp: "besser", mid: "Gitarre", tr: T.tv("çal"), trComp: "o kadar iyi gitar" } },
  { a: { v: LX.lesen, tr: T.tv("oku"), trMore: "çok" }, b: { v: LX.sprechen, comp: "besser", mid: "Deutsch", tr: T.tv("konuş"), trComp: "o kadar iyi Almanca" } },
  { a: { v: LX.sparen, tr: T.tv("biriktir"), trMore: "çok" }, b: { v: LX.reisen, comp: "öfter", tr: T.tv("seyahat et", "seyahat ed"), trComp: "o kadar sık" } },
  { a: { v: LX.machen, mid: "Sport", tr: T.tv("spor yap"), trMore: "çok" }, b: { v: LX.fuehlen, comp: "besser", refl: true, tr: T.tv("hisset", "hissed", "hisseder"), trComp: "kendimi o kadar iyi" } },
  { a: { v: LX.hoeren, mid: "deutsche Musik", tr: T.tv("Almanca müzik dinle"), trMore: "çok" }, b: { v: LX.verstehen, comp: "mehr", tr: T.tv("anla"), trComp: "o kadar çok şey" } },
];

const jeDestoB2 = openTemplate(
  "b2-acik-je-desto",
  "B2",
  "b2-konnektoren",
  ["konnektoren2"],
  "Je + karşılaştırma + yan cümle (fiil sonda), desto + karşılaştırma + fiil + özne: Je mehr ich lerne, desto besser verstehe ich.",
  (p) => {
    const j = p.pick(JE);
    const w = p.pick(PRONOUNS);
    const de: string[] = [];
    let expect = "";
    let wrong = "";
    for (const d of w.de) {
      const reflA = j.a.refl ? REFLEXIVE[d.p] : null;
      const reflB = j.b.refl ? REFLEXIVE[d.p] : null;
      const sub = words(["je mehr", d.s, reflA, j.a.mid, present(j.a.v, d.p)]);
      const fin = present(j.b.v, d.p);
      de.push(sentence([sub + ",", "desto", j.b.comp, fin, d.s, reflB, j.b.mid]));
      de.push(sentence([sub + ",", "umso", j.b.comp, fin, d.s, reflB, j.b.mid]));
      if (!expect) {
        expect = `desto ${j.b.comp} ${fin} ${d.s}`;
        wrong = `desto ${j.b.comp} ${d.s} ${fin}`;
      }
    }
    const condA = T.aoristCond(j.a.tr, w.trP);
    const tr = joinTr(["ne kadar", j.a.trMore, condA, j.b.trComp, T.aorist(j.b.tr, w.trP)]);
    return {
      tr: tr.replace("kendimi", T.possCase("kendi", w.trP, "acc")),
      de: unique(de),
      vocab: [["je … desto", "ne kadar … o kadar"]],
      focus: [focus("konnektoren2", expect, [[wrong, `desto'dan sonra karşılaştırma sıfatı, sonra çekimli fiil, sonra özne gelir: ${expect} …`]])],
    };
  },
);

// ---------- B2: past Konjunktiv II ----------

const konj2PastB2 = openTemplate(
  "b2-acik-gecmis-konj2",
  "B2",
  "b2-konj2-vergangen",
  ["konj2-vergangen"],
  "Pişmanlık: hätte … machen sollen (-meliydim). Gerçekleşmemiş varsayım: wenn … hätte / wäre, hätte / wäre … + Partizip II.",
  (p) => {
    const kind = p.pick(["sollen", "gern", "wenn"] as const);
    const conds: (St & { fits: Tag[] })[] = [
      { id: "z", v: LX.haben, mid: "mehr Zeit", tr: { k: "have", noun: "zaman", pre: "daha çok" }, because: [], despite: [], vocab: ["mehr Zeit", "daha çok zaman"], fits: ["fun", "sport", "contact", "study", "travel"] },
      { id: "g", v: LX.haben, mid: "mehr Geld", tr: { k: "have", noun: "para", pre: "daha çok" }, because: [], despite: [], vocab: ["mehr Geld", "daha çok para"], fits: ["travel", "money", "fun"] },
      { id: "m", v: LX.sein, mid: "nicht so müde", tr: { k: "cop", word: "bu kadar yorgun", neg: true }, because: [], despite: [], vocab: ["müde", "yorgun"], fits: ["fun", "sport", "contact", "chore"] },
      { id: "k", v: LX.sein, mid: "nicht krank", tr: { k: "cop", word: "hasta", neg: true }, because: [], despite: [], vocab: ["krank", "hasta"], fits: ["work", "sport", "out", "fun"] },
    ];
    const c = p.pick(conds);
    const e = p.pick(EVENTS.filter((x) => !has(x, "arrive", "bad", "mini") && (kind !== "wenn" || has(x, ...c.fits))));
    const w = whoFor(p, e);
    const de: string[] = [];
    if (kind === "sollen") {
      const neg = Boolean(e.kein) && p.pick([false, true]);
      const when = neg ? null : timeFor(p, e, WHEN_PAST);
      for (const d of w.de) {
        for (const mid of deMids(e, d, neg)) {
          const tail = words([reflOf(e, d.p), when?.de, mid, e.v.inf, "sollen"]);
          de.push(sentence([d.s, verbGroup(LX.haben, d.p, "k2").fin, tail]));
          if (when) de.push(sentence([when.de, verbGroup(LX.haben, d.p, "k2").fin, d.s, words([reflOf(e, d.p), mid, e.v.inf, "sollen"])]));
        }
      }
      const d0 = w.de[0];
      const h = verbGroup(LX.haben, d0.p, "k2").fin;
      return {
        tr: joinTr([trNoun(w), when?.tr, trEvent(e, w.trP, "necPast", neg)]),
        de: unique(de),
        vocab: [["hätte … sollen", "-meliydi"], e.vocab],
        focus: [focus("konj2-vergangen", `${e.v.inf} sollen`, [[`sollen ${e.v.inf}`, `Çift mastarda sıra: … ${e.v.inf} sollen (modal fiil en sonda).`], [`${e.v.part2} sollen`, `${h} ile birlikte iki mastar kullanılır: ${e.v.inf} sollen (Partizip II değil).`]])],
      };
    }
    if (kind === "gern") {
      for (const d of w.de) for (const c of deEvent(e, d, "k2perf")) {
        const withGern: DeClause = { ...c, mid: ["gern", ...c.mid] };
        for (const mo of mainOrders(withGern)) de.push(sentence(mo));
        const withGerne: DeClause = { ...c, mid: ["gerne", ...c.mid] };
        for (const mo of mainOrders(withGerne)) de.push(sentence(mo));
      }
      const c0 = deEvent(e, w.de[0], "k2perf")[0];
      const wrongAux = verbGroup(LX[e.v.aux === "sein" ? "haben" : "sein"], w.de[0].p, "k2").fin;
      return {
        tr: joinTr([trNoun(w), trEvent(e, w.trP, "inf"), T.aoristPast(T.tv("iste"), w.trP)]),
        de: unique(de),
        vocab: [["hätte / wäre gern …", "-mek isterdim"], e.vocab],
        focus: [
          focus("konj2-vergangen", words([c0.subj, c0.vg.fin, c0.refl, "gern"]), [
            [words([c0.subj, wrongAux, c0.refl, "gern"]), `${e.v.part2} için yardımcı fiil ${e.v.aux === "sein" ? "wäre" : "hätte"} olmalı.`],
          ]),
        ],
      };
    }
    const subs = (d: DeWho) => [deState(c, d, "k2perf")];
    const mains = (d: DeWho) => deEvent(e, d, "k2perf");
    for (const d of w.de) {
      const pron = pronounOf(d);
      de.push(...combine("wenn", subs(d), mains(pron), false));
      de.push(...combine("wenn", subs(pron), mains(d), true).filter((x) => !x.startsWith("Wenn")));
    }
    const s0 = subs(w.de[0])[0];
    const front = w.pron ? null : c.tr.k === "have" ? w.gen : w.tr;
    return {
      tr: joinTr([front, trState(c, w.trP, "condPast"), trEvent(e, w.trP, "aorPast")]),
      de: unique(de),
      vocab: [["hätte … gehabt / wäre … gewesen", "-saydı"], e.vocab],
      focus: [focus("konj2-vergangen", `${s0.vg.end[0]} ${s0.vg.fin}`, [[`${s0.vg.end[0]} ${verbGroup(c.v, w.de[0].p, "plusq").fin}`, `Gerçekleşmemiş geçmiş: Partizip II + ${s0.vg.fin} (Konjunktiv II).`]])],
    };
  },
);

// ---------- C1: nominal style ----------

interface Nom {
  de: Noun;
  owner: string;
  tr: string;
  soft?: string;
  owner_tr: string;
  tags: string[];
}

const NOMS: Nom[] = [
  { de: n("Abfahrt", "f"), owner: "des Zuges", tr: "kalkış", owner_tr: "trenin", tags: ["travel"] },
  { de: n("Ankunft", "f"), owner: "der Gäste", tr: "geliş", owner_tr: "misafirlerin", tags: ["event"] },
  { de: n("Eröffnung", "f"), owner: "der Ausstellung", tr: "açılış", owner_tr: "serginin", tags: ["event"] },
  { de: n("Renovierung", "f"), owner: "des Gebäudes", tr: "yenilenme", owner_tr: "binanın", tags: ["works"] },
  { de: n("Durchführung", "f"), owner: "des Projekts", tr: "yürütülme", owner_tr: "projenin", tags: ["office"] },
  { de: n("Unterzeichnung", "f"), owner: "des Vertrags", tr: "imzalanma", owner_tr: "sözleşmenin", tags: ["office"] },
  { de: n("Prüfung", "f"), owner: "der Unterlagen", tr: "incelenme", owner_tr: "belgelerin", tags: ["office"] },
  { de: n("Veröffentlichung", "f"), owner: "der Ergebnisse", tr: "yayımlanma", owner_tr: "sonuçların", tags: ["office"] },
  { de: n("Reparatur", "f"), owner: "der Heizung", tr: "tamir", owner_tr: "kaloriferin", tags: ["works"] },
  { de: n("Beginn", "m"), owner: "der Veranstaltung", tr: "başlangıç", soft: "başlangıc", owner_tr: "etkinliğin", tags: ["event"] },
  { de: n("Bauarbeiten", "f", "Bauarbeiten"), owner: "am Bahnhof", tr: "inşaat çalışmaları", owner_tr: "istasyondaki", tags: ["works"] },
  { de: n("Einführung", "f"), owner: "des neuen Systems", tr: "devreye alınma", owner_tr: "yeni sistemin", tags: ["office"] },
  { de: n("Verlängerung", "f"), owner: "des Vertrags", tr: "uzatılma", owner_tr: "sözleşmenin", tags: ["office"] },
  { de: n("Sanierung", "f"), owner: "der Straße", tr: "onarılma", owner_tr: "yolun", tags: ["works"] },
  { de: n("Umbau", "m"), owner: "der Küche", tr: "tadilat", owner_tr: "mutfağın", tags: ["works"] },
  { de: n("Landung", "f"), owner: "des Flugzeugs", tr: "iniş", owner_tr: "uçağın", tags: ["travel"] },
  { de: n("Wahl", "f"), owner: "des neuen Vorstands", tr: "seçilme", owner_tr: "yeni yönetimin", tags: ["event"] },
  { de: n("Konferenz", "f"), owner: "der Direktoren", tr: "konferans", owner_tr: "müdürlerin", tags: ["event"] },
];

const NOM_PREPS: { de: string; c: Case; tr: (np: string) => string; ok: string[] }[] = [
  { de: "nach", c: "dat", tr: (x) => `${T.kase(x, "abl", true)} sonra`, ok: ["travel", "event", "office", "works"] },
  { de: "vor", c: "dat", tr: (x) => `${T.kase(x, "abl", true)} önce`, ok: ["travel", "event", "office"] },
  { de: "während", c: "gen", tr: (x) => `${x} sırasında`, ok: ["works"] },
  { de: "wegen", c: "gen", tr: (x) => `${x} nedeniyle`, ok: ["works"] },
  { de: "bis zu", c: "dat", tr: (x) => `${T.kase(x, "dat", true)} kadar`, ok: ["event", "office", "works"] },
];

/** First: after the fronted phrase (verb second); then with {pp} in the middle field. */
const NOM_MAIN: { de: string[]; tr: string; ok: string[] }[] = [
  { de: ["werden alle Teilnehmer informiert", "alle Teilnehmer werden {pp} informiert"], tr: "tüm katılımcılar bilgilendirilecek", ok: ["nach", "vor", "bis zu"] },
  { de: ["bleibt das Büro geschlossen", "das Büro bleibt {pp} geschlossen"], tr: "ofis kapalı kalacak", ok: ["während", "wegen", "bis zu"] },
  { de: ["ist mit Verspätungen zu rechnen", "es ist {pp} mit Verspätungen zu rechnen", "muss mit Verspätungen gerechnet werden"], tr: "gecikmeler yaşanabilir", ok: ["während", "wegen"] },
  { de: ["erhalten Sie eine Bestätigung", "Sie erhalten {pp} eine Bestätigung"], tr: "bir onay alacaksınız", ok: ["nach"] },
  { de: ["bitten wir um Ihr Verständnis", "wir bitten {pp} um Ihr Verständnis"], tr: "anlayışınızı rica ediyoruz", ok: ["während", "wegen"] },
  { de: ["ist der Eingang gesperrt", "der Eingang ist {pp} gesperrt"], tr: "giriş kapalı olacak", ok: ["während", "wegen", "bis zu"] },
  { de: ["können Sie Ihre Fragen stellen", "Sie können {pp} Ihre Fragen stellen"], tr: "sorularınızı sorabilirsiniz", ok: ["nach", "vor"] },
  { de: ["gibt es einen kleinen Empfang", "es gibt {pp} einen kleinen Empfang"], tr: "küçük bir resepsiyon verilecek", ok: ["nach"] },
  { de: ["fällt der Unterricht aus", "der Unterricht fällt {pp} aus"], tr: "dersler yapılmayacak", ok: ["während", "wegen"] },
  { de: ["werden die Türen geschlossen", "die Türen werden {pp} geschlossen"], tr: "kapılar kapatılacak", ok: ["vor"] },
];

function nomPhrase(x: Nom, prep: string, c: Case): string {
  const plural = Boolean(x.de.pl && x.de.pl === x.de.sg);
  const g = plural ? "pl" : x.de.g;
  const head = `${determiner("def", c, g)} ${nounForm(x.de, c, plural)}`;
  const phrase = prep === "bis zu" ? `bis ${pp("zu", { det: "def", noun: x.de, plural }, c)}` : `${prep} ${head}`;
  return `${phrase} ${x.owner}`;
}

const nominalC1 = openTemplate(
  "c1-acik-resmi",
  "C1",
  "c1-register",
  ["nominalstil"],
  "Resmî dilde fiil yerine isim kullanılır: Nach der Abfahrt des Zuges … (Tren kalktıktan sonra yerine).",
  (p) => {
    const prep = p.pick(NOM_PREPS);
    const x = p.pick(NOMS.filter((y) => y.tags.some((t) => prep.ok.includes(t))));
    const main = p.pick(NOM_MAIN.filter((m) => m.ok.includes(prep.de)));
    const phrase = nomPhrase(x, prep.de, prep.c);
    const de = unique(main.de.map((m) => (m.includes("{pp}") ? sentence([m.replace("{pp}", phrase)]) : sentence([phrase, m]))));
    // "inşaat çalışmaları" already carries the compound suffix
    const trHead = x.owner === "am Bahnhof" ? `${x.owner_tr} ${x.tr}` : `${x.owner_tr} ${T.poss(x.tr, "3sg", x.soft)}`;
    const trPhrase = prep.tr(trHead);
    const wrongCase: Case = prep.c === "gen" ? "dat" : "gen";
    const wrongPhrase = nomPhrase(x, prep.de, wrongCase);
    return {
      tr: joinTr([trPhrase, main.tr]),
      de,
      vocab: [[`${determiner("def", "nom", x.de.pl === x.de.sg ? "pl" : x.de.g)} ${x.de.sg}`, x.tr]],
      focus: wrongPhrase !== phrase ? [focus("nominalstil", phrase, [[wrongPhrase, `${prep.de} ${prep.c === "gen" ? "Genitiv" : "Dativ"} ister: ${phrase}.`]])] : [],
    };
  },
);

// ---------- C1: complex sentences ----------

const SO_SEHR: { a: Ev | { v: LV; mid?: string; refl?: boolean; tr: T.TrVerb; trObj?: string }; how: string; trHow: string; b: (d: DeWho) => string; trB: (w: Who) => string; vocab: [string, string] }[] = [
  { a: { v: LX.lernen, tr: T.tv("çalış") }, how: "so viel", trHow: "ne kadar çok", b: (d) => words([d.s, present(LX.verstehen, d.p), "die Grammatik nicht"]), trB: (w) => `dilbilgisini ${T.present(T.tv("anla"), w.trP, true)}`, vocab: ["so viel … auch", "ne kadar çok … -se de"] },
  { a: { v: LX.bemuehen, refl: true, tr: T.tv("uğraş") }, how: "so sehr", trHow: "ne kadar", b: (d) => words([d.s, present(LX.schaffen, d.p), "es nicht"]), trB: (w) => T.inabilityPresent(T.tv("başar"), w.trP), vocab: ["so sehr … auch", "ne kadar … -se de"] },
  { a: { v: LX.beeilen, refl: true, tr: T.tv("acele et", "acele ed") }, how: "so sehr", trHow: "ne kadar", b: (d) => words([d.s, present(LX.kommen, d.p), "immer zu spät"]), trB: (w) => `hep ${T.present(T.tv("geç kal"), w.trP)}`, vocab: ["so sehr … auch", "ne kadar … -se de"] },
  { a: { v: LX.aufstehen, mid: "früh", tr: T.tv("kalk"), trObj: "erken" }, how: "so", trHow: "ne kadar", b: (d) => words([d.s, present(LX.sein, d.p), "immer müde"]), trB: (w) => `hep ${T.copula("yorgun", w.trP)}`, vocab: ["so früh … auch", "ne kadar erken … -se de"] },
  { a: { v: LX.essen, tr: T.tv("ye") }, how: "so viel", trHow: "ne kadar çok", b: (d) => words([d.s, present(LX.haben, d.p), "immer Hunger"]), trB: (w) => `hep ${T.copula("aç", w.trP)}`, vocab: ["so viel … auch", "ne kadar çok … -se de"] },
  { a: { v: LX.sparen, tr: T.tv("biriktir") }, how: "so viel", trHow: "ne kadar çok", b: (d) => words([d.s, present(LX.haben, d.p), "nie genug Geld"]), trB: (w) => `hiçbir zaman yeterli ${T.poss("para", w.trP)} olmuyor`, vocab: ["so viel … auch", "ne kadar çok … -se de"] },
];

const komplexC1 = openTemplate(
  "c1-acik-karmasik",
  "C1",
  "c1-komplex",
  ["so-sehr-auch"],
  "So sehr / so viel … auch + fiil sonda (ne kadar … -se de); iç içe yan cümlelerde her yan cümlenin fiili sona gider.",
  (p) => {
    if (p.pick([true, false])) {
      const s = p.pick(SO_SEHR);
      const w = p.pick(PRONOUNS);
      const a = s.a as { v: LV; mid?: string; refl?: boolean; tr: T.TrVerb; trObj?: string };
      const de: string[] = [];
      for (const d of w.de) {
        const sub = words([s.how === "so" ? `so ${a.mid}` : s.how, d.s, a.refl ? REFLEXIVE[d.p] : null, "auch", s.how === "so" ? null : a.mid, a.v.prefix ? a.v.prefix + present(a.v, d.p) : present(a.v, d.p)]);
        const main = s.b(d);
        const [subj, fin, ...rest] = main.split(" ");
        de.push(sentence([sub + ",", main]));
        de.push(sentence([sub + ",", fin, subj, ...rest]));
      }
      const c = T.cond(a.tr, w.trP);
      return {
        tr: joinTr([s.how === "so" ? `${s.trHow} ${a.trObj}` : s.trHow, `${c} d${T.h2(c)}`, s.trB(w)]),
        de: unique(de),
        vocab: [s.vocab],
        focus: [],
      };
    }
    // Als …, weil …: two subordinate clauses around one main clause
    const arrive = E(p.pick(["eve-gel", "eve-don", "var-ofis", "var-istasyon"]));
    const st = p.pick(STATES.filter((x) => !x.subj && x.because.length && !x.presentOnly));
    const e = p.pick(EVENTS.filter((x) => has(x, ...st.because) && !has(x, "arrive", "move", "bad") && x.id !== "evde-kal"));
    const w = p.pick(PRONOUNS.filter((x) => fitsWho(e, x) && fitsWho(arrive, x)));
    const de: string[] = [];
    for (const d of w.de) {
      for (const als of subOrders(deEvent(arrive, d, "praet")[0], "als")) {
        for (const weil of subOrders(deState(st, d, "praet"), "weil")) {
          for (const t of ["perf", "praet"] as DeTense[]) {
            for (const m of deEvent(e, d, t)) {
              for (const mo of mainOrders(m, als.join(" ") + ",")) de.push(sentence([...mo, ",", ...weil]));
              for (const mo of mainOrders(m, weil.join(" ") + ",")) de.push(sentence([...mo, ",", ...als]));
            }
          }
        }
      }
    }
    return {
      tr: joinTr([trEvent(arrive, w.trP, "dikLoc"), trState(st, w.trP, "dikIcin"), trEvent(e, w.trP, "past")]),
      de: unique(de),
      vocab: [["als …, weil …", "-dığında … -dığı için"], st.vocab, e.vocab],
      focus: [],
    };
  },
);

export const OPEN_B2C1 = [passivB1, konj1B2, passivModalB2, partizipB2, nvvB2, konnektorB2, jeDestoB2, konj2PastB2, nominalC1, komplexC1];
