import type { Level } from "../types";

// Built-in material for "Dinle & Yaz". The dialogues are written for this site; the poems and
// the folk song are old enough to be in the public domain (authors died more than 70 years ago).

export type SceneKind = "sahne" | "siir" | "sarki";

export interface SceneLine {
  de: string;
  tr: string;
  /** Who says it (dialogues only) */
  speaker?: string;
}

export interface Scene {
  id: string;
  kind: SceneKind;
  title: string;
  /** One line about the scene, in Turkish */
  blurb: string;
  level: Level;
  /** Author and year for the public-domain texts */
  source?: string;
  lines: SceneLine[];
}

export const KIND_LABEL: Record<SceneKind, string> = { sahne: "Sahne", siir: "Şiir", sarki: "Halk şarkısı" };

export const SCENES: Scene[] = [
  {
    id: "verhoer",
    kind: "sahne",
    title: "Das Verhör",
    blurb: "Sorgu odası: komiser şüphelinin alibisini söküyor.",
    level: "B2",
    lines: [
      { speaker: "Kommissarin", de: "Sie waren also die ganze Nacht zu Hause, ja?", tr: "Demek bütün gece evdeydiniz, öyle mi?" },
      { speaker: "Verdächtiger", de: "Hab ich doch schon dreimal gesagt.", tr: "Üç kere söyledim ya zaten." },
      { speaker: "Kommissarin", de: "Komisch, Ihr Handy war um zwei Uhr am Hafen.", tr: "Tuhaf, telefonunuz saat ikide limandaymış." },
      { speaker: "Verdächtiger", de: "Dann hat's halt jemand geklaut.", tr: "O zaman biri çalmıştır işte." },
      { speaker: "Kommissarin", de: "Und zurückgebracht, bevor Sie aufgewacht sind?", tr: "Siz uyanmadan da geri mi getirmiş?" },
      { speaker: "Verdächtiger", de: "Was weiß ich, vielleicht war's ein ordentlicher Dieb.", tr: "Ne bileyim, belki düzenli bir hırsızdır." },
      { speaker: "Kommissarin", de: "Wissen Sie, was ich glaube? Dass Sie mir etwas verschweigen.", tr: "Ne düşünüyorum biliyor musunuz? Benden bir şey sakladığınızı." },
      { speaker: "Verdächtiger", de: "Ohne meinen Anwalt sag ich gar nichts mehr.", tr: "Avukatım olmadan artık tek kelime etmem." },
    ],
  },
  {
    id: "letzte-ubahn",
    kind: "sahne",
    title: "Die letzte U-Bahn",
    blurb: "Gece yarısı metroda iki yabancı.",
    level: "B1",
    lines: [
      { speaker: "Lukas", de: "Entschuldigung, ist hier noch frei?", tr: "Pardon, burası boş mu?" },
      { speaker: "Elif", de: "Klar, setz dich ruhig. Fährst du auch bis zur Endstation?", tr: "Tabii, rahatça otur. Sen de son durağa kadar mı gidiyorsun?" },
      { speaker: "Lukas", de: "Eigentlich hätte ich schon längst aussteigen müssen.", tr: "Aslında çoktan inmem gerekiyordu." },
      { speaker: "Elif", de: "Und warum bist du dann noch hier?", tr: "O zaman neden hâlâ buradasın?" },
      { speaker: "Lukas", de: "Weil ich mich nicht getraut habe, dich anzusprechen.", tr: "Çünkü seninle konuşmaya cesaret edemedim." },
      { speaker: "Elif", de: "Na ja, jetzt hast du es ja geschafft.", tr: "Eh, işte şimdi başardın." },
      { speaker: "Lukas", de: "Darf ich dich wenigstens auf einen Kaffee einladen?", tr: "Seni en azından bir kahveye davet edebilir miyim?" },
      { speaker: "Elif", de: "Um Mitternacht? Du bist echt verrückt. Aber gut, warum nicht.", tr: "Gece yarısı mı? Sen gerçekten delisin. Ama tamam, neden olmasın." },
    ],
  },
  {
    id: "coup",
    kind: "sahne",
    title: "Der Coup",
    blurb: "Soygundan dört dakika önce ekip son kez konuşuyor.",
    level: "B2",
    lines: [
      { speaker: "Boss", de: "Hört zu, wir haben genau vier Minuten, bis der Alarm losgeht.", tr: "Dinleyin, alarm çalana kadar tam dört dakikamız var." },
      { speaker: "Lena", de: "Und wenn die Kameras nicht ausfallen?", tr: "Ya kameralar devre dışı kalmazsa?" },
      { speaker: "Boss", de: "Dann brechen wir ab, ohne Diskussion.", tr: "O zaman tartışmasız vazgeçeriz." },
      { speaker: "Mo", de: "Ich hab doch gesagt, dass der Plan zu riskant ist.", tr: "Planın fazla riskli olduğunu söylemiştim ama." },
      { speaker: "Boss", de: "Wer kalte Füße kriegt, kann jetzt noch gehen.", tr: "Kimin korkup vazgeçesi geldiyse hâlâ gidebilir." },
      { speaker: "Lena", de: "Niemand geht. Wir ziehen das durch.", tr: "Kimse gitmiyor. Bunu sonuna kadar götürüyoruz." },
      { speaker: "Mo", de: "Na schön, aber wenn das schiefgeht, bin ich weg.", tr: "Peki, ama işler ters giderse ben yokum." },
      { speaker: "Boss", de: "Wenn das schiefgeht, sind wir alle weg. Los jetzt!", tr: "İşler ters giderse hepimiz yokuz. Hadi şimdi!" },
    ],
  },
  {
    id: "chef",
    kind: "sahne",
    title: "Beim Chef",
    blurb: "Patron odasına çağrıldın; kovuluyor musun?",
    level: "B2",
    lines: [
      { speaker: "Chef", de: "Setzen Sie sich. Wir müssen über das Projekt reden.", tr: "Oturun. Proje hakkında konuşmamız lazım." },
      { speaker: "Ayşe", de: "Falls es um die Verspätung geht, das lag nicht an meinem Team.", tr: "Eğer konu gecikmeyse, bu benim ekibimden kaynaklanmadı." },
      { speaker: "Chef", de: "Niemand macht Ihnen Vorwürfe. Im Gegenteil.", tr: "Kimse sizi suçlamıyor. Tam tersine." },
      { speaker: "Ayşe", de: "Wie bitte? Ich dachte, ich fliege raus.", tr: "Efendim? Kovulacağımı sanmıştım." },
      { speaker: "Chef", de: "Wir möchten, dass Sie die Abteilung übernehmen.", tr: "Departmanı sizin devralmanızı istiyoruz." },
      { speaker: "Ayşe", de: "Damit hätte ich jetzt am allerwenigsten gerechnet.", tr: "Şu an en son bunu beklerdim." },
      { speaker: "Chef", de: "Lassen Sie sich ruhig Zeit mit der Entscheidung.", tr: "Karar için acele etmeyin." },
      { speaker: "Ayşe", de: "Nicht nötig. Ich mach's.", tr: "Gerek yok. Yapıyorum." },
    ],
  },
  {
    id: "funkstille",
    kind: "sahne",
    title: "Funkstille",
    blurb: "Uzay gemisi, kopan telsiz ve bir rulo bant.",
    level: "B2",
    lines: [
      { speaker: "Kapitänin", de: "Bodenstation, hören Sie mich? Bitte kommen.", tr: "Yer istasyonu, beni duyuyor musunuz? Lütfen cevap verin." },
      { speaker: "Pilot", de: "Seit drei Stunden kein Signal. Irgendetwas stimmt hier nicht.", tr: "Üç saattir sinyal yok. Burada bir şeyler ters." },
      { speaker: "Kapitänin", de: "Der Sauerstoff reicht noch für zwei Tage, wenn wir sparsam sind.", tr: "Tutumlu olursak oksijen iki gün daha yeter." },
      { speaker: "Pilot", de: "Und wenn uns niemand findet?", tr: "Ya kimse bizi bulmazsa?" },
      { speaker: "Kapitänin", de: "Dann reparieren wir das Ding eben selbst.", tr: "O zaman bu şeyi kendimiz tamir ederiz, o kadar." },
      { speaker: "Pilot", de: "Mit einem Schraubenzieher und einer Rolle Klebeband?", tr: "Bir tornavida ve bir rulo bantla mı?" },
      { speaker: "Kapitänin", de: "Hast du eine bessere Idee? Ich bin ganz Ohr.", tr: "Daha iyi bir fikrin mi var? Can kulağıyla dinliyorum." },
      { speaker: "Pilot", de: "Nein. Gib mir das Klebeband.", tr: "Yok. Ver şu bandı." },
    ],
  },
  {
    id: "wg",
    kind: "sahne",
    title: "WG-Krieg",
    blurb: "Ev arkadaşları ve kaybolan bir yoğurt.",
    level: "GK",
    lines: [
      { speaker: "Jonas", de: "Sag mal, wer hat schon wieder meinen Joghurt gegessen?", tr: "Baksana, kim yine yoğurdumu yedi?" },
      { speaker: "Mia", de: "Keine Ahnung, ich war's jedenfalls nicht.", tr: "Hiç bilmiyorum, en azından ben değildim." },
      { speaker: "Jonas", de: "Komisch, dein Löffel liegt aber noch in der Spüle.", tr: "Tuhaf, ama senin kaşığın hâlâ lavaboda duruyor." },
      { speaker: "Mia", de: "Okay, erwischt. Ich kauf dir morgen einen neuen.", tr: "Tamam, yakalandım. Yarın sana yenisini alırım." },
      { speaker: "Jonas", de: "Das sagst du jedes Mal, und dann passiert gar nichts.", tr: "Bunu her seferinde söylüyorsun, sonra hiçbir şey olmuyor." },
      { speaker: "Mia", de: "Jetzt reg dich doch nicht so auf, ist doch nur ein Joghurt.", tr: "Bu kadar sinirlenme ama, alt tarafı bir yoğurt." },
      { speaker: "Jonas", de: "Es geht ums Prinzip!", tr: "Mesele prensip meselesi!" },
      { speaker: "Mia", de: "Na gut, dann putz ich halt diese Woche das Bad. Zufrieden?", tr: "Peki, o zaman bu hafta banyoyu ben temizlerim. Memnun musun?" },
    ],
  },
  {
    id: "erlkoenig",
    kind: "siir",
    title: "Erlkönig",
    blurb: "Gece, rüzgâr ve babasının kucağında korkan bir çocuk.",
    level: "C1",
    source: "Johann Wolfgang von Goethe, 1782",
    lines: [
      { de: "Wer reitet so spät durch Nacht und Wind?", tr: "Gecede, rüzgârda bu saatte kim at sürüyor?" },
      { de: "Es ist der Vater mit seinem Kind;", tr: "Çocuğuyla birlikte bir baba bu;" },
      { de: "Er hat den Knaben wohl in dem Arm,", tr: "Oğlanı kolunun arasında tutuyor," },
      { de: "Er fasst ihn sicher, er hält ihn warm.", tr: "Sıkıca kavrıyor, onu sıcak tutuyor." },
      { de: "Mein Sohn, was birgst du so bang dein Gesicht?", tr: "Oğlum, neden yüzünü böyle korkuyla saklıyorsun?" },
      { de: "Siehst, Vater, du den Erlkönig nicht?", tr: "Baba, Erlkönig'i görmüyor musun?" },
      { de: "Den Erlenkönig mit Kron und Schweif?", tr: "Tacı ve kuyruğuyla Kızılağaç Kralı'nı?" },
      { de: "Mein Sohn, es ist ein Nebelstreif.", tr: "Oğlum, o bir sis şeridi." },
      { de: "Du liebes Kind, komm, geh mit mir!", tr: "Sevgili çocuk, gel, benimle gel!" },
      { de: "Gar schöne Spiele spiel ich mit dir;", tr: "Seninle çok güzel oyunlar oynarım;" },
      { de: "Manch bunte Blumen sind an dem Strand,", tr: "Kıyıda rengârenk çiçekler var," },
      { de: "Meine Mutter hat manch gülden Gewand.", tr: "Annemin nice altın giysisi var." },
    ],
  },
  {
    id: "loreley",
    kind: "siir",
    title: "Die Loreley",
    blurb: "Ren'in üstündeki kayada saçlarını tarayan kız.",
    level: "C1",
    source: "Heinrich Heine, 1824",
    lines: [
      { de: "Ich weiß nicht, was soll es bedeuten,", tr: "Bilmiyorum, ne anlama geliyor," },
      { de: "Dass ich so traurig bin;", tr: "Bu kadar hüzünlü olmam;" },
      { de: "Ein Märchen aus alten Zeiten,", tr: "Eski zamanlardan bir masal" },
      { de: "Das kommt mir nicht aus dem Sinn.", tr: "Aklımdan hiç çıkmıyor." },
      { de: "Die Luft ist kühl und es dunkelt,", tr: "Hava serin, ortalık kararıyor," },
      { de: "Und ruhig fließt der Rhein;", tr: "Ren sakince akıyor;" },
      { de: "Der Gipfel des Berges funkelt", tr: "Dağın zirvesi parıldıyor" },
      { de: "Im Abendsonnenschein.", tr: "Akşam güneşinin ışığında." },
      { de: "Die schönste Jungfrau sitzet", tr: "En güzel genç kız oturuyor" },
      { de: "Dort oben wunderbar,", tr: "Orada, yukarıda, büyüleyici," },
      { de: "Ihr goldnes Geschmeide blitzet,", tr: "Altın takıları parlıyor," },
      { de: "Sie kämmt ihr goldenes Haar.", tr: "Altın saçlarını tarıyor." },
    ],
  },
  {
    id: "mondnacht",
    kind: "siir",
    title: "Mondnacht",
    blurb: "Baştan sona Konjunktiv: sanki gök yeri öpmüş gibi.",
    level: "C1",
    source: "Joseph von Eichendorff, 1837",
    lines: [
      { de: "Es war, als hätt der Himmel", tr: "Sanki gökyüzü" },
      { de: "Die Erde still geküsst,", tr: "Yeryüzünü sessizce öpmüştü," },
      { de: "Dass sie im Blütenschimmer", tr: "Öyle ki o, çiçeklerin parıltısında" },
      { de: "Von ihm nur träumen müsst.", tr: "Yalnızca onu düşlemek zorundaydı." },
      { de: "Die Luft ging durch die Felder,", tr: "Rüzgâr tarlaların arasından geçti," },
      { de: "Die Ähren wogten sacht,", tr: "Başaklar usulca dalgalandı," },
      { de: "Es rauschten leis die Wälder,", tr: "Ormanlar hafifçe hışırdadı," },
      { de: "So sternklar war die Nacht.", tr: "Gece öyle yıldızlıydı ki." },
      { de: "Und meine Seele spannte", tr: "Ve ruhum" },
      { de: "Weit ihre Flügel aus,", tr: "Kanatlarını genişçe açtı," },
      { de: "Flog durch die stillen Lande,", tr: "Sessiz diyarların üstünden uçtu," },
      { de: "Als flöge sie nach Haus.", tr: "Sanki eve uçuyormuş gibi." },
    ],
  },
  {
    id: "nachtlied",
    kind: "siir",
    title: "Wandrers Nachtlied",
    blurb: "Almancanın belki de en ünlü sekiz dizesi.",
    level: "B2",
    source: "Johann Wolfgang von Goethe, 1780",
    lines: [
      { de: "Über allen Gipfeln ist Ruh,", tr: "Bütün dorukların üstünde sükûnet var," },
      { de: "In allen Wipfeln spürest du kaum einen Hauch;", tr: "Ağaçların tepelerinde bir esinti bile zor hissedersin;" },
      { de: "Die Vögelein schweigen im Walde.", tr: "Küçük kuşlar ormanda susuyor." },
      { de: "Warte nur, balde ruhest du auch.", tr: "Bekle yalnızca, yakında sen de dinleneceksin." },
    ],
  },
  {
    id: "gedanken",
    kind: "sarki",
    title: "Die Gedanken sind frei",
    blurb: "Yüzyıllardır söylenen bir özgürlük şarkısı.",
    level: "B1",
    source: "Halk şarkısı, 1800 dolayları",
    lines: [
      { de: "Die Gedanken sind frei,", tr: "Düşünceler özgürdür," },
      { de: "Wer kann sie erraten?", tr: "Kim tahmin edebilir onları?" },
      { de: "Sie fliehen vorbei", tr: "Geçip kaçarlar" },
      { de: "Wie nächtliche Schatten.", tr: "Gece gölgeleri gibi." },
      { de: "Kein Mensch kann sie wissen,", tr: "Hiçbir insan onları bilemez," },
      { de: "Kein Jäger erschießen", tr: "Hiçbir avcı vuramaz" },
      { de: "Mit Pulver und Blei:", tr: "Barutla, kurşunla:" },
      { de: "Die Gedanken sind frei!", tr: "Düşünceler özgürdür!" },
    ],
  },
  {
    id: "abendlied",
    kind: "sarki",
    title: "Der Mond ist aufgegangen",
    blurb: "Almanların ninni gibi bildiği akşam şarkısı.",
    level: "B2",
    source: "Matthias Claudius, 1779",
    lines: [
      { de: "Der Mond ist aufgegangen,", tr: "Ay doğdu," },
      { de: "Die goldnen Sternlein prangen", tr: "Altın yıldızcıklar parıldıyor" },
      { de: "Am Himmel hell und klar;", tr: "Gökyüzünde aydınlık ve berrak;" },
      { de: "Der Wald steht schwarz und schweiget,", tr: "Orman kapkara duruyor ve susuyor," },
      { de: "Und aus den Wiesen steiget", tr: "Ve çayırlardan yükseliyor" },
      { de: "Der weiße Nebel wunderbar.", tr: "Beyaz sis, büyüleyici." },
    ],
  },
];

export function sceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
