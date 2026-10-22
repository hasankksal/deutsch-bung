import { describe, expect, it } from "vitest";
import { adjForm, determiner, n, np, PERSONS, pp, present, V, zuInf } from "./de";
import { ability, copula, copulaPast, future, inabilityPast, inabilityPresent, infinitive, necessity, past, present as trPresent, presentQ, tv } from "./tr";

describe("German verbs", () => {
  const table = (v: (typeof V)[keyof typeof V]) => PERSONS.map((p) => present(v, p)).join(" ");

  it("conjugates regular verbs", () => {
    expect(table(V.lernen)).toBe("lerne lernst lernt lernen lernt lernen");
    expect(table(V.arbeiten)).toBe("arbeite arbeitest arbeitet arbeiten arbeitet arbeiten");
    expect(table(V.oeffnen)).toBe("öffne öffnest öffnet öffnen öffnet öffnen");
    expect(table(V.reisen)).toBe("reise reist reist reisen reist reisen");
    expect(table(V.kommen)).toBe("komme kommst kommt kommen kommt kommen");
    expect(table(V.wohnen)).toBe("wohne wohnst wohnt wohnen wohnt wohnen");
  });

  it("conjugates stem-changing and irregular verbs", () => {
    expect(table(V.fahren)).toBe("fahre fährst fährt fahren fahrt fahren");
    expect(table(V.helfen)).toBe("helfe hilfst hilft helfen helft helfen");
    expect(table(V.einladen)).toBe("lade lädst lädt laden ladet laden");
    expect(table(V.sein)).toBe("bin bist ist sind seid sind");
    expect(table(V.koennen)).toBe("kann kannst kann können könnt können");
  });

  it("builds zu-infinitives", () => {
    expect(zuInf(V.lernen)).toBe("zu lernen");
    expect(zuInf(V.aufstehen)).toBe("aufzustehen");
    expect(zuInf(V.anrufen)).toBe("anzurufen");
  });
});

describe("German noun phrases", () => {
  const vater = n("Vater", "m", "Väter");
  const mutter = n("Mutter", "f", "Mütter");
  const auto = n("Auto", "n", "Autos");
  const kind = n("Kind", "n", "Kinder");
  const nachbar = n("Nachbar", "m", "Nachbarn", { weak: "Nachbarn" });
  const regen = n("Regen", "m", undefined, { gen: "Regens" });

  it("declines articles and possessives", () => {
    expect(np({ det: "mein", noun: vater }, "dat")).toBe("meinem Vater");
    expect(np({ det: "mein", noun: mutter }, "dat")).toBe("meiner Mutter");
    expect(np({ det: "mein", noun: vater }, "akk")).toBe("meinen Vater");
    expect(np({ det: "def", noun: kind, plural: true }, "dat")).toBe("den Kindern");
    expect(np({ det: "def", noun: auto, plural: true }, "dat")).toBe("den Autos");
    expect(np({ det: "unser", noun: nachbar }, "dat")).toBe("unserem Nachbarn");
    expect(np({ det: "def", noun: regen }, "gen")).toBe("des Regens");
    expect(determiner("euer", "dat", "m")).toBe("eurem");
    expect(determiner("euer", "nom", "m")).toBe("euer");
  });

  it("declines adjectives", () => {
    const neu = { base: "neu" };
    expect(np({ det: "ein", adj: neu, noun: auto }, "akk")).toBe("ein neues Auto");
    expect(np({ det: "ein", adj: neu, noun: vater }, "akk")).toBe("einen neuen Vater");
    expect(np({ det: "def", adj: neu, noun: mutter }, "nom")).toBe("die neue Mutter");
    expect(np({ det: "mein", adj: neu, noun: auto }, "dat")).toBe("meinem neuen Auto");
    expect(np({ det: "none", adj: { base: "kalt" }, noun: n("Wasser", "n") }, "nom")).toBe("kaltes Wasser");
    expect(adjForm({ base: "teuer", stem: "teur" }, "ein", "nom", "n")).toBe("teures");
  });

  it("contracts prepositions", () => {
    expect(pp("in", { det: "def", noun: n("Park", "m") }, "dat")).toBe("im Park");
    expect(pp("in", { det: "def", noun: n("Park", "m") }, "akk")).toBe("in den Park");
    expect(pp("in", { det: "def", noun: n("Kino", "n") }, "akk")).toBe("ins Kino");
    expect(pp("zu", { det: "def", noun: n("Arbeit", "f") }, "dat")).toBe("zur Arbeit");
    expect(pp("an", { det: "def", noun: n("Wand", "f") }, "dat")).toBe("an der Wand");
  });
});

describe("Turkish verbs", () => {
  const forms = (f: (p: (typeof PERSONS)[number]) => string) => PERSONS.map(f).join(" ");

  it("present continuous", () => {
    expect(forms((p) => trPresent(tv("git", "gid"), p))).toBe("gidiyorum gidiyorsun gidiyor gidiyoruz gidiyorsunuz gidiyorlar");
    expect(trPresent(tv("bekle"), "1sg")).toBe("bekliyorum");
    expect(trPresent(tv("oku"), "3sg")).toBe("okuyor");
    expect(trPresent(tv("ara"), "2sg")).toBe("arıyorsun");
    expect(trPresent(tv("söyle"), "3sg")).toBe("söylüyor");
    expect(trPresent(tv("ye"), "1sg")).toBe("yiyorum");
    expect(trPresent(tv("yardım et", "yardım ed"), "1pl")).toBe("yardım ediyoruz");
    expect(trPresent(tv("çalış"), "1sg", true)).toBe("çalışmıyorum");
    expect(trPresent(tv("oku"), "3sg", true)).toBe("okumuyor");
    expect(presentQ(tv("gel"), "2sg")).toBe("geliyor musun");
    expect(presentQ(tv("gel"), "3pl")).toBe("geliyorlar mı");
  });

  it("past, future, necessity, ability", () => {
    expect(forms((p) => past(tv("git", "gid"), p))).toBe("gittim gittin gitti gittik gittiniz gittiler");
    expect(forms((p) => past(tv("oku"), p))).toBe("okudum okudun okudu okuduk okudunuz okudular");
    expect(past(tv("yardım et", "yardım ed"), "1sg")).toBe("yardım ettim");
    expect(past(tv("al"), "3pl")).toBe("aldılar");
    expect(past(tv("gör"), "2pl")).toBe("gördünüz");
    expect(past(tv("git", "gid"), "1sg", true)).toBe("gitmedim");
    expect(past(tv("oku"), "1sg", true)).toBe("okumadım");
    expect(forms((p) => future(tv("git", "gid"), p))).toBe("gideceğim gideceksin gidecek gideceğiz gideceksiniz gidecekler");
    expect(future(tv("oku"), "1sg")).toBe("okuyacağım");
    expect(future(tv("ye"), "1sg")).toBe("yiyeceğim");
    expect(necessity(tv("git", "gid"), "1sg")).toBe("gitmeliyim");
    expect(necessity(tv("oku"), "3pl")).toBe("okumalılar");
    expect(ability(tv("yüz"), "3sg")).toBe("yüzebilir");
    expect(ability(tv("oku"), "1sg")).toBe("okuyabilirim");
    expect(ability(tv("git", "gid"), "2pl")).toBe("gidebilirsiniz");
    expect(inabilityPast(tv("gel"), "1sg")).toBe("gelemedim");
    expect(inabilityPast(tv("oku"), "3sg")).toBe("okuyamadı");
    expect(inabilityPresent(tv("gel"), "1sg")).toBe("gelemiyorum");
    expect(infinitive(tv("oku"))).toBe("okumak");
  });

  it("copula", () => {
    expect(forms((p) => copula("yorgun", p))).toBe("yorgunum yorgunsun yorgun yorgunuz yorgunsunuz yorgunlar");
    expect(copula("hasta", "1sg")).toBe("hastayım");
    expect(copula("mutlu", "1pl")).toBe("mutluyuz");
    expect(copulaPast("yorgun", "1sg")).toBe("yorgundum");
    expect(copulaPast("hasta", "3pl")).toBe("hastaydılar");
    expect(copulaPast("sıcak", "3sg")).toBe("sıcaktı");
  });
});
