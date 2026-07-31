# Changelog

Formāts: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versijas: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versiju numurs atrodas `src/version.js` un `sw.js` — abiem jāsakrīt.

## [Unreleased]

Iecerēts nākamajām versijām:

- Ierunāti vārdi un atlikušie attēli (skat. `assets/BRIEF.md`)
- Vairāk stāstu un stāstu ainu (`kitchen`, `bedroom`, `garden`, `shop`)
- “Give me two small red apples” — skaitļi un vairāki īpašības vārdi vienā lūgumā
- Izdrukājamas kartītes vecākiem
- Progresa sinhronizācija starp ierīcēm

## [0.3.0] – 2026-07-31

“Viena vieta”. Pārstrādāta spēles sajūta. Mācību pieeja nemainās ne par
milimetru — mainās viss, kas ap to.

Iemesls: lietotne mācīja labi, bet sesijas sākums nejutās kā spēle. Pirmās
minūtes pirms stāsta radīja **satraukumu, nevis prieku**. Četri cēloņi vienā
vietā: pirmā tēma bija “Sasveicināšanās” — vienīgā, kuru nav iespējams uzzīmēt;
katrs uzdevums sākās ar pavēli latviski; ekrāns izskatījās pēc kontroldarba
lapas; un stāsts — labākā daļa — bija 15. no 18 kārtām.

### Mainīts — sesija tagad notiek vienā vietā

- **Visa sesija norisinās vienā ilustrētā ainā**, un draugs stāv tajā iekšā.
  Aina un draugs saglabājas visu apciemojumu — mainās tikai tas, kas tiek
  teikts, un tas, kas atrodas plauktā. **Starp kārtām ekrāns vairs netiek
  nodzēsts.** Iepriekš tas notika 18 reizes vienā sesijā.
- **Angļu teikums pats ir uzdevums.** Bērnam vairs netiek rādīta neviena
  pavēle latviski. “Klausies un pieskaries!”, “Atkārtojam!”, “Saki līdzi!” —
  visas dzēstas. Tagad varonis kaut ko pasaka angliski (“Where is the cat?”),
  un latviskais tulkojums, ja tas ir ieslēgts, atrodas zem tā mazākiem burtiem.
- **Progresa josla noņemta.** Josla, kas lien pāri ekrāna augšai, mazam bērnam
  nozīmē, ka kaut kas beidzas, un pārvērš spēli par daudzumu, kas jāizcieš.
  Bērns uzzina, ka sesija beigusies, kad draugs atvadās.
- **Stāsts vairs nav pielikts beigās** — tas notiek aptuveni divās trešdaļās,
  un aina mainās līdzi tam, kā stāsts virzās (ar pārplūdumu, nevis lēcienu).

### Mainīts — ko un kādā secībā māca

- **Tēmu secība sākas ar dzīvniekiem**: dzīvnieki → ēdiens → mājas → daba →
  rotaļlietas → apģērbs → transports → ķermenis → ģimene → darbības → krāsas →
  sajūtas → skaitļi. Secību nosaka tas, cik labi lietu var uzzīmēt un parādīt
  ar pirkstu. Skaitļi ir pēdējie, jo “trīs” attēls ir vienošanās, kas pašam
  vēl jāiemāca.
- **Sasveicināšanās vairs nav tēma.** `hello`, `bye`, `please`, `thank you`,
  `yes`, `no`, `sorry`, `good night` ir izņemti no vārdu saraksta. Tos nevar
  attēlot bildē (🙋, 👋 un 🙏 ir trīs dzeltenas rokas; ✅ un ❌ ir saskarnes
  simboli), un neviens tos nemācās no kartītes. Tagad **varoņi tos vienkārši
  saka** — katru reizi, kad tiem ir nozīme: sasveicinoties, kaut ko lūdzot un
  saņemot, izlabojot citplanētieti, atvadoties. Netiek pārbaudīti, netiek
  vērtēti, ir dzirdami daudz biežāk nekā agrāk. Vecāku sadaļā par to ir
  paskaidrojums, lai to trūkums tabulā nešķistu zudis progress.

### Pievienots — zīmētie attēli

- **Vēl desmit zīmēti attēli** (kopā 30): `head`, `hair`, `table`, `hungry`,
  `jump`, `wind`, `love`, kā arī `please`, `thankyou` un `sorry`. Pēdējie trīs
  vairs nav atbildes variantiem — tie parādās blakus varoņa teiktajam.
- `assets/BRIEF.md` atjaunots: **236 faili**, 30 pabeigti, **206 atlikuši**.
  Septiņus vairs nevajag zīmēt vispār.

### Labots

- `styles/kid.css` saturēja stāsta noformējumu **divreiz**, un vēlākais,
  vecākais bloks klusi pārrakstīja 16:9 kadru, ko pievienoja v0.2.0. Miruši
  noteikumi izņemti; fails saruka par trešdaļu.
- Balvu skaitītājs vairs neieskaita kartītes, kas vēlākā versijā izņemtas
  (agrāk būtu rādījis “28 no 27”).

### Tehniski

- Jauns `src/ui/sceneStage.js` — viena ainas komponente, ko lieto visi
  uzdevumi. Atbilžu plaukts atgriež to pašu saskarni, ko agrāk atbilžu režģis,
  tāpēc uzdevumu loģika nemainījās.
- Draugs tiek **pārvietots** ainā, nevis pārzīmēts (`pet.dockPet`) — visas
  reakcijas, runas burbulis un aksesuāri turpina strādāt bez izmaiņām.
- Noņemts nelietotais kods: atbilžu režģis, uzdevumu virsraksta rinda, lielā
  kartīte, `heroEl`, `setPetPlacement`.
- 146 automātiskie testi (iepriekš 141). Bez datu shēmas izmaiņām un bez
  migrācijas — progress saglabājas pilnībā.

## [0.2.0] – 2026-07-31

“Piedzīvojums”. Pārstrādāta mācību pieeja, balstoties uz pētījumiem par
svešvalodas apguvi pirmsskolas vecumā.

Būtība: iepriekšējā versija bija digitālas vārdu kartītes ar punktiem. Vārds
tika uzskatīts par apgūtu pēc piecām pareizām atbildēm, izvēloties no diviem
attēliem. Tas nav vārda apguvums — bērns var to izdarīt, atceroties attēla
vietu ekrānā, un tas sabrūk brīdī, kad attēls mainās.

### Mainīts — kā tiek mērīta apguve

- **Apguve tagad balstās uz pierādījumiem, ne uz pareizo atbilžu skaitu.** Katram
  vārdam atsevišķi tiek fiksēts: vai bērns saprot dzirdētu vārdu, vai atpazīst
  to **citā attēlā**, vai atceras **nākamajā dienā** un **pēc nedēļas**, un vai
  **pats to pasaka**. Vārds skaitās apgūts tikai tad, kad ir gan atpazīšana
  citā attēlā, gan atcerēšanās pēc laika.
- **Katrs uzdevums var apliecināt tikai to, ko tas tiešām pārbauda.** Attēla
  pieskaršanās nekad neskaitās kā runāšana; nekāds daudzums viena attēla
  atkārtojumu neskaitās kā pārnese.
- **Atbilde pēc mājiena neskaitās.** Ja bērnam tika parādīts, kur ir pareizā
  atbilde, tas tiek ieskaitīts kā prakse, nevis kā zināšanas.
- **Atkārtošanas grafiks**: nākamajā dienā → pēc 3 dienām → pēc nedēļas
  (mazajiem: 1 → 2 → 4 → 7 dienas). Sesijas iekšienē katrs jaunais vārds
  atkārtojas uzreiz pēc iepazīšanas, pēc dažiem citiem uzdevumiem un vēlreiz
  sesijas beigās.

### Pievienots — uzdevumi

- **“Pasūtījums”** — varonis lūdz priekšmetu (“Give me the apple”), un pēc tam
  to **tiešām izmanto**: apēd, uzvelk, aizbrauc. Atlīdzība ir nozīme, nevis punkts.
- **Kustību uzdevums ar atcerēšanos** — agrāk kustību pauze bija tikai pauze.
  Tagad bērns izpilda darbību, un pēc tam **jāatpazīst**, kura animācija atbilst
  dzirdētajai komandai. Kustība tiek sasaistīta ar atcerēšanās mēģinājumu.
- **Pārneses pārbaude** — tas pats vārds, attēls, ko bērns nekad nav redzējis.
  76 vārdiem ir otrs attēls; krāsām tā ir tā pati krāsa uz pilnīgi cita
  priekšmeta (🔴 → 🌹), kas ir spēcīgākā pārbaude visā komplektā.
- **“Iemāci citplanētietim”** — citplanētietis pārliecināti kļūdās (“This is a
  cow!”, rādot zirgu), un bērnam tas jāizlabo. Runāšana bez automātiskas izrunas
  vērtēšanas: apstiprina pieaugušais vai pats bērns.
- **Stāsta piedzīvojums** — varonim ir problēma, un tikai angļu valodas
  sapratne to atrisina. Pareiza atbilde **maina notikumus**, nevis dod punktu.
  Četri stāsti; ainas tiek aizpildītas ar tiem vārdiem, ko bērns šobrīd mācās.
- **Kopīgas spēles kartīte** — mazo bērnu sesija sākas ar lūgumu pieaugušajam
  apsēsties blakus, jo tieši tas ir tas, kas māca.

### Pievienots — nozīmei atbilstošas animācijas

- Vārda nozīme tiek **parādīta**: “jump” lec, “eat” pazūd mutē, “sleep” aizmieg,
  “big” aug. Vārdiem bez godīgas nozīmes attēlojuma animācijas nav vispār —
  dekoratīva kustība konkurē ar vārdu par to pašu uzmanību.
- Kļūdas gadījumā pēc otrā mēģinājuma lietotne **pārstāj pārbaudīt un sāk mācīt**:
  nosauc pareizo vārdu, parāda tā nozīmi un ļauj bērnam izdoties.

### Mainīts — vecāku sadaļa

- Virsraksta rādītāji tagad ir **atcerēšanās pēc nedēļas** un **atpazīšana citā
  attēlā**, nevis minūtes un spēļu skaits. Aktivitātes skaitļi joprojām ir
  redzami, bet ar skaidru piezīmi, ka tie mēra vēlmi spēlēt, nevis apguvi.
- Katram vārdam tabulā redzams, **ko tieši bērns ir parādījis** (četri punktiņi:
  saprot / cits attēls / atceras vēlāk / pasaka pats).
- “Vārdi, kam pievērst uzmanību” tagad uzrāda arī vārdus, kas sanāk **tikai ar
  palīdzību**, un skaidri norāda: lietojiet tos ikdienā, jo tur lietotne netiek.

### Noņemts

- **Atmiņas spēle (pārīši).** To varēja uzvarēt, atceroties kartīšu vietas,
  nesaprotot nevienu angļu vārdu — gan prakse, gan rezultāts bija bezjēdzīgs.
- **Atsevišķais “Saki tu!” uzdevums** — to aizstāja “Iemāci citplanētietim”,
  kur runāšanai ir iemesls.

### Tehniski

- Datu shēma v1 → v2 ar automātisku migrāciju. Vecais progress saglabājas:
  vārds, uz kuru bērns kādreiz atbildējis pareizi, tiek ieskaitīts kā “saprot”,
  bet pārnese un runāšana jānopelna no jauna, jo tās nekad nav tikušas pārbaudītas.
- 128 automātiskie testi (iepriekš 86).
- `assets/BRIEF.md` — precīzs saraksts ar attēliem un ierakstiem, ko var
  pievienot, un ar failu nosaukumiem, lai tie tiktu pamanīti automātiski.

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

[Unreleased]: https://github.com/Hifistereo/ENG-learning/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Hifistereo/ENG-learning/releases/tag/v0.3.0
[0.2.0]: https://github.com/Hifistereo/ENG-learning/releases/tag/v0.2.0
[0.1.0]: https://github.com/Hifistereo/ENG-learning/releases/tag/v0.1.0
