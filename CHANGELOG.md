# Changelog

Formāts: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versijas: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versiju numurs atrodas `src/version.js` un `sw.js` — abiem jāsakrīt.

## [Unreleased]

Iecerēts nākamajām versijām:

- Ierunāti vārdi (dzimtās valodas runātāja ieraksti) `assets/audio/en/`
- Īstas ilustrācijas emoji vietā `assets/img/`
- Dziesmas un atskaņas
- Izdrukājamas kartītes vecākiem
- Progresa sinhronizācija starp ierīcēm

## [0.1.0] – 2026-07-30

Pirmā versija. "Pirmais solis".

### Pievienots

- **Divi vecuma režīmi.** 2–4 gadi: īsas spēles, divas atbildes, bez teksta,
  tikai atpazīšana. 5–7 gadi: garākas spēles, četras atbildes, rakstīti vārdi,
  burti un teikumi.
- **Mācību saturs** — 144 vārdi 14 tēmās (sasveicināšanās, dzīvnieki, ēdiens,
  krāsas, ķermenis, ģimene, skaitļi, rotaļlietas, apģērbs, mājas, transports,
  daba, darbības, sajūtas) un 7 teikumu modeļi.
- **Atkārtošanas sistēma** (Leitner) ar atsevišķiem intervāliem katram vecumam.
  Tēma atveras, kad iepriekšējā apgūta 70 % apmērā; vecāki var atvērt jebkuru.
- **Astoņi uzdevumu veidi** — atkārtošanas rituālis, jauna vārda iepazīšana,
  klausies un pieskaries, kustību pauze, burti un skaņas, teikumu papildināšana,
  atmiņas spēle, un izrunas atkārtošana.
- **Draugs (mājdzīvnieks)** — astoņi tēli, izvēlas un nosauc bērns. Reaģē uz
  katru atbildi, rāda priekšā kustības, dod mājienu, guļ starp spēlēm, aug līdz
  ar apgūtajiem vārdiem un valkā nopelnītos aksesuārus.
- **Balvu kartītes** — 27 kartītes (sērijas, apgūtie vārdi, pabeigtas tēmas,
  spēļu skaits). Nenopelnītās ir redzamas kopā ar nosacījumu. Jaunas kartītes
  var pievienot vēlāk — tās atveras ar atpakaļejošu spēku no jau esošās
  vēstures.
- **Uzlīmju grāmata** — viena uzlīme par katru pabeigto spēli.
- **Vecāku sadaļa** (aiz rēķina) — apgūto vārdu skaits, minūtes, spēles, dienu
  sērija, precizitāte, 14 dienu diagramma, precizitātes līkne, tēmu progress,
  vārdu tabula, "vārdi, kam pievērst uzmanību", visi iestatījumi, rezerves
  kopiju eksports/imports un padomi vecākiem.
- **Runa** — pārlūka sintēze ar `en-US` balsi, lēnāku tempu mazākajiem; balsi un
  ātrumu var mainīt. Ja `assets/audio/en/` ir ieraksts, tas tiek lietots.
- **Mikrofons** (pēc izvēles, sākotnēji izslēgts) — bērns var noklausīties savu
  izrunu blakus paraugam. Ieraksts paliek tikai ierīcē un netiek saglabāts.
- **Darbojas bezsaistē** — PWA ar servisa darbinieku; var pievienot sākuma
  ekrānam.
- **Vairāki spēlētāji** — katram bērnam savs progress, draugs un iestatījumi.
- Viss saskarnes teksts latviski; angļu valoda parādās tikai kā mācību saturs.

### Tehniski

- Bez būvēšanas soļa un bez atkarībām: `git push` ir izvietošana.
- 84 automātiskie testi (`node --test`) sedz atkārtošanas sistēmu, uzdevumu
  atlasi, sesijas plānošanu, statistiku, balvas un datu glabāšanu.
- Dati glabājas tikai `localStorage`. Lietotne neveic nevienu tīkla pieprasījumu
  pēc ielādes.

[Unreleased]: https://github.com/Hifistereo/ENG-learning/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Hifistereo/ENG-learning/releases/tag/v0.1.0
