import type { Focus } from "../types";
import { say } from "./alts";
import { focus, listTemplate, type ListItem } from "./engine";

// Hard C1 sentences written by hand: idioms inside long sentences, particles, formal register,
// nested clauses, Konjunktiv II with double infinitives, advanced connectors, passive substitutes
// and assumptions. Each item lists the usual ways to say it ({a|b} alternatives, [optional] words).

const item = (tr: string, patterns: string[], vocab: [string, string][], fx: Focus[] = []): ListItem => ({
  tr,
  de: say(...patterns),
  vocab,
  ...(fx.length ? { focus: fx } : {}),
});

const REDEWENDUNGEN: ListItem[] = [
  item(
    "Ona gerçeği söylemeye cesaret edemedim, çünkü yangına körükle gitmek istemedim.",
    ["{Ich habe mich nicht getraut|Ich traute mich nicht}, ihm die Wahrheit zu sagen, {weil ich nicht Öl ins Feuer gießen wollte|weil ich kein Öl ins Feuer gießen wollte|denn ich wollte nicht Öl ins Feuer gießen}."],
    [["Öl ins Feuer gießen", "yangına körükle gitmek"], ["sich trauen, … zu …", "… -meye cesaret etmek"]],
    [focus("zu-infinitiv", "ihm die Wahrheit zu sagen", [["zu sagen ihm die Wahrheit", "sich trauen, … zu + mastar: zu + mastar en sona gider."]])],
  ),
  item(
    "Projeyi hep yarına bıraktığımız için sonunda her şey fiyaskoyla bitti.",
    [
      "{Weil|Da} wir das Projekt immer auf die lange Bank geschoben haben, ist am Ende alles {in die Hose gegangen|schiefgegangen}.",
      "Am Ende ist alles {in die Hose gegangen|schiefgegangen}, {weil|da} wir das Projekt immer auf die lange Bank geschoben haben.",
    ],
    [["etwas auf die lange Bank schieben", "bir işi hep ertelemek"], ["in die Hose gehen", "fiyaskoyla bitmek"]],
  ),
  item(
    "Lafı dolandırmayı bırak da bana ne olduğunu açıkça söyle!",
    ["Hör auf, um den heißen Brei herumzureden, und sag mir {klipp und klar|offen|ehrlich|direkt}, was passiert ist!"],
    [["um den heißen Brei herumreden", "lafı dolandırmak"], ["klipp und klar", "açık açık"]],
    [focus("zu-infinitiv", "herumzureden", [["herum zu reden", "Ayrılabilen fiilde zu araya girer ve tek kelime yazılır: herumzureden."], ["zu herumreden", "Ayrılabilen fiilde zu araya girer: herumzureden."]])],
  ),
  item(
    "Toplantıda tam üstüne bastın; hepimizin düşündüğünü söyledin.",
    ["Du hast in der {Besprechung|Sitzung} den Nagel auf den Kopf getroffen: Du hast gesagt, was wir alle gedacht haben.", "Du hast im Meeting den Nagel auf den Kopf getroffen: Du hast gesagt, was wir alle gedacht haben."],
    [["den Nagel auf den Kopf treffen", "tam üstüne basmak"]],
  ),
  item(
    "Sınavdan önce o kadar gergindim ki öğretmenin anlattıklarından hiçbir şey anlamadım.",
    ["Vor der Prüfung war ich so nervös, dass ich von dem, was {der Lehrer|die Lehrerin} erklärt hat, {nur Bahnhof|gar nichts|überhaupt nichts} verstanden habe."],
    [["nur Bahnhof verstehen", "hiçbir şey anlamamak"], ["von dem, was …", "… -dıklarından"]],
  ),
  item(
    "Bu sefer göz yumacağım, ama bir daha olursa şefe söylemek zorunda kalacağım.",
    ["{Diesmal|Dieses Mal} drücke ich [noch] ein Auge zu, aber wenn das noch einmal passiert, muss ich es {dem Chef|der Chefin} sagen."],
    [["ein Auge zudrücken", "göz yummak"], ["noch einmal", "bir daha"]],
  ),
];

const PARTIKELN: ListItem[] = [
  item(
    "Bana zaten söylemiştin ya, ne yapayım, unutmuşum işte!",
    ["Du hast es mir ja schon gesagt, ich habe es {halt|eben} vergessen!", "Du hast mir das ja schon gesagt, ich habe es {halt|eben} vergessen!"],
    [["ja", "(bilinen şey) ya, zaten"], ["halt / eben", "(kabullenme) işte, ne yapayım"]],
  ),
  item(
    "Bu akşam bize gelsene, nasılsa evde tek başına oturuyorsun!",
    ["Komm doch [mal] heute Abend zu uns [vorbei], du sitzt ja {sowieso|eh} allein zu Hause [rum]!"],
    [["doch mal", "(davet) -sene"], ["sowieso / eh", "nasılsa, zaten"]],
  ),
  item(
    "Bu kadar acele etme, tren nasılsa rötarlı!",
    ["Beeil dich doch nicht so, der Zug hat ja {sowieso|eh} Verspätung!"],
    [["sich beeilen", "acele etmek"], ["Verspätung haben", "rötarlı olmak"]],
  ),
  item(
    "Madem bu kadar iyi biliyorsun, o zaman kendin yapsana!",
    ["Wenn du es so gut weißt, dann mach es doch selbst!", "Wenn du das so gut weißt, dann mach's doch selbst!"],
    [["doch", "(meydan okuma) -sana"]],
  ),
  item(
    "Kim bilir, belki de haklıdır; denemenin kimseye zararı yok.",
    ["Wer weiß, vielleicht hat er ja recht, es schadet {doch|ja} nicht, es zu versuchen.", "Wer weiß, vielleicht hat sie ja recht, es schadet {doch|ja} nicht, es zu versuchen."],
    [["Es schadet nicht, … zu …", "… -menin zararı yok"]],
  ),
  item(
    "Ne yapalım, bazen işler istediğimiz gibi gitmiyor işte.",
    ["Was soll man machen, manchmal läuft es {eben|halt} nicht so, wie man {will|es will|es sich wünscht}."],
    [["eben / halt", "(kabullenme) işte"], ["wie man will", "istediğimiz gibi"]],
  ),
];

const REGISTER: ListItem[] = [
  item(
    "Yeni sistemin devreye alınmasıyla birlikte tüm başvurular yalnızca internet üzerinden kabul edilecektir.",
    ["Mit der Einführung des neuen Systems werden alle Anträge {nur noch|ausschließlich} online {angenommen|entgegengenommen}."],
    [["die Einführung", "devreye alınma"], ["ausschließlich", "yalnızca"]],
    [focus("nominalstil", "der Einführung des neuen Systems", [["der Einführung von dem neuen System", "Resmî dilde Genitiv: die Einführung des neuen Systems."]])],
  ),
  item(
    "Binanın yenilenmesi süresince personel girişi arka kapıdan sağlanacaktır.",
    ["Während der Renovierung des Gebäudes erfolgt der Zugang für {das Personal|die Mitarbeiter} über den Hintereingang."],
    [["erfolgen", "gerçekleşmek, sağlanmak (resmî)"], ["während (+G)", "süresince"]],
    [focus("genitiv", "Während der Renovierung des Gebäudes", [["Während die Renovierung des Gebäudes", "während Genitiv ister: während der Renovierung."]])],
  ),
  item(
    "Sözleşmenin uzatılmasına ilişkin karar en geç ay sonuna kadar verilecektir.",
    ["Die Entscheidung über die Verlängerung des Vertrags wird {spätestens bis Ende des Monats|bis spätestens Ende des Monats} getroffen.", "Die Entscheidung über die Verlängerung des Vertrages wird {spätestens bis Ende des Monats|bis spätestens Ende des Monats} getroffen."],
    [["eine Entscheidung treffen", "karar vermek"], ["die Verlängerung", "uzatılma"]],
  ),
  item(
    "Gerekli belgelerin eksiksiz sunulmaması halinde başvurunuz işleme alınamaz.",
    [
      "Bei unvollständiger Vorlage der erforderlichen Unterlagen kann Ihr Antrag nicht bearbeitet werden.",
      "{Falls|Wenn} die erforderlichen Unterlagen nicht vollständig vorgelegt werden, kann Ihr Antrag nicht bearbeitet werden.",
    ],
    [["die Vorlage", "sunma, ibraz"], ["bearbeiten", "işleme almak"]],
  ),
  item(
    "Fiyatlardaki artış nedeniyle birçok aile tasarruf etmek zorunda kalıyor.",
    ["{Aufgrund|Wegen} {des Anstiegs der Preise|des Preisanstiegs|der gestiegenen Preise} müssen viele Familien sparen."],
    [["aufgrund (+G)", "nedeniyle"], ["der Anstieg", "artış"]],
    [focus("genitiv", "des Anstiegs der Preise", [["dem Anstieg der Preise", "aufgrund / wegen Genitiv ister: aufgrund des Anstiegs."]])],
  ),
  item(
    "Toplantının ertelendiği, katılımcıların hepsine zamanında bildirilmedi.",
    ["Die Verschiebung der {Sitzung|Besprechung} wurde nicht allen Teilnehmern rechtzeitig mitgeteilt.", "Nicht allen Teilnehmern wurde die Verschiebung der {Sitzung|Besprechung} rechtzeitig mitgeteilt."],
    [["die Verschiebung", "erteleme"], ["mitteilen", "bildirmek"]],
  ),
];

const KOMPLEX: ListItem[] = [
  item(
    "Ne kadar uğraştıysam da onu kararından vazgeçirmeyi başaramadım.",
    ["So sehr ich mich auch bemüht habe, ich habe es nicht geschafft, {ihn|sie} von {seiner|ihrer} Entscheidung abzubringen.", "So sehr ich mich auch bemühte, ich schaffte es nicht, {ihn|sie} von {seiner|ihrer} Entscheidung abzubringen."],
    [["jemanden von etwas abbringen", "birini bir şeyden vazgeçirmek"], ["so sehr … auch", "ne kadar … -sa da"]],
    [focus("zu-infinitiv", "abzubringen", [["zu abbringen", "Ayrılabilen fiilde zu araya girer: abzubringen."]])],
  ),
  item(
    "Söylediklerinin doğru olup olmadığını bilmiyorum, ama denemeye değer.",
    ["Ich weiß nicht, ob {das stimmt, was er gesagt hat|das, was er gesagt hat, stimmt}, aber es ist einen Versuch wert.", "Ich weiß nicht, ob {das stimmt, was sie gesagt hat|das, was sie gesagt hat, stimmt}, aber es ist einen Versuch wert."],
    [["einen Versuch wert sein", "denemeye değmek"]],
  ),
  item(
    "Başkaları ne derse desin, ben doğru bulduğumu yapacağım.",
    ["{Egal, was die anderen sagen|Was auch immer die anderen sagen}, ich mache, was ich für richtig halte."],
    [["etwas für richtig halten", "bir şeyi doğru bulmak"], ["egal, was …", "ne … -se -sin"]],
  ),
  item(
    "Ne kadar çok kazanırsa o kadar çok harcıyor; bu yüzden elinde hiç para kalmıyor.",
    ["Je mehr er verdient, desto mehr gibt er aus, {deshalb|deswegen|darum} bleibt ihm nie {etwas|Geld} übrig."],
    [["je …, desto …", "ne kadar … o kadar …"], ["übrig bleiben", "artmak, elde kalmak"]],
    [focus("konnektoren2", "desto mehr gibt er aus", [["desto mehr er gibt aus", "desto + karşılaştırma + fiil + özne: desto mehr gibt er aus."]])],
  ),
  item(
    "Geçen yıl Berlin'de tanıştığımız ve hâlâ görüştüğümüz arkadaşımız gelecek ay bize geliyor.",
    ["Unser {Freund|Bekannter}, den wir letztes Jahr in Berlin kennengelernt haben und mit dem wir immer noch Kontakt haben, besucht uns nächsten Monat.", "Unsere Freundin, die wir letztes Jahr in Berlin kennengelernt haben und mit der wir immer noch Kontakt haben, besucht uns nächsten Monat."],
    [["kennenlernen", "tanışmak"], ["mit jemandem Kontakt haben", "biriyle görüşmek"]],
    [focus("relativ", "mit dem wir immer noch Kontakt haben", [["mit den wir immer noch Kontakt haben", "mit Dativ ister: mit dem (eril, Dativ)."]])],
  ),
  item(
    "Ondan beklediğimizin aksine sınavı en iyi derecesiyle geçti.",
    ["Anders als wir es von ihm erwartet hatten, hat er die Prüfung als Bester bestanden.", "Anders als erwartet hat er die Prüfung als Bester bestanden."],
    [["anders als erwartet", "beklenenin aksine"], ["als Bester", "en iyi olarak"]],
  ),
];

const KONJUNKTIV: ListItem[] = [
  item(
    "Keşke o gün o kadar aceleci davranmasaydım; o zaman her şey bambaşka olurdu.",
    [
      "Hätte ich an dem Tag {bloß|nur|doch} nicht so überstürzt gehandelt, dann wäre alles ganz anders gekommen.",
      "Wenn ich an dem Tag {bloß|nur|doch} nicht so überstürzt gehandelt hätte, {dann |}wäre alles ganz anders gekommen.",
      "Ich wünschte, ich hätte an dem Tag nicht so überstürzt gehandelt, dann wäre alles ganz anders gekommen.",
    ],
    [["überstürzt handeln", "aceleci davranmak"], ["anders kommen", "farklı gelişmek"]],
  ),
  item(
    "Bana daha önce söyleseydin, sana yardım edebilirdim.",
    ["{Wenn du es mir früher gesagt hättest|Hättest du es mir früher gesagt|Wenn du mir das früher gesagt hättest}, hätte ich dir helfen können."],
    [["hätte … helfen können", "yardım edebilirdim"]],
    [focus("konj2-vergangen", "helfen können", [["helfen gekonnt", "hätte + iki mastar: hätte … helfen können."], ["können helfen", "Çift mastarda modal fiil en sona gider: helfen können."]])],
  ),
  item(
    "Hiçbir şey olmamış gibi davranması beni daha da kızdırdı.",
    ["Dass er so getan hat, {als wäre nichts passiert|als ob nichts passiert wäre}, hat mich noch {wütender|mehr} gemacht.", "Dass sie so getan hat, {als wäre nichts passiert|als ob nichts passiert wäre}, hat mich noch {wütender|mehr} gemacht."],
    [["so tun, als ob …", "… -mış gibi davranmak"], ["wütend machen", "kızdırmak"]],
  ),
  item(
    "Ona o kadar güvenmeseydim, şimdi bu kadar hayal kırıklığına uğramazdım.",
    ["{Wenn ich ihm nicht so vertraut hätte|Hätte ich ihm nicht so vertraut}, wäre ich jetzt nicht so enttäuscht.", "{Wenn ich ihr nicht so vertraut hätte|Hätte ich ihr nicht so vertraut}, wäre ich jetzt nicht so enttäuscht."],
    [["jemandem vertrauen", "birine güvenmek"], ["enttäuscht sein", "hayal kırıklığına uğramak"]],
  ),
  item(
    "Bu kadar pahalı olduğunu bilseydik, bu otelde kalmazdık.",
    ["{Wenn wir gewusst hätten|Hätten wir gewusst}, dass es so teuer ist, {wären wir nicht in diesem Hotel geblieben|hätten wir nicht in diesem Hotel übernachtet}."],
    [["übernachten", "konaklamak"]],
  ),
  item(
    "Daha dikkatli olsaydın, kaza belki önlenebilirdi.",
    ["{Wenn du vorsichtiger gewesen wärst|Wärst du vorsichtiger gewesen}, {hätte der Unfall vielleicht vermieden werden können|wäre der Unfall vielleicht nicht passiert}."],
    [["vermeiden", "önlemek"], ["hätte vermieden werden können", "önlenebilirdi"]],
  ),
];

const KONNEKTOREN: ListItem[] = [
  item(
    "Ne İngilizce ne Almanca konuşabiliyor, Çince ise hiç söz konusu değil.",
    ["{Er|Sie} spricht weder Englisch noch Deutsch, geschweige denn Chinesisch."],
    [["geschweige denn", "… ise hiç söz konusu değil"], ["weder … noch", "ne … ne"]],
  ),
  item(
    "Kimseye haber vermeden şehri terk etti.",
    ["{Er|Sie} hat die Stadt verlassen, ohne jemandem Bescheid zu sagen.", "Ohne jemandem Bescheid zu sagen, hat {er|sie} die Stadt verlassen."],
    [["ohne … zu …", "… -meden"], ["jemandem Bescheid sagen", "birine haber vermek"]],
  ),
  item(
    "Hava güzel olduğu sürece her gün bisikletle işe gidiyorum.",
    ["Solange das Wetter schön ist, fahre ich jeden Tag mit dem Fahrrad zur Arbeit.", "Ich fahre jeden Tag mit dem Fahrrad zur Arbeit, solange das Wetter schön ist."],
    [["solange", "-dığı sürece"]],
    [focus("nebensatz", "fahre ich", [["ich fahre", "Yan cümle başta olduğu için ana cümle fiille başlar: Solange …, fahre ich …"]])],
  ),
  item(
    "Kardeşim çok tutumlu, oysa ben bütün paramı hemen harcıyorum.",
    ["{Mein Bruder|Meine Schwester} ist sehr sparsam, {wohingegen|während} ich mein ganzes Geld sofort ausgebe."],
    [["wohingegen", "oysa"], ["sparsam", "tutumlu"]],
  ),
  item(
    "Fiyat makul olduğu takdirde daireyi hemen kiralayacağız.",
    ["{Sofern|Falls|Wenn} der Preis angemessen ist, mieten wir die Wohnung sofort.", "Wir mieten die Wohnung sofort, {sofern|falls|wenn} der Preis angemessen ist."],
    [["sofern", "-dığı takdirde"], ["angemessen", "makul, uygun"]],
  ),
  item(
    "Yorgun olmasına rağmen bize yardım etmeye geldi; bu yüzden ona minnettarız.",
    ["Obwohl er müde war, ist er gekommen, um uns zu helfen, {deshalb|deswegen|darum} sind wir ihm dankbar.", "Obwohl sie müde war, ist sie gekommen, um uns zu helfen, {deshalb|deswegen|darum} sind wir ihr dankbar."],
    [["jemandem dankbar sein", "birine minnettar olmak"], ["obwohl", "-mesine rağmen"]],
  ),
];

const PASSIVERSATZ: ListItem[] = [
  item(
    "Bu sorunun kısa sürede çözülemeyeceği açık.",
    ["Es ist klar, dass sich dieses Problem nicht {kurzfristig|so schnell} lösen lässt.", "Es ist klar, dass dieses Problem nicht {kurzfristig|so schnell} zu lösen ist."],
    [["sich lösen lassen", "çözülebilmek"], ["kurzfristig", "kısa sürede"]],
    [focus("passiversatz", "lösen lässt", [["lässt lösen", "Yan cümlede çekimli fiil (lässt) en sona gider: …, dass sich das Problem nicht lösen lässt."]])],
  ),
  item(
    "Bu kadar eski bir arabanın hâlâ tamir edilip edilemeyeceğinden emin değilim.",
    ["Ich bin mir nicht sicher, ob sich ein so altes Auto noch reparieren lässt.", "Ich bin mir nicht sicher, ob ein so altes Auto noch zu reparieren ist."],
    [["sich reparieren lassen", "tamir edilebilmek"]],
  ),
  item(
    "Formun eksiksiz doldurulup en geç pazartesiye kadar gönderilmesi gerekiyor.",
    ["Das Formular ist vollständig auszufüllen und {bis spätestens Montag|spätestens bis Montag} abzuschicken.", "Das Formular muss vollständig ausgefüllt und {bis spätestens Montag|spätestens bis Montag} abgeschickt werden."],
    [["sein + zu + Infinitiv", "-mesi gerekiyor (resmî)"], ["abschicken", "göndermek"]],
    [focus("passiversatz", "auszufüllen", [["zu ausfüllen", "Ayrılabilen fiilde zu araya girer: auszufüllen, abzuschicken."]])],
  ),
  item(
    "Bu ilaç reçetesiz alınamaz.",
    ["Dieses Medikament ist {nicht ohne Rezept|ohne Rezept nicht} erhältlich.", "Dieses Medikament {bekommt|kriegt} man nicht ohne Rezept.", "Dieses Medikament kann man nicht ohne Rezept kaufen."],
    [["erhältlich", "satın alınabilir"], ["das Rezept", "reçete"]],
  ),
  item(
    "Bu kelimenin tam olarak nasıl çevrilebileceğini bilmiyorum.",
    ["Ich weiß nicht, wie sich dieses Wort genau übersetzen lässt.", "Ich weiß nicht, wie man dieses Wort genau übersetzen kann."],
    [["sich übersetzen lassen", "çevrilebilmek"]],
  ),
  item(
    "Hatanın nedeni henüz bulunamadı.",
    ["Die Ursache des Fehlers {konnte noch nicht gefunden werden|hat noch nicht gefunden werden können|ließ sich noch nicht finden}."],
    [["die Ursache", "neden"], ["konnte nicht gefunden werden", "bulunamadı"]],
  ),
];

const VERMUTUNG: ListItem[] = [
  item(
    "Kapı kilitli değil; Ali çıkarken kilitlemeyi unutmuş olmalı.",
    ["Die Tür ist nicht abgeschlossen, Ali muss vergessen haben, sie abzuschließen, als er gegangen ist.", "Die Tür ist nicht abgeschlossen, Ali muss {beim Gehen|beim Rausgehen} vergessen haben, sie abzuschließen."],
    [["muss vergessen haben", "unutmuş olmalı"], ["abschließen", "kilitlemek"]],
    [focus("vermutung", "muss vergessen haben", [["muss vergessen hat", "Tahminde modal + Partizip II + haben (mastar): muss vergessen haben."]])],
  ),
  item(
    "Sokaklar ıslak, gece yağmur yağmış olmalı.",
    ["Die Straßen sind nass, es muss {in der Nacht|nachts|heute Nacht} geregnet haben."],
    [["es muss geregnet haben", "yağmur yağmış olmalı"]],
  ),
  item(
    "Telefonunu açmıyor; muhtemelen hâlâ toplantıdadır.",
    ["{Sie|Er} geht nicht ans Telefon, {sie|er} dürfte noch in der {Besprechung|Sitzung} sein.", "{Sie|Er} geht nicht ans Telefon, wahrscheinlich ist {sie|er} noch in der {Besprechung|Sitzung}.", "{Sie|Er} geht nicht ans Telefon, {sie|er} wird noch im Meeting sein."],
    [["dürfte … sein", "muhtemelen …-dır"]],
  ),
  item(
    "Bu kadar iyi Almanca konuştuğuna göre uzun süre Almanya'da yaşamış olmalı.",
    ["{Da|Weil} er so gut Deutsch spricht, muss er lange in Deutschland gelebt haben.", "{Da|Weil} sie so gut Deutsch spricht, muss sie lange in Deutschland gelebt haben."],
    [["muss … gelebt haben", "yaşamış olmalı"]],
  ),
  item(
    "Bunu tek başına yapmış olamaz, biri ona yardım etmiş olmalı.",
    ["Das kann er nicht allein gemacht haben, jemand muss ihm geholfen haben.", "Das kann sie nicht allein gemacht haben, jemand muss ihr geholfen haben."],
    [["kann nicht … gemacht haben", "yapmış olamaz"]],
  ),
  item(
    "Paket hâlâ gelmedi; postacı yanlış adrese teslim etmiş olabilir.",
    ["Das Paket ist immer noch nicht da, der {Postbote|Paketbote} könnte es an die falsche Adresse geliefert haben.", "Das Paket ist immer noch nicht angekommen, der {Postbote|Paketbote} könnte es an die falsche Adresse geliefert haben."],
    [["könnte … geliefert haben", "teslim etmiş olabilir"]],
  ),
];

export const C1_BANK = [
  listTemplate("c1-kalip-deyim", "C1", "c1-redewendungen", ["redewendung", "nebensatz"], "Deyimi kalıp olarak öğren; uzun cümlede yan cümlelerin fiili yine sona gider.", REDEWENDUNGEN),
  listTemplate("c1-kalip-parcacik", "C1", "c1-partikeln", ["partikeln"], "doch, ja, halt, eben, sowieso: cümleye sitem, kabullenme ya da davet tonu katar.", PARTIKELN),
  listTemplate("c1-kalip-resmi", "C1", "c1-register", ["nominalstil", "genitiv"], "Resmî dil: isimleştirme, Genitiv ve edilgen (Mit der Einführung des …, erfolgt …).", REGISTER),
  listTemplate("c1-kalip-karmasik", "C1", "c1-komplex", ["so-sehr-auch", "relativ"], "İç içe yan cümleler: her yan cümlenin fiili sona; ilgi zamiri edatın istediği hâlde.", KOMPLEX),
  listTemplate("c1-kalip-konjunktiv", "C1", "c1-konjunktiv", ["konj2-vergangen", "doppelinfinitiv"], "Geçmiş Konjunktiv II: hätte / wäre + Partizip II; modal fiille hätte … helfen können.", KONJUNKTIV),
  listTemplate("c1-kalip-baglac", "C1", "c1-konnektoren", ["konnektoren-c1", "nebensatz"], "geschweige denn, ohne … zu, solange, wohingegen, sofern: çoğu yan cümle açar, fiil sonda.", KONNEKTOREN),
  listTemplate("c1-kalip-edilgen", "C1", "c1-passiversatz", ["passiversatz", "passiv-modal"], "sich lassen + mastar, sein + zu + mastar, -bar / -lich: edilgen anlam.", PASSIVERSATZ),
  listTemplate("c1-kalip-tahmin", "C1", "c1-vermutung", ["vermutung"], "Tahmin: muss / dürfte / könnte + Partizip II + haben / sein.", VERMUTUNG),
];
