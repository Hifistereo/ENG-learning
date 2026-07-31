// The parent area: progress, settings, backup, and advice.
//
// Gated by an arithmetic challenge. That is not security — anyone determined
// gets in — it exists solely to stop a five-year-old wandering into the
// settings and switching their sibling's profile off.

import { el, mount, clear } from '../dom.js';
import { activityChart, accuracyChart, unitBars } from './charts.js';
import { achievementGrid, achievementProgress } from '../achievementCard.js';
import { collection } from '../../core/achievements.js';
import {
  dailyActivity, windowTotals, unitBreakdown, weakWords, wordTable,
  currentStreak, bestStreak, learningMeasures,
} from '../../core/stats.js';
import { accuracy as recAccuracy } from '../../core/srs.js';
import { knowledgeProgress } from '../../core/knowledge.js';
import {
  listProfiles, getProfile, updateProfile, updateSettings, deleteProfile,
  setActiveProfileId, getActiveProfile, SESSION_LENGTHS,
  RECOMMENDED_RATE, RATE_RANGE,
} from '../../state/profiles.js';
import { getProgress, resetProgress, invalidateCache, unlockUnit } from '../../state/progress.js';
import { exportAll, importAll, isPersistent } from '../../state/storage.js';
import { englishVoices } from '../../media/speech.js';
import { isSupported as micSupported } from '../../media/mic.js';
import { PETS, getPet } from '../../data/pets.js';
import { UNITS } from '../../data/units.js';
import { CHATTER_IDS } from '../../data/chatter.js';
import { unlockedUnits } from '../../core/selector.js';
import { APP_VERSION, RELEASE_NAME } from '../../version.js';
import { t, relativeDay } from '../../i18n/lv.js';
import { navigate } from '../../router.js';

// Session-scoped: re-entering the parent area in the same visit does not
// re-ask, but a reload does.
let unlockedThisVisit = false;

export function render(root) {
  document.body.dataset.surface = 'parent';
  document.body.dataset.age = '5';

  if (!unlockedThisVisit) return renderGate(root);
  return renderDashboard(root);
}

// --- Gate ----------------------------------------------------------------

function renderGate(root) {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 4 + Math.floor(Math.random() * 8);

  const input = el('input', { type: 'number', inputmode: 'numeric', autocomplete: 'off' });
  const error = el('p.gate__error');

  const submit = () => {
    if (Number(input.value) === a * b) {
      unlockedThisVisit = true;
      renderDashboard(root);
      return;
    }
    error.textContent = t('gate.wrong');
    input.value = '';
    input.focus();
  };

  const form = el('form.gate', {
    on: { submit: (e) => { e.preventDefault(); submit(); } },
  }, [
    el('h1.gate__title', { text: t('gate.title') }),
    el('p.gate__hint', { text: t('gate.hint') }),
    el('p.gate__sum', { text: `${a} × ${b} = ?` }),
    input,
    error,
    el('button.btn.btn--primary', { type: 'submit' }, t('btn.continue')),
    el('button.btn.btn--ghost', {
      type: 'button',
      on: { click: () => navigate('/') },
    }, t('par.backToApp')),
  ]);

  mount(root, el('div.screen.screen--parent', {}, [form]));
  setTimeout(() => input.focus(), 50);
}

// --- Dashboard -----------------------------------------------------------

const TABS = [
  { id: 'overview',     label: 'par.overview' },
  { id: 'words',        label: 'par.words' },
  { id: 'achievements', label: 'par.achievements' },
  { id: 'settings',     label: 'par.settings' },
  { id: 'tips',         label: 'par.tips' },
];

function renderDashboard(root) {
  const profiles = listProfiles();
  let activeId = getActiveProfile()?.id || profiles[0]?.id || null;
  let tab = 'overview';

  const body = el('div.parent__body');

  const header = el('header.parent__header', {}, [
    el('h1.parent__title', { text: t('par.title') }),
    el('button.btn.btn--ghost', {
      type: 'button',
      on: { click: () => navigate('/') },
    }, `← ${t('par.backToApp')}`),
  ]);

  const childTabs = el('div.chips');
  const tabBar = el('nav.tabs');

  function drawChildTabs() {
    clear(childTabs);
    for (const profile of listProfiles()) {
      childTabs.append(el('button.chip', {
        type: 'button',
        class: profile.id === activeId ? 'is-active' : '',
        on: {
          click: () => { activeId = profile.id; drawChildTabs(); draw(); },
        },
      }, `${getPet(profile.pet.id).emoji} ${profile.name}`));
    }
  }

  function drawTabs() {
    clear(tabBar);
    for (const entry of TABS) {
      tabBar.append(el('button.tab', {
        type: 'button',
        class: entry.id === tab ? 'is-active' : '',
        on: { click: () => { tab = entry.id; drawTabs(); draw(); } },
      }, t(entry.label)));
    }
  }

  function draw() {
    const profile = activeId ? getProfile(activeId) : null;
    if (!profile) {
      mount(body, el('p.parent__empty', { text: t('par.noData') }));
      return;
    }
    const progress = getProgress(profile.id);

    const views = {
      overview: () => overviewView(profile, progress),
      words: () => wordsView(profile, progress),
      achievements: () => achievementsView(progress),
      settings: () => settingsView(profile, () => { drawChildTabs(); draw(); }, root),
      tips: () => tipsView(),
    };
    mount(body, views[tab]());
  }

  mount(root, el('div.screen.screen--parent', {}, [
    header,
    childTabs,
    tabBar,
    body,
    el('footer.parent__footer', {}, [
      el('span', { text: `${t('app.version', { v: APP_VERSION })} · ${RELEASE_NAME}` }),
      !isPersistent()
        ? el('span.warn', { text: 'Uzmanību: šis pārlūks nesaglabā datus. Izveido rezerves kopiju.' })
        : null,
    ]),
  ]));

  drawChildTabs();
  drawTabs();
  draw();
}

// --- Overview ------------------------------------------------------------

function statTile(label, value, sub = null) {
  return el('div.stat', {}, [
    el('span.stat__value', { text: String(value) }),
    el('span.stat__label', { text: label }),
    sub ? el('span.stat__sub', { text: sub }) : null,
  ]);
}

function overviewView(profile, progress) {
  const week = windowTotals(progress.sessions, 7);
  const days = dailyActivity(progress.sessions, 14);
  const units = unitBreakdown(progress, profile.ageBand);
  const weak = weakWords(progress, profile.ageBand);
  const m = learningMeasures(progress, profile.ageBand);

  return el('div.stack', {}, [
    // The headline is retention and transfer. Minutes and session counts are
    // measures of willingness, not of learning, so they sit lower down under
    // their own heading rather than leading the page.
    section(t('par.learningTitle'), el('div.stack', {}, [
      el('p.muted', { text: t('par.learningHint') }),
      el('div.stats', {}, [
        statTile(t('par.statKnown'), m.known, t('par.statKnownSub')),
        statTile(t('par.statRetained'), m.retained, t('par.statRetainedSub')),
        statTile(t('par.statTransfer'), m.transfers, t('par.statTransferSub')),
        statTile(t('par.statSpeaks'), m.speaks, t('par.statSpeaksSub')),
      ]),
      knowledgeLadder(m, profile),
    ])),

    section(t('par.weakTitle'),
      weak.length
        ? el('div.stack', {}, [
            el('p.muted', { text: t('par.weakHint') }),
            el('ul.weak', {}, weak.map(({ word, rec }) =>
              el('li.weak__item', {}, [
                el('span.weak__emoji', { text: word.emoji }),
                el('span.weak__en', { text: word.en }),
                el('span.weak__lv', { text: word.lv }),
                el('span.weak__acc', {
                  text: rec.help > 0 && (rec.help / rec.seen) > 0.4
                    ? t('par.weakHelp')
                    : `${Math.round((recAccuracy(rec) || 0) * 100)}%`,
                }),
              ]))),
          ])
        : el('p.muted', { text: t('par.weakNone') })),

    section(t('par.words'), unitBars(units)),

    // Activity: honest, but explicitly framed as context rather than outcome.
    section(t('par.activityTitle'), el('div.stack', {}, [
      el('p.muted', { text: t('par.activityHint') }),
      el('div.stats', {}, [
        statTile(t('par.statMinutes'), Math.round(week.minutes)),
        statTile(t('par.statSessions'), week.sessions),
        statTile(
          t('par.statStreak'),
          currentStreak(progress.sessions),
          t('par.statBestStreak', { n: bestStreak(progress.sessions) }),
        ),
        statTile(t('par.statMet'), m.met, `no ${m.eligible}`),
      ]),
      activityChart(days),
      accuracyChart(days),
    ])),
  ]);
}

function section(heading, ...content) {
  return el('section.panel', {}, [
    el('h2.panel__title', { text: heading }),
    ...content,
  ]);
}

// --- Words ---------------------------------------------------------------

function wordsView(profile, progress) {
  const rows = wordTable(progress, profile.ageBand);
  let filter = 'all';
  const tbody = el('tbody');

  const draw = () => {
    const shown = rows.filter((r) => filter === 'all' || r.state === filter);
    clear(tbody).append(...shown.map((row) => el('tr', {}, [
      el('td', {}, [
        el('span.wordcell', {}, [
          el('span', { text: row.word.emoji }),
          el('strong', { text: row.word.en }),
        ]),
      ]),
      el('td', { text: row.word.lv }),
      el('td.hide-sm', { text: unitName(row.word.unit) }),
      el('td', {}, [evidenceDots(row.ev, row.word)]),
      el('td', {}, [boxBar(row.rec, profile.ageBand)]),
      el('td.hide-sm', { text: relativeDay(row.lastSeen) }),
    ])));
  };

  const filters = el('div.chips', {}, [
    ['all', 'par.filterAll'],
    ['mastered', 'par.filterMastered'],
    ['learning', 'par.filterLearning'],
    ['new', 'par.filterNew'],
  ].map(([id, key]) => el('button.chip', {
    type: 'button',
    class: id === filter ? 'is-active' : '',
    on: {
      click: (e) => {
        filter = id;
        e.currentTarget.parentElement.querySelectorAll('.chip')
          .forEach((c) => c.classList.remove('is-active'));
        e.currentTarget.classList.add('is-active');
        draw();
      },
    },
  }, t(key))));

  draw();

  return el('div.stack', {}, [
    filters,
    el('div.tablewrap', {}, [
      el('table.table', {}, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', { text: t('par.tableWord') }),
            el('th', { text: t('par.tableLv') }),
            el('th.hide-sm', { text: t('par.tableUnit') }),
            el('th', { text: t('par.tableEvidence') }),
            el('th', { text: t('par.tableBox') }),
            el('th.hide-sm', { text: t('par.tableSeen') }),
          ]),
        ]),
        tbody,
      ]),
    ]),
    // Greetings are not in this table and their absence would otherwise read
    // as missing progress. They are heard, not tested — see data/chatter.js.
    el('p.muted', {}, [
      el('strong', { text: `${CHATTER_IDS.length} ` }),
      el('span', { text: t('par.chatterNote') }),
    ]),
  ]);
}

const unitName = (id) => UNITS.find((u) => u.id === id)?.lv || id;

function boxBar(rec, ageBand) {
  const pct = Math.round(knowledgeProgress(rec, ageBand) * 100);
  return el('div.boxbar', { title: `${pct}%` }, [
    el('div.boxbar__fill', { style: { width: `${pct}%` } }),
  ]);
}

/**
 * What the child has actually shown for this word, as four filled or hollow
 * dots. A single percentage hides the distinction that matters: a word at 100%
 * on one picture and a word that survived a week are not the same thing.
 */
function evidenceDots(ev, word) {
  const dots = [
    { on: ev.recognise, label: t('par.evRecognise'), icon: '👂' },
    { on: ev.transfer, label: word.alt ? t('par.evTransfer') : t('par.evNoAlt'), icon: '🔄', n: !word.alt },
    { on: ev.delay1 || ev.delay7, label: ev.delay7 ? t('par.evWeek') : t('par.evDay'), icon: '📅' },
    { on: ev.produce, label: t('par.evSpeaks'), icon: '🗣️' },
  ];
  return el('span.evdots', {}, dots.map((d) => el('span', {
    class: `evdot ${d.on ? 'is-on' : ''} ${d.n ? 'is-na' : ''}`,
    title: d.label,
    text: d.icon,
  })));
}

/**
 * How the child's vocabulary is spread across the levels of knowing.
 * Deliberately not a single number — the shape is the interesting part.
 */
function knowledgeLadder(m, profile) {
  const labels = [
    t('par.lvl0'), t('par.lvl1'), t('par.lvl2'), t('par.lvl3'), t('par.lvl4'), t('par.lvl5'),
  ];
  const max = Math.max(...m.levels.slice(1), 1);
  return el('div.ladder', {}, m.levels.map((count, level) => {
    if (level === 0) return null;      // "never met" is not a stage of knowing
    return el('div.ladder__row', {}, [
      el('span.ladder__label', { text: labels[level] }),
      el('div.ladder__track', {}, [
        el('div.ladder__fill', {
          style: { width: `${(count / max) * 100}%`, opacity: String(0.45 + level * 0.11) },
        }),
      ]),
      el('span.ladder__count', { text: String(count) }),
    ]);
  }).filter(Boolean));
}

// --- Achievements --------------------------------------------------------

function achievementsView(progress) {
  const entries = collection(progress);
  return el('div.stack', {}, [
    achievementProgress(entries),
    achievementGrid(entries, { compact: true }),
  ]);
}

// --- Settings ------------------------------------------------------------

function settingsView(profile, refresh, root) {
  const progress = getProgress(profile.id);
  const set = (patch) => { updateSettings(profile.id, patch); refresh(); };

  return el('div.stack', {}, [
    section(t('par.setProfiles'), el('div.stack', {}, [
      field(t('par.setChildName'), el('input', {
        type: 'text', value: profile.name, maxLength: 16,
        on: { change: (e) => { updateProfile(profile.id, { name: e.target.value.trim() || profile.name }); refresh(); } },
      })),
      field(t('par.setAge'), select([
        { value: '2', label: t('onb.age2') },
        { value: '5', label: t('onb.age5') },
      ], String(profile.ageBand), (v) => { updateProfile(profile.id, { ageBand: Number(v) }); refresh(); })),
      field(t('par.setPet'), select(
        PETS.map((p) => ({ value: p.id, label: `${p.emoji} ${p.lv}` })),
        profile.pet.id,
        (v) => { updateProfile(profile.id, { pet: { id: v } }); refresh(); },
      )),
      field(t('par.setPetName'), el('input', {
        type: 'text', value: profile.pet.name, maxLength: 16,
        on: { change: (e) => { updateProfile(profile.id, { pet: { name: e.target.value.trim() || profile.pet.name } }); refresh(); } },
      })),
      el('button.btn', {
        type: 'button',
        on: { click: () => { setActiveProfileId(profile.id); navigate('/welcome'); } },
      }, `➕ ${t('onb.addChild')}`),
    ])),

    section(t('par.setSession'), el('div.stack', {}, [
      field(t('par.setSession'), select(
        Object.keys(SESSION_LENGTHS).map((key) => ({
          value: key,
          label: `${t(`par.setSession${key[0].toUpperCase()}${key.slice(1)}`)} · ${SESSION_LENGTHS[key][profile.ageBand]} uzd.`,
        })),
        profile.settings.sessionLength,
        (v) => set({ sessionLength: v }),
      )),
      toggle(t('par.setSound'), profile.settings.sound, (v) => set({ sound: v })),
      toggle(t('par.setPetHints'), profile.settings.petHints, (v) => set({ petHints: v }),
        t('par.setPetHintsHint')),
      toggle(t('par.setLvHints'), profile.settings.lvHints, (v) => set({ lvHints: v }),
        t('par.setLvHintsHint')),
      toggle(t('par.setCoPlay'), profile.settings.coPlay !== false, (v) => set({ coPlay: v }),
        t('par.setCoPlayHint')),
    ])),

    section(t('par.setVoice'), voiceSettings(profile, set)),

    section(t('par.setMic'), el('div.stack', {}, [
      micSupported()
        ? toggle(t('par.setMic'), profile.settings.mic, (v) => set({ mic: v }), t('par.setMicHint'))
        : el('p.muted', { text: 'Šī ierīce neatbalsta ierakstīšanu.' }),
    ])),

    section(t('par.setUnits'), unitLocks(profile, progress, refresh)),

    section(t('par.setData'), el('div.stack', {}, [
      el('p.muted', { text: t('par.exportHint') }),
      el('div.row', {}, [
        el('button.btn', { type: 'button', on: { click: doExport } }, `⬇️ ${t('par.setExport')}`),
        importButton(refresh, root),
      ]),
      el('button.btn.btn--danger', {
        type: 'button',
        on: {
          click: () => {
            if (confirm(t('par.setResetConfirm', { name: profile.name }))) {
              resetProgress(profile.id);
              refresh();
            }
          },
        },
      }, `🗑️ ${t('par.setReset')}`),
      listProfiles().length > 1
        ? el('button.btn.btn--danger', {
            type: 'button',
            on: {
              click: () => {
                if (confirm(t('par.setResetConfirm', { name: profile.name }))) {
                  resetProgress(profile.id);
                  deleteProfile(profile.id);
                  location.reload();
                }
              },
            },
          }, `👤 ${t('par.setDeleteChild')}`)
        : null,
    ])),
  ]);
}

function voiceSettings(profile, set) {
  const recommended = RECOMMENDED_RATE[profile.ageBand] ?? RECOMMENDED_RATE[5];
  const slider = el('input', {
    type: 'range',
    min: String(RATE_RANGE.min),
    max: String(RATE_RANGE.max),
    step: String(RATE_RANGE.step),
    value: String(profile.settings.rate),
    on: { change: (e) => set({ rate: Number(e.target.value) }) },
  });

  // A profile created before the recommendation changed keeps whatever it was
  // given, so without this button the children already on this tablet would
  // never get the slower speech. One tap, and it says what it will set.
  const reset = el('button.btn.btn--ghost', {
    type: 'button',
    on: {
      click: () => {
        slider.value = String(recommended);
        set({ rate: recommended });
      },
    },
  }, t('par.setRateReset', { n: recommended.toFixed(2) }));

  const wrap = el('div.stack', {}, [
    field(t('par.setRate'), slider),
    el('p.muted', { text: t('par.setRateHint') }),
    reset,
  ]);

  // Voices arrive asynchronously; fill the picker in when they do.
  englishVoices().then((voices) => {
    if (!voices.length) return;
    wrap.prepend(field(t('par.setVoice'), select(
      [{ value: '', label: t('par.setVoiceAuto') },
        ...voices.map((v) => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))],
      profile.settings.voiceURI || '',
      (v) => set({ voiceURI: v || null }),
    )));
  });

  return wrap;
}

function unitLocks(profile, progress, refresh) {
  const open = new Set(unlockedUnits(profile, progress));
  return el('div.stack', {}, UNITS.map((unit) => el('div.row.unitrow', {}, [
    el('span', { text: `${unit.emoji} ${unit.lv}` }),
    el('span.spacer'),
    open.has(unit.id)
      ? el('span.badge', { text: t('par.setUnitOpened') })
      : el('button.btn.btn--small', {
          type: 'button',
          on: { click: () => { unlockUnit(profile.id, unit.id); refresh(); } },
        }, t('par.setUnitOpen')),
  ])));
}

function doExport() {
  const dump = exportAll();
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', {
    href: url,
    download: `angliski-${new Date().toISOString().slice(0, 10)}.json`,
  });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importButton(refresh, root) {
  const input = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    style: { display: 'none' },
    on: {
      change: async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const dump = JSON.parse(await file.text());
          const result = importAll(dump);
          if (!result.ok) throw new Error(result.error);
          invalidateCache();
          alert(t('par.importOk'));
          render(root);
        } catch {
          alert(t('par.importFail'));
        }
        e.target.value = '';
        refresh();
      },
    },
  });

  const button = el('button.btn', {
    type: 'button',
    on: { click: () => input.click() },
  }, `⬆️ ${t('par.setImport')}`);

  return el('span', {}, [button, input]);
}

// --- Tips ----------------------------------------------------------------

function tipsView() {
  return section(t('par.tipsTitle'), el('ul.tips', {},
    ['par.tip7', 'par.tip1', 'par.tip2', 'par.tip8', 'par.tip3', 'par.tip4', 'par.tip5', 'par.tip6']
      .map((key) => el('li', { text: t(key) }))));
}

// --- Small form helpers --------------------------------------------------

function field(label, control) {
  return el('label.pfield', {}, [
    el('span.pfield__label', { text: label }),
    control,
  ]);
}

function select(options, value, onChange) {
  return el('select', {
    on: { change: (e) => onChange(e.target.value) },
  }, options.map((opt) => el('option', {
    value: opt.value,
    selected: String(opt.value) === String(value),
    text: opt.label,
  })));
}

function toggle(label, checked, onChange, hint = null) {
  return el('label.toggle', {}, [
    el('input', {
      type: 'checkbox',
      checked: !!checked,
      on: { change: (e) => onChange(e.target.checked) },
    }),
    el('span.toggle__body', {}, [
      el('span.toggle__label', { text: label }),
      hint ? el('span.toggle__hint', { text: hint }) : null,
    ]),
  ]);
}
