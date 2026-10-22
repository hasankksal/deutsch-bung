import { sentence } from "../grammar/de";
import { ability, necessity, trSentence, tv, type TrVerb } from "../grammar/tr";
import { focus, listTemplate, type Template } from "./engine";

// ---------- B2: reported speech (Konjunktiv I) ----------

const SPEAKERS: { id: string; tr: string; de: { s: string; pron: string }[] }[] = [
  { id: "bakan", tr: "bakan", de: [{ s: "der Minister", pron: "er" }, { s: "die Ministerin", pron: "sie" }] },
  { id: "doktor", tr: "doktor", de: [{ s: "der Arzt", pron: "er" }, { s: "die Ärztin", pron: "sie" }] },
  { id: "ogretmen", tr: "öğretmen", de: [{ s: "der Lehrer", pron: "er" }, { s: "die Lehrerin", pron: "sie" }] },
  { id: "patron", tr: "patronum", de: [{ s: "mein Chef", pron: "er" }, { s: "meine Chefin", pron: "sie" }] },
  { id: "komsu", tr: "komşumuz", de: [{ s: "unser Nachbar", pron: "er" }, { s: "unsere Nachbarin", pron: "sie" }] },
];

const STATEMENTS: { tr: string; k1: (pron: string) => string[]; dass: (pron: string) => string[]; wrong: [string, string][]; ok: string[] }[] = [
  {
    tr: "ekonominin iyi durumda olduğunu",
    k1: () => ["die Wirtschaft sei in einem guten Zustand", "die Wirtschaft sei in gutem Zustand", "der Wirtschaft gehe es gut"],
    dass: () => ["dass die Wirtschaft in einem guten Zustand sei"],
    wrong: [["die Wirtschaft ist", "Haber dilinde aktarımda Konjunktiv I kullanılır: die Wirtschaft sei."]],
    ok: ["bakan"],
  },
  {
    tr: "daha çok çalışmam gerektiğini",
    k1: () => ["ich müsse mehr arbeiten"],
    dass: () => ["dass ich mehr arbeiten müsse"],
    wrong: [["ich muss mehr", "Aktarılan sözde Konjunktiv I: ich müsse."]],
    ok: ["patron", "ogretmen"],
  },
  {
    tr: "daha çok uyumam gerektiğini",
    k1: () => ["ich solle mehr schlafen", "ich müsse mehr schlafen"],
    dass: () => ["dass ich mehr schlafen solle", "dass ich mehr schlafen müsse"],
    wrong: [["ich soll mehr", "Aktarılan sözde Konjunktiv I: ich solle."], ["ich muss mehr", "Aktarılan sözde Konjunktiv I: ich müsse."]],
    ok: ["doktor"],
  },
  {
    tr: "sınavın kolay olacağını",
    k1: () => ["die Prüfung werde leicht sein", "die Prüfung sei leicht"],
    dass: () => ["dass die Prüfung leicht sein werde"],
    wrong: [["die Prüfung wird", "Aktarılan sözde Konjunktiv I: die Prüfung werde leicht sein."]],
    ok: ["ogretmen"],
  },
  {
    tr: "yarın gelemeyeceğini",
    k1: (pron) => [`${pron} könne morgen nicht kommen`],
    dass: (pron) => [`dass ${pron} morgen nicht kommen könne`],
    wrong: [["kann morgen nicht", "Aktarılan sözde Konjunktiv I: er/sie könne."]],
    ok: ["patron", "komsu", "ogretmen"],
  },
  {
    tr: "hiç zamanı olmadığını",
    k1: (pron) => [`${pron} habe keine Zeit`],
    dass: (pron) => [`dass ${pron} keine Zeit habe`],
    wrong: [["hat keine Zeit", "Aktarılan sözde Konjunktiv I: er/sie habe keine Zeit."]],
    ok: ["patron", "komsu", "doktor"],
  },
  {
    tr: "her şeyin yolunda olduğunu",
    k1: () => ["alles sei in Ordnung"],
    dass: () => ["dass alles in Ordnung sei"],
    wrong: [["alles ist in Ordnung", "Aktarılan sözde Konjunktiv I: alles sei in Ordnung."]],
    ok: ["bakan", "doktor", "ogretmen", "patron", "komsu"],
  },
];

const konj1: Template = {
  id: "b2-konj1",
  level: "B2",
  topicId: "b2-konj1",
  rules: ["konj1"],
  hint: "Aktarılan söz: er sagte, … sei / habe / könne / müsse.",
  make(p) {
    const st = p.pick(STATEMENTS);
    const sp = p.pick(SPEAKERS.filter((x) => st.ok.includes(x.id)));
    const de = sp.de.flatMap(({ s, pron }) =>
      ["sagte", "hat gesagt"].flatMap((verb) => {
        const [fin, rest] = verb === "sagte" ? ["sagte", ""] : ["hat", "gesagt"];
        return [...st.k1(pron), ...st.dass(pron)].map((c) => sentence([s, fin, rest, `, ${c}`]));
      }),
    );
    return {
      tr: trSentence([sp.tr, st.tr, "söyledi"]),
      de,
      vocab: [["Konjunktiv I", "aktarma kipi (sei, habe, könne…)"]],
      focus: [focus("konj1", st.k1(sp.de[0].pron)[0], st.wrong)],
    };
  },
};

// ---------- B2: modal passive ----------

const MP_OBJ: { tr: string; de: string }[] = [
  { tr: "kalorifer", de: "die Heizung" },
  { tr: "bilgisayar", de: "der Computer" },
  { tr: "araba", de: "das Auto" },
  { tr: "bisiklet", de: "das Fahrrad" },
  { tr: "çamaşır makinesi", de: "die Waschmaschine" },
  { tr: "pencere", de: "das Fenster" },
];
const MP_VERBS: { tr: TrVerb; de: string[]; v: [string, string] }[] = [
  { tr: tv("tamir edil"), de: ["repariert"], v: ["reparieren", "tamir etmek"] },
  { tr: tv("kontrol edil"), de: ["überprüft", "kontrolliert"], v: ["überprüfen", "kontrol etmek"] },
];
const MP_MODAL: { tr: (v: TrVerb) => string; de: string; front: boolean; time: [string, string] }[] = [
  { tr: (v) => necessity(v, "3sg"), de: "muss", front: false, time: ["hemen", "sofort"] },
  { tr: (v) => necessity(v, "3sg"), de: "muss", front: true, time: ["bu hafta", "diese Woche"] },
  { tr: (v) => ability(v, "3sg"), de: "kann", front: true, time: ["yarın", "morgen"] },
];

const passivModal: Template = {
  id: "b2-modal-edilgen",
  level: "B2",
  topicId: "b2-passiv-modal",
  rules: ["passiv-modal"],
  hint: "Modal fiil 2. sırada, sonda Partizip II + werden: muss repariert werden.",
  make(p) {
    const obj = p.pick(MP_OBJ);
    const v = p.pick(MP_VERBS);
    const m = p.pick(MP_MODAL);
    const de = v.de.flatMap((part) => [
      sentence([obj.de, m.de, m.time[1], part, "werden"]),
      ...(m.front ? [sentence([m.time[1], m.de, obj.de, part, "werden"])] : []),
    ]);
    const part = v.de[0];
    return {
      tr: trSentence([obj.tr, m.time[0], m.tr(v.tr)]),
      de,
      vocab: [v.v],
      focus: [
        focus("passiv-modal", `${part} werden`, [
          [`werden ${part}`, `Sonda önce Partizip II, sonra werden gelir: ${part} werden.`],
          [`${part} sein`, `Eylem anlatan edilgende werden kullanılır: ${part} werden.`],
          [`wird ${part}`, `Modal fiil varken werden mastar hâlinde en sona gider: ${m.de} … ${part} werden.`],
        ]),
      ],
    };
  },
};

const modalPassiveList = listTemplate("b2-edilgen-cumleler", "B2", "b2-passiv-modal", ["passiv-modal", "zustandspassiv"], "Modal edilgen: … muss … werden. Durum: ist geschlossen.", [
  { tr: "Burada sigara içilmez.", de: ["Hier darf nicht geraucht werden.", "Hier wird nicht geraucht."], focus: [focus("passiv-modal", "geraucht werden", [["werden geraucht", "Sonda önce Partizip II, sonra werden: geraucht werden."]])] },
  { tr: "Fatura cumaya kadar ödenmeli.", de: ["Die Rechnung muss bis Freitag bezahlt werden."] },
  { tr: "Form internetten doldurulabilir.", de: ["Das Formular kann online ausgefüllt werden.", "Das Formular kann im Internet ausgefüllt werden."] },
  { tr: "Mağaza pazar günleri kapalı.", de: ["Das Geschäft ist sonntags geschlossen.", "Der Laden ist sonntags geschlossen.", "Sonntags ist das Geschäft geschlossen.", "Sonntags ist der Laden geschlossen."], focus: [focus("zustandspassiv", "ist sonntags geschlossen", [["wird sonntags geschlossen", "Bir durumu anlatıyorsun (kapalı), bu yüzden sein + Partizip II: ist geschlossen."]])] },
  { tr: "Kapı açık.", de: ["Die Tür ist offen.", "Die Tür ist geöffnet.", "Die Tür ist auf."] },
  { tr: "Masa çoktan hazırlandı.", de: ["Der Tisch ist schon gedeckt.", "Der Tisch ist bereits gedeckt.", "Der Tisch wurde schon gedeckt."] },
]);

const nvv = listTemplate("b2-isim-fiil", "B2", "b2-nvv", ["nvv"], "Sabit kalıplar: eine Entscheidung treffen, eine Frage stellen …", [
  { tr: "Henüz bir karar vermedim.", de: ["Ich habe noch keine Entscheidung getroffen.", "Ich habe mich noch nicht entschieden."], focus: [focus("nvv", "Entscheidung getroffen", [["Entscheidung gegeben", "'Karar vermek' = eine Entscheidung treffen (geben değil)."], ["Entscheidung gemacht", "'Karar vermek' = eine Entscheidung treffen (machen değil)."]])] },
  { tr: "Hükümet yeni önlemler aldı.", de: ["Die Regierung hat neue Maßnahmen ergriffen.", "Die Regierung hat neue Maßnahmen getroffen."], focus: [focus("nvv", "Maßnahmen ergriffen", [["Maßnahmen genommen", "'Önlem almak' = Maßnahmen ergreifen / treffen (nehmen değil)."]])] },
  { tr: "Bu görevin sorumluluğunu üstleniyorum.", de: ["Ich übernehme die Verantwortung für diese Aufgabe."], focus: [focus("nvv", "übernehme die Verantwortung", [["nehme die Verantwortung", "'Sorumluluk almak' = Verantwortung übernehmen."]])] },
  { tr: "Bu iş benim için söz konusu değil.", de: ["Dieser Job kommt für mich nicht in Frage.", "Diese Arbeit kommt für mich nicht in Frage.", "Diese Stelle kommt für mich nicht in Frage."] },
  { tr: "Şirket bize bir oda sağladı.", de: ["Die Firma hat uns einen Raum zur Verfügung gestellt.", "Die Firma hat uns ein Zimmer zur Verfügung gestellt."] },
  { tr: "Başkalarını dikkate almalısın.", de: ["Du solltest Rücksicht auf andere nehmen.", "Du musst Rücksicht auf andere nehmen."], focus: [focus("nvv", "Rücksicht auf andere nehmen", [["Rücksicht für andere", "'Dikkate almak' = Rücksicht nehmen auf + Akkusativ."]])] },
  { tr: "Sana bir soru sorabilir miyim?", de: ["Darf ich dir eine Frage stellen?", "Kann ich dir eine Frage stellen?", "Könnte ich dir eine Frage stellen?"], focus: [focus("nvv", "eine Frage stellen", [["eine Frage fragen", "'Soru sormak' = eine Frage stellen."]])] },
]);

const connectors = listTemplate("b2-baglaclar", "B2", "b2-konnektoren", ["konnektoren2"], "sowohl … als auch, weder … noch, entweder … oder, je … desto.", [
  { tr: "Hem Almanca hem İngilizce konuşuyor.", de: ["Er spricht sowohl Deutsch als auch Englisch.", "Sie spricht sowohl Deutsch als auch Englisch."], focus: [focus("konnektoren2", "als auch", [["und auch", "'Hem … hem' = sowohl … als auch."]])] },
  { tr: "Ne kahve ne çay içiyorum.", de: ["Ich trinke weder Kaffee noch Tee."], focus: [focus("konnektoren2", "noch Tee", [["oder Tee", "'Ne … ne' = weder … noch."], ["nicht Tee", "'Ne … ne' = weder … noch."]])] },
  { tr: "Ne arabası ne bisikleti var.", de: ["Er hat weder ein Auto noch ein Fahrrad.", "Sie hat weder ein Auto noch ein Fahrrad."] },
  { tr: "Ya bugün ya yarın geliyorum.", de: ["Ich komme entweder heute oder morgen.", "Entweder komme ich heute oder morgen."], focus: [focus("konnektoren2", "oder morgen", [["noch morgen", "'Ya … ya' = entweder … oder."]])] },
  { tr: "Ya trenle ya otobüsle gidiyoruz.", de: ["Wir fahren entweder mit dem Zug oder mit dem Bus.", "Entweder fahren wir mit dem Zug oder mit dem Bus."] },
  { tr: "Ne kadar çok okursan o kadar çok öğrenirsin.", de: ["Je mehr du liest, desto mehr lernst du.", "Je mehr du liest, umso mehr lernst du."], focus: [focus("konnektoren2", "desto mehr lernst du", [["desto mehr du lernst", "desto'dan sonra çekimli fiil gelir, sonra özne: desto mehr lernst du."]])] },
  { tr: "Ne kadar çok çalışırsan o kadar çok kazanırsın.", de: ["Je mehr du arbeitest, desto mehr verdienst du.", "Je mehr du arbeitest, umso mehr verdienst du."] },
  { tr: "Sadece Almanca değil, Fransızca da öğreniyor.", de: ["Er lernt nicht nur Deutsch, sondern auch Französisch.", "Sie lernt nicht nur Deutsch, sondern auch Französisch."], focus: [focus("konnektoren2", "sondern auch", [["aber auch", "'Sadece … değil, … da' = nicht nur …, sondern auch."]])] },
]);

const konj2Past = listTemplate("b2-gecmis-konj2", "B2", "b2-konj2-vergangen", ["konj2-vergangen"], "Geçmişe dönük varsayım: hätte / wäre + Partizip II.", [
  { tr: "Bunu bilseydim gelirdim.", de: ["Wenn ich das gewusst hätte, wäre ich gekommen.", "Hätte ich das gewusst, wäre ich gekommen.", "Ich wäre gekommen, wenn ich das gewusst hätte."], focus: [focus("konj2-vergangen", "wäre ich gekommen", [["hätte ich gekommen", "kommen sein ile çekimlenir: wäre gekommen."], ["würde ich gekommen", "Geçmişe dönük varsayımda wäre/hätte + Partizip II kullanılır."]])] },
  { tr: "Daha dikkatli olmalıydın.", de: ["Du hättest vorsichtiger sein sollen.", "Du hättest besser aufpassen sollen."], focus: [focus("konj2-vergangen", "hättest", [["musstest", "Geçmişte yapılması gereken ama yapılmayan şey: hättest … sollen."]])] },
  { tr: "Treni kaçırmasaydık zamanında varırdık.", de: ["Wenn wir den Zug nicht verpasst hätten, wären wir pünktlich angekommen.", "Hätten wir den Zug nicht verpasst, wären wir pünktlich angekommen."] },
  { tr: "Keşke daha önce Almanca öğrenmeye başlasaydım.", de: ["Ich wünschte, ich hätte früher angefangen, Deutsch zu lernen.", "Hätte ich doch früher angefangen, Deutsch zu lernen!", "Hätte ich nur früher angefangen, Deutsch zu lernen!", "Ich wünschte, ich hätte früher mit Deutsch angefangen."] },
  { tr: "Keşke o filmi izlemeseydik.", de: ["Ich wünschte, wir hätten den Film nicht gesehen.", "Hätten wir den Film doch nicht gesehen!", "Hätten wir den Film nur nicht gesehen!"] },
  { tr: "Biraz daha erken çıksaydın otobüsü yakalardın.", de: ["Wenn du etwas früher losgegangen wärst, hättest du den Bus noch erreicht.", "Wärst du etwas früher losgegangen, hättest du den Bus noch erreicht.", "Wenn du etwas früher losgegangen wärst, hättest du den Bus bekommen."] },
]);

const partizip = listTemplate("b2-sifat-fiil", "B2", "b2-partizip", ["partizip-attr"], "Partizip I (-end) ve Partizip II isimden önce sıfat gibi çekilir.", [
  { tr: "Uyuyan bebeği uyandırma!", de: ["Weck das schlafende Baby nicht auf!", "Wecke das schlafende Baby nicht auf!"], focus: [focus("partizip-attr", "schlafende Baby", [["schlafend Baby", "Partizip sıfat gibi ek alır: das schlafende Baby."]])] },
  { tr: "Gülen çocuklar bahçede oynuyor.", de: ["Die lachenden Kinder spielen im Garten."], focus: [focus("partizip-attr", "lachenden Kinder", [["lachende Kinder spielen", "der/die/das'tan sonra çoğulda -en: die lachenden Kinder."]])] },
  { tr: "Dün tamir edilen araba yine bozuldu.", de: ["Das gestern reparierte Auto ist wieder kaputt.", "Das Auto, das gestern repariert wurde, ist wieder kaputt.", "Das gestern reparierte Auto ist schon wieder kaputt."] },
  { tr: "Bu, en çok satan kitap.", de: ["Das ist das meistverkaufte Buch.", "Das ist das am meisten verkaufte Buch.", "Das ist der Bestseller."] },
  { tr: "Dün satın aldığım kitap çok sıkıcı.", de: ["Das Buch, das ich gestern gekauft habe, ist sehr langweilig.", "Das gestern gekaufte Buch ist sehr langweilig."] },
  { tr: "Kırık pencereyi kim tamir edecek?", de: ["Wer repariert das kaputte Fenster?", "Wer wird das kaputte Fenster reparieren?", "Wer repariert das zerbrochene Fenster?"] },
]);

export const B2C1: Template[] = [konj1, passivModal, modalPassiveList, nvv, connectors, konj2Past, partizip];
