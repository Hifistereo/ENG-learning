// Hand-rolled inline SVG charts.
//
// No charting library: two chart types on one page is not worth 200kB of
// dependency on a device that may be offline, and hand-drawn SVG scales
// cleanly and themes with CSS variables for free.

import { el } from '../dom.js';
import { t } from '../../i18n/lv.js';

const svg = (tag, attrs = {}, children = []) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  node.append(...[].concat(children).filter(Boolean));
  return node;
};

/**
 * Daily activity bars.
 * @param {Array<{ts:number, minutes:number, sessions:number}>} days oldest first
 */
export function activityChart(days, { height = 120 } = {}) {
  if (!days.some((d) => d.sessions > 0)) {
    return el('p.chart__empty', { text: t('par.noData') });
  }

  // Geometry in SVG, labels in HTML. Bars stretch happily to any width, but
  // text under preserveAspectRatio="none" gets smeared — so the dates live
  // outside the SVG and the chart can use the full container width.
  const width = 100;
  const max = Math.max(...days.map((d) => d.minutes), 5);
  const slot = width / days.length;
  const barW = slot * 0.62;

  const bars = days.map((day, i) => {
    const h = (day.minutes / max) * height;
    const drawn = Math.max(h, day.sessions ? 3 : 0);
    const group = svg('g', {}, [
      svg('rect', {
        x: i * slot + (slot - barW) / 2,
        y: height - drawn,
        width: barW,
        height: drawn,
        class: day.sessions ? 'bar bar--on' : 'bar',
      }),
    ]);
    group.append(svg('title', {}, [
      document.createTextNode(
        `${new Date(day.ts).toLocaleDateString('lv-LV', { day: 'numeric', month: 'short' })}: `
        + `${day.minutes.toFixed(0)} min, ${day.sessions} sp.`),
    ]));
    return group;
  });

  const shortDate = (ts) =>
    new Date(ts).toLocaleDateString('lv-LV', { day: 'numeric', month: 'numeric' });

  return el('div.chart', {}, [
    svg('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'none',
      role: 'img',
      'aria-label': t('par.chartWeek'),
    }, bars),
    el('div.chart__axis', {}, [
      el('span', { text: shortDate(days[0].ts) }),
      el('span', { text: `maks. ${Math.round(max)} min` }),
      el('span', { text: shortDate(days.at(-1).ts) }),
    ]),
  ]);
}

/**
 * Accuracy over time as a sparkline. Days with no data break the line rather
 * than being drawn as zero — a day off is not a day of getting everything wrong.
 */
export function accuracyChart(days, { height = 90 } = {}) {
  const points = days
    .map((day, i) => ({ i, value: day.accuracy }))
    .filter((p) => p.value !== null);

  if (points.length < 2) return el('p.chart__empty', { text: t('par.noData') });

  const width = 100;
  const x = (i) => (i / Math.max(1, days.length - 1)) * width;
  const y = (v) => height - 4 - v * (height - 8);

  // Break the path wherever there is a gap of missing days.
  let path = '';
  let previous = null;
  for (const point of points) {
    const cmd = previous !== null && point.i === previous + 1 ? 'L' : 'M';
    path += `${cmd}${x(point.i).toFixed(2)},${y(point.value).toFixed(2)} `;
    previous = point.i;
  }

  // vector-effect keeps the stroke an even width once the viewBox is squashed
  // to the container; without it the line thickens horizontally.
  return el('div.chart', {}, [
    svg('svg', {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'none',
      role: 'img',
      'aria-label': t('par.chartAccuracy'),
    }, [
      svg('line', {
        x1: 0, y1: y(0.5), x2: width, y2: y(0.5),
        class: 'axisline axisline--dashed', 'vector-effect': 'non-scaling-stroke',
      }),
      svg('path', { d: path.trim(), class: 'spark', 'vector-effect': 'non-scaling-stroke' }),
    ]),
    el('div.chart__axis', {}, [
      el('span', { text: '0%' }),
      el('span', { text: '50%' }),
      el('span', { text: '100%' }),
    ]),
  ]);
}

/** Horizontal mastery bar per unit. */
export function unitBars(units) {
  return el('div.unitbars', {}, units.map((unit) => {
    const pct = unit.total ? (unit.mastered / unit.total) * 100 : 0;
    const learning = unit.total ? (unit.learning / unit.total) * 100 : 0;
    return el('div.unitbar', {}, [
      el('span.unitbar__label', { text: `${unit.emoji} ${unit.lv}` }),
      el('div.unitbar__track', {}, [
        el('div.unitbar__learning', { style: { width: `${pct + learning}%` } }),
        el('div.unitbar__fill', { style: { width: `${pct}%`, background: unit.color } }),
      ]),
      el('span.unitbar__count', { text: `${unit.mastered}/${unit.total}` }),
    ]);
  }));
}
