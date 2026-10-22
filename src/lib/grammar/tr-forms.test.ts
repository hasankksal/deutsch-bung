import { describe, expect, it } from "vitest";
import { PERSONS } from "./de";
import {
  abilityQ,
  aorist,
  aorist3,
  abilityCond,
  abilityPast,
  copulaEvid,
  madikca,
  presentEvid,
  aoristQ,
  desire,
  irmez,
  presCond,
  unable,
  whether,
  optativeI,
  optativeWe,
  optativeWeQ,
  aoristCond,
  aoristPast,
  arak,
  condPast,
  cond,
  diktan,
  dik,
  ene,
  evidential,
  futPart,
  futureQ,
  imperative,
  ince,
  ip,
  kase,
  ken,
  madan,
  necessityPast,
  partCase,
  pastCont,
  pastPerfect,
  pastQ,
  poss,
  possCase,
  presPart,
  sana,
  tv,
  verbNoun,
} from "./tr";

const git = tv("git", "gid");
const oku = tv("oku");
const gel = tv("gel");
const yap = tv("yap");
const ye = tv("ye");
const yardim = tv("yardım et", "yardım ed");
const calis = tv("çalış");
const ol = tv("ol");

const all = (f: (p: (typeof PERSONS)[number]) => string) => PERSONS.map(f);

describe("Turkish forms for complex sentences", () => {
  it("aorist", () => {
    expect([git, oku, gel, yap, ye, yardim, calis, ol, tv("kalk"), tv("al"), tv("bin")].map(aorist3)).toEqual([
      "gider",
      "okur",
      "gelir",
      "yapar",
      "yer",
      "yardım eder",
      "çalışır",
      "olur",
      "kalkar",
      "alır",
      "biner",
    ]);
    expect(all((p) => aorist(git, p))).toEqual(["giderim", "gidersin", "gider", "gideriz", "gidersiniz", "giderler"]);
    expect(all((p) => aorist(oku, p, true))).toEqual(["okumam", "okumazsın", "okumaz", "okumayız", "okumazsınız", "okumazlar"]);
    expect(all((p) => aoristPast(oku, p))).toEqual(["okurdum", "okurdun", "okurdu", "okurduk", "okurdunuz", "okurlardı"]);
  });

  it("past continuous, evidential and past perfect", () => {
    expect(all((p) => pastCont(git, p))).toEqual(["gidiyordum", "gidiyordun", "gidiyordu", "gidiyorduk", "gidiyordunuz", "gidiyorlardı"]);
    expect(all((p) => evidential(yap, p))).toEqual(["yapmışım", "yapmışsın", "yapmış", "yapmışız", "yapmışsınız", "yapmışlar"]);
    expect(all((p) => pastPerfect(git, p))).toEqual(["gitmiştim", "gitmiştin", "gitmişti", "gitmiştik", "gitmiştiniz", "gitmişlerdi"]);
    expect(pastPerfect(oku, "3pl")).toBe("okumuşlardı");
  });

  it("conditionals", () => {
    expect(all((p) => cond(calis, p))).toEqual(["çalışsam", "çalışsan", "çalışsa", "çalışsak", "çalışsanız", "çalışsalar"]);
    expect(all((p) => condPast(ol, p))).toEqual(["olsaydım", "olsaydın", "olsaydı", "olsaydık", "olsaydınız", "olsalardı"]);
    expect(condPast(git, "1sg", true)).toBe("gitmeseydim");
    expect(all((p) => aoristCond(gel, p))).toEqual(["gelirsem", "gelirsen", "gelirse", "gelirsek", "gelirseniz", "gelirlerse"]);
    expect(aoristCond(ol, "3sg", true)).toBe("olmazsa");
    expect(all((p) => necessityPast(tv("kalk"), p))).toEqual(["kalkmalıydım", "kalkmalıydın", "kalkmalıydı", "kalkmalıydık", "kalkmalıydınız", "kalkmalıydılar"]);
  });

  it("questions", () => {
    expect(abilityQ(tv("ara"), "2sg")).toBe("arayabilir misin");
    expect(abilityQ(gel, "3pl")).toBe("gelebilirler mi");
    expect(pastQ(git, "2pl")).toBe("gittiniz mi");
    expect(pastQ(oku, "3pl")).toBe("okudular mı");
    expect(futureQ(gel, "2sg")).toBe("gelecek misin");
    expect(futureQ(oku, "3pl")).toBe("okuyacaklar mı");
  });

  it("possessives and cases", () => {
    expect(all((p) => poss("anne", p))).toEqual(["annem", "annen", "annesi", "annemiz", "anneniz", "anneleri"]);
    expect(all((p) => poss("kitap", p, "kitab"))).toEqual(["kitabım", "kitabın", "kitabı", "kitabımız", "kitabınız", "kitapları"]);
    expect(all((p) => possCase("anne", p, "acc"))).toEqual(["annemi", "anneni", "annesini", "annemizi", "annenizi", "annelerini"]);
    expect(all((p) => possCase("kardeş", p, "dat"))).toEqual(["kardeşime", "kardeşine", "kardeşine", "kardeşimize", "kardeşinize", "kardeşlerine"]);
    expect(possCase("anne", "3sg", "ins")).toBe("annesiyle");
    expect([poss("telefon", "3pl"), possCase("telefon", "3pl", "dat"), poss("okul", "3pl")]).toEqual(["telefonları", "telefonlarına", "okulları"]);
    expect(kase("ev", "dat")).toBe("eve");
    expect(kase("park", "loc")).toBe("parkta");
    expect(kase("Berlin", "dat")).toBe("Berlin'e");
    expect(kase("Ali", "acc")).toBe("Ali'yi");
    expect(kase("kitap", "acc", false, "kitab")).toBe("kitabı");
  });

  it("participles and verbal nouns", () => {
    expect(all((p) => dik(git, p))).toEqual(["gittiğim", "gittiğin", "gittiği", "gittiğimiz", "gittiğiniz", "gittikleri"]);
    expect(all((p) => dik(oku, p))).toEqual(["okuduğum", "okuduğun", "okuduğu", "okuduğumuz", "okuduğunuz", "okudukları"]);
    expect(dik(gel, "1sg", true)).toBe("gelmediğim");
    expect(dik(yardim, "3sg")).toBe("yardım ettiği");
    expect(all((p) => partCase(dik(gel, p), p, "loc"))).toEqual(["geldiğimde", "geldiğinde", "geldiğinde", "geldiğimizde", "geldiğinizde", "geldiklerinde"]);
    expect(all((p) => partCase(dik(gel, p), p, "acc"))).toEqual(["geldiğimi", "geldiğini", "geldiğini", "geldiğimizi", "geldiğinizi", "geldiklerini"]);
    expect(all((p) => futPart(git, p))).toEqual(["gideceğim", "gideceğin", "gideceği", "gideceğimiz", "gideceğiniz", "gidecekleri"]);
    expect(futPart(oku, "3pl")).toBe("okuyacakları");
    expect(all((p) => possCase(verbNoun(git), p, "dat"))).toEqual(["gitmeme", "gitmene", "gitmesine", "gitmemize", "gitmenize", "gitmelerine"]);
    expect(possCase(verbNoun(oku, true), "3sg", "dat")).toBe("okumamasına");
    expect(kase(verbNoun(tv("ara")), "dat")).toBe("aramaya");
  });

  it("converbs and imperatives", () => {
    expect([git, oku, ye, yardim].map(madan)).toEqual(["gitmeden", "okumadan", "yemeden", "yardım etmeden"]);
    expect([git, oku, tv("kalk"), ye].map(diktan)).toEqual(["gittikten", "okuduktan", "kalktıktan", "yedikten"]);
    expect([git, oku].map((v) => ken(v))).toEqual(["giderken", "okurken"]);
    expect([git, oku, ye].map(arak)).toEqual(["giderek", "okuyarak", "yiyerek"]);
    expect([git, oku, gel, ye].map(ince)).toEqual(["gidince", "okuyunca", "gelince", "yiyince"]);
    expect([git, oku].map(ip)).toEqual(["gidip", "okuyup"]);
    expect([git, oku].map(ene)).toEqual(["gidene", "okuyana"]);
    expect([tv("oyna"), tv("bekle"), tv("gül"), tv("çalış")].map(presPart)).toEqual(["oynayan", "bekleyen", "gülen", "çalışan"]);
    expect([sana(tv("ara")), sana(gel), sana(tv("ara"), true), sana(gel, true)]).toEqual(["arasana", "gelsene", "arasanıza", "gelsenize"]);
    expect([imperative(git), imperative(git, true), imperative(oku, true), imperative(yardim, true)]).toEqual(["git", "gidin", "okuyun", "yardım edin"]);
  });

  it("everyday speech forms", () => {
    expect([git, oku, yardim, ye, tv("yap")].map(optativeWe)).toEqual(["gidelim", "okuyalım", "yardım edelim", "yiyelim", "yapalım"]);
    expect([optativeWeQ(git), optativeWeQ(oku)]).toEqual(["gidelim mi", "okuyalım mı"]);
    expect([tv("al"), git, oku].map(optativeI)).toEqual(["alayım", "gideyim", "okuyayım"]);
    expect([aoristQ(tv("aç"), "2sg"), aoristQ(yardim, "2pl"), aoristQ(gel, "2sg"), aoristQ(oku, "2sg")]).toEqual([
      "açar mısın",
      "yardım eder misiniz",
      "gelir misin",
      "okur musun",
    ]);
    expect([desire(git, "1sg"), desire(calis, "1sg"), desire(tv("kalk"), "1pl"), desire(oku, "3sg")]).toEqual(["gidesim", "çalışasım", "kalkasımız", "okuyası"]);
  });

  it("advanced spoken forms", () => {
    expect([gel, tv("var"), tv("çık"), yardim, tv("bin")].map(irmez)).toEqual(["gelir gelmez", "varır varmaz", "çıkar çıkmaz", "yardım eder etmez", "biner binmez"]);
    expect([gel, oku, git, ye, yardim].map((v) => unable(v).stem)).toEqual(["geleme", "okuyama", "gideme", "yiyeme", "yardım edeme"]);
    expect(all((p) => whether(git, p, "fut"))).toEqual([
      "gidip gitmeyeceğimi",
      "gidip gitmeyeceğini",
      "gidip gitmeyeceğini",
      "gidip gitmeyeceğimizi",
      "gidip gitmeyeceğinizi",
      "gidip gitmeyeceklerini",
    ]);
    expect(whether(gel, "2sg", "able")).toBe("gelip gelemeyeceğini");
    expect(whether(tv("al"), "3sg", "able", "dat")).toBe("alıp alamayacağına");
    expect(whether(yardim, "3sg", "past")).toBe("yardım edip etmediğini");
    expect(whether(tv("ol"), "3sg", "past")).toBe("olup olmadığını");
    expect(whether(tv("kahvaltı et", "kahvaltı ed"), "1sg", "past")).toBe("kahvaltı edip etmediğimi");
    expect(all((p) => abilityCond(tv("al"), p))).toEqual(["alabilirsem", "alabilirsen", "alabilirse", "alabilirsek", "alabilirseniz", "alabilirlerse"]);
    expect(abilityCond(gel, "2sg")).toBe("gelebilirsen");
    expect(all((p) => presCond(tv("dizi izle"), p))).toEqual(["dizi izliyorsam", "dizi izliyorsan", "dizi izliyorsa", "dizi izliyorsak", "dizi izliyorsanız", "dizi izliyorlarsa"]);
    expect(presCond(tv("kahvaltı et", "kahvaltı ed"), "2sg", true)).toBe("kahvaltı etmiyorsan");
  });

  it("C1 forms", () => {
    expect([tv("al"), gel, yardim, oku].map(madikca)).toEqual(["almadıkça", "gelmedikçe", "yardım etmedikçe", "okumadıkça"]);
    expect(all((p) => abilityPast(tv("ara"), p))).toEqual(["arayabilirdim", "arayabilirdin", "arayabilirdi", "arayabilirdik", "arayabilirdiniz", "arayabilirlerdi"]);
    expect(all((p) => presentEvid(tv("bil"), p))).toEqual(["biliyormuşum", "biliyormuşsun", "biliyormuş", "biliyormuşuz", "biliyormuşsunuz", "biliyorlarmış"]);
    expect([copulaEvid("patron", "3sg"), copulaEvid("hasta", "2sg"), copulaEvid("zengin", "1pl"), copulaEvid("yorgun", "3pl")]).toEqual(["patronmuş", "hastaymışsın", "zenginmişiz", "yorgunmuşlar"]);
  });
});

