// All user-facing chrome, in Latvian.
//
// English never appears in the interface except as target-language content —
// mixing the two would make the child guess which words are "the lesson".
// Keeping every string here also means an English or Russian UI is a new file,
// not a rewrite.

export const LV = {
  // --- generic ---
  'app.title': 'Mācāmies angliski!',
  'app.version': 'Versija {v}',
  'btn.back': 'Atpakaļ',
  'btn.close': 'Aizvērt',
  'btn.next': 'Tālāk',
  'btn.done': 'Gatavs!',
  'btn.again': 'Vēlreiz',
  'btn.start': 'Sākam!',
  'btn.continue': 'Turpināt',
  'btn.cancel': 'Atcelt',
  'btn.save': 'Saglabāt',
  'btn.skip': 'Izlaist',
  'btn.yes': 'Jā',
  'btn.no': 'Nē',

  // --- onboarding ---
  'onb.welcome': 'Sveiks!',
  'onb.intro': 'Izveidosim spēlētāju.',
  'onb.nameQ': 'Kā tevi sauc?',
  'onb.namePlaceholder': 'Vārds',
  'onb.ageQ': 'Cik tev gadu?',
  'onb.age2': '2–4 gadi',
  'onb.age2hint': 'Īsas spēles, tikai bildes un skaņas',
  'onb.age5': '5–7 gadi',
  'onb.age5hint': 'Garākas spēles, burti un teikumi',
  'onb.petQ': 'Izvēlies draugu!',
  'onb.petNameQ': 'Kā sauksim {pet}?',
  'onb.ready': 'Viss gatavs!',
  'onb.addChild': 'Pievienot bērnu',

  // --- home ---
  'home.hi': 'Sveiks, {name}!',
  'home.play': 'Spēlēt',
  'home.trophies': 'Manas balvas',
  'home.switch': 'Mainīt spēlētāju',
  'home.parents': 'Vecākiem',
  'home.petAsleep': '{pet} guļ. Pamodini viņu!',
  'home.petReady': '{pet} tevi gaida!',
  'home.wordsKnown': 'Zini {n} vārdus',
  'home.todayDone': 'Šodien jau nospēlēts! Var spēlēt vēl.',

  // --- session / activities ---
  'act.listen': 'Klausies un pieskaries!',
  'act.listenAgain': 'Klausīties vēlreiz',
  'act.whichIs': 'Kur ir?',
  'act.chant': 'Atkārtojam!',
  'act.chantHint': 'Saki līdzi!',
  'act.tprTitle': 'Kustību pauze!',
  'act.tprDo': 'Dari līdzi!',
  'act.tprDone': 'Es izdarīju!',
  'act.phonicsTitle': 'Ar kādu burtu sākas?',
  'act.phonicsPick': 'Kurš vārds sākas ar {letter}?',
  'act.sentenceTitle': 'Pabeidz teikumu!',
  'act.sayItRecord': 'Ierakstīt sevi',
  'act.sayItStop': 'Apturēt',
  'act.sayItPlayback': 'Noklausīties',

  // Order fulfilment
  'act.orderTitle': 'Ko viņš lūdz?',

  // Movement, now with a retrieval
  'act.actionWhich': 'Kura bilde to dara?',
  'act.grownupDo': 'Pieaugušais: izdari to kopā ar bērnu!',
  'act.grownupSay': 'Pieaugušais: pasaki “{word}” skaļi!',

  // Transfer check
  'act.transferHint': 'Cita bilde — tas pats vārds!',

  // Teach the alien
  'act.teachTitle': 'Iemāci citplanētietim!',
  'act.teachNo': 'Nepareizi!',
  'act.teachYes': 'Pareizi!',
  'act.teachReally': 'Tiešām? Paskatīsimies vēlreiz…',
  'act.teachWhat': 'Ups! Kas tas ir?',
  'act.teachSaid': 'Es pateicu!',
  'act.teachGrownupConfirm': 'Bērns to pateica',
  'act.teachThanks': 'Paldies! Tas ir',

  // Story
  'act.storyNext': 'Tālāk',
  'act.hintLv': 'Latviski',
  'act.newWord': 'Jauns vārds!',
  'act.great': 'Lieliski!',
  'act.tryAgain': 'Gandrīz! Pamēģini vēlreiz.',
  'act.wellDone': 'Malacis!',

  // --- co-play (age 2) ---
  'coplay.title': 'Spēlēsim kopā!',
  'coplay.lead': 'Mazajiem bērniem ekrāns viens pats māca maz. Apsēdieties blakus {name} — tieši jūs esat tas, kas māca.',
  'coplay.tip1': 'Sakiet katru angļu vārdu skaļi arī paši.',
  'coplay.tip2': 'Reaģējiet uz to, ko bērns izvēlas: “Jā! Cat!”',
  'coplay.tip3': 'Lietojiet šos vārdus arī pēc spēles — pusdienās, vannā, pastaigā.',
  'coplay.ready': 'Esam gatavi!',

  // --- session end ---
  'end.title': 'Nospēlēts!',
  'end.words': 'Šoreiz mācījāmies {n} vārdus',
  'end.sticker': 'Tu nopelnīji uzlīmi!',
  'end.newCards': 'Jauna balva!',
  'end.petLevel': '{pet} izauga līdz līmenim {level}!',
  'end.again': 'Spēlēt vēl',
  'end.home': 'Uz sākumu',

  // --- trophies ---
  'tro.title': 'Manas balvas',
  'tro.locked': 'Vēl nav nopelnīta',
  'tro.earned': 'Nopelnīts {date}',
  'tro.progress': '{n} no {total}',
  'tro.stickers': 'Uzlīmes',
  'tro.petTitle': 'Mans draugs',
  'tro.petLevel': 'Līmenis {level} · {title}',
  'tro.petNext': 'Vēl {n} vārdi līdz nākamajam līmenim',
  'tro.petMax': 'Augstākais līmenis sasniegts!',

  // --- parent gate ---
  'gate.title': 'Vecāku sadaļa',
  'gate.hint': 'Atrisini, lai turpinātu',
  'gate.wrong': 'Nepareizi. Mēģini vēlreiz.',

  // --- parent page ---
  'par.title': 'Vecākiem',
  'par.overview': 'Pārskats',
  'par.words': 'Vārdi',
  'par.achievements': 'Balvas',
  'par.settings': 'Iestatījumi',
  'par.tips': 'Padomi',
  'par.backToApp': 'Atpakaļ uz spēli',

  'par.statMastered': 'Apgūti',
  'par.statLearning': 'Mācās',
  'par.statNew': 'Vēl nav sākts',
  'par.statMinutes': 'Minūtes (7 dienas)',
  'par.statSessions': 'Spēles (7 dienas)',
  'par.statStreak': 'Dienas pēc kārtas',
  'par.statBestStreak': 'Labākā sērija: {n}',
  'par.statAccuracy': 'Precizitāte',
  'par.statMet': 'Vārdi, ko bērns saticis',

  // --- what actually indicates learning ---
  'par.learningTitle': 'Ko bērns tiešām ir apguvis',
  'par.learningHint': 'Svarīgākais nav nospēlēto spēļu skaits, bet gan tas, vai vārds paliek atmiņā pēc laika un vai bērns to atpazīst arī citā attēlā.',
  'par.statKnown': 'Apgūti',
  'par.statKnownSub': 'saprot, atpazīst citā attēlā un atceras vēlāk',
  'par.statRetained': 'Atceras pēc nedēļas',
  'par.statRetainedSub': 'spēcīgākais rādītājs',
  'par.statTransfer': 'Atpazīst citā attēlā',
  'par.statTransferSub': 'zina vārdu, ne tikai bildi',
  'par.statSpeaks': 'Pasaka pats',
  'par.statSpeaksSub': 'apstiprinājis pieaugušais',

  'par.lvl1': 'Saticis, bet vēl nesaprot',
  'par.lvl2': 'Saprot dzirdētu vārdu',
  'par.lvl3': 'Viens solis tālāk',
  'par.lvl4': 'Saprot arī citā attēlā un pēc laika',
  'par.lvl5': 'Pilnībā apguvis',

  'par.activityTitle': 'Aktivitāte',
  'par.activityHint': 'Šie skaitļi rāda, cik daudz bērns spēlējis — nevis cik daudz iemācījies. Noderīgi paradumu izsekošanai, bet ne mācīšanās mērīšanai.',

  'par.evRecognise': 'Saprot dzirdētu vārdu',
  'par.evTransfer': 'Atpazina arī citā attēlā',
  'par.evNoAlt': 'Šim vārdam nav otra attēla',
  'par.evDay': 'Atcerējās nākamajā dienā',
  'par.evWeek': 'Atcerējās pēc nedēļas',
  'par.evSpeaks': 'Pateica pats',
  'par.tableEvidence': 'Ko parādījis',
  'par.weakHelp': 'ar palīdzību',

  'par.chartWeek': 'Pēdējās 14 dienas',
  'par.chartAccuracy': 'Precizitāte laika gaitā',
  'par.noData': 'Vēl nav datu. Nospēlējiet vienu spēli!',

  'par.tableWord': 'Vārds',
  'par.tableLv': 'Latviski',
  'par.tableUnit': 'Tēma',
  'par.tableBox': 'Līmenis',
  'par.tableAcc': 'Precizitāte',
  'par.tableSeen': 'Pēdējoreiz',
  'par.filterAll': 'Visi',
  'par.filterMastered': 'Apgūti',
  'par.filterLearning': 'Mācās',
  'par.filterNew': 'Nesākti',
  'par.weakTitle': 'Vārdi, kam pievērst uzmanību',
  'par.weakHint': 'Šie vārdi vēl neveicas vai sanāk tikai ar palīdzību. Lietojiet tos ikdienā — brokastīs, vannā, pastaigā. Tieši tur vārdi nostiprinās, un tur lietotne netiek.',
  'par.weakNone': 'Nav vārdu, kas sagādā grūtības. Lieliski!',

  'par.setProfiles': 'Spēlētāji',
  'par.setChildName': 'Vārds',
  'par.setAge': 'Vecuma grupa',
  'par.setPet': 'Draugs',
  'par.setPetName': 'Drauga vārds',
  'par.setSession': 'Spēles garums',
  'par.setSessionShort': 'Īsa',
  'par.setSessionNormal': 'Vidēja',
  'par.setSessionLong': 'Gara',
  'par.setVoice': 'Balss',
  'par.setVoiceAuto': 'Automātiska (en-US)',
  'par.setRate': 'Runas ātrums',
  'par.setLvHints': 'Rādīt latviskās norādes',
  'par.setLvHintsHint': 'Poga “Latviski” spēles laikā. Iesakām atstāt ieslēgtu tikai sākumā.',
  'par.setMic': 'Atļaut ierakstīt balsi',
  'par.setMicHint': 'Bērns var noklausīties savu izrunu. Ieraksts paliek tikai ierīcē un netiek saglabāts.',
  'par.setPetHints': 'Draugs palīdz ar mājienu',
  'par.setPetHintsHint': 'Pēc dažām sekundēm draugs pagriežas uz pareizo atbildi.',
  'par.setSound': 'Skaņas efekti',
  'par.setUnits': 'Tēmas',
  'par.setUnitLocked': 'Slēgta',
  'par.setUnitOpen': 'Atvērt',
  'par.setUnitOpened': 'Atvērta',
  'par.setData': 'Dati',
  'par.setExport': 'Lejupielādēt rezerves kopiju',
  'par.setImport': 'Ielādēt rezerves kopiju',
  'par.setReset': 'Dzēst progresu',
  'par.setResetConfirm': 'Tiešām dzēst visu {name} progresu? To nevar atsaukt.',
  'par.setDeleteChild': 'Dzēst spēlētāju',
  'par.importOk': 'Dati ielādēti.',
  'par.importFail': 'Neizdevās nolasīt failu.',
  'par.exportHint': 'Progress glabājas tikai šajā pārlūkā. Rezerves kopija ir vienīgais veids, kā to pārnest uz citu ierīci.',

  'par.tipsTitle': 'Kā palīdzēt bērnam',
  'par.tip1': '5 minūtes katru dienu dod vairāk nekā 40 minūtes reizi nedēļā. Regularitāte ir svarīgāka par ilgumu.',
  'par.tip2': 'Spēlējiet kopā. Bērns iemācās vairāk, kad pieaugušais nosauc vārdu skaļi un reaģē.',
  'par.tip3': 'Uzslavējiet pūliņus, ne pareizās atbildes: “Tu labi klausījies!”',
  'par.tip4': 'Lietojiet apgūtos vārdus arī ārpus lietotnes — veikalā, pastaigā, vannā.',
  'par.tip5': 'Nelabojiet izrunu uzreiz. Vienkārši atkārtojiet vārdu pareizi — bērns pielāgojas pats.',
  'par.tip6': 'Mazākajiem pietiek ar atpazīšanu. Runāt viņi sāks vēlāk — tas ir normāli.',
  'par.tip7': 'Bērniem līdz aptuveni trim gadiem mācīšanās no ekrāna ir daudz vājāka nekā no dzīvas sarunas. Šī lietotne mazajiem ir kopīga rotaļa, nevis nodarbība, ko atstāt vienatnē.',
  'par.tip8': 'Ja bērns kļūdās, nesakiet “nepareizi”. Nosauciet pareizo vārdu, parādiet, ko tas nozīmē, un dodiet vēl vienu mēģinājumu — lietotne dara tieši to.',

  'par.setCoPlay': 'Kopīgas spēles atgādinājumi',
  'par.setCoPlayHint': 'Spēles sākumā parāda kartīti pieaugušajam un lūdz apstiprināt, kad bērns vārdu pasaka. Ieteicams bērniem līdz 4 gadiem.',

  // --- misc ---
  'err.generic': 'Kaut kas nogāja greizi.',
  'confirm.exit': 'Beigt spēli?',
};

/**
 * Look up a string, interpolating {placeholders}.
 * Missing keys return the key itself so a gap is obvious rather than blank.
 */
export function t(key, vars) {
  let str = LV[key];
  if (str === undefined) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
  }
  return str;
}

/** Latvian short date, e.g. "5. mar." */
export function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('lv-LV', { day: 'numeric', month: 'short' });
}

/** "šodien" / "vakar" / a date — used in the parent word table. */
export function relativeDay(ts) {
  if (!ts) return '—';
  const day = 86400000;
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const diff = startOfToday - new Date(ts).setHours(0, 0, 0, 0);
  if (diff <= 0) return 'šodien';
  if (diff === day) return 'vakar';
  if (diff < 7 * day) return `pirms ${diff / day} d.`;
  return formatDate(ts);
}
