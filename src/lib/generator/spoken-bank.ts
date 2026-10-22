import type { Focus } from "../types";
import { say } from "./alts";
import { focus, listTemplate, type ListItem } from "./engine";

// Advanced everyday German: long spoken sentences people really say, each with the usual ways of
// saying it ({a|b} alternatives, [optional] words). Short spoken forms (hab, wär's, drauf) and
// filler particles (mal, doch, echt …) are evened out by the grader, so they are not listed here.

const item = (tr: string, patterns: string[], vocab: [string, string][], fx: Focus[] = []): ListItem => ({
  tr,
  de: say(...patterns),
  vocab,
  ...(fx.length ? { focus: fx } : {}),
});

const endOf = (rule: string, right: string, wrong: string, why: string) => focus(rule, right, [[wrong, why]]);

const SOHBET: ListItem[] = [
  item(
    "Görüşmeyeli asırlar oldu! En son görüştüğümüzden beri neler yaptın bakalım?",
    ["{Lange nicht gesehen|Wir haben uns ewig nicht gesehen|Ewig nicht gesehen|Wir haben uns lange nicht gesehen}! Was hast du [denn] [so] gemacht, seit wir uns {das letzte Mal|zuletzt|zum letzten Mal} gesehen haben?"],
    [["seit wir uns das letzte Mal gesehen haben", "en son görüştüğümüzden beri"], ["ewig", "asırlardır (abartma)"]],
    [endOf("nebensatz", "das letzte Mal gesehen haben", "haben das letzte Mal gesehen", "seit yan cümle açar, çekimli fiil en sona gider: seit wir uns das letzte Mal gesehen haben.")],
  ),
  item(
    "Hâlâ o şirkette mi çalışıyorsun, yoksa sonunda istifa ettin mi?",
    ["Arbeitest du [eigentlich] {immer noch|noch immer|noch} bei {der|dieser} Firma, oder hast du {endlich|schließlich} gekündigt?"],
    [["kündigen", "istifa etmek"], ["immer noch", "hâlâ"]],
  ),
  item(
    "Ayşe ile Ali'nin ayrıldığını duydun mu? Açıkçası hiç beklemiyordum.",
    [
      "Hast du [schon] gehört, dass {Ayşe und Ali sich|sich Ayşe und Ali} getrennt haben? {{Ehrlich gesagt|Ganz ehrlich}, {damit hätte ich nie gerechnet|das hätte ich nie erwartet|damit habe ich nicht gerechnet}|Damit hätte ich ehrlich gesagt nie gerechnet|Das hätte ich ehrlich gesagt nie erwartet}.",
    ],
    [["sich trennen", "ayrılmak"], ["mit etwas rechnen", "bir şeyi beklemek, hesaba katmak"]],
    [endOf("nebensatz", "getrennt haben", "haben sich getrennt", "dass yan cümle açar, çekimli fiil en sona gider: dass Ayşe und Ali sich getrennt haben.")],
  ),
  item(
    "Tahmin et geçen hafta kiminle karşılaştım: eski lise öğretmenimizle!",
    [
      "Rate mal, wen ich letzte Woche [zufällig] getroffen habe: {unseren alten Lehrer|unsere alte Lehrerin} {vom Gymnasium|aus der Schule|aus der Oberstufe}!",
      "Rate mal, wer mir letzte Woche über den Weg gelaufen ist: {unser alter Lehrer|unsere alte Lehrerin} {vom Gymnasium|aus der Schule}!",
    ],
    [["Rate mal, …", "tahmin et …"], ["jemandem über den Weg laufen", "biriyle karşılaşmak"]],
    [endOf("indirekte-frage", "wen ich letzte Woche", "wen habe ich letzte Woche", "Dolaylı soruda (Rate mal, wen …) fiil en sona gider: wen ich letzte Woche getroffen habe.")],
  ),
  item(
    "Sana bir şey anlatacağım ama kimseye söylemeyeceğine söz vermen lazım.",
    ["{Ich erzähl dir {was|etwas}|Ich muss dir {was|etwas} erzählen|Ich sag dir {was|etwas}|Ich muss dir {was|etwas} sagen}, aber du musst mir versprechen, dass du es {niemandem|keinem} {sagst|erzählst|weitersagst|weitererzählst}."],
    [["versprechen", "söz vermek"], ["weitersagen", "başkasına söylemek"]],
  ),
  item(
    "Ne zamandır Almanca öğreniyorsun? Hiç aksanın yok, ben de burada doğduğunu sanmıştım!",
    ["{Seit wann|Wie lange} lernst du [schon] Deutsch? Du hast {gar keinen|überhaupt keinen|keinen} Akzent, ich dachte, du {bist|wärst} hier geboren!"],
    [["Ich dachte, du …", "… sanmıştım"], ["der Akzent", "aksan"]],
  ),
  item(
    "Hafta sonu ne yaptın? Sakın bana bütün gün evde oturduğunu söyleme!",
    ["Was hast du am Wochenende gemacht? Sag [mir] [bloß|jetzt] nicht, dass du {den ganzen Tag|die ganze Zeit} zu Hause {rumgesessen hast|rumgesessen bist|gesessen hast|geblieben bist}!"],
    [["Sag bloß nicht, dass …", "sakın … deme"], ["rumsitzen", "boş boş oturmak"]],
  ),
  item(
    "Biliyor musun, Ali gelecek ay Berlin'e taşınıyor, çünkü orada sonunda iş bulmuş.",
    ["{Weißt du was|Stell dir vor|Weißt du schon}? Ali zieht nächsten Monat nach Berlin [um], {weil er {da|dort} endlich {einen Job|eine Stelle|Arbeit} gefunden hat|denn er hat {da|dort} endlich {einen Job|eine Stelle|Arbeit} gefunden}."],
    [["umziehen", "taşınmak"], ["Stell dir vor!", "düşünsene!, biliyor musun"]],
    [endOf("nebensatz", "gefunden hat", "hat endlich einen Job gefunden", "weil yan cümle açar, çekimli fiil en sona gider: weil er da endlich einen Job gefunden hat.")],
  ),
  item(
    "Keşke daha sık görüşebilsek, ama ikimizin de hiç vakti yok.",
    [
      "Ich {wünschte|wünsche mir}, wir könnten uns öfter sehen, aber wir haben {beide|alle beide} {nie|keine|einfach nie|einfach keine} Zeit.",
      "Wenn wir uns doch [nur|bloß] öfter sehen könnten, aber wir haben beide {nie|keine} Zeit.",
    ],
    [["Ich wünschte, …", "keşke …"], ["öfter", "daha sık"]],
  ),
  item(
    "Annen nasıl? En son konuştuğumuzda hastanedeydi, değil mi?",
    ["Wie geht's deiner Mutter? Als wir {das letzte Mal|zuletzt} {gesprochen|telefoniert} haben, {war sie [doch] im Krankenhaus|lag sie [doch] im Krankenhaus}, {oder|nicht|ne|stimmt's}?"],
    [["als wir das letzte Mal …", "en son … -diğimizde"], ["im Krankenhaus liegen", "hastanede yatmak"]],
  ),
  item(
    "Bu arada, düğüne gelip gelmeyeceğini hâlâ söylemedin bana.",
    [
      "Übrigens, du hast mir {immer noch nicht|noch immer nicht|noch nicht} gesagt, ob du {zur|auf die} Hochzeit {kommst|kommen wirst}.",
      "Übrigens hast du mir {immer noch nicht|noch nicht} gesagt, ob du {zur|auf die} Hochzeit kommst.",
    ],
    [["übrigens", "bu arada"], ["ob …", "-ip -meyeceğini"]],
    [endOf("indirekte-frage", "ob du zur Hochzeit kommst", "ob kommst du zur Hochzeit", "ob dolaylı soru açar, çekimli fiil en sona gider: ob du zur Hochzeit kommst.")],
  ),
  item(
    "Bence ikiniz çok iyi anlaşırsınız, sizi bir ara mutlaka tanıştırmalıyım.",
    ["{Ich glaube|Ich denke|Ich finde}, ihr {zwei|beide} würdet euch {super|richtig gut|total gut|echt gut|sehr gut} verstehen, ich {muss|sollte} euch {unbedingt mal|mal|irgendwann mal|unbedingt} {vorstellen|miteinander bekannt machen|einander vorstellen}."],
    [["sich gut verstehen", "iyi anlaşmak"], ["jemanden vorstellen", "birini tanıştırmak"]],
  ),
];

const TEPKI: ListItem[] = [
  item(
    "Olamaz! Bunu bana neden daha önce söylemedin? Bilseydim ben de gelirdim!",
    ["{Das gibt's doch nicht|Das kann doch nicht wahr sein|Echt jetzt}! Warum hast du mir das nicht {früher|vorher|eher} gesagt? {Wenn ich das gewusst hätte|Hätte ich das gewusst}, {wäre ich auch gekommen|wäre ich auch mitgekommen|wäre ich mitgekommen}!"],
    [["Wenn ich das gewusst hätte, …", "bilseydim …"], ["mitkommen", "birlikte gelmek"]],
    [endOf("konj2-vergangen", "das gewusst hätte", "hätte das gewusst", "wenn yan cümlesinde çekimli fiil (hätte) en sona gider: wenn ich das gewusst hätte.")],
  ),
  item(
    "O kadar üşüyorum ki artık parmaklarımı hissetmiyorum.",
    ["Mir ist so kalt, dass ich meine Finger {nicht mehr|gar nicht mehr|kaum noch} {spüre|fühle}.", "Ich friere so, dass ich meine Finger {nicht mehr|gar nicht mehr} spüre."],
    [["so …, dass …", "o kadar … ki"], ["spüren", "hissetmek"]],
    [focus("mir-ist", "Mir ist so kalt", [["Ich bin so kalt", "Üşümek: kişi Dativ'dir, fiil ist kalır: Mir ist kalt (Ich bin kalt yanlış)."]])],
  ),
  item(
    "Sınavı geçtiğime hâlâ inanamıyorum, o kadar rahatladım ki ağlayacağım!",
    ["Ich kann [es] {immer noch nicht|noch immer nicht} glauben, dass ich die Prüfung bestanden habe, ich bin so erleichtert, dass ich gleich {heule|weine|anfange zu heulen|anfange zu weinen}!"],
    [["eine Prüfung bestehen", "sınavı geçmek"], ["erleichtert", "rahatlamış"], ["heulen", "ağlamak (konuşma)"]],
    [endOf("dass-gefuehl", "die Prüfung bestanden habe", "habe die Prüfung bestanden", "dass yan cümle açar, çekimli fiil en sona gider: dass ich die Prüfung bestanden habe.")],
  ),
  item(
    "Bana öyle bakma! Sanki suçlu benmişim gibi davranıyorsun.",
    ["{Guck|Schau|Sieh} mich nicht so an! Du tust so, {als ob ich schuld wäre|als wäre ich schuld|als ob ich schuld bin|als ob ich der Schuldige wäre}."],
    [["so tun, als ob …", "… -mış gibi davranmak"], ["schuld sein", "suçlu olmak"]],
  ),
  item(
    "Ne kadar utandım anlatamam, yerin dibine girmek istedim!",
    ["{Du glaubst [gar] nicht, wie peinlich mir das war|Das war mir so peinlich|Ich habe mich so geschämt}, ich wäre am liebsten im {Boden|Erdboden} versunken!"],
    [["im Boden versinken", "yerin dibine girmek"], ["peinlich", "utanç verici"]],
  ),
  item(
    "Bu kadar sinirleneceğin hiç aklıma gelmezdi, sadece şaka yapıyordum!",
    ["Ich hätte nie gedacht, dass du dich so {aufregst|aufregen würdest|ärgerst}, ich habe doch nur {Spaß gemacht|einen Witz gemacht|gescherzt}!", "Ich hätte nie gedacht, dass du so sauer {wirst|werden würdest}, ich habe doch nur {Spaß gemacht|einen Witz gemacht}!"],
    [["Ich hätte nie gedacht, dass …", "… hiç aklıma gelmezdi"], ["sich aufregen", "sinirlenmek"]],
  ),
  item(
    "Ciddi misin? Bu dairenin kirası gerçekten iki bin euro mu? Kafayı mı yemişler?",
    [
      "Ist das dein Ernst? Die Miete für {diese|die} Wohnung ist {echt|wirklich} {zweitausend|2000} Euro? {Die spinnen doch|Sind die verrückt geworden|Spinnen die}?",
      "Ist das dein Ernst? {Diese|Die} Wohnung kostet {echt|wirklich} {zweitausend|2000} Euro Miete? {Die spinnen doch|Sind die verrückt geworden|Spinnen die}?",
    ],
    [["Ist das dein Ernst?", "ciddi misin?"], ["Die spinnen doch!", "kafayı yemişler!"]],
  ),
  item(
    "Keşke onu dinleseydim, şimdi başım bu kadar dertte olmazdı.",
    ["{Hätte ich doch [bloß|nur] auf {ihn|sie} gehört|Wenn ich doch [nur|bloß] auf {ihn|sie} gehört hätte|Ich wünschte, ich hätte auf {ihn|sie} gehört}, dann {wäre ich jetzt nicht in so einer Situation|säße ich jetzt nicht so in der Patsche|hätte ich jetzt nicht so viel Ärger|hätte ich jetzt nicht so viele Probleme}."],
    [["auf jemanden hören", "birini dinlemek (söz dinlemek)"], ["in der Patsche sitzen", "başı dertte olmak"]],
  ),
  item(
    "Her seferinde aynı şeyi söylemek zorunda kalmaktan gerçekten bıktım artık!",
    ["Ich habe {echt|wirklich|langsam} die Nase voll davon, jedes Mal {das Gleiche|dasselbe} sagen zu müssen!", "Ich habe es {echt|wirklich|langsam} satt, jedes Mal {das Gleiche|dasselbe} sagen zu müssen!"],
    [["die Nase voll haben", "bıkmak, gına gelmek"], ["… sagen zu müssen", "söylemek zorunda kalmak"]],
    [focus("zu-infinitiv", "sagen zu müssen", [["zu sagen müssen", "Modal fiille zu-mastar: zu, modal fiilin önüne gelir: sagen zu müssen."]])],
  ),
  item(
    "İyi ki gelmişsin, sen olmasan bu partide sıkıntıdan patlardım!",
    ["{Gut|Schön|Wie gut|Zum Glück}, dass du gekommen bist, ohne dich {wäre ich auf {dieser|der} Party vor Langeweile gestorben|hätte ich mich auf {dieser|der} Party zu Tode gelangweilt}!"],
    [["Gut, dass …", "iyi ki …"], ["sich zu Tode langweilen", "sıkıntıdan patlamak"]],
  ),
  item(
    "Dün akşamki maçı görmen lazımdı, son dakikada attığımız golle kazandık!",
    ["Du hättest das Spiel gestern Abend sehen {müssen|sollen}, wir haben {in der letzten Minute|in letzter Minute} {mit einem Tor|durch ein Tor} gewonnen!"],
    [["Du hättest … sehen müssen!", "… görmen lazımdı!"], ["in letzter Minute", "son dakikada"]],
    [focus("konj2-vergangen", "sehen müssen", [["müssen sehen", "Çift mastarda modal fiil en sona gider: Du hättest das Spiel sehen müssen."], ["gesehen müssen", "hätte … müssen yapısında asıl fiil mastar kalır: sehen müssen."]])],
  ),
];

const PLAN: ListItem[] = [
  item(
    "Hafta sonu müsaitsen bir şeyler yapalım, ne zaman vaktin olduğunu bana yazman yeterli.",
    ["Wenn du am Wochenende Zeit hast, lass uns {was|etwas} {machen|unternehmen}, schreib mir einfach, wann du {Zeit hast|kannst}."],
    [["etwas unternehmen", "bir şeyler yapmak (dışarıda)"], ["Schreib mir einfach, …", "bana yazman yeterli"]],
  ),
  item(
    "Çok geç olmazsa filmden sonra bir şeyler içmeye gidebiliriz.",
    ["Wenn es nicht zu spät wird, {können|könnten} wir nach dem Film noch {was|etwas} trinken gehen.", "Wir {können|könnten} nach dem Film noch {was|etwas} trinken gehen, wenn es nicht zu spät wird."],
    [["was trinken gehen", "bir şeyler içmeye gitmek"], ["zu spät werden", "çok geç olmak"]],
    [focus("nebensatz", "können wir", [["wir können", "Yan cümle başta olduğu için ana cümle fiille başlar: Wenn es nicht zu spät wird, können wir …"]])],
  ),
  item(
    "Biletleri ben mi alayım, yoksa kapıda alacağımızı mı söylemiştin?",
    ["Soll ich die {Tickets|Karten} {besorgen|kaufen}, oder {hattest du gesagt|hast du gesagt}, dass wir sie an der {Abendkasse|Kasse} kaufen?"],
    [["besorgen", "temin etmek, almak"], ["die Abendkasse", "gişe (kapıda bilet)"]],
  ),
  item(
    "Yarın hava nasıl olur bilmiyorum, ama yağmur yağarsa piknik yerine sinemaya gideriz.",
    [
      "Ich weiß nicht, wie das Wetter morgen wird, aber {wenn|falls} es regnet, gehen wir {statt|anstatt} {zum Picknick|eines Picknicks} ins Kino.",
      "Ich weiß nicht, wie das Wetter morgen wird, aber {wenn|falls} es regnet, gehen wir ins Kino {statt|anstatt} {zum Picknick|eines Picknicks}.",
    ],
    [["statt (+G)", "yerine"], ["wie das Wetter wird", "havanın nasıl olacağı"]],
    [endOf("indirekte-frage", "wie das Wetter morgen wird", "wie wird das Wetter morgen", "Dolaylı soruda (Ich weiß nicht, wie …) fiil en sona gider: wie das Wetter morgen wird.")],
  ),
  item(
    "Planımız değişti: Ayşe gelemediği için buluşmayı gelecek haftaya erteledik.",
    [
      "Unser Plan hat sich geändert: {Weil|Da} Ayşe nicht kommen kann, haben wir das Treffen auf nächste Woche verschoben.",
      "Unser Plan hat sich geändert: Wir haben das Treffen auf nächste Woche verschoben, {weil|da} Ayşe nicht kommen kann.",
    ],
    [["verschieben (auf + A)", "ertelemek"], ["sich ändern", "değişmek"]],
  ),
  item(
    "Saat sekizde buluşalım mı, yoksa sana göre çok mu erken? Öyleyse dokuz da olur.",
    ["{Wollen|Sollen} wir uns um acht treffen, oder ist {dir das|das für dich|das} zu früh? Dann {geht|passt} auch neun."],
    [["Ist dir das zu früh?", "sana göre erken mi?"], ["sich treffen", "buluşmak"]],
  ),
  item(
    "Yola çıkmadan önce beni ara, belki seni istasyondan alabilirim.",
    ["Ruf mich an, bevor du {losfährst|losgehst|aufbrichst}, vielleicht kann ich dich vom Bahnhof abholen.", "Bevor du {losfährst|losgehst}, ruf mich an, vielleicht kann ich dich vom Bahnhof abholen."],
    [["losfahren", "yola çıkmak"], ["abholen", "(birini bir yerden) almak"]],
    [endOf("nebensatz", "bevor du losfährst", "bevor du fährst los", "bevor yan cümle açar; ayrılabilen fiil yan cümlede birleşir ve sona gider: bevor du losfährst.")],
  ),
  item(
    "Bu sefer her şeyi ben ayarlayayım, geçen sefer zaten her şeyi sen organize etmiştin.",
    ["{Diesmal organisiere ich alles|Lass mich diesmal alles organisieren}, letztes Mal hattest du {ja|doch} schon alles organisiert."],
    [["organisieren", "ayarlamak, organize etmek"], ["hattest … organisiert", "organize etmiştin"]],
  ),
  item(
    "Herkes gelirse sekiz kişi olacağız, o yüzden bir masa ayırtsak iyi olur.",
    ["Wenn alle kommen, sind wir zu acht, {deshalb|deswegen|also} sollten wir [lieber] einen Tisch reservieren.", "Wenn alle kommen, sind wir zu acht, {deshalb|deswegen|also} wäre es gut, wenn wir einen Tisch reservieren."],
    [["zu acht sein", "sekiz kişi olmak"], ["einen Tisch reservieren", "masa ayırtmak"]],
  ),
  item(
    "Gelip gelemeyeceğimi henüz bilmiyorum, işten ne zaman çıkacağıma bağlı.",
    ["Ich weiß noch nicht, ob ich kommen kann, {das hängt davon ab|es hängt davon ab|es kommt darauf an|das kommt darauf an}, wann ich {Feierabend habe|Feierabend mache|aus der Arbeit rauskomme|mit der Arbeit fertig bin}."],
    [["Das hängt davon ab, …", "… -e bağlı"], ["Feierabend haben", "mesai bitmek, işten çıkmak"]],
    [endOf("indirekte-frage", "ob ich kommen kann", "ob ich kann kommen", "ob dolaylı soru açar, çekimli fiil (kann) en sona gider: ob ich kommen kann.")],
  ),
  item(
    "Sana söz veriyorum, bu sefer geç kalmayacağım; gerekirse bir saat erken yola çıkarım.",
    ["Ich verspreche dir, {diesmal komme ich nicht zu spät|dass ich diesmal nicht zu spät komme}, {notfalls|zur Not|wenn nötig|wenn es sein muss} fahre ich eine Stunde früher los."],
    [["notfalls / zur Not", "gerekirse"], ["losfahren", "yola çıkmak"]],
  ),
];

const KAFE: ListItem[] = [
  item(
    "Hesabı ayrı mı ödeyelim, yoksa bu sefer ben mi ısmarlayayım?",
    ["{Zahlen wir getrennt|Sollen wir getrennt zahlen|Wollen wir getrennt zahlen}, oder soll ich dich diesmal einladen?"],
    [["getrennt zahlen", "hesabı ayrı ödemek"], ["jemanden einladen", "birine ısmarlamak"]],
  ),
  item(
    "Rezervasyonumuz yok ama dört kişilik boş bir masanız olup olmadığını sorabilir miyim?",
    [
      "Wir haben {nicht reserviert|keine Reservierung}, aber {darf|kann} ich fragen, ob Sie noch einen Tisch für vier [Personen] {frei haben|haben}?",
      "Wir haben {nicht reserviert|keine Reservierung}, aber {darf|kann} ich fragen, ob noch ein Tisch für vier [Personen] frei ist?",
    ],
    [["Darf ich fragen, ob …?", "… -ip -mediğini sorabilir miyim?"], ["frei", "boş"]],
    [endOf("indirekte-frage", "einen Tisch für vier Personen frei haben", "haben einen Tisch für vier Personen frei", "ob dolaylı soru açar, çekimli fiil en sona gider: ob Sie noch einen Tisch für vier Personen frei haben.")],
  ),
  item(
    "Siparişimizi yarım saat önce verdik, yemeğin ne zaman geleceğini söyleyebilir misiniz?",
    ["Wir haben vor einer halben Stunde bestellt, {können|könnten} Sie mir sagen, wann {das|unser} Essen kommt?"],
    [["vor einer halben Stunde", "yarım saat önce"], ["Können Sie mir sagen, wann …?", "ne zaman … söyleyebilir misiniz?"]],
    [endOf("indirekte-frage", "wann das Essen kommt", "wann kommt das Essen", "Dolaylı soruda (wann …) çekimli fiil en sona gider: wann das Essen kommt.")],
  ),
  item(
    "Burasının bu kadar pahalı olduğunu bilseydim hiç gelmezdik.",
    ["{Wenn ich gewusst hätte|Hätte ich gewusst}, dass es hier so teuer ist, wären wir {gar nicht|nie} hergekommen."],
    [["Hätte ich gewusst, dass …", "… bilseydim"], ["herkommen", "buraya gelmek"]],
  ),
  item(
    "Bu kazağı bir beden büyüğüyle değiştirebilir miyim? Ama fişi kaybettim.",
    ["Kann ich diesen Pullover gegen {eine Nummer|eine Größe} größer umtauschen? Ich habe {aber|allerdings} den {Kassenbon|Bon} verloren.", "Kann ich diesen Pullover gegen {eine Nummer|eine Größe} größer umtauschen? Den {Kassenbon|Bon} habe ich {aber|allerdings} verloren."],
    [["umtauschen", "değiştirmek (mağazada)"], ["der Kassenbon", "fiş"]],
  ),
  item(
    "Kartla ödenebiliyor mu, yoksa sadece nakit mi kabul ediyorsunuz?",
    ["{Kann man hier|Kann ich hier|Kann man|Kann ich} mit Karte {zahlen|bezahlen}, oder {nehmen Sie nur {Bargeld|bar}|geht nur bar}?"],
    [["mit Karte zahlen", "kartla ödemek"], ["bar zahlen", "nakit ödemek"]],
  ),
  item(
    "Garsona kahvemizi tatlıdan önce getirmesini söyler misin?",
    ["Kannst du dem Kellner sagen, {dass er uns den Kaffee vor dem {Nachtisch|Dessert} bringen soll|dass er uns den Kaffee vor dem {Nachtisch|Dessert} bringt|er soll uns den Kaffee vor dem {Nachtisch|Dessert} bringen}?"],
    [["der Nachtisch", "tatlı"], ["dass er … soll", "… -mesini (söylemek)"]],
    [focus("dativ", "dem Kellner", [["den Kellner", "sagen + Dativ (kime?): dem Kellner."]])],
  ),
  item(
    "İndirimde olduğunu sanmıştım ama kasada tam fiyatı ödemek zorunda kaldım.",
    ["Ich dachte, {das wäre|das ist|es wäre} {im Angebot|reduziert}, aber an der Kasse musste ich den vollen Preis {zahlen|bezahlen}."],
    [["im Angebot", "indirimde"], ["der volle Preis", "tam fiyat"]],
  ),
  item(
    "Bence burası şehrin en iyi kahvesini yapıyor, o yüzden her sabah buraya geliyorum.",
    ["Ich finde, {hier gibt's den besten Kaffee der Stadt|die machen hier den besten Kaffee der Stadt}, {deshalb|deswegen|darum} komme ich jeden Morgen her."],
    [["der beste … der Stadt", "şehrin en iyi …"], ["herkommen", "buraya gelmek"]],
  ),
  item(
    "Ne kadar bahşiş bırakılır bilmiyorum, Almanya'da bu nasıl işliyor?",
    ["Ich weiß nicht, wie viel Trinkgeld man {gibt|geben sollte}, {wie läuft das|wie ist das|wie funktioniert das} in Deutschland?"],
    [["das Trinkgeld", "bahşiş"], ["Wie läuft das?", "bu nasıl işliyor?"]],
    [endOf("indirekte-frage", "wie viel Trinkgeld man gibt", "wie viel Trinkgeld gibt man", "Dolaylı soruda (wie viel …) fiil en sona gider: wie viel Trinkgeld man gibt.")],
  ),
  item(
    "Kalanını paket yaptırabilir miyiz? Hepsini bitiremedik.",
    ["{Können|Könnten} wir den Rest einpacken lassen? {Wir haben nicht alles geschafft|Wir haben es nicht geschafft, alles aufzuessen}."],
    [["einpacken lassen", "paket yaptırmak"], ["schaffen", "becermek, bitirebilmek"]],
  ),
];

const YOL: ListItem[] = [
  item(
    "Affedersiniz, bu otobüsün merkez istasyonda durup durmadığını biliyor musunuz?",
    ["{Entschuldigung|Entschuldigen Sie}, wissen Sie, ob {dieser|der} Bus am Hauptbahnhof hält?"],
    [["der Hauptbahnhof", "merkez istasyon"], ["halten", "durmak (araç)"]],
    [endOf("indirekte-frage", "Bus am Hauptbahnhof hält", "hält dieser Bus am Hauptbahnhof", "ob dolaylı soru açar, çekimli fiil en sona gider: ob dieser Bus am Hauptbahnhof hält.")],
  ),
  item(
    "Tren yarım saat rötar yaptığı için aktarma trenimi kaçırdım.",
    ["{Weil|Da} der Zug eine halbe Stunde Verspätung hatte, habe ich meinen {Anschluss|Anschlusszug} verpasst.", "Ich habe meinen {Anschluss|Anschlusszug} verpasst, {weil|da} der Zug eine halbe Stunde Verspätung hatte."],
    [["Verspätung haben", "rötar yapmak"], ["der Anschluss", "aktarma bağlantısı"]],
    [focus("nebensatz", "habe ich meinen", [["ich habe meinen", "Yan cümle başta olduğu için ana cümle fiille başlar: …, habe ich meinen Anschluss verpasst."]])],
  ),
  item(
    "Bir sonraki durakta mı inmem gerekiyor, yoksa son durağa kadar mı gidiyorum?",
    ["Muss ich an der nächsten Haltestelle aussteigen, oder {fahre ich bis zur Endstation|fahre ich bis zur Endhaltestelle|bleibe ich bis zur Endstation drin}?"],
    [["aussteigen", "inmek"], ["die Endstation", "son durak"]],
  ),
  item(
    "Bu saatte metro çalışmadığı için eve taksiyle dönmek zorunda kaldım.",
    ["{Weil|Da} um diese Uhrzeit keine U-Bahn mehr fährt, musste ich {mit dem Taxi nach Hause fahren|ein Taxi nach Hause nehmen}."],
    [["um diese Uhrzeit", "bu saatte"], ["mit dem Taxi fahren", "taksiyle gitmek"]],
  ),
  item(
    "Sanırım kayboldum, bana haritada nerede olduğumuzu gösterebilir misiniz?",
    ["{Ich glaube, ich habe mich verlaufen|Ich habe mich wohl verlaufen}, {können|könnten} Sie mir auf der Karte zeigen, wo wir sind?"],
    [["sich verlaufen", "(yürürken) yolu kaybetmek"], ["zeigen, wo …", "nerede olduğunu göstermek"]],
    [endOf("indirekte-frage", "wo wir sind", "wo sind wir", "Dolaylı soruda (wo …) fiil en sona gider: wo wir sind.")],
  ),
  item(
    "Bilet makinesi bozuktu, o yüzden biletsiz bindim; umarım kontrol gelmez.",
    ["Der {Fahrkartenautomat|Ticketautomat} war kaputt, {deshalb|deswegen} bin ich ohne {Ticket|Fahrkarte} eingestiegen, {hoffentlich kommt keine Kontrolle|hoffentlich werde ich nicht kontrolliert}."],
    [["einsteigen", "binmek"], ["hoffentlich", "umarım"]],
  ),
  item(
    "Navigasyon başka bir yol gösteriyor ama bence buradan gitmek daha hızlı.",
    ["Das Navi zeigt einen anderen Weg an, aber ich {glaube|finde|denke}, {dass es hier lang schneller geht|hier lang geht es schneller|dass wir hier lang schneller sind}."],
    [["hier lang", "buradan (yön)"], ["das Navi", "navigasyon"]],
  ),
  item(
    "Havaalanına zamanında yetişmek istiyorsan en geç altıda yola çıkman lazım.",
    ["Wenn du rechtzeitig am Flughafen sein willst, {musst|solltest} du spätestens um sechs losfahren."],
    [["spätestens", "en geç"], ["rechtzeitig", "zamanında"]],
    [focus("nebensatz", "musst du", [["du musst", "Yan cümle başta olduğu için ana cümle fiille başlar: Wenn …, musst du …"]])],
  ),
  item(
    "Buralı değilim ama sanırım müzeye giden otobüs karşı taraftan kalkıyor.",
    ["Ich bin nicht von hier, aber ich glaube, {der Bus zum Museum fährt {auf der anderen Straßenseite|gegenüber|auf der anderen Seite} ab|dass der Bus zum Museum {auf der anderen Straßenseite|gegenüber} abfährt}."],
    [["Ich bin nicht von hier.", "buralı değilim"], ["abfahren", "kalkmak (araç)"]],
  ),
  item(
    "Tren o kadar kalabalıktı ki iki saat boyunca ayakta durmak zorunda kaldım.",
    ["{Der Zug war so voll|Im Zug war es so voll}, dass ich zwei Stunden [lang] stehen musste."],
    [["so voll, dass …", "o kadar kalabalık ki"], ["stehen müssen", "ayakta durmak zorunda kalmak"]],
    [endOf("nebensatz", "stehen musste", "musste stehen", "dass yan cümlesinde çekimli fiil (musste) en sona gider: dass ich zwei Stunden lang stehen musste.")],
  ),
];

const TELEFON: ListItem[] = [
  item(
    "Şarjım bitmek üzere; telefon kapanırsa merak etme, eve varınca seni ararım.",
    ["Mein Akku ist fast leer, {wenn|falls} das Handy ausgeht, mach dir keine Sorgen, {ich rufe dich an|ich melde mich}, {sobald|wenn} ich zu Hause bin."],
    [["Mein Akku ist leer.", "şarjım bitti"], ["ausgehen", "kapanmak (cihaz)"]],
  ),
  item(
    "Mesajını daha yeni gördüm, telefonum sessizdeydi; bir şey mi oldu?",
    ["Ich habe deine Nachricht {gerade erst|eben erst|jetzt erst} gesehen, mein Handy war auf {lautlos|stumm}, ist {was|etwas} passiert?"],
    [["auf lautlos", "sessizde"], ["gerade erst", "daha yeni"]],
  ),
  item(
    "Sesin çok kötü geliyor, galiba çekmiyor; sonra tekrar arayabilir misin?",
    ["Ich verstehe dich ganz schlecht, ich glaube, ich habe kein Netz, {kannst|könntest} du mich später noch mal anrufen?"],
    [["kein Netz haben", "telefon çekmemek"], ["noch mal", "tekrar"]],
  ),
  item(
    "Bana bir dakika ver, diğer hattan biri arıyor; hemen dönerim.",
    ["{Gib mir eine Minute|Warte eine Minute|Moment mal}, auf der anderen Leitung ruft {jemand|gerade jemand} an, {ich bin gleich wieder da|ich melde mich gleich wieder|ich rufe gleich zurück}."],
    [["die andere Leitung", "diğer hat"], ["gleich", "hemen"]],
  ),
  item(
    "Neden hep mesajlarımı görüp cevap vermiyorsun? Bu beni gerçekten sinir ediyor.",
    ["Warum liest du {immer meine Nachrichten|meine Nachrichten immer} und antwortest nicht? Das nervt mich {echt|total|wirklich}."],
    [["jemanden nerven", "sinir etmek"], ["auf eine Nachricht antworten", "mesaja cevap vermek"]],
  ),
  item(
    "Ona sesli mesaj bıraktım ama hâlâ beni geri aramadı; sence bir şey mi oldu?",
    [
      "{Ich habe ihm eine Sprachnachricht {hinterlassen|geschickt}, aber er hat mich {immer noch nicht|noch nicht} zurückgerufen|Ich habe ihr eine Sprachnachricht {hinterlassen|geschickt}, aber sie hat mich {immer noch nicht|noch nicht} zurückgerufen}, {meinst|glaubst} du, {es ist|da ist} {was|etwas} passiert?",
    ],
    [["die Sprachnachricht", "sesli mesaj"], ["zurückrufen", "geri aramak"]],
  ),
  item(
    "Bunu telefonda anlatmak zor, akşam yüz yüze konuşsak daha iyi olur.",
    [
      "Das ist am Telefon schwer zu erklären, es wäre besser, wenn wir heute Abend {persönlich|unter vier Augen} {reden|sprechen|reden würden}.",
      "Das ist am Telefon schwer zu erklären, lass uns lieber heute Abend {persönlich|unter vier Augen} {reden|sprechen}.",
    ],
    [["schwer zu erklären", "anlatması zor"], ["unter vier Augen", "yüz yüze, baş başa"]],
  ),
  item(
    "Numaranı kaydetmeyi unutmuşum, kimin aradığını bilmediğim için açmadım.",
    ["Ich habe vergessen, deine Nummer zu speichern, und {weil|da} ich nicht wusste, wer {anruft|dran ist|da anruft}, bin ich nicht rangegangen."],
    [["eine Nummer speichern", "numara kaydetmek"], ["rangehen", "telefonu açmak (konuşma)"]],
    [focus("zu-infinitiv", "deine Nummer zu speichern", [["zu speichern deine Nummer", "vergessen, … zu + mastar: zu + mastar en sona gider (deine Nummer zu speichern)."]])],
  ),
  item(
    "Gruptan çıktım, çünkü bütün gün gelen bildirimler sinirimi bozdu.",
    ["Ich bin aus der Gruppe {ausgetreten|raus}, weil {mir die {ganzen|vielen|ständigen} Benachrichtigungen {total|echt} auf die Nerven gegangen sind|mich die {ganzen|vielen|ständigen} Benachrichtigungen {total|echt} genervt haben}."],
    [["auf die Nerven gehen", "sinirini bozmak"], ["austreten", "(gruptan) çıkmak"]],
  ),
  item(
    "Tam seni arayacaktım ki sen aradın, ne tesadüf!",
    ["Ich wollte dich gerade anrufen, {als|da} du angerufen hast, {was für ein|so ein} Zufall!", "Ich wollte dich gerade anrufen, und dann rufst du an, {was für ein|so ein} Zufall!"],
    [["Ich wollte gerade …", "tam … -ecektim"], ["Was für ein Zufall!", "ne tesadüf!"]],
  ),
];

const RICA: ListItem[] = [
  item(
    "Bana bir iyilik yapar mısın? Ben tatildeyken çiçeklerimi sulayabilir misin?",
    ["{Kannst|Könntest} du mir einen Gefallen tun? {Könntest|Kannst|Würdest} du meine Blumen gießen, während ich {im Urlaub|weg} bin?"],
    [["jemandem einen Gefallen tun", "birine iyilik yapmak"], ["während …", "… -ken"]],
  ),
  item(
    "Rahatsız ettiğim için kusura bakmayın ama müziğin sesini biraz kısabilir misiniz? Yarın erken kalkmam lazım.",
    ["{Entschuldigen Sie die Störung|Tut mir leid, dass ich störe}, aber {könnten|können} Sie die Musik {etwas|ein bisschen} leiser {machen|stellen|drehen}? Ich muss morgen früh aufstehen."],
    [["Entschuldigen Sie die Störung", "rahatsız ettiğim için kusura bakmayın"], ["leiser machen", "sesini kısmak"]],
  ),
  item(
    "Bana bu kadar çabuk yardım ettiğin için çok teşekkürler, sana bir iyilik borçluyum.",
    ["{Vielen Dank|Danke}, dass du mir so schnell geholfen hast, ich bin dir {was|etwas|einen Gefallen} schuldig."],
    [["jemandem etwas schuldig sein", "birine borçlu olmak"]],
    [endOf("dass-gefuehl", "so schnell geholfen hast", "hast mir so schnell geholfen", "dass yan cümle açar, çekimli fiil en sona gider: dass du mir so schnell geholfen hast.")],
  ),
  item(
    "Sana kızgın değilim, sadece bunu benden saklamaman gerekirdi diye düşünüyorum.",
    ["Ich bin nicht sauer auf dich, ich finde nur, du hättest mir das nicht verheimlichen {sollen|dürfen|müssen}."],
    [["verheimlichen", "saklamak, gizlemek"], ["sauer auf jemanden sein", "birine kızgın olmak"]],
    [focus("konj2-vergangen", "verheimlichen sollen", [["sollen verheimlichen", "Çift mastarda modal fiil en sona gider: du hättest mir das nicht verheimlichen sollen."]])],
  ),
  item(
    "Yanlış anlama ama bu sefer sana borç para veremem, ben de bu ay sıkışığım.",
    ["{Versteh mich nicht falsch|Nimm's mir nicht übel}, aber diesmal kann ich dir kein Geld leihen, ich bin diesen Monat selbst {knapp bei Kasse|pleite|knapp}."],
    [["knapp bei Kasse sein", "parasız, sıkışık olmak"], ["leihen", "ödünç vermek"]],
  ),
  item(
    "Tabii ki yaparım, arkadaşlar bunun için var zaten!",
    ["{Klar|Natürlich} mache ich das, dafür sind Freunde [doch] da!"],
    [["dafür sind Freunde da", "arkadaşlar bunun için var"]],
  ),
  item(
    "Seni bu kadar beklettiğim için kusura bakma, trafik inanılmazdı.",
    ["{Sorry|Entschuldige|Tut mir leid}, {dass ich dich so lange habe warten lassen|dass du so lange warten musstest}, der Verkehr war {der Wahnsinn|unglaublich|der Horror}."],
    [["jemanden warten lassen", "birini bekletmek"], ["der Verkehr", "trafik"]],
    [focus("dass-gefuehl", "habe warten lassen", [["warten lassen habe", "Çift mastarlı (warten lassen) yan cümlede yardımcı fiil, iki mastarın önüne gelir: dass ich dich so lange habe warten lassen."]])],
  ),
  item(
    "Yardım teklif etmen çok tatlı ama sanırım bunu tek başıma halledebilirim.",
    ["{Das ist echt lieb von dir|Echt lieb von dir|Wie lieb von dir}, dass du mir helfen willst, aber ich glaube, {das kriege ich {alleine|allein} hin|das schaffe ich {alleine|allein}}."],
    [["etwas hinkriegen", "bir şeyi halletmek"], ["Das ist lieb von dir.", "çok tatlısın, çok naziksin"]],
  ),
  item(
    "Senden bir şey rica edebilir miyim? Bu mektubu Almancaya çevirmeme yardım eder misin?",
    ["Darf ich dich um {was|etwas} bitten? {{Kannst|Könntest|Würdest} du mir helfen|Hilfst du mir}, diesen Brief ins Deutsche zu übersetzen?"],
    [["jemanden um etwas bitten", "birinden bir şey rica etmek"], ["ins Deutsche übersetzen", "Almancaya çevirmek"]],
    [focus("zu-infinitiv", "ins Deutsche zu übersetzen", [["zu übersetzen ins Deutsche", "helfen, … zu + mastar: zu + mastar en sona gider (ins Deutsche zu übersetzen)."]])],
  ),
  item(
    "Partide söylediklerim için özür dilerim, öyle demek istememiştim.",
    ["{Es tut mir leid|Tut mir leid|Entschuldige [bitte]}, was ich auf der Party gesagt habe, so habe ich das nicht gemeint."],
    [["Ich hab das nicht so gemeint.", "öyle demek istemedim"]],
  ),
];

const ARGO: ListItem[] = [
  item(
    "Kafayı yemek üzereyim, bu proje beni resmen bitirdi.",
    ["Ich dreh gleich durch, {dieses|das} Projekt {macht mich {echt|total|völlig} fertig|hat mich {echt|total|völlig} fertiggemacht}."],
    [["durchdrehen", "kafayı yemek"], ["jemanden fertigmachen", "birini bitirmek"]],
  ),
  item(
    "Kafana takma, biz bunu nasılsa hallederiz!",
    ["{Mach dir keinen Kopf|Mach dir keine Sorgen}, das {kriegen wir {schon|sowieso} hin|schaffen wir schon}!"],
    [["sich keinen Kopf machen", "kafaya takmamak"], ["etwas hinkriegen", "halletmek"]],
  ),
  item(
    "O kadar yorgunum ki ayakta uyuyorum, dün gece gözümü bile kırpmadım.",
    ["Ich bin so {fertig|müde|kaputt}, dass ich im Stehen einschlafe, ich habe letzte Nacht kein Auge zugemacht."],
    [["kein Auge zumachen", "gözünü kırpmamak"], ["kaputt / fertig sein", "bitik olmak"]],
    [endOf("nebensatz", "im Stehen einschlafe", "schlafe im Stehen ein", "dass yan cümlesinde ayrılabilen fiil birleşir ve sona gider: dass ich im Stehen einschlafe.")],
  ),
  item(
    "Ona bir şey söylemene gerek yok, o nasılsa her şeyi öğrenir.",
    ["{Du musst ihm nichts sagen|Du brauchst ihm nichts {zu sagen|sagen}}, er kriegt {sowieso|eh|ja eh} alles mit."],
    [["etwas mitkriegen", "bir şeyi duymak, fark etmek"], ["eh / sowieso", "nasılsa, zaten"]],
  ),
  item(
    "Bu iş bana göre değil, ilk fırsatta bırakıp başka bir şey arayacağım.",
    ["Der Job ist nichts für mich, {sobald ich kann|bei der ersten Gelegenheit}, {schmeiße ich hin|kündige ich} und suche mir {was|etwas} anderes."],
    [["etwas hinschmeißen", "bir işi bırakmak (argo)"], ["nichts für mich", "bana göre değil"]],
  ),
  item(
    "Bana masal anlatma! Dün akşam nerede olduğunu çok iyi biliyorum.",
    ["{Erzähl mir keine Märchen|Erzähl mir nichts}! Ich weiß ganz genau, wo du gestern Abend warst."],
    [["Erzähl mir keine Märchen!", "bana masal anlatma!"], ["ganz genau", "çok iyi, tam olarak"]],
    [endOf("indirekte-frage", "wo du gestern Abend warst", "wo warst du gestern Abend", "Dolaylı soruda (wo …) fiil en sona gider: wo du gestern Abend warst.")],
  ),
  item(
    "O konsere bu kadar para gömdüğüme inanamıyorum, berbattı.",
    ["Ich fass es nicht, dass ich so viel Geld für das Konzert {rausgeschmissen|ausgegeben} habe, {es|das} war {echt|total} mies."],
    [["Geld rausschmeißen", "parayı sokağa atmak"], ["mies", "berbat (argo)"]],
  ),
  item(
    "Benimle dalga mı geçiyorsun? Bunu sana zaten üç kere anlattım!",
    ["{Willst du mich veräppeln|Willst du mich auf den Arm nehmen|Machst du Witze}? Das habe ich dir doch schon dreimal erklärt!"],
    [["jemanden auf den Arm nehmen", "biriyle dalga geçmek"], ["veräppeln", "dalga geçmek (argo)"]],
  ),
  item(
    "Bu kadar abartma, o kadar da kötü değildi!",
    ["{Jetzt übertreib mal nicht|Übertreib nicht}, so schlimm war's doch gar nicht!"],
    [["übertreiben", "abartmak"]],
  ),
  item(
    "Sınav kolaydı derken ciddiydim, hiç çalışmadan geçtim.",
    ["Ich habe es ernst gemeint, als ich gesagt habe, dass die Prüfung leicht war, ich habe sie {ohne zu lernen|ohne was zu lernen} bestanden."],
    [["etwas ernst meinen", "ciddi olmak, öyle demek istemek"], ["ohne zu lernen", "çalışmadan"]],
  ),
  item(
    "Sonunda işi bitirdim, şimdi biraz kafa dinleyeceğim, kimse beni rahatsız etmesin!",
    ["Endlich bin ich mit der Arbeit fertig, jetzt {chill|chille|entspanne} ich erst mal, {keiner|niemand} soll mich stören!"],
    [["chillen", "kafa dinlemek"], ["erst mal", "önce bir, şimdilik"]],
  ),
];

const FIKIR: ListItem[] = [
  item(
    "Bence haklısın ama bunu ona bu şekilde söylememeliydin.",
    ["{Ich finde, du hast recht|Du hast schon recht|Du hast ja recht}, aber du hättest {es|das} ihm nicht so sagen sollen."],
    [["Du hättest … nicht … sollen.", "… -memeliydin"]],
    [focus("konj2-vergangen", "sagen sollen", [["sollen sagen", "Çift mastarda modal fiil en sona gider: du hättest es ihm nicht so sagen sollen."], ["gesagt sollen", "hätte … sollen yapısında asıl fiil mastar kalır: sagen sollen."]])],
  ),
  item(
    "Ne dersen de, hâlâ bunun iyi bir fikir olmadığını düşünüyorum.",
    ["{Egal, was du sagst|Du kannst sagen, was du willst}, ich {finde|glaube} immer noch, dass {das|es} keine gute Idee ist."],
    [["Egal, was du sagst, …", "ne dersen de …"], ["immer noch", "hâlâ"]],
  ),
  item(
    "Bir yere kadar haklısın ama her şeyi bu kadar siyah beyaz göremezsin.",
    ["Bis zu einem gewissen {Punkt|Grad} hast du recht, aber {du kannst|man kann} nicht alles so schwarz-weiß sehen."],
    [["bis zu einem gewissen Punkt", "bir yere kadar"], ["schwarz-weiß", "siyah beyaz"]],
  ),
  item(
    "Açıkçası bu konuda senin kadar emin değilim, belki biraz daha beklemeliyiz.",
    ["Ehrlich gesagt bin ich mir da nicht so sicher wie du, vielleicht sollten wir noch {ein bisschen|etwas} warten."],
    [["sich sicher sein", "emin olmak"], ["so … wie du", "senin kadar …"]],
  ),
  item(
    "Ben olsam ona hemen söylerdim; ne kadar beklersen o kadar zorlaşır.",
    ["{An deiner Stelle|Wenn ich du wäre,} würde ich es ihm sofort sagen, je länger du wartest, desto {schwieriger|schwerer} wird es."],
    [["an deiner Stelle", "ben olsam, senin yerinde"], ["je … desto …", "ne kadar … o kadar …"]],
    [focus("konnektoren2", "desto schwieriger wird es", [["desto es wird schwieriger", "desto + karşılaştırma + fiil + özne: desto schwieriger wird es."]])],
  ),
  item(
    "Bunun bir faydası yok, zaten kararını çoktan vermişsin.",
    ["Das bringt [doch] nichts, {du hast dich [doch] {sowieso|eh} schon entschieden|du hast deine Entscheidung [doch] {sowieso|eh} schon getroffen}."],
    [["Das bringt nichts.", "bir faydası yok"], ["sich entscheiden", "karar vermek"]],
  ),
  item(
    "Sana katılmıyorum, bence mesele paradan çok zamanla ilgili.",
    ["{Da bin ich anderer Meinung|Das sehe ich anders|Da stimme ich dir nicht zu}, ich finde, es geht {weniger ums Geld als um die Zeit|nicht so sehr ums Geld, sondern um die Zeit}."],
    [["anderer Meinung sein", "farklı düşünmek"], ["es geht um …", "mesele … ile ilgili"]],
  ),
  item(
    "Haklı olabilirsin ama yine de kendi gözlerimle görmek isterim.",
    ["{Kann sein|Es kann sein|Mag sein}, dass du recht hast, aber ich würde es trotzdem gern mit eigenen Augen sehen."],
    [["Kann sein, dass …", "… olabilir"], ["mit eigenen Augen", "kendi gözleriyle"]],
  ),
  item(
    "Bu filmi beğenenlerin neyi bu kadar güzel bulduğunu hiç anlamıyorum.",
    ["Ich {verstehe|check} {echt|überhaupt|gar} nicht, was die Leute an diesem Film so toll finden."],
    [["was … an … finden", "… -de neyi beğendiklerini"], ["checken", "anlamak (argo)"]],
    [endOf("indirekte-frage", "was die Leute an diesem Film so toll finden", "was finden die Leute an diesem Film so toll", "Dolaylı soruda (was …) fiil en sona gider: was die Leute an diesem Film so toll finden.")],
  ),
  item(
    "Bence önemli olan ne söylediğin değil, nasıl söylediğin.",
    ["Ich finde, {es kommt nicht darauf an, was du sagst, sondern wie du es sagst|wichtig ist nicht, was du sagst, sondern wie du es sagst}."],
    [["es kommt darauf an, …", "önemli olan …"], ["nicht …, sondern …", "… değil, …"]],
  ),
];

const HINT = "Uzun konuşma cümlesi: her yan cümlede (dass, ob, weil, wenn …) çekimli fiil en sona gider. hab, wär's, drauf gibi kısa biçimler de doğru.";

export const SPOKEN_BANK = [
  listTemplate("gk-kalip-sohbet", "GK", "gk-sohbet", ["indirekte-frage", "nebensatz", "umgang"], HINT, SOHBET),
  listTemplate("gk-kalip-tepki", "GK", "gk-tepki", ["dass-gefuehl", "konj2-vergangen", "mir-ist"], "Tepki cümleleri: Hätte ich doch …! Ich hätte nie gedacht, dass … Ich hab die Nase voll davon, … zu …", TEPKI),
  listTemplate("gk-kalip-plan", "GK", "gk-plan", ["vorschlag", "indirekte-frage", "nebensatz"], "Plan yaparken: Wenn …, können wir … / Das hängt davon ab, wann … / Ruf mich an, bevor du losfährst.", PLAN),
  listTemplate("gk-kalip-kafe", "GK", "gk-kafe", ["bestellen", "indirekte-frage", "konj2-vergangen"], "Kafede ve dükkânda: Können Sie mir sagen, wann …? Darf ich fragen, ob …? Hätte ich gewusst, dass …", KAFE),
  listTemplate("gk-kalip-yol", "GK", "gk-yol", ["indirekte-frage", "nebensatz", "zum-zur"], "Yol ve ulaşım: Wissen Sie, ob …? Weil der Zug Verspätung hatte, … / umsteigen, aussteigen, losfahren.", YOL),
  listTemplate("gk-kalip-telefon", "GK", "gk-telefon", ["nebensatz", "zu-infinitiv", "umgang"], HINT, TELEFON),
  listTemplate("gk-kalip-rica", "GK", "gk-rica", ["bitte-mal", "dass-gefuehl", "konj2-vergangen"], "Rica ve özür: Kannst du mir einen Gefallen tun? Ich bin dir was schuldig. Du hättest mir das sagen sollen.", RICA),
  listTemplate("gk-kalip-argo", "GK", "gk-argo", ["umgang", "nebensatz", "indirekte-frage"], "Argo: durchdrehen, sich keinen Kopf machen, kein Auge zumachen, etwas mitkriegen, hinschmeißen.", ARGO),
  listTemplate("gk-kalip-fikir", "GK", "gk-fikir", ["nebensatz", "konj2-vergangen", "indirekte-frage"], "Fikir bildirirken: Egal, was du sagst, … / An deiner Stelle würde ich … / je länger …, desto …", FIKIR),
];
