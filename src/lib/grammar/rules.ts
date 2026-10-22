import type { RuleInfo } from "../types";

// Grammar rule bank. Feedback says "in this pattern X is used" from here, so explanations work
// offline and stay consistent. Turkish text, German examples.

export interface RuleDef {
  title: string;
  pattern: string;
  examples: string[];
  turkishTip?: string;
}

export const RULES: Record<string, RuleDef> = {
  // ---------- general ----------
  artikel: {
    title: "Artikel: der, die, das",
    pattern:
      "Her Almanca ismin bir cinsiyeti vardır: eril der, dişil die, nötr das; çoğulda hep die. Cinsiyet çoğu zaman tahmin edilemez, bu yüzden her ismi artikeliyle birlikte öğren: der Tisch, die Lampe, das Buch.",
    examples: ["Der Film ist gut.", "Die Jacke ist neu.", "Das Buch ist spannend."],
    turkishTip: "Türkçede artikel de cinsiyet de yok, en sık hata bu yüzden burada olur. Kelimeyi hep der/die/das ile birlikte ezberle.",
  },
  kasus: {
    title: "Hâller (Kasus)",
    pattern:
      "Artikel ve zamirler cümledeki göreve göre değişir: Nominativ özne (der, ein, er), Akkusativ doğrudan nesne (den, einen, ihn), Dativ 'kime/kiminle' (dem, einem, ihm), Genitiv 'kimin' (des, eines). Edat ya da fiil hangi hâli istiyorsa o kullanılır.",
    examples: ["Der Mann sieht den Hund.", "Ich gebe dem Kind ein Buch.", "Das ist das Auto meines Vaters."],
  },
  "eksik-artikel": {
    title: "İsimden önce artikel",
    pattern:
      "Sayılabilen tekil isimler Almancada neredeyse her zaman artikelle kullanılır: der/die/das ya da ein/eine. Meslek, dil ve milliyet bildirirken artikel kullanılmaz: Ich bin Arzt. Ich lerne Deutsch.",
    examples: ["Ich habe einen Bruder.", "Ich lese ein Buch.", "Sie ist Lehrerin."],
    turkishTip: "Türkçede 'bir' kelimesi sık sık düşer (kardeşim var), Almancada ise ein/eine unutulmaz: Ich habe einen Bruder.",
  },
  "fiil-cekimi": {
    title: "Fiil özneye uyar",
    pattern:
      "Çekimli fiil özneye göre ek alır: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. sein, haben ve modal fiillerin çekimi düzensizdir.",
    examples: ["Ich lerne Deutsch.", "Du lernst Deutsch.", "Er lernt Deutsch."],
  },
  "kelime-sirasi": {
    title: "Kelime sırası",
    pattern:
      "Ana cümlede çekimli fiil 2. sıradadır, yan cümlede en sondadır. Perfekt, modal ve ayrılabilen fiillerde ikinci parça (Partizip II, mastar ya da ön ek) cümlenin sonuna gider. Zaman ifadesi genelde yer ifadesinden önce gelir.",
    examples: ["Ich fahre morgen nach Berlin.", "Ich habe gestern Fußball gespielt.", "…, weil ich keine Zeit habe."],
    turkishTip: "Türkçede fiil hep sondadır ve kelime sırası serbesttir. Almancada fiilin yeri sabittir.",
  },

  // ---------- A1 ----------
  sein: {
    title: "sein (olmak)",
    pattern:
      "Durum, meslek, yaş ve yer söylerken sein kullanılır: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. Yaş söylerken kalıp şudur: sein + sayı + Jahre alt.",
    examples: ["Ich bin müde.", "Sie ist fünfundzwanzig Jahre alt.", "Wir sind in Berlin."],
    turkishTip: "'Yorgunum, yirmi yaşındayım' derken Türkçede ayrı bir fiil yok, Almancada her zaman sein gerekir: Ich bin müde.",
  },
  haben: {
    title: "haben + Akkusativ (… var)",
    pattern:
      "'Bir kardeşim var, arabası var' gibi sahiplik cümleleri haben ile kurulur ve sahip olunan şey Akkusativ olur: ich habe, du hast, er/sie hat, wir haben, ihr habt, sie haben. Eril isimlerde ein → einen olur.",
    examples: ["Ich habe einen Bruder.", "Hast du ein Auto?", "Sie hat zwei Kinder."],
    turkishTip: "Türkçedeki '…m var' kalıbı Almancada haben ile söylenir: Ich habe einen Hund. 'Es gibt' sadece 'bir yerde … var' demektir.",
  },
  praesens: {
    title: "Şimdiki zaman çekimi (Präsens)",
    pattern:
      "Fiil kökü + ek: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en. Bazı fiillerde du ve er/sie/es için kökteki sesli harf değişir: fahren → fährt, sprechen → spricht, lesen → liest, essen → isst, sehen → sieht, nehmen → nimmt, schlafen → schläft.",
    examples: ["Ich fahre mit dem Bus.", "Er spricht gut Deutsch.", "Liest du gern?"],
  },
  "fahren-gehen": {
    title: "fahren mi, gehen mi?",
    pattern: "Bir taşıtla gidiliyorsa fahren kullanılır: mit dem Bus fahren. gehen yürüyerek gitmek ya da genel olarak bir yere gitmek demektir: ins Kino gehen.",
    examples: ["Ich fahre mit dem Zug nach Köln.", "Wir gehen zu Fuß.", "Er fährt mit dem Fahrrad zur Arbeit."],
    turkishTip: "Türkçede hepsine 'gitmek' denir. Almancada taşıtla gidiyorsan fahren, yürüyorsan gehen.",
  },
  akkusativ: {
    title: "Akkusativ (nesne hâli)",
    pattern:
      "Fiilin doğrudan etkilediği nesne Akkusativ olur. Sadece eril isimler değişir: der → den, ein → einen, kein → keinen, mein → meinen. Dişil (die/eine), nötr (das/ein) ve çoğul aynı kalır.",
    examples: ["Ich suche den Schlüssel.", "Wir kaufen einen Tisch.", "Sie trinkt eine Cola."],
    turkishTip: "Türkçedeki belirtme hâli (anahtarı) belirli bir nesneyi gösterir. Almancada belirli eril nesne 'den' olur (den Schlüssel), 'bir anahtar' ise 'einen Schlüssel'.",
  },
  "w-frage": {
    title: "Soru kelimeli sorular",
    pattern:
      "Soru kelimesi (wo, wann, was, wie, woher, wohin, warum, wer) en başa gelir, hemen ardından çekimli fiil, sonra özne: Wo wohnst du?",
    examples: ["Wo wohnst du?", "Wann kommt der Zug?", "Was trinkt ihr?"],
    turkishTip: "Türkçede soru kelimesi fiilin önündedir (sen nerede oturuyorsun?). Almancada soru kelimesi başa, çekimli fiil hemen ikinci sıraya gelir.",
  },
  "ja-nein-frage": {
    title: "Evet/hayır soruları",
    pattern: "Almancada 'mi' gibi bir soru eki yoktur. Çekimli fiil cümlenin başına gelir, özne hemen arkasından: Kommst du morgen?",
    examples: ["Kommst du morgen?", "Sprechen Sie Deutsch?", "Hat er ein Auto?"],
    turkishTip: "Türkçedeki 'mi' ekinin işini Almancada fiili başa almak görür.",
  },
  "kein-nicht": {
    title: "kein mi, nicht mi?",
    pattern:
      "Artikelsiz ya da ein ile kullanılan bir ismi olumsuz yaparken kein kullanılır ve isme göre çekilir (kein, keine, keinen). Fiili, sıfatı, zarfı ya da der/die/das'lı bir ismi olumsuz yaparken nicht kullanılır.",
    examples: ["Ich habe keine Zeit.", "Er hat keinen Hund.", "Ich bin nicht müde.", "Ich arbeite heute nicht."],
    turkishTip: "Türkçedeki 'yok' ve 'değil' ayrımı gibi düşün: 'zamanım yok' → keine Zeit, 'yorgun değilim' → nicht müde.",
  },
  modal: {
    title: "Modal fiil + mastar",
    pattern:
      "Modal fiil (können, müssen, wollen, möchten, dürfen, sollen) çekimlenip 2. sıraya gelir, asıl fiil mastar hâlinde en sona gider. Modal fiilden sonra 'zu' kullanılmaz. ich ve er/sie/es ek almaz: ich kann / er kann, ich muss / er muss, ich will / er will.",
    examples: ["Ich muss morgen früh aufstehen.", "Kannst du schwimmen?", "Wir möchten Deutsch lernen."],
  },
  trennbar: {
    title: "Ayrılabilen fiiller",
    pattern:
      "aufstehen, einkaufen, anrufen, fernsehen gibi fiillerde çekimli kök 2. sıraya gelir, ön ek (auf, ein, an, fern…) cümlenin en sonuna gider. Modal fiil varsa ya da yan cümlede fiil bitişik kalır: Ich muss früh aufstehen.",
    examples: ["Ich stehe um sieben Uhr auf.", "Er ruft seine Mutter an.", "Wir kaufen am Samstag ein."],
  },
  v2: {
    title: "Çekimli fiil 2. sırada",
    pattern:
      "Ana cümlede çekimli fiil her zaman 2. sıradadır. Cümle zaman ya da yer ifadesiyle başlarsa özne fiilin arkasına geçer: Morgen gehe ich ins Kino. (Morgen ich gehe ✗)",
    examples: ["Morgen gehe ich ins Kino.", "Am Samstag spielen wir Fußball.", "Heute bleibt sie zu Hause."],
    turkishTip: "Türkçede fiil sondadır ve sıra serbesttir. Almanca ana cümlede çekimli fiilin yeri sabittir: hep ikinci sıra.",
  },

  // ---------- A2 ----------
  perfekt: {
    title: "Perfekt: haben/sein + Partizip II",
    pattern:
      "Konuşmada geçmiş zaman Perfekt ile anlatılır: yardımcı fiil (haben ya da sein) çekimlenip 2. sıraya gelir, Partizip II en sona gider. Hareket (gehen, fahren, fliegen, kommen) ve durum değişikliği (aufstehen, einschlafen) bildiren fiiller ile bleiben sein alır; diğerleri haben alır.",
    examples: ["Ich habe einen Film gesehen.", "Wir sind nach Berlin gefahren.", "Sie ist früh aufgestanden."],
    turkishTip: "Türkçede tek bir '-di' eki yeter. Almancada iki parça var: yardımcı fiil 2. sırada, Partizip II sonda.",
  },
  partizip2: {
    title: "Partizip II nasıl yapılır?",
    pattern:
      "Düzenli fiiller: ge- + kök + -t (machen → gemacht, kaufen → gekauft). Düzensiz fiiller: ge- + kök + -en, kök çoğu zaman değişir (sehen → gesehen, schreiben → geschrieben, trinken → getrunken). Ayrılabilen fiillerde ge- ortaya girer (einkaufen → eingekauft, anrufen → angerufen). be-, ver-, er- ile başlayan ve -ieren ile biten fiiller ge- almaz (besuchen → besucht, verstehen → verstanden, studieren → studiert).",
    examples: ["Ich habe Brot gekauft.", "Hast du das Buch gelesen?", "Er hat mich angerufen."],
  },
  dativ: {
    title: "Dativ",
    pattern:
      "Dativ'de artikeller değişir: der → dem, die → der, das → dem, çoğul die → den (isim de -n alır). ein → einem / einer / einem, mein → meinem / meiner / meinem / meinen. Zamirler: mir, dir, ihm, ihr, uns, euch, ihnen, Ihnen.",
    examples: ["Ich gebe dem Kind ein Buch.", "Er wohnt bei seiner Mutter.", "Das gehört mir."],
    turkishTip: "Türkçedeki -e hâli (babaMA, banA) çoğu zaman Dativ'e karşılık gelir.",
  },
  "dativ-verben": {
    title: "Dativ alan fiiller",
    pattern:
      "Bazı fiiller nesnesini Dativ'de ister: helfen, danken, antworten, gratulieren, glauben (birine), gefallen, gehören, passen, folgen. Kalıp: jemandem helfen, jemandem danken. helfen düzensizdir: du hilfst, er hilft.",
    examples: ["Ich helfe meinem Vater.", "Wir danken dir.", "Er hat seiner Lehrerin geantwortet."],
    turkishTip: "Türkçede 'birine yardım etmek, birine teşekkür etmek' -e hâli alır, Almancada da Dativ. Ama dikkat: 'birini tebrik etmek' (-i hâli) Almancada yine Dativ'dir: jemandem gratulieren.",
  },
  gefallen: {
    title: "gefallen / gehören / passen + Dativ",
    pattern:
      "Bu fiillerde beğenilen, ait olan ya da uyan şey öznedir, kişi Dativ olur: [şey] gefällt [kişi-Dativ]. Özne çoğulsa fiil de çoğul olur: Die Schuhe gefallen mir.",
    examples: ["Die Stadt gefällt mir.", "Das Auto gehört meinem Vater.", "Die Jacke passt mir nicht."],
    turkishTip: "Türkçede de 'hoşuMA gidiyor, babaMA ait' derken kişi -e hâlindedir. Almancada o kişi Dativ olur: mir, meinem Vater.",
  },
  "dativ-praep": {
    title: "Her zaman Dativ alan edatlar",
    pattern:
      "mit, nach, bei, seit, von, zu, aus her zaman Dativ ister. Kaynaşmalar: zu + dem = zum, zu + der = zur, von + dem = vom, bei + dem = beim.",
    examples: ["Ich fahre mit dem Bus.", "Er geht zum Arzt.", "Sie kommt aus der Türkei."],
    turkishTip: "Türkçedeki '-le' eki (otobüsLE) Almancada 'mit + Dativ' olur: mit dem Bus.",
  },
  wechsel: {
    title: "İki yönlü edatlar: wo? / wohin?",
    pattern:
      "in, an, auf, über, unter, vor, hinter, neben, zwischen: 'Nerede?' (bir yerde durmak) sorusunda Dativ, 'Nereye?' (bir yere hareket) sorusunda Akkusativ alır. Fiil çiftleri: liegen / legen, stehen / stellen, hängen. Kaynaşmalar: in + dem = im, in + das = ins, an + dem = am.",
    examples: ["Das Buch liegt auf dem Tisch.", "Ich lege das Buch auf den Tisch.", "Wir sind im Park.", "Wir gehen in den Park."],
    turkishTip: "Burada Türkçe sezgin ters çalışır: -de (masaDA, nerede?) → Dativ, -e (masaYA, nereye?) → Akkusativ.",
  },
  nebensatz: {
    title: "Yan cümlede fiil en sonda",
    pattern:
      "weil, dass, wenn, ob, obwohl, als, damit, bevor, nachdem gibi bağlaçlarla başlayan yan cümlede çekimli fiil en sona gider; yan cümle virgülle ayrılır. Yan cümle başa gelirse ana cümle fiille başlar: Wenn ich Zeit habe, komme ich.",
    examples: ["Ich bleibe zu Hause, weil ich krank bin.", "Ich weiß, dass du recht hast.", "Wenn es regnet, fahre ich mit dem Bus."],
    turkishTip: "Türkçede fiil zaten sonda olduğu için bu kural sana tanıdık gelir: yan cümlede Almanca da Türkçe gibi davranır.",
  },
  "weil-denn": {
    title: "weil ve denn farkı",
    pattern: "İkisi de 'çünkü' demektir. weil yan cümle açar ve fiil sona gider: weil ich krank bin. denn normal sırayı korur: denn ich bin krank.",
    examples: ["Ich komme nicht, weil ich krank bin.", "Ich komme nicht, denn ich bin krank."],
  },
  reflexiv: {
    title: "Dönüşlü fiiller",
    pattern:
      "sich freuen, sich fühlen, sich beeilen, sich treffen gibi fiillerde dönüşlü zamir özneye uyar: ich … mich, du … dich, er/sie … sich, wir … uns, ihr … euch, sie/Sie … sich. Zamir çekimli fiilden hemen sonra gelir.",
    examples: ["Ich freue mich auf das Wochenende.", "Wir müssen uns beeilen.", "Fühlst du dich gut?"],
    turkishTip: "Türkçede bu anlam fiilin içinde saklıdır (seviniyorum, acele ediyoruz). Almancada ayrı bir zamir gerekir: mich, uns…",
  },
  "freuen-auf-ueber": {
    title: "sich freuen auf / über",
    pattern:
      "sich freuen auf + Akkusativ: henüz gelmemiş bir şeyi dört gözle beklemek. sich freuen über + Akkusativ: olmuş bir şeye sevinmek.",
    examples: ["Ich freue mich auf die Ferien.", "Sie freut sich über das Geschenk."],
  },
  komparativ: {
    title: "Karşılaştırma (Komparativ)",
    pattern:
      "Sıfat + -er + als: schnell → schneller als. Tek heceli birçok sıfat umlaut alır: alt → älter, groß → größer, jung → jünger, kalt → kälter, warm → wärmer, gesund → gesünder. Düzensizler: gut → besser, viel → mehr, gern → lieber. als'tan sonra özne hâli gelir: größer als ich. Eşitlik: so … wie.",
    examples: ["Berlin ist größer als München.", "Mein Bruder ist älter als ich.", "Tee ist gesünder als Kaffee."],
    turkishTip: "Türkçedeki '-den daha' (benDEN daha uzun) Almancada 'als + Nominativ' olur: größer als ich (als mich ✗).",
  },
  praeteritum: {
    title: "war, hatte ve modalların geçmişi",
    pattern:
      "sein, haben ve modal fiillerde konuşmada da Präteritum kullanılır: war (ich war, du warst, er war, wir waren), hatte (ich hatte, du hattest, er hatte), konnte, musste, wollte. Präteritum'da modallar umlaut almaz: konnte (könnte ise 'yapabilirdi' demektir).",
    examples: ["Gestern war ich krank.", "Als Kind hatte ich einen Hund.", "Ich konnte nicht kommen."],
  },
  adjektiv: {
    title: "Sıfat çekimi",
    pattern:
      "İsimden önceki sıfat ek alır. der/die/das'tan sonra Nominativ'de -e (der neue Lehrer), diğer çoğu durumda -en. ein/kein/mein'dan sonra sıfat cinsiyeti gösterir: ein neuer Hund, eine neue Jacke, ein neues Auto. Akkusativ erilde: einen neuen Hund. Dativ'de her zaman -en: mit meinem neuen Auto.",
    examples: ["Ich habe ein neues Auto.", "Der neue Lehrer ist nett.", "Wir wohnen in einem kleinen Haus."],
    turkishTip: "Türkçede sıfat hiç değişmez (yeni araba, yeni arabayla). Almancada sıfat artikele, cinsiyete ve hâle göre ek alır.",
  },

  // ---------- B1 ----------
  obwohl: {
    title: "obwohl (-e rağmen)",
    pattern:
      "obwohl yan cümle açar, çekimli fiil sona gider. Yan cümle başta ise ana cümle çekimli fiille başlar: Obwohl er krank war, ist er zur Arbeit gegangen.",
    examples: ["Obwohl es regnet, gehen wir spazieren.", "Er arbeitet, obwohl er müde ist."],
    turkishTip: "Türkçedeki '-masına rağmen' kalıbı Almancada 'obwohl + fiil sonda' olur.",
  },
  "als-wenn": {
    title: "als mı, wenn mi?",
    pattern:
      "Geçmişte bir kez olan olay ya da geçmişteki tek bir dönem için als kullanılır: Als ich ein Kind war… Şimdiki, gelecekteki ya da tekrarlanan olaylar için wenn kullanılır: Wenn ich nach Hause komme… (her geldiğimde).",
    examples: ["Als ich nach Berlin kam, konnte ich kein Deutsch.", "Wenn ich Zeit habe, lese ich."],
    turkishTip: "Türkçedeki '-dığında' iki anlama da gelir. Tek seferlik geçmişse als, 'her … -dığında' ise wenn.",
  },
  "damit-umzu": {
    title: "Amaç: um … zu ve damit",
    pattern:
      "Amaç bildirirken iki cümlenin öznesi aynıysa 'um … zu + mastar' kullanılır ve mastar sona gider: Ich lerne, um in Deutschland zu arbeiten. Özneler farklıysa damit + fiil sonda: Ich spreche langsam, damit du mich verstehst.",
    examples: ["Ich spare, um ein Auto zu kaufen.", "Ich mache das Licht aus, damit das Baby schläft."],
    turkishTip: "Türkçedeki '-mek için' çoğu zaman 'um … zu', '-sin diye' ise damit olur.",
  },
  "bevor-nachdem": {
    title: "bevor / nachdem",
    pattern:
      "bevor: -meden önce, nachdem: -dikten sonra. İkisi de yan cümle açar, fiil sona gider. nachdem'li cümlede olay daha önce olduğu için ana cümle Präsens ise yan cümle Perfekt olur.",
    examples: ["Bevor ich ins Bett gehe, putze ich mir die Zähne.", "Nachdem ich gefrühstückt habe, gehe ich zur Arbeit."],
  },
  relativ: {
    title: "İlgi cümlesi (Relativsatz)",
    pattern:
      "İlgi zamiri cinsiyetini ve sayısını isimden alır, hâlini ise yan cümledeki görevinden. Eril: der (özne), den (nesne), dem (Dativ); dişil: die, die, der; nötr: das, das, dem; çoğul: die, die, denen. Yan cümlede fiil sona gider ve cümle virgülle ayrılır.",
    examples: ["Der Mann, der dort steht, ist mein Nachbar.", "Der Film, den ich gesehen habe, war gut.", "Die Frau, der ich geholfen habe, ist Ärztin."],
    turkishTip: "Türkçede ilgi cümlesi ismin önüne gelir (dün tanıştığım adam), Almancada ismin arkasına: der Mann, den ich gestern kennengelernt habe.",
  },
  passiv: {
    title: "Edilgen çatı (Passiv)",
    pattern:
      "werden + Partizip II (en sonda). Şimdiki zaman: wird / werden gebaut. Geçmiş: wurde / wurden gebaut. Eylemi yapan belirtilirse von + Dativ: von der Polizei.",
    examples: ["Das Haus wird renoviert.", "Die Brücke wurde 1990 gebaut.", "Hier wird Deutsch gesprochen."],
    turkishTip: "Türkçedeki edilgen ek (yapıldı, inşa edildi) Almancada 'werden + Partizip II' ile kurulur.",
  },
  konjunktiv2: {
    title: "Konjunktiv II: dilek, varsayım, rica",
    pattern:
      "Gerçek olmayan koşul: Wenn ich … hätte / wäre / könnte, würde ich … + mastar (sonda). Kibar rica: Könnten Sie …? Würden Sie …? Ich hätte gern …",
    examples: ["Wenn ich mehr Zeit hätte, würde ich reisen.", "Könnten Sie mir helfen?", "Ich hätte gern einen Kaffee."],
    turkishTip: "Türkçedeki '-saydı … -ırdı' kalıbı Almancada 'wenn … hätte/wäre, würde … + mastar' olur.",
  },
  "praep-verben": {
    title: "Edatlı fiiller",
    pattern:
      "Bazı fiiller sabit bir edatla kullanılır ve hâli o edat belirler. Bunları edatıyla birlikte öğren: warten auf + A, denken an + A, sich interessieren für + A, Angst haben vor + D, träumen von + D, sich erinnern an + A, sich kümmern um + A, teilnehmen an + D, sich ärgern über + A.",
    examples: ["Ich warte auf den Bus.", "Er denkt oft an seine Familie.", "Sie interessiert sich für Musik."],
    turkishTip: "Türkçe hâl eki burada yol göstermez: 'otobüsü beklemek' (-i) → auf den Bus warten, 'müzikle ilgilenmek' (-le) → sich für Musik interessieren.",
  },
  "zu-infinitiv": {
    title: "zu + mastar",
    pattern:
      "'Es ist schwer / schön / wichtig, … zu + mastar' kalıbında ve vergessen, versuchen, beschließen, vorhaben, Zeit haben gibi ifadelerden sonra 'zu + mastar' gelir ve en sona gider. Ayrılabilen fiillerde zu ortaya girer: aufzustehen, anzurufen.",
    examples: ["Es ist schwer, früh aufzustehen.", "Vergiss nicht, mich anzurufen!", "Ich habe keine Zeit, einkaufen zu gehen."],
  },
  genitiv: {
    title: "Genitiv: wegen, trotz, während",
    pattern:
      "wegen (yüzünden), trotz (-e rağmen) ve während (sırasında) Genitiv ister. Eril ve nötr isimlerde: des + isim + -(e)s (des Regens, des Films). Dişil ve çoğulda: der (der Krankheit, der Ferien).",
    examples: ["Wegen des Regens bleiben wir zu Hause.", "Trotz der Kälte gehen wir spazieren.", "Während des Films ist er eingeschlafen."],
  },
  plusquam: {
    title: "Plusquamperfekt (-mıştı)",
    pattern:
      "Geçmişteki bir olaydan daha önce olanı anlatır: hatte / war + Partizip II. haben ve sein seçimi Perfekt'teki gibidir: Der Zug war schon abgefahren. Er hatte schon gegessen.",
    examples: ["Als ich ankam, war der Zug schon abgefahren.", "Sie hatte das Buch schon gelesen."],
    turkishTip: "Türkçedeki '-mıştı' eki Almancada 'hatte / war + Partizip II' ile karşılanır.",
  },

  // ---------- B2 ----------
  konj1: {
    title: "Dolaylı anlatım (Konjunktiv I)",
    pattern:
      "Haber ve resmî dilde başkasının sözünü aktarırken Konjunktiv I kullanılır: er sei, er habe, er komme, er könne, er müsse. dass kullanılırsa fiil sona gider, kullanılmazsa normal sıra kalır.",
    examples: ["Er sagte, er sei krank.", "Sie sagte, sie habe keine Zeit.", "Der Minister sagte, die Lage sei stabil."],
  },
  "passiv-modal": {
    title: "Modal fiilli edilgen",
    pattern:
      "Modal fiil 2. sıraya gelir, cümlenin sonunda Partizip II + werden olur: Das muss repariert werden. Yasaklarda: Hier darf nicht geraucht werden.",
    examples: ["Die Heizung muss repariert werden.", "Das Formular kann online ausgefüllt werden."],
    turkishTip: "Türkçedeki '-ilmeli / -ilebilir' (tamir edilmeli) Almancada 'modal + Partizip II + werden' olur.",
  },
  zustandspassiv: {
    title: "Durum edilgeni (sein + Partizip II)",
    pattern: "Bir eylemin sonunda oluşan durumu anlatır: Das Geschäft ist geschlossen. Eylemin kendisi ise werden ile söylenir: Das Geschäft wird geschlossen.",
    examples: ["Die Tür ist geöffnet.", "Der Tisch ist schon gedeckt."],
  },
  "partizip-attr": {
    title: "Sıfat-fiil (Partizip) yapıları",
    pattern:
      "Partizip I (-end) eşzamanlı ve etken anlam verir: die lachenden Kinder (gülen çocuklar). Partizip II tamamlanmış ve çoğunlukla edilgen anlam verir: das gekaufte Buch. İkisi de isimden önce sıfat gibi çekilir; aynı anlam ilgi cümlesiyle de söylenebilir.",
    examples: ["Weck das schlafende Baby nicht auf!", "Das gestern gekaufte Buch ist langweilig."],
    turkishTip: "Türkçedeki '-an / -dığı' sıfat-fiilleri (gülen çocuklar, aldığım kitap) Almancada Partizip ya da ilgi cümlesiyle söylenir.",
  },
  nvv: {
    title: "İsim-fiil kalıpları",
    pattern:
      "Bazı anlamlar sabit isim + fiil kalıplarıyla söylenir ve fiil Türkçeden birebir çevrilmez: eine Entscheidung treffen (karar vermek), eine Frage stellen (soru sormak), Verantwortung übernehmen (sorumluluk almak), in Frage kommen (söz konusu olmak), zur Verfügung stellen (sunmak), Maßnahmen ergreifen (önlem almak).",
    examples: ["Ich habe eine Entscheidung getroffen.", "Darf ich eine Frage stellen?"],
    turkishTip: "'Karar vermek' → eine Entscheidung treffen. 'Vermek, almak, sormak' fiillerini birebir çevirme (eine Entscheidung geben ✗).",
  },
  konnektoren2: {
    title: "İki parçalı bağlaçlar",
    pattern:
      "sowohl … als auch (hem … hem), weder … noch (ne … ne), entweder … oder (ya … ya), nicht nur … sondern auch (sadece … değil, … da). je + karşılaştırma (fiil sonda), desto + karşılaştırma + fiil + özne: ne kadar … o kadar.",
    examples: ["Er spricht sowohl Deutsch als auch Englisch.", "Ich trinke weder Kaffee noch Tee.", "Je mehr du übst, desto besser sprichst du."],
  },
  "konj2-vergangen": {
    title: "Geçmiş Konjunktiv II",
    pattern:
      "Geçmişte gerçekleşmemiş varsayım ve pişmanlık: hätte / wäre + Partizip II. Modal fiille: hätte + mastar + modal mastarı (hätte machen sollen). Keşke: Ich wünschte, ich hätte … / Hätte ich doch …!",
    examples: ["Wenn ich das gewusst hätte, wäre ich gekommen.", "Du hättest vorsichtiger sein sollen."],
    turkishTip: "Türkçedeki '-saydı … -ırdı' geçmişe dönükse Almancada 'hätte / wäre + Partizip II' olur.",
  },

  // ---------- C1 ----------
  redewendung: {
    title: "Deyimler",
    pattern:
      "Deyimler kelime kelime çevrilmez, kalıp olarak öğrenilir. Türkçedeki anlamı karşılayan Almanca deyimi bil; emin değilsen aynı anlamı veren sade bir cümle de doğrudur.",
    examples: ["Ich drücke dir die Daumen.", "Ich verstehe nur Bahnhof.", "Das ist mir Wurst."],
  },
  doppelinfinitiv: {
    title: "Yan cümlede çift mastar: …, dass er es hätte wissen müssen",
    pattern:
      "Modal fiilli geçmiş Konjunktiv II (hätte … sollen / müssen / können) yan cümleye girince çekimli fiil (hätte) sona değil, iki mastarın ÖNÜNE gelir: …, dass ich sie früher hätte anrufen sollen. Asıl fiil de modal fiil de mastar kalır (angerufen ya da gesollt değil).",
    examples: ["Ich weiß, dass ich früher hätte aufstehen sollen.", "Er hat zugegeben, dass er es hätte wissen müssen.", "Er sagt, er hätte kommen können, wenn wir ihn gefragt hätten."],
    turkishTip: "'Annemi daha önce aramam gerektiğini biliyorum' → Ich weiß, dass ich meine Mutter früher hätte anrufen sollen. Türkçe sıralamayla (anrufen sollen hätte) kurma.",
  },
  "als-ob": {
    title: "als ob / als + Konjunktiv II: -mış gibi",
    pattern:
      "Gerçek olmayan karşılaştırma: als ob + özne … + Konjunktiv II (fiil sonda) ya da als + Konjunktiv II hemen arkasından (fiil öne gelir). Geçmiş için hätte / wäre + Partizip II: als ob er nichts gewusst hätte = als hätte er nichts gewusst.",
    examples: ["Er tut so, als ob er nichts davon gewusst hätte.", "Du siehst aus, als hättest du die ganze Nacht nicht geschlafen.", "Sie redet, als wüsste sie alles."],
    turkishTip: "'Hiçbir şey olmamış gibi davranıyor' → Er tut so, als wäre nichts passiert. -mış gibi → als ob / als + Konjunktiv II.",
  },
  "konnektoren-c1": {
    title: "İleri bağlaçlar: es sei denn, ohne dass, indem, zumal",
    pattern:
      "es sei denn (-medikçe, meğer ki): arkasından ana cümle sırası (fiil 2.) ya da dass + fiil sonda. ohne dass (başka biri … -meden), indem (-erek, yöntem), zumal (hele ki, ek neden), sofern (-dığı takdirde), wohingegen (oysa) yan cümle açar: çekimli fiil sonda.",
    examples: ["Ich komme nicht, es sei denn, du holst mich ab.", "Er ist gegangen, ohne dass es jemand gemerkt hat.", "Man spart viel Geld, indem man selbst kocht."],
    turkishTip: "'Kendin yemek yaparak' → indem du selbst kochst; 'kimse fark etmeden' → ohne dass es jemand merkt.",
  },
  passiversatz: {
    title: "Edilgen yerine: sich lassen, sein + zu, -bar",
    pattern:
      "'… -ebilir / -emez' anlamı için edilgen yerine: sich lassen + mastar (Das lässt sich leicht lösen), sein + zu + mastar (Das ist leicht zu lösen), -bar / -lich sıfatı (lösbar, erhältlich). Zorunlulukta sein + zu: Die Rechnung ist bis Freitag zu bezahlen (ödenmesi gerekiyor).",
    examples: ["Das Problem lässt sich leicht lösen.", "Das Formular ist vollständig auszufüllen.", "Die Entscheidung lässt sich nicht mehr rückgängig machen."],
    turkishTip: "'Bu sorun kolayca çözülebilir' → Das Problem lässt sich leicht lösen = ist leicht zu lösen = ist leicht lösbar.",
  },
  vermutung: {
    title: "Geçmişe dair tahmin: muss / dürfte / könnte … gemacht haben",
    pattern:
      "Tahmin bildiren modal fiil + Partizip II + haben / sein (Perfekt mastarı): muss … verpasst haben (-miş olmalı), dürfte / wird (wohl) … verpasst haben (büyük ihtimalle -mıştır), könnte … haben (-miş olabilir), kann nicht … haben (-miş olamaz).",
    examples: ["Er muss den Bus verpasst haben.", "Sie dürfte schon nach Hause gegangen sein.", "Das kann er nicht allein gemacht haben."],
    turkishTip: "'Otobüsü kaçırmış olmalı' → Er muss den Bus verpasst haben ('verpassen müssen' değil: o 'kaçırmak zorunda' demek olur).",
  },
  // ---------- everyday spoken German ----------
  umgang: {
    title: "Konuşma dili kısaltmaları",
    pattern:
      "Günlük konuşmada bazı sesler düşer: ich hab (habe), wär's (wäre es), gibt's (gibt es), 'n / 'nen (ein / einen), nix (nichts), drauf (darauf), ich geh / ich mach (gehe / mache). Yazıda uzun biçim de doğrudur; ikisi de kabul edilir.",
    examples: ["Ich hab null Bock, heute zu kochen.", "Wie wär's, wenn wir ins Kino gehen?", "Kommt drauf an, ob er Zeit hat."],
    turkishTip: "Türkçedeki 'napıyosun, geliyom' gibi: Almancada da konuşurken kelimeler kısalır. Kesme işaretini (wär's) unutursan da sorun değil.",
  },
  "mir-ist": {
    title: "Mir ist kalt: beden ve duygu durumu",
    pattern:
      "Üşümek, sıkılmak, mide bulanması, baş dönmesi gibi durumlarda kişi Dativ'dedir ve fiil hep ist kalır: mir ist kalt, dir ist schlecht, ihm ist langweilig. Yan cümlede de böyledir: …, dass dir kalt ist.",
    examples: ["Mir ist so kalt, dass ich meine Finger nicht mehr spüre.", "Kein Wunder, dass dir kalt ist, wenn du ohne Jacke rausgehst!"],
    turkishTip: "'Üşüyorum' için 'Ich bin kalt' demek yanlıştır (soğuk biriyim demek olur); doğrusu 'Mir ist kalt' ya da 'Ich friere'.",
  },
  lust: {
    title: "Lust / Bock haben, … zu …",
    pattern:
      "Bir şeyi yapmak isteyip istemediğini söylemenin en doğal yolu: (keine) Lust haben, … zu + mastar (sonda). Argoda keinen Bock / null Bock. zu + mastar virgülden sonraki öbeğin en sonuna gider.",
    examples: ["Ich hab null Bock, heute die Wohnung zu putzen, aber ich muss wohl.", "Hast du Lust, am Wochenende ins Kino zu gehen?"],
    turkishTip: "'Hiç … -esim yok' cümleleri Almancada 'keinen Bock / keine Lust haben, … zu …' ile kurulur.",
  },
  vorschlag: {
    title: "Öneri: Wie wär's, wenn …? / Wir könnten doch …",
    pattern:
      "Öneri yaparken: Wie wär's, wenn wir … (fiil sonda)? Was hältst du davon, … zu …? Wenn …, könnten wir doch …, oder? Yan cümle başta ise ana cümle çekimli fiille başlar (…, könnten wir …).",
    examples: ["Wie wär's, wenn wir heute Abend ins Kino gehen?", "Wenn das Wetter morgen schön ist, könnten wir doch Fahrrad fahren, oder?"],
    turkishTip: "'… -sek nasıl olur?' → Wie wär's, wenn wir …? '… -ebiliriz, ne dersin?' → Wir könnten doch …, oder?",
  },
  "bitte-mal": {
    title: "Kibar rica ve izin isteme",
    pattern:
      "İzin isterken: Hättest du was dagegen / Macht es dir was aus, wenn ich … (fiil sonda)? Rica ederken: Würde es dir was ausmachen, … zu + mastar? Ayrılabilen fiil yan cümlede birleşir (aufmache), zu ile araya zu girer (abzuholen).",
    examples: ["Hättest du was dagegen, wenn ich das Fenster aufmache?", "Würde es dir was ausmachen, mich morgen vom Bahnhof abzuholen?"],
    turkishTip: "'… -sem sorun olur mu?' → Hättest du was dagegen, wenn ich …? '… -sen senin için sorun olur mu?' → Würde es dir was ausmachen, … zu …?",
  },
  "zum-zur": {
    title: "Yol tarifi: zum / zur",
    pattern:
      "Bir yere giderken zu + Dativ kullanılır: eril ve nötr isimde zu dem → zum, dişil isimde zu der → zur. bis zum / bis zur: -e kadar.",
    examples: ["Können Sie mir sagen, wie ich zum Bahnhof komme?", "Gehen Sie geradeaus, bis Sie zur Kirche kommen."],
    turkishTip: "Türkçede yönelme eki (-e) tektir; Almancada ismin cinsiyetine göre zum ya da zur seçilir.",
  },
  "dass-gefuehl": {
    title: "Duygu + dass: Danke / Sorry / Es nervt mich, dass …",
    pattern:
      "Neye teşekkür ettiğini, neden özür dilediğini ya da neye kızdığını dass'lı yan cümleyle söylersin; çekimli fiil en sona gider: Danke, dass du mir geholfen hast. Es nervt mich, dass er immer zu spät kommt.",
    examples: ["Tut mir leid, dass ich deinen Geburtstag vergessen habe.", "Ich kann nicht glauben, dass er schon wieder zu spät gekommen ist!"],
    turkishTip: "'… -dığın için teşekkürler', '… -diğine inanamıyorum', '… -mesi beni sinir ediyor' → hepsi dass'lı yan cümle.",
  },
  bestellen: {
    title: "Sipariş: Ich hätte gern … / Ich nehme …",
    pattern:
      "Kafede ve restoranda en doğal sipariş kalıpları: Ich hätte gern + Akkusativ, Ich nehme + Akkusativ. Eril isimde ein → einen, kein → keinen. Nedeni weil ile söylersen fiil sona gider.",
    examples: ["Ich hätte gern einen großen Kaffee, aber ohne Milch, weil ich laktoseintolerant bin.", "Ich hatte eigentlich einen Tee bestellt, keinen Kaffee."],
    turkishTip: "'Bir kahve alabilir miyim?' Almancada çoğu zaman 'Ich hätte gern einen Kaffee.' diye söylenir.",
  },
  "indirekte-frage": {
    title: "Dolaylı soru: ob, wie, wann, warum …",
    pattern:
      "Bir soruyu başka bir cümlenin içine koyarken (Weißt du, …? Können Sie mir sagen, …? Ich check nicht, …) soru kelimesi ya da ob yan cümle açar: hemen arkasından özne gelir, çekimli fiil en sona gider. Evet/hayır sorusu ob ile kurulur.",
    examples: ["Weißt du zufällig, ob Ali morgen kommt?", "Können Sie mir sagen, wie ich zum Bahnhof komme?", "Ich check nicht, warum er so sauer ist."],
    turkishTip: "'Gelip gelmeyeceğini biliyor musun?' → Weißt du, ob er kommt? 'Nasıl gideceğimi' → wie ich … komme (wie komme ich değil).",
  },
  "statt-zu": {
    title: "statt … zu: -eceğine, -mek yerine",
    pattern:
      "'-eceğine / -mek yerine' anlamında statt (anstatt) … zu + mastar kullanılır; zu + mastar o öbeğin en sonundadır. Ayrılabilen fiilde zu araya girer: fernzusehen, aufzuräumen. Öbek başta ise ana cümle fiille başlar.",
    examples: ["Statt für die Prüfung zu lernen, hängt er nur am Handy rum.", "Lass uns lieber selbst kochen, statt Essen zu bestellen."],
    turkishTip: "'Ders çalışacağına bütün gün telefonla oynuyor' → Statt zu lernen, … Türkçedeki -eceğine eki Almancada statt … zu olur.",
  },
  pronomen: {
    title: "Zamir ismin cinsiyetine uyar",
    pattern:
      "Bir ismin yerine geçen zamir, ismin artikeline göre seçilir: der → er (ihn), die → sie, das → es, çoğul → sie. Eşyalar için de böyledir: die Jacke → sie, der Pullover → er, das Hemd → es.",
    examples: ["Kann ich die Jacke umtauschen, falls sie nicht passt?", "Der Pullover ist schön, aber er ist zu klein."],
    turkishTip: "Türkçede eşya için hep 'o' denir; Almancada ceket (die Jacke) dişil olduğu için 'sie', kazak (der Pullover) eril olduğu için 'er' olur.",
  },
  "sobald-bis": {
    title: "sobald (-ir -mez), bis (-ene kadar), als, falls",
    pattern:
      "sobald 'yapar yapmaz', bis 'yapana kadar', als 'geçmişte … -dığında', falls 'eğer … -se' anlamında yan cümle açar; çekimli fiil en sona gider. Yan cümle başta ise ana cümle fiille başlar: Sobald ich zu Hause bin, ruf ich dich an.",
    examples: ["Ich ruf dich zurück, sobald ich zu Hause bin.", "Gehen Sie geradeaus, bis Sie zur Kirche kommen."],
    turkishTip: "'Eve varır varmaz' → sobald ich zu Hause bin; 'kiliseye gelene kadar' → bis Sie zur Kirche kommen.",
  },
  partikeln: {
    title: "Konuşma parçacıkları: doch, mal, ja, halt, eben",
    pattern:
      "Bu küçük kelimeler cümlenin anlamını değil tonunu değiştirir: doch ve mal ricayı yumuşatır ya da teşvik eder (Komm doch mal her!), ja bilinen bir şeyi vurgular, halt ve eben kabullenmeyi gösterir (Das ist halt so).",
    examples: ["Komm doch mal her!", "Das weiß ich ja schon.", "Das ist halt so."],
    turkishTip: "Türkçedeki 'bi, -sene, ya, işte, zaten' gibi kelimeler bu parçacıklara karşılık gelir: 'Bi gelsene!' → Komm doch mal!",
  },
  nominalstil: {
    title: "Resmî dil ve isimleştirme",
    pattern:
      "Resmî yazıda fiiller isimleştirilir ve Genitiv sık kullanılır: das Projekt durchführen → die Durchführung des Projekts. Edilgen yapılar ve erfolgen gibi fiiller tercih edilir.",
    examples: ["Die Umsetzung des Projekts wurde verschoben.", "Die Zahlung erfolgt bis Freitag."],
  },
  "so-sehr-auch": {
    title: "so sehr … auch / egal, …",
    pattern:
      "'Ne kadar … -sa da' anlamında so sehr … auch, 'ne olursa olsun' anlamında egal, was … kullanılır. Bu yan cümlelerden sonra ana cümle normal sırayla başlayabilir.",
    examples: ["So sehr er sich auch bemühte, er schaffte es nicht.", "Egal, was passiert, ich komme morgen."],
  },
};

export function ruleInfo(id: string | undefined): (RuleInfo & { turkishTip: string | null }) | null {
  const r = id ? RULES[id] : undefined;
  return r && id ? { id, title: r.title, pattern: r.pattern, examples: r.examples, turkishTip: r.turkishTip ?? null } : null;
}

/** Rules practiced by each topic; used when a sentence carries no rule annotations of its own. */
export const TOPIC_RULES: Record<string, string[]> = {
  "a1-sein-haben": ["sein", "haben"],
  "a1-praesens": ["praesens", "fahren-gehen"],
  "a1-artikel-akk": ["akkusativ", "artikel"],
  "a1-fragen": ["w-frage", "ja-nein-frage"],
  "a1-negation": ["kein-nicht"],
  "a1-modal": ["modal"],
  "a1-trennbar": ["trennbar"],
  "a1-zeit": ["v2"],
  "a2-perfekt": ["perfekt", "partizip2"],
  "a2-dativ": ["dativ-verben", "gefallen", "dativ-praep", "dativ"],
  "a2-wechsel": ["wechsel"],
  "a2-nebensatz": ["nebensatz", "weil-denn"],
  "a2-reflexiv": ["reflexiv", "freuen-auf-ueber"],
  "a2-vergleich": ["komparativ"],
  "a2-praeteritum": ["praeteritum"],
  "a2-adjektiv": ["adjektiv"],
  "b1-nebensatz": ["nebensatz", "obwohl", "als-wenn", "bevor-nachdem", "damit-umzu"],
  "b1-relativ": ["relativ"],
  "b1-passiv": ["passiv"],
  "b1-konjunktiv": ["konjunktiv2"],
  "b1-praepverben": ["praep-verben"],
  "b1-infinitiv": ["zu-infinitiv", "damit-umzu"],
  "b1-genitiv": ["genitiv"],
  "b1-plusquam": ["plusquam"],
  "b2-konj1": ["konj1"],
  "b2-passiv-modal": ["passiv-modal", "zustandspassiv"],
  "b2-partizip": ["partizip-attr"],
  "b2-nvv": ["nvv"],
  "b2-konnektoren": ["konnektoren2"],
  "b2-konj2-vergangen": ["konj2-vergangen"],
  "c1-redewendungen": ["redewendung", "nebensatz"],
  "c1-partikeln": ["partikeln", "konj2-vergangen"],
  "gk-sohbet": ["indirekte-frage", "nebensatz", "umgang"],
  "gk-tepki": ["dass-gefuehl", "nebensatz", "mir-ist"],
  "gk-plan": ["vorschlag", "statt-zu", "indirekte-frage"],
  "gk-kafe": ["bestellen", "indirekte-frage", "pronomen"],
  "gk-yol": ["indirekte-frage", "zum-zur", "sobald-bis"],
  "gk-telefon": ["zu-infinitiv", "sobald-bis", "nebensatz"],
  "gk-rica": ["bitte-mal", "konj2-vergangen", "dass-gefuehl"],
  "gk-argo": ["umgang", "lust", "statt-zu"],
  "gk-fikir": ["nebensatz", "indirekte-frage", "zu-infinitiv"],
  "c1-register": ["nominalstil"],
  "c1-komplex": ["so-sehr-auch", "partizip-attr", "relativ"],
  "c1-konjunktiv": ["doppelinfinitiv", "konj2-vergangen", "als-ob"],
  "c1-konnektoren": ["konnektoren-c1", "nebensatz"],
  "c1-passiversatz": ["passiversatz", "passiv-modal"],
  "c1-vermutung": ["vermutung", "perfekt"],
};

/** Rules where a mistake is usually about word order. */
export const ORDER_RULES = new Set([
  "v2",
  "nebensatz",
  "weil-denn",
  "obwohl",
  "als-wenn",
  "bevor-nachdem",
  "damit-umzu",
  "trennbar",
  "modal",
  "perfekt",
  "w-frage",
  "ja-nein-frage",
  "relativ",
  "passiv",
  "passiv-modal",
  "konjunktiv2",
  "zu-infinitiv",
  "plusquam",
  "konj1",
  "konnektoren2",
  "vorschlag",
  "bitte-mal",
  "dass-gefuehl",
  "lust",
  "indirekte-frage",
  "statt-zu",
  "sobald-bis",
  "doppelinfinitiv",
  "konnektoren-c1",
  "als-ob",
  "kelime-sirasi",
]);
