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
  snapshot, dailyActivity, windowTotals, unitBreakdown, weakWords, wordTable,
  currentStreak, bestStreak,
} from '../../core/stats.js';
import { masteryProgress, accuracy as recAccuracy } from '../../core/srs.js';
import {
  listProfiles, getProfile, updateProfile, updateSettings, deleteProfile,
  setActiveProfileId, getActiveProfile, SESSION_LENGTHS,
} from '../../state/profiles.js';
import { getProgress, resetProgress, invalidateCache, unlockUnit } from '../../state/progress.js';
import { exportAll, importAll, isPersistent } from '../../state/storage.js';
import { englishVoices } from '../../media/speech.js';
import { isSupported as micSupported } from '../../media/mic.js';
import { PETS, getPet } from '../../data/pets.js';
import { UNITS } from '../../data/units.js';
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
  const snap = snapshot(progress, profile);
  const week = windowTotals(progress.sessions, 7);
  const days = dailyActivity(progress.sessions, 14);
  const units = unitBreakdown(progress, profile.ageBand);
  const weak = weakWords(progress, profile.ageBand);

  return el('div.stack', {}, [
    el('div.stats', {}, [
      statTile(t('par.statMastered'), snap.wordsMastered),
      statTile(t('par.statLearning'), snap.wordsLearning),
      statTile(t('par.statNew'), Math.max(0, unitsTotal(units) - snap.wordsSeen)),
      statTile(t('par.statMinutes'), Math.round(week.minutes)),
      statTile(t('par.statSessions'), week.sessions),
      statTile(
        t('par.statStreak'),
        currentStreak(progress.sessions),
        t('par.statBestStreak', { n: bestStreak(progress.sessions) }),
      ),
      statTile(
        t('par.statAccuracy'),
        snap.accuracy === null ? '—' : `${Math.round(snap.accuracy * 100)}%`,
      ),
    ]),

    section(t('par.chartWeek'), activityChart(days)),
    section(t('par.chartAccuracy'), accuracyChart(days)),
    section(t('par.words'), unitBars(units)),

    section(
      t('par.weakTitle'),
      weak.length
        ? el('div.stack', {}, [
            el('p.muted', { text: t('par.weakHint') }),
            el('ul.weak', {}, weak.map(({ word, rec }) =>
              el('li.weak__item', {}, [
                el('span.weak__emoji', { text: word.emoji }),
                el('span.weak__en', { text: word.en }),
                el('span.weak__lv', { text: word.lv }),
                el('span.weak__acc', {
                  text: `${Math.round((recAccuracy(rec) || 0) * 100)}%`,
                }),
              ]))),
          ])
        : el('p.muted', { text: t('par.weakNone') }),
    ),
  ]);
}

const unitsTotal = (units) => units.reduce((sum, u) => sum + u.total, 0);

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
      el('td', {}, [boxBar(row.rec)]),
      el('td', { text: row.accuracy === null ? '—' : `${Math.round(row.accuracy * 100)}%` }),
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
            el('th', { text: t('par.tableBox') }),
            el('th', { text: t('par.tableAcc') }),
            el('th.hide-sm', { text: t('par.tableSeen') }),
          ]),
        ]),
        tbody,
      ]),
    ]),
  ]);
}

const unitName = (id) => UNITS.find((u) => u.id === id)?.lv || id;

function boxBar(rec) {
  const pct = Math.round(masteryProgress(rec) * 100);
  return el('div.boxbar', { title: `${pct}%` }, [
    el('div.boxbar__fill', { style: { width: `${pct}%` } }),
  ]);
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
  const wrap = el('div.stack', {}, [
    field(t('par.setRate'), el('input', {
      type: 'range', min: '0.5', max: '1.2', step: '0.05',
      value: String(profile.settings.rate),
      on: { change: (e) => set({ rate: Number(e.target.value) }) },
    })),
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
    ['par.tip1', 'par.tip2', 'par.tip3', 'par.tip4', 'par.tip5', 'par.tip6']
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
