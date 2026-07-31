// The visit — one illustrated place that lasts the whole session.
//
// Before this, every round wiped the screen and rebuilt it: a cream field, a
// thin progress bar, an instruction in Latvian, some white cards. Eighteen
// times. Tested on a real child the opening minutes read as a test rather than
// a game, and the hard cut between rounds was a large part of why.
//
// So the stage is now built once and kept. The backdrop, the pet standing in
// it, the caption panel and the prop shelf all persist; a round changes only
// what is said and what is on the shelf. Nothing flashes, nothing is rebuilt,
// and the child stays in the same place for the whole visit.
//
// The layout is the story screen's, which was already the one part of the app
// that felt like somewhere rather than something:
//
//   .visit
//     .visit__frame          16:9 illustrated box
//       .scene               backdrop — drawn artwork or a gradient
//       .visit__cast         where characters stand, feet on the ground
//       .visit__caption      what is being said, on its own readable surface
//     .visit__shelf          the things you can tap
//
// Two rules carried over from the story, both from the research notes: nothing
// is clickable except the answers, and the backdrop stays plain, because a busy
// scene competes with the thing the child is meant to be looking at.

import { el, clear, wait, prefersReducedMotion } from './dom.js';
import { pictureEl } from '../media/picture.js';
import { sceneEl } from '../media/scene.js';
import { artUrl, hasArt } from '../media/art.js';
import { dockPet } from '../pet/pet.js';
import { play } from '../media/sfx.js';

/**
 * Build the visit.
 *
 * @param {Element} mountEl - the stage element from kidScreen()
 * @param {{mood?: string, profile: object}} cfg
 */
export function createSceneStage(mountEl, { mood = 'home', profile }) {
  let currentMood = mood;

  const backdrop = el('div.visit__backdrop', {}, [sceneEl(currentMood)]);
  const cast = el('div.visit__cast');
  const petSpot = el('div.visit__petspot');
  const says = el('p.visit__says');
  const lv = el('p.visit__lv');
  const caption = el('div.visit__caption', {}, [says, lv]);
  const frame = el('div.visit__frame', {}, [backdrop, cast, petSpot, caption]);
  const shelf = el('div.visit__shelf');
  const root = el('div.visit', {}, [frame, shelf]);

  clear(mountEl).append(root);
  dockPet(petSpot);

  const stage = {
    root,
    frame,
    shelf,
    get mood() { return currentMood; },

    /**
     * Move to a different place.
     *
     * A crossfade rather than a swap: the child sees the scene change, which
     * reads as walking somewhere, where an instant cut reads as a new screen.
     */
    async setMood(next) {
      if (!next || next === currentMood) return;
      currentMood = next;
      const incoming = sceneEl(next);
      incoming.classList.add('is-entering');
      backdrop.append(incoming);
      // One frame so the browser has the starting opacity before it animates.
      await wait(prefersReducedMotion() ? 0 : 30);
      incoming.classList.remove('is-entering');
      await wait(prefersReducedMotion() ? 0 : 420);
      for (const old of [...backdrop.children]) if (old !== incoming) old.remove();
    },

    /**
     * What is being said, and by extension what the round is asking.
     *
     * The English sentence IS the prompt — there is no Latvian instruction
     * above it telling the child what to do. When Latvian hints are on, the
     * translation sits underneath in smaller type, which is the pattern the
     * story screen has always used.
     *
     * @param {string} en
     * @param {string} [lvText]
     */
    say(en, lvText = '') {
      says.textContent = en || '';
      lv.textContent = profile.settings.lvHints ? (lvText || '') : '';
      lv.hidden = !lv.textContent;
    },

    /** Who else is in the scene — a story hero, the alien, a big picture. */
    setCast(...nodes) {
      clear(cast).append(...nodes.filter(Boolean));
      return cast;
    },
    clearCast() { clear(cast); },

    /**
     * Things sitting in the scene that are not answers to anything — used by
     * the look-around at the start of a visit.
     *
     * Rendered as plain elements rather than disabled buttons so there is
     * nothing to tap and nothing that looks tappable. The research note this
     * comes from: if poking around produces effects, children learn to hunt
     * for effects instead of listening.
     *
     * @returns {Element[]} one holder per word, in order, for highlighting
     */
    showProps(words, { size = null } = {}) {
      clear(shelf);
      shelf.dataset.count = String(words.length);
      return words.map((word) => {
        const holder = el('div.prop.prop--static', { dataset: { id: word.id } }, [
          pictureEl(word, { size: size || 'var(--prop-size)', className: 'prop__pic' }),
        ]);
        shelf.append(holder);
        return holder;
      });
    },

    /**
     * The things on the shelf.
     *
     * Returns the same handle shape as components.choiceGrid so activities can
     * express feedback as intent, and so base.teachAnswer works against either
     * one without knowing which it was given.
     *
     * @param {object[]} options - word objects
     * @param {{showText?: boolean, size?: string, onPick: Function}} cfg
     */
    setProps(options, { showText = false, size = null, onPick }) {
      clear(shelf);
      shelf.dataset.count = String(options.length);
      const buttons = [];
      let locked = false;

      for (const [index, word] of options.entries()) {
        const button = el('button.prop', {
          type: 'button',
          'aria-label': word.en,
          dataset: { id: word.id },
          on: {
            click: () => {
              if (locked) return;
              play('tap');
              onPick(word, index);
            },
          },
        }, [
          pictureEl(word, { size: size || 'var(--prop-size)', className: 'prop__pic' }),
          showText ? el('span.prop__word', { text: word.en }) : null,
        ]);
        buttons.push(button);
        shelf.append(button);
      }

      const find = (id) => buttons.find((b) => b.dataset.id === id);

      return {
        root: shelf,
        lock() { locked = true; },
        unlock() { locked = false; },

        async markCorrect(id) {
          const button = find(id);
          if (!button) return;
          button.classList.add('is-correct');
          buttons.filter((b) => b !== button).forEach((b) => b.classList.add('is-dimmed'));
          await wait(prefersReducedMotion() ? 300 : 900);
        },

        /**
         * A wrong tap fades that option back and leaves the right one there.
         * Nothing is crossed out and nothing is lost, so there is nothing to
         * be upset about — the round always ends on a success.
         */
        async markWrong(id) {
          const button = find(id);
          if (!button) return;
          button.classList.add('is-wrong');
          await wait(prefersReducedMotion() ? 200 : 650);
          button.classList.remove('is-wrong');
          button.classList.add('is-out');
        },

        hint(id) { find(id)?.classList.add('is-hinted'); },

        /** Which way the pet should lean when it points at the answer. */
        directionOf(id) {
          const index = buttons.findIndex((b) => b.dataset.id === id);
          if (index === -1) return null;
          return index < options.length / 2 ? 'left' : 'right';
        },

        pictureOf(id) { return find(id)?.querySelector('.picture') || null; },
      };
    },

    clearProps() {
      clear(shelf);
      delete shelf.dataset.count;
    },

    /** Anything extra a round needs below the shelf (a button, a nudge). */
    setExtra(...nodes) {
      let extra = root.querySelector('.visit__extra');
      if (!extra) {
        extra = el('div.visit__extra');
        root.append(extra);
      }
      clear(extra).append(...nodes.filter(Boolean));
      return extra;
    },
    clearExtra() {
      root.querySelector('.visit__extra')?.replaceChildren();
    },

    /** Hand the pet back to the floating layer (celebration, leaving). */
    release() { dockPet(null); },
  };

  return stage;
}

/**
 * A character standing in the scene: the story's hero, or the alien.
 *
 * Shares the cast area with the pet so both stand on the same ground line.
 * Drawn artwork is scaled up like the pets are — these files carry their own
 * transparent padding, so at nominal size they render noticeably smaller than
 * the emoji they replace.
 *
 * @param {{id: string, emoji: string}} character
 * @param {{kind?: 'hero'|'char', size?: string}} [opts]
 */
export function castEl(character, { kind = 'hero', size = 'clamp(4rem, 17vw, 7rem)' } = {}) {
  const id = `${kind}:${character.id}`;
  if (hasArt(id)) {
    return el('img', {
      class: `cast cast--art cast--${kind}`,
      src: artUrl(id),
      alt: '',
      decoding: 'async',
      style: { width: size, height: size },
    });
  }
  return el('span', {
    class: `cast cast--${kind}`,
    'aria-hidden': 'true',
    style: { fontSize: size },
    text: character.emoji,
  });
}
