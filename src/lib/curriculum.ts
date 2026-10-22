import { MIXED_TOPIC, type Level, type Topic } from "./types";

export const LEVEL_INFO: Record<Level, { short: string; name: string; description: string }> = {
  A1: { short: "A1", name: "Başlangıç", description: "Kendini tanıtma, günlük basit cümleler" },
  A2: { short: "A2", name: "Temel", description: "Geçmiş zaman, Dativ, basit yan cümleler" },
  B1: { short: "B1", name: "Orta", description: "Yan cümleler, edilgen çatı, Konjunktiv II" },
  B2: { short: "B2", name: "İleri orta", description: "Dolaylı anlatım, kalıplar, karmaşık yapılar" },
  C1: { short: "C1", name: "İleri", description: "Çift mastar, als ob, uzun sıfat-fiil öbekleri, ileri bağlaçlar, tahmin kipleri, deyimler" },
  GK: { short: "Günlük", name: "Günlük konuşma (ileri)", description: "Gerçek hayatta konuşulan Almanca, ileri seviye: iç içe yan cümleler, Konjunktiv, dolaylı sorular, argo" },
};

/** Short label for buttons and badges ("A2", "Günlük"). */
export function levelLabel(level: Level): string {
  return LEVEL_INFO[level]?.short ?? level;
}

export const TOPICS: Topic[] = [
  // A1
  { id: "a1-sein-haben", level: "A1", name: "sein ve haben", focus: "sein/haben çekimi, kendini tanıtma (Ich bin…, Ich habe…)" },
  { id: "a1-praesens", level: "A1", name: "Şimdiki zaman çekimi", focus: "Präsens: düzenli ve düzensiz fiiller (fahren → fährt, sprechen → spricht)" },
  { id: "a1-artikel-akk", level: "A1", name: "Artikel ve Akkusativ", focus: "der/die/das, ein/eine; Akkusativ: den/einen (Ich habe einen Bruder)" },
  { id: "a1-fragen", level: "A1", name: "Soru cümleleri", focus: "W-Fragen (wo, wann, was, wie) ve evet/hayır soruları; fiil başta veya soru kelimesinden hemen sonra" },
  { id: "a1-negation", level: "A1", name: "Olumsuzluk: nicht / kein", focus: "kein (isimle), nicht (fiil, sıfat, zarfla)" },
  { id: "a1-modal", level: "A1", name: "Modal fiiller", focus: "können, müssen, wollen, möchten; asıl fiil mastar halinde sonda" },
  { id: "a1-trennbar", level: "A1", name: "Ayrılabilen fiiller", focus: "aufstehen, einkaufen, anrufen: ön ek cümle sonuna gider" },
  { id: "a1-zeit", level: "A1", name: "Zaman ifadeleri ve fiil 2. sırada", focus: "Zaman ifadesi başa gelince fiil yine 2. sırada: Morgen gehe ich…" },
  // A2
  { id: "a2-perfekt", level: "A2", name: "Perfekt (geçmiş zaman)", focus: "haben/sein + Partizip II; hareket ve durum değişikliğinde sein" },
  { id: "a2-dativ", level: "A2", name: "Dativ ve Dativ fiiller", focus: "dem/der/dem; helfen, danken, gefallen, gehören + Dativ" },
  { id: "a2-wechsel", level: "A2", name: "İki yönlü edatlar", focus: "in, an, auf, unter, über…: wo? → Dativ, wohin? → Akkusativ; liegen/legen, stehen/stellen" },
  { id: "a2-nebensatz", level: "A2", name: "weil, dass, wenn ile yan cümle", focus: "Yan cümlede çekimli fiil sona gider" },
  { id: "a2-reflexiv", level: "A2", name: "Dönüşlü fiiller", focus: "sich freuen, sich waschen, sich treffen; mich/dich/sich" },
  { id: "a2-vergleich", level: "A2", name: "Karşılaştırma", focus: "Komparativ (größer als), Superlativ (am größten), so … wie" },
  { id: "a2-praeteritum", level: "A2", name: "war, hatte ve modalların geçmişi", focus: "Präteritum: war, hatte, konnte, musste, wollte" },
  { id: "a2-adjektiv", level: "A2", name: "Sıfat çekimi (temel)", focus: "ein großer Hund, der große Hund, mit dem neuen Auto" },
  // B1
  { id: "b1-nebensatz", level: "B1", name: "Yan cümleler (obwohl, als, damit…)", focus: "obwohl, damit, als, während, bevor, nachdem; fiil sona" },
  { id: "b1-relativ", level: "B1", name: "İlgi cümleleri", focus: "der/die/das ilgi zamirleri, hal uyumu: Der Mann, den ich kenne… / dem ich helfe…" },
  { id: "b1-passiv", level: "B1", name: "Edilgen çatı (Passiv)", focus: "werden + Partizip II; Präsens ve Präteritum (wurde gebaut)" },
  { id: "b1-konjunktiv", level: "B1", name: "Konjunktiv II", focus: "würde + mastar, hätte, wäre, könnte: dilek, kibar rica, varsayım" },
  { id: "b1-praepverben", level: "B1", name: "Edatlı fiiller", focus: "warten auf, denken an, sich interessieren für, Angst haben vor; worauf/darauf" },
  { id: "b1-infinitiv", level: "B1", name: "zu + mastar, um … zu", focus: "Es ist schwer, … zu …; um … zu (amaç); ohne … zu" },
  { id: "b1-genitiv", level: "B1", name: "Genitiv ve wegen/trotz", focus: "des Mannes, der Frau; wegen, trotz, während + Genitiv" },
  { id: "b1-plusquam", level: "B1", name: "Plusquamperfekt", focus: "hatte/war + Partizip II: geçmişte daha önce olan olay" },
  // B2
  { id: "b2-konj1", level: "B2", name: "Dolaylı anlatım (Konjunktiv I)", focus: "er sei, er habe, er komme: haber ve aktarma dili" },
  { id: "b2-passiv-modal", level: "B2", name: "Modal fiilli ve durum edilgeni", focus: "muss gemacht werden, kann repariert werden; Zustandspassiv (ist geschlossen)" },
  { id: "b2-partizip", level: "B2", name: "Sıfat-fiil yapıları", focus: "das gestern gekaufte Buch, die lachenden Kinder; ilgi cümlesine alternatif" },
  { id: "b2-nvv", level: "B2", name: "İsim-fiil kalıpları", focus: "eine Entscheidung treffen, in Frage kommen, zur Verfügung stehen" },
  { id: "b2-konnektoren", level: "B2", name: "İki parçalı bağlaçlar", focus: "sowohl … als auch, weder … noch, je … desto, entweder … oder" },
  { id: "b2-konj2-vergangen", level: "B2", name: "Geçmiş Konjunktiv II", focus: "hätte machen sollen, wäre gekommen; pişmanlık ve gerçekleşmemiş varsayım" },
  // C1
  { id: "c1-redewendungen", level: "C1", name: "Deyimler (uzun cümlede)", focus: "aus allen Wolken fallen, jemandem einen Bären aufbinden, ins Fettnäpfchen treten, etwas auf die lange Bank schieben" },
  { id: "c1-partikeln", level: "C1", name: "Parçacıklar (sitem ve öğüt)", focus: "Du hättest ja wenigstens … können! Ich hab dir doch gesagt, dass … Frag halt …!" },
  { id: "c1-register", level: "C1", name: "Resmî yazı dili", focus: "isimleştirme ve Genitiv: Mit der Einführung des neuen Systems …, Bei unvollständiger Vorlage der Unterlagen …" },
  { id: "c1-komplex", level: "C1", name: "Karmaşık cümle yapıları", focus: "so sehr … auch, iç içe yan cümleler, das von meinem Bruder gestern gekaufte Auto" },
  { id: "c1-konjunktiv", level: "C1", name: "Zor Konjunktiv: çift mastar, als ob", focus: "…, dass er es hätte wissen müssen; Wenn ich gestern …, wäre ich jetzt …; Er tut so, als hätte er nichts gewusst." },
  { id: "c1-konnektoren", level: "C1", name: "İleri bağlaçlar", focus: "es sei denn, ohne dass, indem, zumal, sofern, wohingegen, geschweige denn" },
  { id: "c1-passiversatz", level: "C1", name: "Edilgen yerine geçen yapılar", focus: "Das lässt sich lösen / ist zu lösen / ist lösbar; Die Rechnung ist bis Freitag zu bezahlen." },
  { id: "c1-vermutung", level: "C1", name: "Geçmişe dair tahmin", focus: "Er muss den Bus verpasst haben. Sie dürfte schon gegangen sein. Das kann er nicht allein gemacht haben." },
  // everyday spoken German
  { id: "gk-sohbet", level: "GK", name: "Sohbet ve dedikodu", focus: "Ich hab gehört, dass … Stimmt das? Weißt du zufällig, ob …? Was hast du gemacht, seit wir uns das letzte Mal gesehen haben?" },
  { id: "gk-tepki", level: "GK", name: "Tepkiler ve duygular", focus: "Ich kann nicht glauben, dass …! Kein Wunder, dass du müde bist, wenn … Es nervt mich, dass … Hätte ich doch …!" },
  { id: "gk-plan", level: "GK", name: "Plan ve öneri", focus: "Wie wär's, wenn wir …? Wenn …, könnten wir doch …, oder? Lass uns lieber …, statt … zu … Sag mir Bescheid, sobald du weißt, ob …" },
  { id: "gk-kafe", level: "GK", name: "Kafe, restoran, alışveriş", focus: "Ich hätte gern …, aber ohne …, weil … Können Sie mir sagen, ob …? Kann ich … umtauschen, falls sie nicht passt?" },
  { id: "gk-yol", level: "GK", name: "Yol sorma ve ulaşım", focus: "Können Sie mir sagen, wie ich am schnellsten zum … komme? Gehen Sie geradeaus, bis Sie zur … kommen. Muss ich umsteigen?" },
  { id: "gk-telefon", level: "GK", name: "Telefon ve mesajlaşma", focus: "Ich war gerade dabei, … zu …, als du angerufen hast. Kannst du ihr ausrichten, dass …? Ich ruf dich zurück, sobald …" },
  { id: "gk-rica", level: "GK", name: "Rica, teşekkür, özür", focus: "Hättest du was dagegen, wenn ich …? Würde es dir was ausmachen, … zu …? Tut mir leid, dass …, ich hätte … sollen." },
  { id: "gk-argo", level: "GK", name: "Argo ve gündelik deyişler", focus: "null Bock haben, jemanden versetzen, rumhängen, Ich check nicht, warum … Mach dir keinen Kopf!" },
  { id: "gk-fikir", level: "GK", name: "Fikir, katılma, itiraz", focus: "Da hast du zwar recht, aber … Es kommt drauf an, ob … Ich bin mir nicht sicher, ob es eine gute Idee ist, … zu …" },
];

export function topicsForLevel(level: Level): Topic[] {
  return TOPICS.filter((t) => t.level === level);
}

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function topicName(id: string): string {
  if (id === MIXED_TOPIC) return "Karışık";
  return getTopic(id)?.name ?? "Karışık";
}
