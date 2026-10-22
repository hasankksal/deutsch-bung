# Almanca Pratik

Türkçe cümleleri Almancaya çevirerek öğrenme sitesi. Seviyeni ve konunu seçersin, kolu çekersin, gelen cümleyi çevirirsin. Site hatanın nerede ve neden olduğunu gösterir, sonra aynı kuralla yeni bir cümle verip öğrenip öğrenmediğini kontrol eder.

## Özellikler

- **6 seviye:** A1'den C1'e kadar dil bilgisi konuları ve "Günlük": ileri seviye konuşma dili (argo, dolaylı sorular, Konjunktiv, uzun yan cümleler).
- **Sonsuz cümle:** Cümleler kişi, zaman, olay ve bağlaçlardan her seferinde yeniden kurulur; aynı cümleler dönüp durmaz.
- **Hata analizi:** Yanlış kısım cevabının içinde işaretlenir. Her hatanın türü, doğrusu, Türkçe açıklaması ve kural kartı gösterilir.
- **Türklere özel ipuçları:** Türkçe sezgin seni nerede yanıltıyorsa ayrıca belirtilir.
- **Küçük şeyler hata sayılmaz:** Büyük/küçük harf, noktalama, ae/oe/ue yazımı; Günlük seviyesinde hab/habe, wär's gibi kısaltmalar ve mal/doch gibi parçacıklar.
- **Pekiştirme:** Hata yaptığında aynı kuralı soran yeni bir cümle gelir ("Şimdi sıra sende").
- **Tekrar listesi:** Yanlış yaptığın cümleler 1, 3, 7, 14 ve 30 gün sonra geri gelir.
- **Defterim:** Yıldızladığın kelimeleri kartlarla tekrar edersin; Anki için CSV indirebilirsin.
- **İlerleme:** En sık yaptığın hata türleri, konulara göre başarın, günlük hedefin ve serin.
- **Sesli dinleme:** Almanca cümleler tarayıcının kendi sesiyle okunur.

Bütün ilerleme tarayıcının kendi hafızasında (localStorage) saklanır. Hesap, veritabanı ya da sunucu tarafı servis gerekmez.

## Çalıştırma

```bash
npm install
npm run dev
```

Sonra tarayıcıda http://localhost:3000 adresini aç.

## Proje yapısı

```
src/
  app/
    page.tsx            Pratik ekranı
    defter/             Defterim (yıldızlı kelimeler ve cümleler)
    ilerleme/           İlerleme
  components/           Arayüz bileşenleri (slot makinesi, eskiz tasarım)
  lib/
    curriculum.ts       Seviyeler ve konular
    generator/          Cümle şablonları ve hazır cümle bankaları
    grammar/            Almanca ve Türkçe çekim kuralları, kural kartları
    local-grader.ts     Cevap karşılaştırma ve hata açıklama
    store.ts            Tarayıcıda saklanan veriler
```

## Testler

```bash
npm test
```
